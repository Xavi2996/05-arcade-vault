# SPEC 04 — Configuración inicial del cliente de Supabase

> **Estado:** Aprobado
> **Depende de:** Ninguno
> **Fecha:** 2026-09-15
> **Objetivo:** Instalar y configurar el cliente de Supabase (`@supabase/supabase-js`) en la app Next.js con las credenciales del proyecto ya creado, sin tocar todavía la autenticación mock ni las puntuaciones existentes.

## Scope

**In:**

- Dependencia `@supabase/supabase-js` instalada.
- `lib/supabase.ts`: cliente único (`createClient`) inicializado con la URL y la publishable key del proyecto, que lanza un error legible en arranque si falta alguna variable de entorno.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` documentadas en `.env.template`, con sus valores reales cargados en `.env.local` (no versionado).
- Verificación puntual de la conexión: script temporal que usa `lib/supabase.ts` para hacer una llamada real contra el proyecto (`supabase.auth.getSession()`), se ejecuta una vez para confirmar que URL y key son correctas, y luego se descarta (no queda commiteado ni forma parte de la app).
- Convención documentada para futuras migraciones de esquema: se usará `supabase/migrations/*.sql` versionado en el repo, aplicado con la herramienta MCP `apply_migration` — queda establecida aquí pero no se usa todavía porque este spec no crea tablas.

**Out of scope (para futuros specs):**

- Ninguna tabla se crea en este spec (ni `profiles`, ni `games`, ni `scores`) — queda para el spec de Auth.
- No se toca `app/auth/page.tsx` ni `lib/session.ts` — el login sigue siendo mock (localStorage) hasta el spec de Auth.
- No se reemplazan `data/games.ts` ni `data/mock-scores.ts`.
- No se configura OAuth (Google/GitHub) — decisión registrada para el spec de Auth: solo email + contraseña.
- No se define Row Level Security ni políticas — no hay tablas todavía sobre las que aplicarlas.
- No se agrega un endpoint de healthcheck permanente (`/api/health` o similar).

## Data model

Este spec no introduce ningún modelo de datos ni tabla nueva. Solo configura el cliente que las specs futuras (Auth, luego scores/juegos) usarán para hablar con Supabase.

Variables de entorno:

```
NEXT_PUBLIC_SUPABASE_URL=https://yquwpbsfchdqshpkaooo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_4kcGRi3ABGsYupQL9TZVOA_H2CpMRvP
```

Ambas son públicas por diseño (prefijo `NEXT_PUBLIC_`): la URL y la publishable key no son secretas: la seguridad real de los datos dependerá de las políticas RLS que se definan cuando existan tablas, no de ocultar estos valores.

## Implementation plan

1. Ejecutar `npm install @supabase/supabase-js`.
2. Agregar a `.env.template` las claves `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (comentario indicando que salen de Project Settings → API Keys en el dashboard de Supabase), y completar los valores reales en `.env.local`.
3. Crear `lib/supabase.ts`: exporta un cliente único creado con `createClient(url, publishableKey)`, leyendo `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y lanza un `Error` descriptivo si alguna falta.
4. Crear un script temporal (por ejemplo `scripts/check-supabase.ts`, ejecutado con `npx tsx` o similar) que importe `lib/supabase.ts` y llame a `supabase.auth.getSession()`, confirmando que la llamada responde sin error de red/URL/key.
5. Ejecutar el script, confirmar la conexión exitosa contra el proyecto real, y eliminarlo del repo (no se commitea).
6. Ejecutar `npm run lint` y `npm run build` para confirmar que `lib/supabase.ts` compila sin errores y no rompe nada existente.

## Acceptance criteria

- [ ] `@supabase/supabase-js` aparece como dependencia en `package.json`.
- [ ] `.env.template` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] `.env.local` contiene los valores reales del proyecto (no versionado).
- [ ] `lib/supabase.ts` exporta un cliente de Supabase funcional y lanza un error legible si faltan las variables de entorno.
- [ ] El script de verificación puntual confirma una conexión exitosa contra el proyecto real y no queda en el repositorio después de la verificación.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.
- [ ] El esquema `public` del proyecto de Supabase sigue sin tablas al terminar este spec (verificable con `list_tables`).
- [ ] `app/auth/page.tsx`, `lib/session.ts`, `data/games.ts` y `data/mock-scores.ts` no tienen cambios.

## Decisions

- **Sí:** este primer spec solo monta el cliente de Supabase, sin auth ni tablas, para no mezclar la configuración de infraestructura con el diseño del esquema de datos.
- **Sí:** se usa la publishable key moderna (`sb_publishable_...`) en vez de la legacy anon key (JWT), siguiendo la recomendación de Supabase para apps nuevas.
- **Sí:** las futuras migraciones de esquema se versionarán en `supabase/migrations/*.sql` y se aplicarán con la herramienta MCP `apply_migration` — convención que queda establecida aquí pero no se usa todavía porque no hay tablas.
- **Sí:** el spec de Auth (siguiente) reemplazará el login mock (localStorage) por Supabase Auth con email + contraseña únicamente; OAuth (Google/GitHub) queda fuera también de ese spec, solo visual por ahora.
- **Sí:** "JUGAR COMO INVITADO" se mantendrá igual (sin sesión de Supabase) cuando llegue el spec de Auth.
- **No:** no se crea la tabla `profiles` en este spec, aunque se sabe que será la primera tabla del spec de Auth.
- **No:** no se agrega un endpoint `/api/health` permanente — la verificación de conexión es puntual y se descarta tras usarla.

## Risks

| Riesgo                                                                     | Mitigación                                                                                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La publishable key queda expuesta en el bundle del cliente                 | Es el comportamiento esperado (`NEXT_PUBLIC_*`); la seguridad real dependerá de las políticas RLS que se definan en el spec de Auth, no de ocultar esta key. |
| Variables de entorno faltantes en el entorno de despliegue (Vercel u otro) | `lib/supabase.ts` lanza un error claro en arranque si faltan, en vez de fallar silenciosamente más adelante.                                                 |

## Lo que **no** está en este spec

- Ninguna tabla ni esquema de base de datos.
- Reemplazo del login mock por Supabase Auth.
- Persistencia real de puntuaciones o del catálogo de juegos.
- OAuth (Google/GitHub).
- Un endpoint de healthcheck permanente.
