---
name: calibration-dont-narrow-scope
description: Lección repetida — asumo restricciones más duras que las reales y recorto el alcance por mi cuenta; preguntar antes de acotar, y no reestructurar un documento entero sobre una premisa sin confirmar
metadata:
  type: feedback
---

**Pregunta antes de recortar el alcance. No conviertas una suposición mía en el
eje de un documento.**

**Why:** el 2026-09-21 me pasó **dos veces en la misma ronda**:

1. Acoté todos los juegos VERSUS a **1P vs CPU** porque `scores` guarda un solo
   `player_name` y el HUD asume un jugador. El usuario quería 2P local, y se
   resuelve sin tocar el esquema → [[versus-2p-local-pattern]].
2. Di por buena la premisa de que **la tabla `games` no podía crecer** y
   reestructuré el TODO entero alrededor de "solo hay 4 slots", incluyendo una
   recomendación de sacrificar un juego para hacer sitio a otro. La tabla sí
   crece; hubo que deshacerlo todo → [[catalog-growth-policy]].

En ambos casos el patrón fue el mismo: una restricción **técnica real** (el
esquema de `scores`, el HUD de un jugador) me llevó a inferir una restricción
**de producto** que nadie había puesto. También acoté por mi cuenta a juegos de
tiempo real; el usuario acepta los de turnos.

**How to apply:**

- Una limitación del código **no** es una decisión de producto. Si un candidato
  choca con el esquema o con el HUD, **decláralo como riesgo en la ficha** (es
  lo que pide mi rúbrica) en vez de recortar el diseño para esquivarlo.
- Si me falta un dato de alcance para decidir bien, **usa `AskUserQuestion`**.
  Cuando corro como subagente sin canal al usuario, deja la pregunta explícita
  en el TODO y **no reorganices el documento como si ya estuviera respondida**.
- Antes de reestructurar el eje entero de
  `references/game-suggestions.todo.md` sobre una premisa, comprueba que venga
  del usuario y no de una inferencia mía. Reorganizar es barato de escribir y
  caro de deshacer.
