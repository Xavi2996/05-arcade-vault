# SPEC 06 — Catálogo de juegos y leaderboard reales en Supabase

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-09-16
> **Objetivo:** Migrar el catálogo de juegos y las puntuaciones simuladas a tablas reales de Supabase (`games` y `scores`), reemplazando `data/games.ts`, `data/mock-scores.ts` y el guardado en `localStorage["av_scores"]` por lectura y escritura real en todas las pantallas que hoy muestran datos falsos (portada, biblioteca, detalle de juego, GamePlayer y Salón de la Fama).

## Scope

**In:**

- Nueva tabla `games` en Supabase (migración SQL): `id` (text, PK, mismo slug que hoy: "asteroids", "caida", etc.), `title`, `short`, `long` (text), `cat` (text, check `ARCADE|PUZZLE|SHOOTER|VERSUS`), `cover` (text), `color` (text, check `cyan|magenta|yellow|green`), `best` (integer), `plays` (text). Sembrada vía la propia migración con las 8 filas actuales de `data/games.ts`.
- Nueva tabla `scores` en Supabase (migración SQL): `id` (uuid, PK, default `gen_random_uuid()`), `game_id` (text, FK a `games(id)`), `player_name` (text, NOT NULL, check longitud ≤ 10 — mismo límite que ya impone el input del modal de fin de partida), `score` (integer, NOT NULL, check `score > 0`), `created_at` (timestamptz, default `now()`). Arranca vacía.
- RLS habilitado en ambas tablas: SELECT público (rol `anon`) en `games` y `scores`. INSERT público (rol `anon`) solo en `scores`. `games` no acepta INSERT/UPDATE/DELETE desde el cliente — el catálogo solo cambia vía migraciones.
- Nuevo módulo `lib/games.ts`: tipo `Game` (mismos campos que hoy), constante `CATS` (se mantiene como lista fija en código, es UI, no se persiste), `getGames(): Promise<Game[]>`, `getGameById(id): Promise<Game | null>`.
- Nuevo módulo `lib/scores.ts`: tipo `ScoreRow` (mismos campos que `data/mock-scores.ts` hoy: `rank`, `name`, `score`, `date`), `getTopScores(gameId, limit): Promise<ScoreRow[]>`, `getBestScoreByName(gameId, name): Promise<ScoreRow | null>`, `saveScore(gameId, playerName, score): Promise<void>`.
- Eliminación de `data/games.ts` y `data/mock-scores.ts`.
- `app/page.tsx`, `app/biblioteca/page.tsx`, `app/juegos/[id]/page.tsx`, `app/juegos/[id]/jugar/page.tsx` y `app/salon-de-la-fama/page.tsx` pasan a ser Server Components asíncronos que obtienen el catálogo (y, donde aplica, las puntuaciones) desde `lib/games.ts`/`lib/scores.ts`. La interactividad de cliente que ya tenían (reveal on scroll en la portada, búsqueda/filtro en biblioteca, tabs en Salón de la Fama) se extrae a componentes cliente nuevos (`components/HomeClient.tsx`, `components/BibliotecaClient.tsx`, `components/SalonDeLaFamaClient.tsx`) que reciben los datos ya cargados por props, sin hacer fetch propio.
- `components/GameCard.tsx` actualiza el import del tipo `Game` a `@/lib/games` (sin cambios de comportamiento).
- `components/GamePlayer.tsx`: `saveScore` pasa a insertar en `scores` vía `lib/scores.ts` en lugar de escribir en `localStorage["av_scores"]` (que se elimina). El resto del flujo (input de iniciales, toast "PUNTUACIÓN GUARDADA") no cambia.
- Leaderboard real en el aside "MEJORES PUNTUACIONES" de `/juegos/[id]`: top 10 de `scores` para ese juego, orden descendente. Si no hay filas, se muestra un estado vacío ("AÚN NO HAY PUNTUACIONES — SÉ EL PRIMERO EN JUGAR").
- Leaderboard real en `/salon-de-la-fama`: por cada tab de juego se muestran las filas reales de `scores` (hasta 12, orden desc). El podio (oro/plata/bronce) solo se renderiza si hay 3 o más puntuaciones reales para el juego seleccionado; con 1-2 filas se muestra solo la tabla; con 0 filas se muestra el estado vacío. La fila "TU MEJOR MARCA" busca, entre las puntuaciones del juego seleccionado, la de mayor `score` cuyo `player_name` coincide (sin distinguir mayúsculas/minúsculas) con el nombre de la sesión mock actual (`lib/session.ts`); si no hay coincidencia, la fila no se muestra (en vez de inventar un número como hoy).
- `app/page.tsx`, sección "JUEGOS DISPONIBLES AHORA": pasa a mostrar los primeros 6 juegos reales obtenidos de Supabase en vez de `GAMES.slice(0, 6)`. El resto del contenido estático de la portada (ticker de "actividad en vivo", top jugadores, features, stats, precios) no se toca — son datos decorativos hardcodeados sin relación con `seededScores` ni con el catálogo.
- Migración SQL versionada en `supabase/migrations/`, aplicada con la herramienta MCP `apply_migration`, siguiendo la convención establecida en `specs/04-supabase-setup.md`.

