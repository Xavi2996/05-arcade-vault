---
name: spec-juego
description: Designs a spec for adding a new playable game to the platform (ported from references/templates/started-games or built from scratch), wired into GamePlayer.tsx with a real Supabase leaderboard. Specialized variant of /spec for this recurring task — use it before implementing a new game.
disable-model-invocation: true
argument-hint: 'game name or source, e.g. "tetris" or "a from-scratch pong-style duel"'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), mcp__supabase__execute_sql, mcp__supabase__list_tables
---

# /spec-juego — Guided spec designer for adding a new game

## Session context

Today's date (use this for the spec header, never guess it):
!`date +%F`

Specs that already exist:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist yet"`

Game templates available to port from:
!`ls references/templates/started-games/ 2>/dev/null || echo "No started-games templates folder found"`

Game components already ported into the platform:
!`ls components/games/ 2>/dev/null || echo "No games ported yet"`

---

This skill is a specialized variant of `/spec` for exactly one recurring task in this repo: adding a new playable game to Arcade Vault, wired into `GamePlayer.tsx`, with a real Supabase leaderboard. **You don't write code here.** Your job is to clarify what the new game is and how it plugs into the existing pattern, then write a spec into `specs/`, the same way `/spec` does.

Read `.claude/skills/spec/template.md` (a sibling skill's file, one level up then into `spec/`) for the exact section structure and formatting rules a spec must follow in this repo — this skill does not repeat that content, it only adds game-specific guidance on top of it.

## Why this skill exists

Two prior specs already proved the pattern this skill encodes:

- **specs/05-juego-asteroides.md** ported a vanilla-JS canvas game template into `components/games/AsteroidsGame.tsx`: a `forwardRef<Handle, Props>` component with props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }` and a handle `{ restart }`, stripping the template's own HUD/game-over overlay/keyboard-restart in favor of reporting state upward via callbacks.
- **specs/06-catalogo-y-leaderboard-supabase.md** made the catalog (`games` table) and leaderboard (`scores` table) fully generic: `lib/games.ts`, `lib/scores.ts`, `GameCard.tsx`, `app/juegos/[id]/page.tsx`, and Salón de la Fama already work for **any** `game.id` with zero code changes. Giving a new game a real leaderboard requires nothing beyond a `games` row with a fresh `id`.

So adding a game is now a narrow, well-understood recipe. This skill exists so you don't have to re-derive that recipe (or re-read hundreds of lines of template `game.js` to rediscover its quirks) every time.

## Command flow

- Follow the four phases in order. **Never skip Phase 2.**
- Your replies must be in the same language as the initial prompt — for this repo that is Spanish (check the existing specs to confirm).

### Phase 1 — Understand the current integration state

1. Read the project-memory file (`CLAUDE.md`, else `AGENTS.md`, else `GEMINI.md`, else `README.md`) and the two most recent specs in the session-context listing above, to confirm language and section-heading conventions — same as `/spec`.
2. Read `components/GamePlayer.tsx` in full and count how many hardcoded `game.id === "..."` branches exist (as of the last time this was checked, there was exactly one: `isAsteroids`, referenced at the game-id check itself, the `level` ternary, the fake-simulation guard and its dependency array, and the render branch). **This is a scope decision the spec must state explicitly:**
   - If there is still only **one** hardcoded branch → this spec's scope **must** include converting it into a small generic dispatch (a map/registry keyed by `game.id`, holding at least the component and its ref, plus a place for per-game level semantics), routing the _existing_ game through it too — not just the new one. Do not leave a second `isXxx` boolean sitting next to the first; that would just postpone the same refactor again.
   - If a registry already exists (a previous `/spec-juego` spec already generalized it) → the plan only needs to add one new entry to it.
3. Query the current catalog to avoid `id`/`cover` collisions and see what categories/colors are already in use (read-only, never write): `select id, title, cat, color, cover from public.games order by id;` via `mcp__supabase__execute_sql`. Show the user a short summary if it's useful context for Phase 2.
4. Figure out the game's source:
   - If `$ARGUMENTS` names or clearly implies one of the templates listed in the session context above, identify which one and use the **known template quirks** table below instead of re-reading the whole template file. Only read the template's actual `game.js` (and sibling files) yourself if it isn't in the table (a template added after this skill was written) or the argument is ambiguous — in that case do the same kind of analysis fresh: is the HUD/game-over overlay canvas-drawn or DOM-drawn? Is input keyboard-only or also mouse? Is it a single self-contained file or split across several with external assets (sprites/sound)? Does it manage extra chrome (theme toggle, its own restart button, its own pause menu) that a ported version must not duplicate, since the platform already has its own pause/HUD/game-over modal?
   - If the user says "from scratch" / describes an original idea with no template, skip the template analysis — mechanics come entirely from the Phase 2 answers.

**Known template quirks** (`references/templates/started-games/`):

| Template                                                              | Shape                                                                                                                                                                                                                                                                                                                                                                                                             | Needs stripping/adapting when porting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `02-asteroids` (already ported — use as the reference implementation) | Single file, class-based (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`), canvas-drawn HUD + game-over overlay, keyboard listeners on `window`                                                                                                                                                                                                                                                              | Already done. Read `components/games/AsteroidsGame.tsx` to see the target shape any new game component should match: canvas mounted via `useRef`+`useEffect`, `requestAnimationFrame` loop with a clamped `dt`, listeners added/removed in the effect's setup/cleanup, state reported via callbacks only when it actually changes, `paused` freezing `update()` but still calling `draw()`.                                                                                                                                                                                                                                                                                                                                      |
| `03-tetris`                                                           | Single file, procedural (no classes), **DOM-drawn** HUD (`#score`/`#lines`/`#level` `<span>`s updated via a `updateHUD()`-style function) and a DOM `#overlay` div reused for game-over/pause, a **second `<canvas>`** for the next-piece preview, its own light/dark theme toggle wired to `localStorage`, its own restart button with a `click` listener                                                        | The DOM HUD/overlay must become callback-driven (`onScoreChange`/`onLivesChange`/`onLevelChange`/`onGameOver`) instead of `textContent` writes to elements that won't exist in the React version. The theme toggle and the template's own restart button must be removed — the platform already has PAUSA/FIN/JUGAR DE NUEVO in `GamePlayer.tsx`. The preview canvas can stay: nothing stops the new component from rendering two `<canvas>` elements internally, as long as the outward prop/handle contract is unchanged. Tetris has no traditional "lives" — decide in Phase 2 what `onLivesChange` should report for it (e.g. always report `0`/hide it, or repurpose it — do not leave this undecided).                     |
| `04-arkanoid`                                                         | Split across `game.js` + `levels.js` + `assets/spritesheet.js` (three plain `<script>` tags, no bundler/imports), canvas-drawn HUD, **two** terminal overlays (game-over and a separate "you win"), mouse drag/click for the paddle plus a canvas-drawn pause menu with manual click hit-testing for level-select buttons, `Audio`-object sound effects, an async spritesheet preload gate before the loop starts | Both terminal states (lose and win) must map onto the single `onGameOver(finalScore)` callback — decide in Phase 2 whether the modal should say anything different for a win, or if that's out of scope for a first pass. The canvas-drawn pause menu and its manual hit-testing must be removed; the platform's own pause overlay already covers pausing. Mouse input can stay if the spec says the game needs it. Sound effects and the spritesheet preload are allowed to survive the port, but must live inside the new component's own `useEffect` (loading before the render loop starts), the same way `AsteroidsGame.tsx` sets everything up inside one effect — never as global scripts loaded via `<script src>` tags. |

