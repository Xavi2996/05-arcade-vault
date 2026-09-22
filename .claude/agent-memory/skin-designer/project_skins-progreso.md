---
name: skins-progreso
description: Qué juegos de Arcade Vault tienen ya sus tres skins diseñadas, cuándo, y cuáles siguen pendientes
metadata:
  type: project
---

Estado del diseño de skins (el detalle con hex y ratios vive en `references/game-themes.md`, no aquí):

- **TETRIS** (`tetris`, PUZZLE/magenta) — diseñado **2026-09-22**. Primera ficha del archivo.
- ARKANOID (`arkanoid`, ARCADE/cyan) — pendiente.
- ASTEROIDS (`asteroids`, SHOOTER/yellow) — pendiente.
- SNAKE (`snake`, ARCADE/green) — pendiente.

Al cierre de la ficha de Tetris, **ningún juego tiene skins implementadas en código**: `RealGameProps`
(`components/GamePlayer.tsx`) sigue sin prop `skin` y `.crt` sin `data-skin`. La ficha de Tetris es
diseño en espera de `/spec`.

**Why:** evita rediseñar un juego ya cubierto y permite responder "¿qué falta?" sin releer el archivo
entero.
**How to apply:** verificar contra `references/game-themes.md` antes de fiarse de esta lista — es un
snapshot y el archivo es la fuente de verdad. Actualizar esta entrada al cerrar cada juego nuevo.

Relacionado: [[criterio-piezas-multicolor]].