**Out of scope (para futuros specs):**

- Auth real (sigue mock en `localStorage`, `lib/session.ts`). Vincular `scores` a un usuario real (columna `user_id`) queda para el spec de Auth.
- Rate limiting, verificación de que la puntuación corresponde a una partida real, o cualquier protección anti-trampa en el insert de `scores` — mismo nivel de confianza que ya existía con `localStorage`, solo que ahora es una tabla compartida.
- Calcular `best`/`plays` en vivo desde `scores` (`MAX`/`COUNT`) — siguen siendo columnas manuales migradas tal cual desde `data/games.ts`.
- Cambiar el ticker y el top de jugadores estáticos de la portada (`app/page.tsx`) — contenido decorativo no relacionado con el leaderboard real.
- Paginación del leaderboard — se mantienen los límites actuales (10 en el detalle, 12 en Salón de la Fama).
- Cualquier UI de administración para editar el catálogo — solo se modifica vía migraciones SQL.
- Implementar el juego real de cualquier otro título del catálogo — sigue el plan de specs futuros por juego (según `specs/05-juego-asteroides.md`).

## Data model

```sql
-- supabase/migrations/0001_create_games_and_scores.sql

create table public.games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan','magenta','yellow','green')),
  best integer not null,
  plays text not null
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  player_name text not null check (char_length(player_name) <= 10),
  score integer not null check (score > 0),
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games are publicly readable" on public.games
  for select using (true);

create policy "scores are publicly readable" on public.scores
  for select using (true);

create policy "anyone can insert a score" on public.scores
  for insert with check (true);

insert into public.games (id, title, short, long, cat, cover, color, best, plays) values
  ('bloque-buster', 'BLOQUE BUSTER', 'Rebota la pelota y destruye muros de neón.', 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?', 'ARCADE', 'cover-bricks', 'cyan', 28450, '12.4K'),
  ('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.', 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.', 'PUZZLE', 'cover-tetro', 'magenta', 184220, '31.8K'),
  ('serpentina', 'SERPENTINA', 'Crece sin morder tu propia cola.', 'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.', 'ARCADE', 'cover-snake', 'green', 7820, '9.1K'),
  ('gloton', 'GLOTÓN', 'Devora puntos y escapa de los fantasmas.', 'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.', 'ARCADE', 'cover-glot', 'yellow', 96400, '27.2K'),
  ('invasores', 'INVASORES', 'Defiende el planeta de filas alienígenas.', 'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.', 'SHOOTER', 'cover-invaders', 'green', 54190, '18.0K'),
  ('asteroids', 'ASTEROIDS', 'Pulveriza asteroides en gravedad cero.', 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cada cierto tiempo aparece un power-up de disparo triple.', 'SHOOTER', 'cover-asteroids', 'yellow', 41200, '15.6K'),
  ('ranaria', 'RANARIA', 'Cruza la autopista de pixeles.', 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.', 'ARCADE', 'cover-rana', 'green', 18900, '6.4K'),
  ('duelo-pixel', 'DUELO PIXEL', 'Dos paletas. Una pelota. Reflejos máximos.', 'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.', 'VERSUS', 'cover-duelo', 'cyan', 24, '4.2K');
```

Contratos TypeScript:

```ts
// lib/games.ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
export async function getGames(): Promise<Game[]>;
export async function getGameById(id: string): Promise<Game | null>;

// lib/scores.ts
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}
export async function getTopScores(
  gameId: string,
  limit: number,
): Promise<ScoreRow[]>;
export async function getBestScoreByName(
  gameId: string,
  name: string,
): Promise<ScoreRow | null>;
export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void>;
```

## Implementation plan