### Phase 2 — Clarify through questions

Same rules as `/spec`: ask in blocks of 3 to 5, wait for an answer before continuing, use `AskUserQuestion` when available with your recommendation labeled and listed first, and flag anything that smells like a much bigger feature (e.g. "and it should have online multiplayer") as deserving its own spec instead of silently expanding this one.

Instead of the generic scope/data/integration/persistence/UX/risk categories from `/spec`, use this fixed question set (skip a block only if the answer is already fully unambiguous from `$ARGUMENTS` or Phase 1):

**Block A — Identity & catalog row:**

1. Display title (as it should appear on the card, all-caps per existing convention, e.g. "ASTEROIDS").
2. `id` slug: kebab-case, must not collide with the ids found in the Phase 1 catalog query.
3. Category: one of `ARCADE` / `PUZZLE` / `SHOOTER` / `VERSUS`.
4. Color: one of `cyan` / `magenta` / `yellow` / `green`.
5. Short and long copy (matching the tone of existing entries — playful, one or two sentences).
6. `best`/`plays` seed values — purely decorative catalog stats, not tied to real scores. Offer a modest placeholder (e.g. `best: 0`, `plays: "0"`) as the default if the user doesn't have real numbers in mind.

**Block B — Source & mechanics:**

1. Confirmed source: which template (from Phase 1) or "from scratch".
2. Controls: which keys, and what they do.
3. Does the game have a meaningful concept of "lives"? If not, what should `onLivesChange` report (see the quirks table for known cases like Tetris)?
4. Does the game have a meaningful concept of "level" that increases during play, or should it stay at a fixed value (e.g. always `1`)?
5. Single-player, or two-player local (relevant mainly if the category is `VERSUS`)?

**Block C — Integration specifics:**

