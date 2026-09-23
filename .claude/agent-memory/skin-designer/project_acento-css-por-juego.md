---
name: acento-css-por-juego
description: El CSS de [data-skin] en globals.css es global y trae los acentos de Tetris (magenta/ámbar); todo juego con otro color de catálogo debe declararlo como riesgo
metadata:
  type: project
---

`app/globals.css` define `[data-skin="neon"]` y `[data-skin="retro"]` **globalmente**, y los valores
que hay son los que se eligieron para **Tetris**: `neon` → `--skin-accent: var(--magenta)`,
`retro` → `--skin-accent: #ffb000` (más `--skin-glow`, `--skin-halo`, `--skin-inset` a juego).

**Actualizado 2026-09-23:** el scoping por juego **ya existe** — `GamePlayer` pone `data-game` junto a
`data-skin` y `globals.css` tiene overrides `[data-game="<id>"][data-skin="<skin>"]` para arkanoid,
asteroids y snake. Pero es **opt-in juego por juego**: el que no declare el suyo sigue heredando el
magenta de Tetris. Caso confirmado en Snake (2026-09-22) y otra vez en Frogger (2026-09-23), ambos
anclados a `--green #00ff88`: sin su override saldrían con marco y HUD magenta sobre un canvas verde.
Snake también apaga el glow en `retro` con `--skin-glow: transparent`; copiar ese patrón en todo juego
cuyo `retro` lleve `glow: null`.

**Why:** el conflicto es invisible leyendo solo el componente del juego — vive en CSS, a dos capas de
distancia del canvas — y aparece en cuanto el usuario prueba la skin.
**How to apply:** en la sección **Riesgos** de toda ficha cuyo color de catálogo no sea magenta,
nombrar el acento correcto para ese juego (`--skin-accent` y `--skin-glow`, y si la skin es `retro`,
decir explícitamente que el glow se anula) y marcar el scoping por juego como prerrequisito de `/spec`.

Relacionado: [[skins-progreso]], [[paleta-desde-spritesheet]].