1. Crear `supabase/migrations/0001_create_games_and_scores.sql` con las tablas, constraints, políticas RLS y los inserts de seed de arriba; aplicarla con `apply_migration` y confirmar con `list_tables` que `games` (8 filas) y `scores` (0 filas) existen.
2. Crear `lib/games.ts` y `lib/scores.ts` usando el cliente `supabase` de `lib/supabase.ts`.
3. Migrar `app/juegos/[id]/page.tsx` y `app/juegos/[id]/jugar/page.tsx` para usar `getGameById()` en vez de `GAMES.find()`; el detalle además usa `getTopScores(id, 10)` en vez de `seededScores()`, con el estado vacío cuando no hay filas.
4. Migrar `components/GamePlayer.tsx` y `components/GameCard.tsx` para importar `Game` desde `@/lib/games`; en `GamePlayer.tsx`, `saveScore` pasa a llamar a `saveScore(game.id, name, score)` de `lib/scores.ts` en vez de escribir en `localStorage["av_scores"]`.
5. Convertir `app/page.tsx` en Server Component asíncrono que llama `getGames()` y renderiza `<HomeClient games={games} />` (nuevo componente cliente que conserva `useReveal`, `FloatingSilhouettes`, `MiniCard` y el resto del markup existente, sin cambios de comportamiento fuera de recibir `games` por prop).
6. Convertir `app/biblioteca/page.tsx` en Server Component asíncrono que llama `getGames()` y renderiza `<BibliotecaClient games={games} />` (conserva la búsqueda y el filtro por categoría existentes).
7. Convertir `app/salon-de-la-fama/page.tsx` en Server Component asíncrono que llama `getGames()` y, para cada juego, `getTopScores(id, 12)`, y renderiza `<SalonDeLaFamaClient games={games} scoresByGame={...} />`. Como el nombre de sesión mock solo existe en el navegador (`lib/session.ts`), `SalonDeLaFamaClient` (componente cliente) resuelve "TU MEJOR MARCA" comparando el nombre de sesión contra `scoresByGame` ya cargado, sin fetch propio. Conserva las tabs, el podio condicional (solo si hay ≥3 filas) y el estado vacío.
8. Eliminar `data/games.ts` y `data/mock-scores.ts`, y confirmar (búsqueda de texto) que ningún archivo los sigue importando.
9. Probar manualmente en el navegador (`npm run dev`): la portada muestra 6 juegos reales, la biblioteca filtra y busca sobre datos reales, el detalle de un juego sin puntuaciones muestra el estado vacío, jugar Asteroids y guardar una puntuación la inserta en `scores` y aparece de inmediato al volver al detalle del juego y en Salón de la Fama (incluyendo el podio si ya hay 3+ filas, y "TU MEJOR MARCA" si el nombre coincide).
10. Ejecutar `npm run lint`, `npm run build`, y `get_advisors` (seguridad) sobre el proyecto de Supabase para confirmar que las políticas RLS nuevas no generan alertas inesperadas.

## Acceptance criteria

- [ ] Las tablas `games` (8 filas) y `scores` (0 filas) existen en el esquema `public` del proyecto de Supabase, verificable con `list_tables`.
- [ ] RLS está habilitado en ambas tablas; `get_advisors` no reporta una tabla pública sin RLS.
- [ ] Un cliente anónimo (publishable key) puede leer `games` y `scores`, e insertar en `scores`, pero no puede insertar/actualizar/borrar en `games`.
- [ ] `data/games.ts` y `data/mock-scores.ts` ya no existen en el repositorio y ningún archivo los importa.
- [ ] `lib/games.ts` y `lib/scores.ts` existen y exponen las funciones descritas en el modelo de datos.
- [ ] La portada (`/`) muestra 6 juegos reales obtenidos de Supabase en "JUEGOS DISPONIBLES AHORA".
- [ ] `/biblioteca` muestra el catálogo real, y la búsqueda/filtro por categoría siguen funcionando igual que antes.
- [ ] `/juegos/[id]` carga el juego real por id y su aside "MEJORES PUNTUACIONES" muestra hasta 10 filas reales de `scores`, o el estado vacío si no hay ninguna.
- [ ] `/juegos/[id]/jugar` carga el juego real por id y renderiza `GamePlayer` igual que antes.
- [ ] Guardar una puntuación desde el modal de fin de partida inserta una fila real en `scores` (verificable con `execute_sql` o releyendo el leaderboard) y ya no escribe en `localStorage["av_scores"]`.
- [ ] `/salon-de-la-fama` muestra, por cada tab de juego, hasta 12 filas reales de `scores`; el podio solo aparece con 3 o más filas reales; con 0 filas se muestra el estado vacío "AÚN NO HAY PUNTUACIONES — SÉ EL PRIMERO EN JUGAR".
- [ ] "TU MEJOR MARCA" en Salón de la Fama solo aparece cuando existe una fila real de `scores` cuyo `player_name` coincide (case-insensitive) con el nombre de sesión actual, y muestra ese score real (no uno inventado).
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.
- [ ] El resto de la plataforma (Auth mock, `GamePlayer` para juegos no implementados, resto de la portada) no cambia de comportamiento.

## Decisions