1. Confirm the `GamePlayer.tsx` scope decision from Phase 1 step 2 (registry refactor now, or just a new entry).
2. Confirm which template-specific stripping items from the quirks table apply (if sourced from a template).
3. Cover-art concept: an icon/glyph and color mood for the new `.cover-<name>` CSS class (exact gradient stops are an implementation detail decided during `/spec-impl`, not spec'd literally here — matching how `specs/05` handled `.cover-asteroids`).

**When to stop asking:** the same three closing questions as `/spec` — which files change, what the first and last executable steps are, how to verify the feature is finished. If any of Block A/B/C is still unanswered or vague, you cannot answer these — keep asking.

### Phase 3 — Write the spec

Same fast-path rule as `/spec`: if Phase 2 is genuinely complete, write the whole spec at once and go straight to Phase 4 — no section-by-section confirmation, no draft-for-approval step. Only fall back to section-by-section if information is still missing.

Follow the exact section order and formatting from `.claude/skills/spec/template.md` (Header, Scope, Data model, Implementation plan, Acceptance criteria, Decisions, Risks, closing "what is not in this spec"). On top of that generic shape, apply these game-specific rules:

- **Header:** `**Depends on:**` should normally list SPEC 05 and SPEC 06 (the game-porting pattern and the generic leaderboard schema this spec builds on) — verify both exist in `specs/` before writing the reference.
- **Data model section stays small:** only (a) a new migration `supabase/migrations/000X_add_<id>.sql` containing a single `insert into public.games (...)` row matching the exact schema and CHECK-constraint values from `specs/06` (`cat` uppercase enum, `color` lowercase enum), and (b) the new component's prop/handle contract, written the same shape as `AsteroidsGameHandle`/`AsteroidsGameProps`. **Never** propose a new table, a new column, or any change to `lib/games.ts` / `lib/scores.ts` — the leaderboard schema is already generic; if you find yourself wanting to add one, that's a sign a Phase 2 question was skipped.
- **Implementation plan must include, in this order:** (1) the new migration adding the catalog row (2) the new game component under `components/games/` (3) the new `.cover-<name>` CSS block in `app/globals.css` (4) the `GamePlayer.tsx` wiring (registry refactor or new entry, per the Phase 1/Block C decision) (5) a manual browser test playing the real game end-to-end, triggering game over, saving a score, and confirming it shows up both in the `/juegos/<id>` leaderboard aside and in Salón de la Fama (this step only _confirms_ the already-generic leaderboard UI, it does not add any new leaderboard code) (6) `npm run lint` and `npm run build`.
- **Decisions section must state explicitly:** that no new tables/columns are introduced and `lib/games.ts`/`lib/scores.ts` are untouched (reusing the generic schema from `specs/06`), and the resolved `GamePlayer.tsx` registry decision from Phase 1.

### Phase 4 — Save the spec

Identical mechanics to `/spec`:

1. Next sequential number from the `specs/` listing in the session context above.
2. Kebab-case slug derived from the objective (e.g. `juego-tetris`), not from `$ARGUMENTS` verbatim unless it already is one.
3. Date from the session context above — never guess it.
4. Write `specs/NN-slug.md` directly. Don't ask permission or whether the name works; only ask if the target file already exists.
5. State `Draft`. Never mark it `Approved` automatically.
6. Verify every spec referenced in `**Depends on:**` actually exists in `specs/`.
7. Leave `specs/.spec-config.yml` untouched — it already exists in this repo.
8. Confirm to the user: the file path, that it's in `Draft` state and needs a re-read before approval, and that the next step is `/spec-impl NN-slug` once approved. **Stop there** — do not propose implementing it.

## Hard rules

- **Never write or edit any code, CSS, or SQL during this command.** Only the spec's `.md` file at the end.
- **Never touch Supabase beyond the one read-only catalog query in Phase 1.** No inserts, no migrations — `apply_migration` is not in this skill's tool access for a reason.
- **Never invent controls, mechanics, or catalog fields the user didn't confirm.**
- **Always re-check `components/GamePlayer.tsx` fresh in Phase 1.** Don't assume the registry refactor is or isn't already done based on a previous `/spec-juego` run in this conversation — the file may have changed since.
- **Reuse the schema from `specs/06` as-is.** Never propose new tables or columns for leaderboard or catalog purposes.
- **Do not re-ask in Phase 3 what was already answered in Phase 2.**
- **Never propose implementing the spec after saving it.** The user runs `/spec-impl` when ready.
- **If the feature grows beyond "one game, one leaderboard entry"** (e.g. new game mechanics platform-wide, multiplayer netcode, an admin UI for the catalog), say so and propose splitting it into a separate spec.

## Arguments

`$ARGUMENTS` is the game's name or source description (e.g. `"tetris"`, `"arkanoid"`, or a free-text description of an original game idea) — not a file name or slug. Use it as the starting point for Phase 1's source detection, and derive the actual `id`/slug from the Block A answers in Phase 2, confirmed with the user, never guessed from `$ARGUMENTS` alone.

If invoked with no arguments, ask which game to add (template name from the session-context listing, or "from scratch") as the first question.
