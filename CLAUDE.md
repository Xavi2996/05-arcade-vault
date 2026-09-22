# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — plataforma para jugar online y competir por la mayor cantidad de puntos. Built with Next.js 16 (App Router), React 19.2, TypeScript, and Tailwind CSS v4, backed by Supabase (catalog + leaderboard) and Resend (contact email). The scaffold stage is over: the app has a real home/landing page, a game library, four playable games, a real-time leaderboard ("Salón de la Fama"), a lightweight local-only auth, and an about/contact page.

## Commands

- `npm run dev` — start the dev server (Turbopack, the default bundler since v16)
- `npm run build` — production build (Turbopack by default; a custom webpack config requires `--webpack` or migration)
- `npm start` — run the production build
- `npm run lint` — ESLint via the flat config in `eslint.config.mjs`; the `next lint` command no longer exists in v16
- `npx prettier --write .` — formatting (Prettier is a devDependency; no separate `format` script is defined)
- No test runner is configured yet.

## Architecture

- **Routes (`app/`):** `/` (landing, `HomeClient.tsx`), `/biblioteca` (game catalog, `BibliotecaClient.tsx`), `/juegos/[id]` (game detail + leaderboard aside), `/juegos/[id]/jugar` (the actual play screen, renders `GamePlayer.tsx`), `/salon-de-la-fama` (global leaderboard, `SalonDeLaFamaClient.tsx`), `/acerca-de` (about + contact form), `/auth` (sign-in), `/api/contact` (route handler that sends mail via Resend).
- **Data layer (`lib/`):** `supabase.ts` (client, env-var checked), `games.ts` (`Game` type + `getGames`/`getGameById` against the `games` table), `scores.ts` (`getTopScores`/`getBestScoreByName`/`saveScore` against the `scores` table), `session.ts` (fake client-only auth: a `{ name }` object in `localStorage`, no real backend user).
- **Games (`components/games/`):** `AsteroidsGame.tsx`, `TetrisGame.tsx`, `ArkanoidGame.tsx`, `SnakeGame.tsx` — each a `forwardRef<{ restart }, { paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }>` canvas component. `components/GamePlayer.tsx` wires the active game through a `REAL_GAMES` registry keyed by `game.id`, owns the shared HUD/pause/game-over modal, and calls `saveScore` on submit. Any non-registered `game.id` falls back to a fake placeholder arena (legacy/demo behavior — shouldn't happen for catalog entries).
- **Supabase (`supabase/migrations/`):** `games` (catalog: `id`, `title`, `short`, `long`, `cat` enum `ARCADE|PUZZLE|SHOOTER|VERSUS`, `cover`, `color` enum `cyan|magenta|yellow|green`, `best`, `plays`, `playable`) and `scores` (`game_id`, `player_name`, `score`, `created_at`) — this schema is generic and already supports any game with zero code changes (see `specs/06-catalogo-y-leaderboard-supabase.md`). Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.template`). The Supabase MCP server is configured in `.mcp.json` (project ref `yquwpbsfchdqshpkaooo`) for schema/migration/log access from Claude Code directly.
- **Email (`app/api/contact/route.ts`):** sends the `/acerca-de` contact form via Resend (`lib/resend.ts`); needs `RESEND_API_KEY` and `CONTACT_TO_EMAIL`.

## Games

`references/implemented-games.md` is the source of truth for which games are actually implemented and playable (`playable = true` in Supabase's `games` table) — as of this writing: Arkanoid, Asteroids, Snake, Tetris. It lists each game's id, category/color, description, controls, component path, and spec. **Always check this file first** before answering questions about existing games, before touching any game component, and before starting work on a new game (it explains the shared `forwardRef` contract every game component follows). Keep it in sync: whenever a new game is added or an existing one's mechanics/catalog row changes, update `references/implemented-games.md` too — ideally via a re-query of the `games` table so it doesn't drift from Supabase.

`references/game-suggestions.todo.md` es el complemento mirando hacia adelante: el backlog de juegos **candidatos** (próximo recomendado, backlog, implementados, descartados). Lo mantiene el agente `game-planner`; consúltalo antes de decidir qué construir, y no lo edites a mano salvo para corregir un error.

`references/game-themes.md` es el registro de **skins** por juego: qué juegos ya tienen diseñadas sus tres skins (`clasico` default, `neon`, `retro`), con los hex exactos de cada rol y su ratio de contraste medido sobre el fondo del canvas. Lo mantiene el agente `skin-designer`, un juego por invocación; no lo edites a mano salvo para corregir un error. Consúltalo antes de tocar cualquier color de un juego. Hoy **ningún juego tiene skins implementadas**: cada uno hardcodea su paleta a su manera y `RealGameProps` no tiene ninguna prop de presentación.

## Skills

- `/frontend-design` — usa siempre para diseñar o retocar la interfaz de usuario.
- `/spec` — diseña e interactivamente redacta un spec en `specs/NN-slug.md` antes de implementar cualquier feature (Spec Driven Design, ver README.md). Guarda el spec en `Draft`; nunca lo aprueba ni implementa automáticamente.
- `/spec-impl` — implementa un spec ya `Approved` de `specs/`, normalmente creando/cambiando a la rama `spec-NN-slug` (controlado por `AutoCreateBranch` en `specs/.spec-config.yml`).
- `/spec-juego` — variante especializada de `/spec` para añadir un nuevo juego jugable (portado desde `references/templates/started-games/` o desde cero), ya wireado a `GamePlayer.tsx` y al leaderboard genérico de Supabase. Úsalo en vez de `/spec` cuando la tarea sea "agregar un juego nuevo".

Estas tres skills de spec vienen de `Klerith/fernando-skills` (instaladas vía `npx skills@latest add Klerith/fernando-skills`, ver `skills-lock.json`) y ya están presentes en `.claude/skills/` — el workflow "Spec Driven Design" del README.md está activo, no es solo una intención documentada.

## Agents

- `game-planner` (`.claude/agents/game-planner.md`) — decide **qué juego construir a continuación**. Analiza la tabla `games` de Supabase, `references/implemented-games.md` y las fuentes disponibles en `references/templates/`, razona sobre huecos de categoría/color, solape de mecánicas y esfuerzo bajo el contrato `forwardRef`, y escribe su recomendación con ficha completa en `references/game-suggestions.todo.md`. Va **antes** de `/spec-juego` en el workflow: no escribe specs ni código. Mantiene memoria persistente en `.claude/agent-memory/game-planner/MEMORY.md` (campo `memory: project`, versionada en git), donde guarda preferencias del usuario, restricciones técnicas aprendidas y motivos de descarte — por eso no vuelve a proponer lo que ya se rechazó. Invócalo con `@agent-game-planner`.
- `game-jam` (`.claude/agents/game-jam.md`) — dado **un tema libre**, deriva de forma autónoma **3 conceptos de juego** y escribe sus specs completos en `specs/game-jam/<tema-slug>/`: una carpeta `GJ-NN-<id>/` por juego con `spec.md` (contrato de integración, estilo specs/07-09) y `design.md` (mecánica, balance, arte, game feel), más un `README.md` índice del jam. Los tres juegos difieren obligatoriamente en eje mecánico, categoría y color, se diseñan desde cero sin assets ni dependencias nuevas, y cada uno propone un `insert` de **fila nueva** en `games` (no reemplaza placeholders). Usa numeración propia `GJ-NN`, global y creciente entre jams. **No pregunta nada, no tiene memoria persistente, y es independiente de `game-planner`**: no lee ni escribe `references/game-suggestions.todo.md`. Sus specs nacen en `Borrador` y viven fuera de `specs/`, así que `/spec-impl` no los ve: hay que **promover** el elegido a `specs/NN-slug.md` y marcarlo `Aprobado` a mano antes de implementarlo. Invócalo con `@agent-game-jam <tema>`.
- `skin-designer` (`.claude/agents/skin-designer.md`) — diseña las **skins visuales de UN juego a la vez**, solo el que le nombres. Lee el componente del juego, transcribe su paleta actual como skin `clasico` (el default), y diseña `neon` (anclada al color de catálogo y a los tokens de `app/globals.css`, glow en CSS) y `retro` (fósforo CRT, máximo 4 tonos, sin glow). **Todo hex va medido**: calcula el ratio de contraste WCAG contra el fondo real del canvas de ese juego y exige ≥ 3:1 en elementos jugables, ≥ 4.5:1 en texto, ≥ 1.5:1 en decorado, más ≥ 1.5:1 entre elementos que el jugador deba distinguir entre sí. Escribe la ficha en `references/game-themes.md` y nada más: **no escribe código, CSS ni specs**, y rechaza los juegos que no estén en `REAL_GAMES`. Cada ficha cierra con el contrato de integración esperado (prop `skin` en `RealGameProps`, `data-skin` en `.crt`, selector en el HUD, `localStorage["av-skin-<gameId>"]`) para que `/spec` lo recoja. Mantiene memoria persistente en `.claude/agent-memory/skin-designer/MEMORY.md` (`memory: project`) con tus preferencias de paleta y lo que ya rechazaste. Invócalo con `@agent-skin-designer <juego>`.

## Next.js 16 — do not rely on pre-v16 training data

This repo pins `next@16.3.4` / `react@19.2.8`. Per AGENTS.md, check `node_modules/next/dist/docs/` before writing App Router code — breaking changes already visible in this codebase include:

- `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` are async-only; there is no synchronous fallback.
- Route prop types come from generated global helpers instead of hand-written interfaces: `PageProps<'/route'>`, `LayoutProps<'/route'>`, `RouteContext<'/route'>` (see `app/layout.tsx`, which already uses `LayoutProps<"/">`). These are (re)generated by `next dev`, `next build`, or `next typegen` — no import needed.
- `middleware.ts` is deprecated in favor of `proxy.ts` (export `proxy` instead of `middleware`); the edge runtime is not supported in `proxy`.
- Parallel route slots require an explicit `default.js`.

## Styling

Tailwind CSS v4 is wired through `@tailwindcss/postcss` (see `postcss.config.mjs`) — there is no `tailwind.config.js`; theme/tokens live in `app/globals.css`. Fonts are loaded via `next/font/google` (Geist / Geist Mono) in `app/layout.tsx` and exposed as CSS variables consumed by Tailwind.

## Workflow convention (per README.md)

Every non-trivial feature goes through `specs/NN-slug.md` first (`/spec` or `/spec-juego` to draft, `/spec-impl` to implement once `Approved`). Check `specs/` for the current numbered history before starting new work — as of this writing it runs 01 (MVP visual) through 09 (Snake), covering the landing page, about/contact, Supabase setup, and each ported game.

Para juegos, el pipeline completo empieza un paso antes: `@agent-game-planner` decide qué juego construir y deja la ficha en `references/game-suggestions.todo.md` → `/spec-juego` redacta `specs/NN-slug.md` en `Draft` → tú lo apruebas → `/spec-impl` lo implementa en la rama `spec-NN-slug`.