- **Sí:** un solo spec crea las dos tablas (`games` y `scores`) y migra todas las pantallas afectadas de una vez, en vez de encadenar dos specs — evita diseñar la relación FK dos veces y ambas tablas están intrínsecamente ligadas.
- **Sí:** `games.id` es texto (el mismo slug ya usado hoy: "asteroids", "caida", etc.), no un uuid con columna `slug` separada — cero fricción con las URLs y con el resto del código existente.
- **Sí:** `best` y `plays` se migran tal cual como columnas manuales; calcular esos valores en vivo desde `scores` (`MAX`/`COUNT`) queda fuera de este spec.
- **Sí:** `scores` no incluye `user_id` todavía — no hay Auth real (sigue mock en `localStorage`); ese vínculo lo decide el spec de Auth futuro.
- **Sí:** el único constraint de validación en `scores` es de esquema (`score > 0`, longitud de `player_name` ≤ 10, FK a `games`) — sin rate limiting ni verificación de partida real, mismo nivel de confianza que ya existía con `localStorage["av_scores"]`.
- **Sí:** RLS permite SELECT público en ambas tablas e INSERT público solo en `scores`; `games` no acepta escritura desde el cliente, solo vía migraciones.
- **Sí:** la migración completa reemplaza `data/games.ts` como fuente de datos en TODAS las pantallas (portada, biblioteca, detalle, jugar, Salón de la Fama), no solo se crea la tabla para el FK — es lo que se pidió explícitamente.
- **Sí:** `app/page.tsx`, `app/biblioteca/page.tsx` y `app/salon-de-la-fama/page.tsx` (hoy "use client") se convierten en Server Components que hacen el fetch, delegando la interactividad existente (reveal, búsqueda, tabs) a nuevos componentes cliente que reciben los datos por props — patrón estándar de Next.js App Router, minimiza el riesgo de romper la interactividad actual.
- **Sí:** el leaderboard falso (`seededScores`) se reemplaza en ambos lugares donde aparece (`/juegos/[id]` y `/salon-de-la-fama`), y `data/mock-scores.ts` se elimina del código de producción.
- **Sí:** con 0 puntuaciones reales se muestra un estado vacío explícito ("AÚN NO HAY PUNTUACIONES — SÉ EL PRIMERO EN JUGAR") en vez de una tabla/podio vacíos sin mensaje.
- **Sí:** el podio de Salón de la Fama solo se renderiza con 3 o más puntuaciones reales para evitar acceder a filas inexistentes (`rows[1]`/`rows[2]`); con menos de 3 se muestra solo la tabla (o el estado vacío).
- **Sí:** "TU MEJOR MARCA" se calcula buscando coincidencia de `player_name` (case-insensitive) contra el nombre de sesión mock, en vez de la fórmula inventada actual (`rows[5].score - 2400`); si no hay coincidencia, no se muestra la fila.
- **Sí:** `localStorage["av_scores"]` se elimina por completo — Supabase pasa a ser la única persistencia de puntuaciones, reabriendo y resolviendo la decisión pendiente de `specs/01-mvp-visual.md`.
- **No:** no se toca el ticker de "actividad en vivo" ni el "top jugadores" estáticos de `app/page.tsx` — son contenido decorativo hardcodeado, no relacionado con `seededScores` ni con este leaderboard real.
- **No:** no se agrega paginación al leaderboard — se mantienen los límites actuales (10 en detalle, 12 en Salón de la Fama).
- **No:** no se crea ninguna UI de administración para el catálogo — solo se modifica vía migraciones SQL.

## Risks

| Riesgo                                                                                                                                                                             | Mitigación                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La política de INSERT público en `scores` permite que cualquiera con la publishable key inserte puntuaciones falsas sin haber jugado.                                              | Aceptado por diseño en este spec: es el mismo nivel de confianza que ya existía con `localStorage["av_scores"]` (nunca hubo verificación de partida real). Endurecerlo requiere Auth real, fuera de alcance. |
| Convertir `app/page.tsx`, `app/biblioteca/page.tsx` y `app/salon-de-la-fama/page.tsx` de cliente a servidor+cliente puede introducir bugs de hidratación si el split no es limpio. | Los nuevos componentes cliente reciben exactamente los mismos datos que antes importaban de forma estática, solo que ahora llegan por props; el árbol de renderizado y el markup no cambian.                 |
| El podio o la fila "TU MEJOR MARCA" podrían romperse (acceso a índices inexistentes) si el número de puntuaciones reales es menor al esperado.                                     | El podio se condiciona explícitamente a `scores.length >= 3`, y "TU MEJOR MARCA" se condiciona a que exista una coincidencia real de `player_name` (decisiones tomadas arriba).                              |

## Lo que **no** está en este spec

- Auth real (sigue mock en `localStorage`) y cualquier vínculo `user_id` en `scores`.
- Rate limiting o verificación anti-trampa en el insert de puntuaciones.
- Cálculo en vivo de `best`/`plays` desde `scores`.
- Cambios al ticker o al top de jugadores estáticos de la portada.
- Paginación del leaderboard.
- UI de administración del catálogo de juegos.
- Implementación real de cualquier otro juego del catálogo.
