# SPEC 13 — Registro, inicio de sesión y autenticación real con Supabase Auth

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 06
> **Fecha:** 2026-09-24
> **Objetivo:** Sustituir la sesión falsa de `localStorage` por cuentas reales de Supabase Auth (email + contraseña, Google y GitHub), con perfiles de nick único, sesión en cookies legible desde el servidor y puntuaciones atadas al usuario, sin cerrarle la puerta a quien juegue como invitado.

## Por qué existe este spec

Hoy la "autenticación" es decorado. `lib/session.ts` escribe `{ name }` en `localStorage["av_user"]` y `app/auth/page.tsx` ignora por completo la contraseña y el correo: escribas lo que escribas, `setUser({ name })` te deja dentro. Los botones **◆ GOOGLE** y **▣ GITHUB** no tienen `onClick`. Cualquiera puede aparecer en el Salón de la Fama con el nombre de otro, y la política RLS `anyone can insert a score` con `check (true)` lo permite a nivel de base de datos.

Este spec convierte esa maqueta en autenticación real y, de paso, le da al Salón de la Fama una identidad estable: un nick pertenece a una cuenta.

## Scope

**In:**

- Dependencia nueva `@supabase/ssr`. `lib/supabase.ts` pasa de `createClient` a `createBrowserClient` (misma exportación `supabase`, misma API para `lib/games.ts` y `lib/scores.ts`, pero la sesión se persiste en cookies en vez de en `localStorage`). Nuevo `lib/supabase-server.ts` con `createServerClient` sobre el `cookies()` asíncrono de Next 16.
- Nueva tabla `public.profiles` (migración `0007_create_profiles.sql`): `id uuid` PK y FK a `auth.users(id) on delete cascade`, `display_name text` único con check de formato de 3–10 caracteres en mayúsculas, `created_at timestamptz`. RLS: lectura pública (hace falta para comprobar si un nick está libre), `insert` y `update` solo del propio perfil.
- Trigger `handle_new_user` sobre `auth.users`: si el alta trae `display_name` en `raw_user_meta_data` (registro por email), crea la fila de `profiles`. Si no viene (OAuth), no crea nada y el usuario pasa por `/auth/nick`.
- Migración `0008_scores_user_id_and_rls.sql`: columna `user_id uuid null references auth.users(id) on delete set null` en `scores`, índice sobre ella, y sustitución de la política `anyone can insert a score` por dos: anónimo solo con `user_id is null`, autenticado solo con `user_id = auth.uid()`. La lectura sigue siendo pública y las filas históricas se quedan con `user_id = null`.
- Función RPC `rename_profile(new_name text)` (`security definer`): valida el formato, cambia `profiles.display_name` y reescribe `scores.player_name` de todas las filas con ese `user_id`, en una sola transacción.
- Rutas nuevas bajo `app/auth/`: `login/page.tsx`, `registro/page.tsx`, `nick/page.tsx` (elegir nick tras OAuth) y `callback/route.ts` (route handler que intercambia el `code` de OAuth por sesión). `app/auth/page.tsx` pasa a ser un `redirect("/auth/login")`.
- Ruta nueva `app/cuenta/page.tsx` — protegida: nick, correo, proveedor de acceso, cambiar nick, cerrar sesión y "mis mejores marcas" por juego (consulta a `scores` por `user_id`).
- Nuevo `proxy.ts` en la raíz (no `middleware.ts`, deprecado en Next 16): refresca el token de Supabase en cada navegación, redirige a `/auth/login` las rutas protegidas sin sesión, redirige a `/auth/nick` a cualquier usuario autenticado que no tenga fila en `profiles`, y saca de `/auth/login` y `/auth/registro` a quien ya tenga sesión.
- `lib/session.ts` reescrito sobre la sesión real: mismo patrón de store externo y mismos nombres exportados (`getUser`, `subscribeUser`) para que `Nav`, `GamePlayer` y `SalonDeLaFamaClient` no cambien de import. `SessionUser` pasa a `{ id, name, email }`. `setUser` desaparece y se sustituye por `signOut()`. Al inicializar se borra la clave huérfana `av_user`.
- `app/layout.tsx` lee el usuario en el servidor y lo pasa a `<Nav initialUser={...} />`, que lo usa como snapshot inicial: el Nav ya no parpadea de "Iniciar Sesión" a nick al hidratar.
- `components/Nav.tsx`: el botón de cuenta deja de cerrar sesión de un clic y despliega un menú con **CUENTA** y **CERRAR SESIÓN**.
- `lib/scores.ts`: `saveScore(gameId, playerName, score, userId)` con `userId: string | null`. Nueva `getBestScoresByUser(userId)` para `/cuenta`.
- `components/GamePlayer.tsx`: con sesión, el input de iniciales del modal de fin de partida muestra el nick y es de solo lectura, y `saveScore` manda el `user_id`. Sin sesión, todo funciona exactamente como hoy (nombre libre, `user_id` nulo).
- Validación en cliente antes de llamar a Supabase: correo con formato válido, contraseña de 8 caracteres mínimo, nick de 3–10 caracteres `[A-Z0-9_]` normalizado a mayúsculas y comprobado contra `profiles` antes de enviar. Errores en vivo bajo cada campo.
- Estilos nuevos en `app/globals.css` extendiendo el lenguaje actual (`.auth-card`, `.auth-tabs`, `.field`, `.social`): mensajes de error de campo, estado de carga del botón, menú desplegable de cuenta y la parrilla de `/cuenta`.
- `.env.template`: se añade `NEXT_PUBLIC_SITE_URL`, necesaria para el `redirectTo` del OAuth.
- Configuración de dashboard documentada en el spec (no es código): proveedores Google y GitHub activados, **Confirm email desactivado**, y las Redirect URLs de desarrollo y producción.

