---
name: platform-game-contract
description: Contrato forwardRef de los juegos y gotchas del HUD de GamePlayer (vidas 3-5, reportedLives=-1, sin fallback de nivel, covers son CSS a mano) que condicionan el diseño de todo candidato
metadata:
  type: project
---

Restricciones de la plataforma que **condicionan qué juego vale la pena
proponer**, no solo cómo implementarlo. Verificadas en código el 2026-09-21.

**Why:** varias de estas no se deducen leyendo el contrato `forwardRef`, y
cambian la ficha de un candidato (p. ej. "3 cúpulas, no 6"). Descubrirlas en el
spec o en la implementación es tarde.

**How to apply:** repásalas al redactar la ficha de cualquier candidato, sobre
todo los campos vidas / nivel / fuente. Antes de recomendar algo basándote en
un número de línea de aquí, **verifícalo**: el código pudo cambiar.

## Contrato base

- Componente `"use client"` con
  `forwardRef<{ restart }, { paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }>`.
- Se registra por `game.id` en `REAL_GAMES` de `components/GamePlayer.tsx`.
  El registry ya existe — añadir un juego es una entrada más, no un refactor.
- `GamePlayer.tsx` es dueño del HUD, la pausa, el modal de fin y el guardado del
  score. El HUD **asume un jugador** con vidas y nivel.
- Ver `references/implemented-games.md` (fuente de verdad, mantenida por quien
  implementa — **no la edites**).

## Gotchas del HUD

- **Las vidas deben quedarse en 3–5.** `components/GamePlayer.tsx:105` pinta
  `{"♥ ".repeat(lives).trim() || "—"}`. Con 0 muestra `—`; con 6+ desborda.
  Por eso un Missile Command va con **3 cúpulas, no 6**: restricción de diseño
  impuesta por el HUD.
- **El HUD arranca en `useState(3)`** (`GamePlayer.tsx:48`): un juego que nunca
  llame `onLivesChange` muestra **3 corazones falsos**.
- **Juegos sin vidas → patrón obligatorio `reportedLives = -1`.**
  `GamePlayer.restart()` resetea las vidas a 3 a ciegas, así que emitir
  `onLivesChange(0)` una sola vez no basta: tras reiniciar se queda el 3 pegado.
  Patrón documentado en `components/games/TetrisGame.tsx:378-381`; precedente de
  `onLivesChange(0)` en `TetrisGame.tsx:357`.
- **No hay fallback de nivel para juegos reales** (`GamePlayer.tsx:56`): sin
  `onLevelChange` el HUD se queda clavado en `01` para siempre.
- **Nada más cabe en el HUD.** Temporizadores, combustible, cola de piezas,
  ángulo/potencia o salud de una base **se dibujan dentro del canvas**. Un
  cuarto indicador es esfuerzo extra, no gratis.
- **Los `cover` NO son imágenes: son clases CSS pixel-art escritas a mano** en
  `app/globals.css` (8 clases, líneas 669–854). **Toda fila nueva en `games`
  arrastra el coste de escribir un `cover-*`** — esa es la ventaja concreta y
  medible de las 4 filas que ya existen, no solo "ahorrarse el copy".
- Los 4 juegos actuales usan `requestAnimationFrame`; `paused` congela el loop.
  Un juego basado en `setTimeout` o por turnos no encaja igual de bien con ese
  modelo de pausa.

Ver también [[supabase-schema-constraints]] y [[versus-2p-local-pattern]].
