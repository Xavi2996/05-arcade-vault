# Memoria — game-planner

El backlog vive en `references/game-suggestions.todo.md` — **esa es la fuente de
verdad** de qué juegos se proponen y en qué estado están. Esta memoria solo
guarda el *porqué*: preferencias, lecciones y motivos de descarte. No dupliques
aquí la lista de candidatos.

## Preferencias del usuario

_Nada registrado todavía. Anota aquí estilos que le gusten, controles que
rechace, y cómo prefiere que se presenten las recomendaciones._

- En Snake rechazó a propósito el esquema WASD: solo flechas. Posible señal de
  que prefiere controles mínimos y clásicos. Confirmar antes de generalizar.

## Restricciones técnicas aprendidas

Contrato que todo juego nuevo debe cumplir (ver `references/implemented-games.md`):

- Componente `"use client"` con
  `forwardRef<{ restart }, { paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }>`.
- Se registra por `game.id` en `REAL_GAMES` de `components/GamePlayer.tsx`.
  El registry ya existe — añadir un juego es una entrada más, no un refactor.
- `GamePlayer.tsx` es dueño del HUD, la pausa, el modal de fin y el guardado del
  score. El HUD **asume un jugador** con vidas y nivel.

Restricciones de datos (`supabase/migrations/0001_create_games_and_scores.sql`):

- `games.cat` ∈ `ARCADE | PUZZLE | SHOOTER | VERSUS` (check constraint).
- `games.color` ∈ `cyan | magenta | yellow | green` (check constraint).
- `scores.player_name` ≤ 10 caracteres; `scores.score > 0` (check constraint).
  Un juego cuyo score pueda quedar en 0 no podrá guardar partida.
- `scores` guarda **un solo** `player_name` por fila: un juego 2P necesita
  definir explícitamente qué score se persiste.
- RLS solo permite `select` público e `insert` de scores. Sin update ni delete.

Estado de las fuentes:

- Los 3 templates de `references/templates/started-games/` (`02-asteroids`,
  `03-tetris`, `04-arkanoid`) **ya fueron portados**. No queda template sin usar.
- Snake se construyó desde assets sueltos en
  `references/templates/source-assets/snake-assets/`.
- Por tanto, el próximo juego sale de assets sueltos o desde cero.

## Historial de decisiones

_Ninguna decisión tomada por este agente todavía. Registra aquí cada
recomendación con su fecha y el motivo principal._

Contexto previo a la existencia de este agente (de `specs/` y git):

- 05 Asteroids (2026-09-16) — primer juego portado, sirve de referencia.
- 07 Tetris (2026-09-17) — reemplazó la fila de catálogo "Caída".
- 08 Arkanoid (2026-09-18) — reemplazó la fila "Bloque Buster".
- 09 Snake (2026-09-18) — reemplazó la fila "Serpentina".

Patrón observado: los juegos nuevos han ido **reemplazando filas de catálogo
existentes** en vez de crear filas nuevas. Comprobar si el usuario quiere
seguir así o empezar a añadir filas nuevas.

## Candidatos descartados

_Ninguno todavía._ Cuando descartes uno, anota el motivo y la fecha aquí, y
refléjalo también en la sección ❌ del TODO.

## Última sincronización

- **2026-09-21** — catálogo sembrado desde Supabase: 4 jugables (arkanoid,
  asteroids, snake, tetris) y 4 filas con `playable = false` (duelo-pixel,
  gloton, invasores, ranaria). VERSUS sin ningún juego jugable.