**Fuera de alcance:**

- **Recuperación de contraseña.** `/auth/recuperar` y `/auth/nueva-clave` van a un spec propio (decisión explícita del usuario). Mientras tanto, quien olvide su contraseña no tiene salida dentro de la app.
- Confirmación de correo, reenvío del enlace y pantalla de "revisa tu bandeja".
- Cambiar el correo o la contraseña desde `/cuenta`.
- Borrar la cuenta.
- Vincular varios proveedores a la misma cuenta (quien entre con Google y luego con email tendrá dos cuentas distintas).
- Roles, permisos o administración; no hay usuario administrador.
- Migrar puntuaciones antiguas a cuentas nuevas por coincidencia de nombre: las filas históricas conservan `user_id = null` para siempre.
- Endurecer la RLS de `games` o cambiar `best` / `plays`; siguen siendo columnas manuales (decisión de SPEC 06).
- Avatares, biografía o cualquier campo de perfil más allá del nick.
- Rate limiting, captcha y protección contra fuerza bruta más allá de lo que Supabase Auth trae de serie.
- Traducir todos los mensajes de error que devuelve Supabase: se mapean a mano solo los casos conocidos (credenciales inválidas, correo ya registrado) y el resto cae en un mensaje genérico.
- Cualquier cambio en los componentes de `components/games/**`, `lib/skins.ts`, `lib/input.ts` o las migraciones de juegos.
- PWA, "recordarme" y sesión compartida entre dispositivos más allá de lo que hace la cookie.

## Data model

