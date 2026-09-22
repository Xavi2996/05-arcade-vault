---
name: backlog-round-2026-09-21
description: La ronda de 4 pasadas paralelas que produjo 18 conceptos ya consolidados en el TODO — no re-derivar el backlog; incluye método, colisiones y decisiones del usuario
metadata:
  type: project
---

El 2026-09-21 se corrió una **ronda de exploración exhaustiva**: 4 pasadas en
paralelo, una por categoría, que produjeron **20 propuestas / 18 conceptos
distintos**. Están consolidados, priorizados y con ficha completa en
`references/game-suggestions.todo.md`.

**Why:** cubrir el espacio de juegos arcade clásicos de una vez, en lugar de
proponerlos de a uno.

**How to apply:** **no vuelvas a re-derivar el backlog.** Si hace falta un
candidato, parte del TODO y afina. La exploración amplia está agotada.
`duelo-pixel` sobrevivió a la ronda y sigue siendo el recomendado.

## Aprendizajes del método (no están en el TODO)

- Una pasada por categoría es buen método: **fuerza cubrir PUZZLE y VERSUS**,
  que quedan invisibles si se razona sobre el catálogo entero de golpe.
- El coste de esa exhaustividad son **colisiones entre pasadas**: salieron 2
  (`tanques`/`tanques-neon` y `artilleria`/`mortero-neon`). Si se repite el
  método, revisarlas es parte obligatoria de la consolidación.
- **PUZZLE es el hueco más olvidado**: solo tiene Tetris, y ninguna de las 4
  filas preexistentes sin implementar es PUZZLE. Por eso `fusion-2048` quedó 2.º
  en el orden recomendado. Ver [[catalog-growth-policy]].

## Las tres decisiones del usuario que reordenaron la ronda

Las tres se cerraron el mismo 2026-09-21, después de que yo las planteara como
preguntas abiertas. Quedan **respondidas — no las vuelvas a preguntar**:

- **2P local en VERSUS: SÍ** → [[versus-2p-local-pattern]].
- **Juegos por turnos: SÍ se aceptan.** Al usuario no le importa el cambio de
  ritmo y acepta que el botón de pausa quede decorativo. Dejó de penalizar a
  `fusion-2048`, `mortero-neon` y `artilleria`.
- **La tabla `games` SÍ puede crecer con filas nuevas** →
  [[catalog-growth-policy]]. Ojo: primero respondió lo contrario y luego se
  corrigió, y yo llegué a reestructurar el TODO entero sobre la respuesta
  errónea. Está deshecho.

Patrón a recordar, y es la lección principal de la ronda: **las tres respuestas
fueron más permisivas de lo que yo había asumido.** Ver
[[calibration-dont-narrow-scope]].
