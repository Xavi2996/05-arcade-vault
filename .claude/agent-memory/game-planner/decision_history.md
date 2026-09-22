---
name: decision-history
description: Historial de recomendaciones del game-planner y contexto previo de specs 05-09; duelo-pixel es el recomendado vigente desde 2026-09-21
metadata:
  type: project
---

Historial de decisiones de planificación. El **qué** vive en
`references/game-suggestions.todo.md`; aquí solo el **porqué** y la fecha.

## Contexto previo a este agente (de `specs/` y git)

- 05 Asteroids (2026-09-16) — primer juego portado, sirve de referencia.
- 07 Tetris (2026-09-17) — sobrescribió la fila "Caída".
- 08 Arkanoid (2026-09-18) — sobrescribió la fila "Bloque Buster".
- 09 Snake (2026-09-18) — sobrescribió la fila "Serpentina".

Los cuatro juegos se hicieron **sobrescribiendo filas sembradas**; nunca se
insertó una fila de juego nueva. Eso ya **no** es una regla: desde el 2026-09-21
la tabla puede crecer → [[catalog-growth-policy]].

## Decisiones de este agente

- **2026-09-21 — recomendado `duelo-pixel` (Pong, VERSUS, cyan). Vigente.**
  Motivo: VERSUS es la única categoría sin ningún juego jugable, su fila ya está
  escrita (cero coste de catálogo y de cover) y es el candidato de menor
  esfuerzo. Reconfirmado tres veces el mismo día: sobrevivió a la ronda de 18
  conceptos ([[backlog-round-2026-09-21]]), a las decisiones de alcance y a que
  se liberara la tabla `games`.
  **Alcance v1: 1P vs CPU + 2P local** → [[versus-2p-local-pattern]].
  Nota histórica: mi primera versión acotaba el juego a 1P vs CPU y declaraba
  como riesgo que el `long` de la fila prometía 2P. **Esa disonancia
  desapareció** cuando el usuario confirmó que quiere 2P: el copy existente
  quedó correcto tal cual.
  Alternativa nº 1 si se cae: **`invasores`** (el candidato más seguro del
  backlog, encaje sin fricción con el contrato).

- **2026-09-21 — orden recomendado tras `duelo-pixel`:** `fusion-2048` (2.º,
  PUZZLE está casi vacío y es barato y sin solape), `invasores` (3.º, el más
  seguro y sin coste de catálogo), `estelas` (4.º), `memoria-neon` (5.º).
  `gloton` va al fondo (#18) **por esfuerzo alto, no por falta de mérito**.
  ⚠️ **Decisión anulada el mismo día:** llegué a recomendar _sacrificar la fila
  de `gloton` para meter `fusion-2048`_, bajo la premisa falsa de que la tabla no
  podía crecer. Ya no aplica: ambos caben → [[catalog-growth-policy]].

- **2026-09-21 — resolución de las 2 colisiones de la ronda:** quedarse con
  `tanques` (no `tanques-neon`, esfuerzo alto) y con `artilleria` (no
  `mortero-neon`, aunque sea más barato: el rival humano en 2P le da identidad).
  Ninguna de las dos está ejecutada — siguen como decisión pendiente en el TODO.
