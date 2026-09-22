---
name: supabase-schema-constraints
description: Check constraints de games y scores (cat, color, score>0, player_name<=10, un solo player_name por fila) y estado agotado de las fuentes en references/templates
metadata:
  type: project
---

Restricciones de datos que descartan o reforman candidatos.

**Why:** son check constraints reales en
`supabase/migrations/0001_create_games_and_scores.sql` — un juego que las
ignore simplemente no puede guardar partida, y eso rompe el núcleo del
producto (el leaderboard).

**How to apply:** valida cada candidato contra `score > 0` antes de
recomendarlo. Nunca escribas en Supabase: solo `select`.

- `games.cat` ∈ `ARCADE | PUZZLE | SHOOTER | VERSUS` (check constraint).
- `games.color` ∈ `cyan | magenta | yellow | green` (check constraint).
- `scores.player_name` ≤ 10 caracteres.
- **`scores.score > 0`** (check constraint, línea 17 de la migración): un juego
  cuyo score pueda quedar en 0 **no podrá guardar partida**. Todo candidato con
  ese riesgo necesita **puntos de consolación** (p. ej. +1 por rebote, +1 por
  segundo en vuelo, puntos por acierto individual en vez de por ronda).
- `scores` guarda **un solo** `player_name` por fila: un juego 2P necesita
  definir explícitamente qué score se persiste. Ver [[versus-2p-local-pattern]].
- RLS solo permite `select` público e `insert` de scores. Sin update ni delete.
- **FK `scores.game_id → games(id)`:** sobrescribir una fila cambia la primary
  key de `games` y rompe la FK si ya hay puntuaciones para ese id. Verificar
  antes con `select count(*) from scores where game_id = '<id>'`; el procedimiento
  está en `specs/09-juego-snake.md`. Ver [[catalog-growth-policy]].

## Fuentes: agotadas

- Los 3 templates de `references/templates/started-games/` (`02-asteroids`,
  `03-tetris`, `04-arkanoid`) **ya fueron portados**.
- Snake se construyó desde `references/templates/source-assets/snake-assets/`,
  el único directorio de assets que había.
- Por tanto **todo candidato futuro se construye desde cero**, y el criterio
  "fuente disponible" de la rúbrica **ya no diferencia entre candidatos**: el
  peso se desplaza a huecos de catálogo, esfuerzo y fila existente.
