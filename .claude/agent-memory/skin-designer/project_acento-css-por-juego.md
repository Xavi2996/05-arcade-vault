---
name: acento-css-por-juego
description: El CSS de [data-skin] en globals.css es global y trae los acentos de Tetris (magenta/ámbar); todo juego con otro color de catálogo debe declararlo como riesgo
metadata:
  type: project
---

`app/globals.css` define `[data-skin="neon"]` y `[data-skin="retro"]` **globalmente**, y los valores
que hay son los que se eligieron para **Tetris**: `neon` → `--skin-accent: var(--magenta)`,
`retro` → `--skin-accent: #ffb000` (más `--skin-glow`, `--skin-halo`, `--skin-inset` a juego).

No hay ningún `data-game` que califique esas variables, así que **cualquier juego que no sea Tetris
hereda un marco, HUD y glow que pueden chocar con su propio canvas**. Caso confirmado en Snake
(2026-09-22): su `neon` está anclada a `--green #00ff88` y con el CSS actual saldría con marco y HUD
magenta alrededor de un canvas verde.

**Why:** el conflicto es invisible leyendo solo el componente del juego — vive en CSS, a dos capas de
distancia del canvas — y aparece en cuanto el usuario prueba la skin.
**How to apply:** en la sección **Riesgos** de toda ficha cuyo color de catálogo no sea magenta,
nombrar el acento correcto para ese juego (`--skin-accent` y `--skin-glow`, y si la skin es `retro`,
decir explícitamente que el glow se anula) y marcar el scoping por juego como prerrequisito de `/spec`.

Relacionado: [[skins-progreso]], [[paleta-desde-spritesheet]].
