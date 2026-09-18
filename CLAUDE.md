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

## Skills

- `/frontend-design` — usa siempre para diseñar o retocar la interfaz de usuario.
- `/spec` — diseña e interactivamente redacta un spec en `specs/NN-slug.md` antes de implementar cualquier feature (Spec Driven Design, ver README.md). Guarda el spec en `Draft`; nunca lo aprueba ni implementa automáticamente.
- `/spec-impl` — implementa un spec ya `Approved` de `specs/`, normalmente creando/cambiando a la rama `spec-NN-slug` (controlado por `AutoCreateBranch` en `specs/.spec-config.yml`).
- `/spec-juego` — variante especializada de `/spec` para añadir un nuevo juego jugable (portado desde `references/templates/started-games/` o desde cero), ya wireado a `GamePlayer.tsx` y al leaderboard genérico de Supabase. Úsalo en vez de `/spec` cuando la tarea sea "agregar un juego nuevo".

Estas tres skills de spec vienen de `Klerith/fernando-skills` (instaladas vía `npx skills@latest add Klerith/fernando-skills`, ver `skills-lock.json`) y ya están presentes en `.claude/skills/` — el workflow "Spec Driven Design" del README.md está activo, no es solo una intención documentada.

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
