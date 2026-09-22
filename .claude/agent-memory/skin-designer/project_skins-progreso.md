---
name: skins-progreso
description: Qué juegos de Arcade Vault tienen ya sus tres skins diseñadas, cuándo, y cuáles siguen pendientes
metadata:
  type: project
---

Estado del diseño de skins (el detalle con hex y ratios vive en `references/game-themes.md`, no aquí):

- **TETRIS** (`tetris`, PUZZLE/magenta) — diseñado **2026-09-22**. Primera ficha del archivo.
- **ARKANOID** (`arkanoid`, ARCADE/cyan) — diseñado **2026-09-22**. Único juego que pinta con
  **spritesheet PNG**: los hex hubo que sacarlos de los píxeles, y `neon`/`retro` exigen tintado en
  carga o PNGs alternos (ver [[paleta-desde-spritesheet]]). `retro` reutiliza la escala ámbar de
  TETRIS a propósito: el fósforo es acabado de plataforma, no identidad por juego.
- **ASTEROIDS** (`asteroids`, SHOOTER/yellow) — diseñado **2026-09-22**. `retro` en ámbar P3 de 3 tonos
  (no 4): es un juego vectorial, todo es contorno hueco, así que no hay recurso de "relleno hueco vs
  sólido" y la diferenciación descansa en la escala de luminancia + geometría.
- **SNAKE** (`snake`, ARCADE/green) — diseñado **2026-09-22**. Segundo juego con **spritesheet PNG**
  (`/games/snake/fruits.png`, 22 frutas; ver [[paleta-desde-spritesheet]]): `neon` y `retro` dependen
  por completo de retintar por composición, y dos frutas del PNG ni siquiera pasan el 3:1 en
  `clasico`. Solo tiene 3 roles jugables (cabeza/cuerpo/fruta), así que **no** se le aplica la
  excepción de [[criterio-piezas-multicolor]]: los tres pares se exigen ≥ 1.5:1 sin excusas.

**Corregido el 2026-09-22 (la nota anterior ya era falsa):** la infraestructura de skins **ya está
implementada y es agnóstica del juego** — `lib/skins.ts` (ids, `localStorage`, `resolvePalette`),
`skin?: SkinId` en `RealGameProps`, `data-skin` en `.crt` y el selector del HUD. Lo que gatea qué juego
ve el selector es `GAMES_WITH_SKINS` en `components/GamePlayer.tsx`, hoy solo `tetris`. Así que dar
skins a un juego ya no es construir infra: es escribir `components/games/skins/<id>.ts` y añadir su id
a ese set. **Verifica esto en el código antes de escribir la sección Integración de una ficha** — se
movió una vez y se volverá a mover.

**Why:** evita rediseñar un juego ya cubierto y permite responder "¿qué falta?" sin releer el archivo
entero.
**How to apply:** verificar contra `references/game-themes.md` antes de fiarse de esta lista — es un
snapshot y el archivo es la fuente de verdad. Actualizar esta entrada al cerrar cada juego nuevo.

Relacionado: [[criterio-piezas-multicolor]], [[paleta-desde-spritesheet]].