### Migración `0007_create_profiles.sql`

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null unique
    check (display_name ~ '^[A-Z0-9_]{3,10}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable" on public.profiles
  for select using (true);

create policy "users insert their own profile" on public.profiles
  for insert with check (id = auth.uid());

create policy "users update their own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Solo crea el perfil cuando el alta trae nick (registro por email).
-- En OAuth no viene, y la pantalla /auth/nick se encarga.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  if new.raw_user_meta_data ? 'display_name' then
    insert into public.profiles (id, display_name)
    values (new.id, upper(new.raw_user_meta_data ->> 'display_name'));
  end if;
  return new;
end;
$fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

La lectura pública de `profiles` es deliberada: sin ella el formulario de registro no puede decirte que un nick está ocupado. Expone solo nicks, que ya son públicos en el Salón de la Fama — no el correo, que vive en `auth.users` y no es legible desde el cliente.

### Migración `0008_scores_user_id_and_rls.sql`

```sql
alter table public.scores
  add column user_id uuid references auth.users(id) on delete set null;

create index scores_user_id_idx on public.scores (user_id);

drop policy "anyone can insert a score" on public.scores;

create policy "guests insert anonymous scores" on public.scores
  for insert to anon with check (user_id is null);

create policy "users insert their own scores" on public.scores
  for insert to authenticated with check (user_id = auth.uid());

-- Cambiar el nick reescribe el histórico del jugador. Va en una función
-- security definer porque `scores` no tiene (ni tendrá) política de update.
create function public.rename_profile(new_name text)
returns void language plpgsql security definer set search_path = '' as $fn$
declare
  normalized text := upper(trim(new_name));
begin
  if auth.uid() is null then
    raise exception 'no session';
  end if;
  if normalized !~ '^[A-Z0-9_]{3,10}$' then
    raise exception 'invalid nick';
  end if;
  update public.profiles set display_name = normalized where id = auth.uid();
  update public.scores set player_name = normalized where user_id = auth.uid();
end;
$fn$;
```

`on delete set null` en vez de `cascade`: borrar una cuenta no debe borrar el Salón de la Fama. La puntuación sobrevive como marca anónima con su `player_name` intacto.

### Contrato de `lib/session.ts`

```ts
export interface SessionUser {
  id: string;
  name: string; // profiles.display_name
  email: string | null; // null si el proveedor no lo devuelve
}

export function getUser(): SessionUser | null;
export function subscribeUser(callback: () => void): () => void;
export function primeUser(user: SessionUser | null): void; // siembra el snapshot del servidor
export function signOut(): Promise<void>;
```

Se conserva la disciplina de referencia estable que ya documenta el archivo actual: `getUser` devuelve **el mismo objeto** mientras la sesión no cambie, o `useSyncExternalStore` entra en bucle.

### Claves de `localStorage`

No se añade ninguna. La clave `av_user` de la sesión falsa se **borra** al inicializar el store; la sesión real vive en cookies gestionadas por `@supabase/ssr`.

### Variables de entorno

| Variable                               | Estado    | Para qué                                                        |
| -------------------------------------- | --------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | existe    | —                                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | existe    | —                                                               |
| `NEXT_PUBLIC_SITE_URL`                 | **nueva** | Base del `redirectTo` de OAuth (`http://localhost:3000` en dev) |

## Implementation plan

1. **Dependencia y clientes.** `npm i @supabase/ssr`. Reescribir `lib/supabase.ts` con `createBrowserClient` (misma exportación `supabase`) y crear `lib/supabase-server.ts` con `createServerClient` sobre el `cookies()` asíncrono de Next 16. Verificación: `/biblioteca` y `/salon-de-la-fama` siguen cargando datos; `npm run build` pasa.
2. **Migración de perfiles.** Aplicar `0007_create_profiles.sql` vía `mcp__supabase__apply_migration`. Verificación: `select * from profiles` devuelve cero filas sin error, y un `insert` con nick en minúsculas o de 2 caracteres es rechazado por el check.
3. **Migración de `scores`.** Aplicar `0008_scores_user_id_and_rls.sql`. Verificación: las filas existentes tienen `user_id is null`; `select * from scores` sigue funcionando desde el cliente anónimo.
4. **Configuración del dashboard.** Desactivar _Confirm email_, activar los proveedores Google y GitHub con sus credenciales, y registrar las Redirect URLs (`http://localhost:3000/auth/callback` y la de producción). Verificación: `mcp__supabase__get_advisors` no señala nada nuevo.
5. **`lib/session.ts` real.** Reescribirlo sobre `supabase.auth.onAuthStateChange`, resolviendo el nick contra `profiles`, con `primeUser` y `signOut`, y el borrado de la clave `av_user`. Verificación: con una sesión creada a mano desde la consola, `getUser()` devuelve el usuario y dos llamadas seguidas devuelven el mismo objeto.
6. **`proxy.ts`.** Refresco del token, guarda de `/cuenta`, redirección a `/auth/nick` sin perfil y expulsión de `/auth/login` y `/auth/registro` con sesión, con su `config.matcher`. Verificación: `/cuenta` sin sesión redirige a `/auth/login`.
7. **Registro por email.** `app/auth/registro/page.tsx`: nick + correo + contraseña, validación en vivo, comprobación de nick libre contra `profiles`, `signUp` con `display_name` en `options.data`, y redirección a `/biblioteca`. Verificación: una cuenta nueva aparece en `auth.users` y su fila en `profiles`; repetir el nick da error antes de enviar.
8. **Login por email.** `app/auth/login/page.tsx` con los mismos campos que el diseño actual, errores mapeados, enlace a registro y el botón **JUGAR COMO INVITADO** conservado. Convertir `app/auth/page.tsx` en `redirect("/auth/login")`. Verificación: credenciales malas muestran error y no navegan; credenciales buenas entran.
9. **OAuth.** Botones GOOGLE y GITHUB con `signInWithOAuth` y `redirectTo` hacia `/auth/callback`; `app/auth/callback/route.ts` intercambia el código por sesión y redirige según haya perfil o no. Verificación: entrar con Google aterriza en `/auth/nick` la primera vez y en `/biblioteca` la segunda.
10. **Pantalla de nick.** `app/auth/nick/page.tsx`: pide el nick, comprueba disponibilidad, inserta la fila de `profiles` y sigue a `/biblioteca`. Verificación: sin perfil, cualquier ruta protegida devuelve aquí; con perfil, esta ruta redirige fuera.
11. **Nav con sesión de servidor.** `app/layout.tsx` lee el usuario y lo pasa a `<Nav initialUser>`; `Nav` lo usa como snapshot inicial y su botón despliega CUENTA / CERRAR SESIÓN. Verificación: recargar `/biblioteca` con sesión muestra el nick sin parpadeo intermedio.
12. **`/cuenta`.** Página protegida con nick, correo, proveedor, formulario de cambio de nick (RPC `rename_profile`), cerrar sesión, y las mejores marcas por juego vía `getBestScoresByUser`. Verificación: cambiar el nick lo actualiza en el Nav y en el Salón de la Fama tras recargar.
13. **Guardado de puntuación con identidad.** `lib/scores.ts` con el cuarto parámetro `userId`; `GamePlayer` manda el `user_id` y bloquea el input cuando hay sesión. Verificación: una partida con sesión guarda la fila con `user_id`; una partida como invitado la guarda con `null`, y ambas aparecen en el leaderboard.
14. **Estilos.** Errores de campo, botón en carga, menú de cuenta y parrilla de `/cuenta` en `app/globals.css`, reutilizando los tokens existentes y respetando el mínimo de 44×44 px de SPEC 11.
15. **Verificación final.** `npm run lint` y `npm run build` sin errores, y un recorrido manual completo: registrar → jugar → guardar → cerrar sesión → volver a entrar → ver la marca en `/cuenta`.

## Acceptance criteria

- [ ] `@supabase/ssr` está en `package.json` y `lib/supabase-server.ts` existe.
- [ ] La tabla `profiles` existe con `display_name` único y el check de formato activo.
- [ ] `scores` tiene la columna `user_id` nullable y las filas anteriores al spec la tienen a `null`.
- [ ] La política `anyone can insert a score` ya no existe; en su lugar están la de invitado y la de autenticado.
- [ ] Un cliente anónimo **no** puede insertar una fila en `scores` con un `user_id` que no sea nulo.
- [ ] Un usuario autenticado **no** puede insertar una fila en `scores` con el `user_id` de otro.
- [ ] `/auth` redirige a `/auth/login`.
- [ ] Registrarse con nick, correo y contraseña crea la fila en `auth.users` y en `profiles`, y deja la sesión iniciada sin pasar por el correo.
- [ ] Un nick ya ocupado se rechaza en el formulario, antes de llamar a `signUp`.
- [ ] Un nick con minúsculas se normaliza a mayúsculas; uno de menos de 3 o más de 10 caracteres, o con símbolos, no deja enviar.
- [ ] Una contraseña de menos de 8 caracteres no deja enviar.
- [ ] Iniciar sesión con credenciales incorrectas muestra un error legible en español y no navega.
- [ ] Los botones GOOGLE y GITHUB inician el flujo OAuth y vuelven a la app con sesión.
- [ ] Un usuario de OAuth sin perfil aterriza en `/auth/nick` y no puede salir de ahí hasta elegir un nick libre.
- [ ] Con sesión iniciada, `/auth/login` y `/auth/registro` redirigen fuera.
- [ ] `/cuenta` sin sesión redirige a `/auth/login`.
- [ ] `/cuenta` muestra nick, correo y las mejores marcas del usuario por juego.
- [ ] Cambiar el nick desde `/cuenta` lo actualiza en el Nav, en `profiles` y en todas las filas de `scores` de ese usuario.
- [ ] El Nav muestra el nick ya en el primer render tras recargar, sin parpadeo de "Iniciar Sesión".
- [ ] El botón del Nav despliega un menú con CUENTA y CERRAR SESIÓN, y cerrar sesión devuelve el Nav a su estado anónimo.
- [ ] Con sesión, el input de iniciales del modal de fin de partida muestra el nick y no se puede editar.
- [ ] Una puntuación guardada con sesión tiene `user_id` y `player_name` igual al nick.
- [ ] Sin sesión se puede jugar y guardar una puntuación con nombre libre, y la fila queda con `user_id = null`.
- [ ] En `/salon-de-la-fama`, la fila "TÚ" sigue reconociendo al usuario con sesión.
- [ ] La clave `av_user` se elimina del `localStorage` al cargar la app.
- [ ] `setUser` ya no se exporta desde `lib/session.ts` y ningún componente lo importa.
- [ ] No existe `middleware.ts`; la lógica vive en `proxy.ts` con `export function proxy`.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí: Supabase Auth.** Ya hay proyecto, cliente y RLS. Es la única opción en la que la identidad del usuario y las reglas de la base de datos son la misma cosa: `auth.uid()` en una política vale más que cualquier comprobación en el cliente.
- **Sí: sesión en cookies con `@supabase/ssr`.** Sin ella, ni las Server Components ni `proxy.ts` ven al usuario, y toda protección de ruta sería un parpadeo en cliente. El coste es una dependencia y reescribir la creación del cliente.
- **Sí: tabla `profiles` con nick único de 3–10 caracteres.** El límite superior no es arbitrario: `scores.player_name` ya tiene `char_length(player_name) <= 10` desde SPEC 01, y el nick tiene que caber ahí sin truncar.
- **Sí: lectura pública de `profiles`.** Es el precio de poder decir "ese nick está ocupado" antes de enviar el formulario. Solo expone nicks, que ya son públicos en el leaderboard.
- **Sí: `user_id` nullable en `scores`.** Es lo único compatible con mantener el modo invitado y con no inventarse una identidad para las filas históricas.
- **Sí: dos políticas de insert en vez de una abierta.** La actual permite que cualquiera con la clave publicable inserte una fila a nombre de otra cuenta. Con las dos nuevas, el `user_id` de una fila solo lo puede poner su dueño.
- **Sí: cambiar el nick reescribe `scores.player_name`.** Un jugador con dos nombres en el Salón de la Fama parece dos jugadores. Va en una RPC `security definer` porque `scores` no tiene política de `update` y no se le va a añadir una.
- **Sí: rutas separadas bajo `/auth`.** Las tabs no sobrevivían al spec de todos modos: el callback de OAuth necesita su propia ruta, y la elección de nick tras OAuth también.
- **Sí: `/auth/nick`, una pantalla que no estaba en el enunciado.** Es consecuencia directa de combinar nick único con OAuth: ni Google ni GitHub devuelven algo que sirva como nick de 10 caracteres, y dejar que el sistema lo invente produciría nicks feos e irrepetibles. El trigger solo crea el perfil cuando el alta trae nick; el resto pasa por aquí.
- **Sí: sin confirmación de correo.** Es un arcade. Confirmar añade una pantalla de espera, un reenvío de enlace y una dependencia del correo transaccional para ganar una garantía que aquí no protege nada.
- **Sí: el usuario inicial se lee en el servidor y se pasa al Nav.** El patrón `useSyncExternalStore` con snapshot de servidor `null` que ya usan la skin y el puntero grueso es aceptable para un selector, pero el Nav cambiando de "Iniciar Sesión" a tu nick en cada carga se ve como un fallo.
- **Sí: `lib/session.ts` conserva su nombre y sus exportaciones.** `Nav`, `GamePlayer` y `SalonDeLaFamaClient` solo cambian donde de verdad cambia el comportamiento (`setUser(null)` → `signOut()`), no en sus imports. El diff queda donde está la decisión.
- **Sí: con sesión, el nombre del modal de fin de partida es de solo lectura.** Si el nick pertenece a la cuenta, poder escribir otro en el modal lo desmentiría en el mismo formulario.
- **No: recuperación de contraseña.** Decisión explícita del usuario: spec aparte. Se asume conscientemente el hueco — hasta ese spec, olvidar la contraseña no tiene solución dentro de la app.
- **No: vincular proveedores.** Entrar con Google y con el mismo correo por contraseña creará dos cuentas distintas. Resolverlo bien exige un flujo de vinculación con verificación; no entra aquí.
- **No: migrar puntuaciones antiguas por coincidencia de nombre.** Cualquiera podría registrar el nick `PLAYER1` y quedarse con marcas que no son suyas.
- **No: `middleware.ts`.** Está deprecado en Next 16 en favor de `proxy.ts`, y el runtime edge no está soportado ahí.
- **No: roles ni administración.** No hay ninguna funcionalidad que hoy los necesite.

## Risks

| Riesgo                                                                                                                                                        | Mitigación                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiar `createClient` por `createBrowserClient` toca el cliente que usan `lib/games.ts` y `lib/scores.ts`: si algo se rompe, se cae el catálogo entero.      | El paso 1 es independiente y termina con `npm run build` más una carga de `/biblioteca` y `/salon-de-la-fama`. La exportación `supabase` conserva nombre y API.                                                       |
| Dos personas eligen el mismo nick a la vez: la comprobación previa dice "libre" para ambas y el `unique` rechaza a la segunda.                                | La comprobación previa es cortesía, no garantía. El error del `unique` se captura y se muestra en el campo del nick como "ese nick acaba de ocuparse". El check de la base de datos es la única verdad.               |
| Si el trigger `handle_new_user` falla (nick duplicado), el `signUp` falla y podría quedar un usuario en `auth.users` sin perfil.                              | El trigger corre dentro de la transacción del alta, así que la excepción la revierte entera. Y aunque quedara huérfano, `proxy.ts` lo manda a `/auth/nick`, que es exactamente el camino de reparación.               |
| `proxy.ts` consulta `profiles` en cada navegación para saber si hay perfil, y eso es una petición extra por request.                                          | Solo se consulta cuando hay sesión y la ruta está en el `matcher`, que excluye estáticos, `/api` y las rutas de juego. Si pesa, el nick puede cachearse en la propia sesión vía `user_metadata` en un spec posterior. |
| La sesión falsa de `localStorage` y la real conviven en el navegador de quien ya usó la app: el Nav podría mostrar un nick fantasma.                          | El store borra `av_user` al inicializar, y hay un criterio de aceptación dedicado.                                                                                                                                    |
| La política de insert por rol (`to anon` / `to authenticated`) puede no coincidir con el rol real del cliente si la petición viaja sin el token de la sesión. | El paso 13 verifica las dos rutas por separado (con sesión y sin ella) comprobando el `user_id` de la fila resultante en la base de datos, no solo que la UI diga "guardado".                                         |
| Las Redirect URLs de OAuth mal configuradas hacen que el flujo funcione en local y falle en producción, y el fallo solo aparece al desplegar.                 | `NEXT_PUBLIC_SITE_URL` es explícita y está en `.env.template`; el paso 4 exige registrar ambas URLs, la de desarrollo y la de producción, en el mismo momento.                                                        |
| Sin recuperación de contraseña, un usuario bloqueado no tiene salida y su nick queda ocupado indefinidamente.                                                 | Hueco aceptado y declarado. El spec de reset es la primera continuación natural de este.                                                                                                                              |

## Lo que **no** está en este spec

- Recuperar la contraseña, cambiarla o cambiar el correo.
- Confirmación de correo y todo su flujo.
- Borrar la cuenta y vincular varios proveedores a una misma identidad.
- Avatares o cualquier campo de perfil más allá del nick.
- Roles, administración y moderación del Salón de la Fama.
- Migrar puntuaciones históricas a cuentas nuevas.
- Rate limiting, captcha y traducción completa de los errores de Supabase.
- Cambios en los componentes de juego, en las skins o en los controles táctiles.
