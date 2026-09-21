---
name: candidate-antipatterns
description: Patrones que hunden a un candidato en la rúbrica (sin game over natural, juego de contenido, score discreto, muerte por azar, categoría falsa, capa técnica ausente) con el ejemplo de cada uno
metadata:
  type: project
---

De los 18 conceptos de la ronda del 2026-09-21 **no se descartó ninguno**, pero
quedaron identificados los patrones que hunden a un candidato.

**Why:** son juicios ya razonados; repetir el análisis desde cero en cada ronda
es desperdicio.

**How to apply:** pásale esta lista a cualquier candidato nuevo antes de
proponerlo. Si cae en uno, dilo explícitamente en la ficha en vez de dejarlo
pasar en silencio.

- **Sin game over natural** (`bodega`/Sokoban): el límite de intentos habría que
  imponerlo artificialmente. Choca con el criterio duro de la plataforma, que
  exige un game over claro que dispare `onGameOver(finalScore)`.
- **Juego de contenido, no de código** (`bodega` otra vez): el valor está en
  niveles diseñados a mano; el esfuerzo no termina cuando el código funciona.
- **Score discreto a saltos grandes**: produce muchos empates y hace aburrido el
  leaderboard, que es el núcleo del producto.
- **Muerte por azar** (`campo-neon`/Buscaminas): los 50/50 irresolubles
  **envenenan un leaderboard competitivo**. Garantizar tableros deducibles lo
  arregla pero sube el esfuerzo un escalón entero.
- **Identidad de categoría falsa** (`justa`/Joust): se propone como VERSUS pero
  en la práctica son oleadas PvE, así que **no llena el hueco de categoría**, que
  era justamente la razón para elegirlo.
- **Exige una capa técnica que el repo no tiene**: `memoria-neon`/Simon depende
  del **audio** y ningún juego del repo usa audio todavía. Además pausar una
  máquina de estados con `setTimeout` es más delicado que congelar un `rAF`, que
  es lo que hacen los 4 juegos actuales.
- **Solape de sensación, no solo de mecánica** (`modulo-lunar` vs Asteroids):
  mismos controles de rotar + empujar aunque el objetivo sea el opuesto. El
  jugador piensa "esto ya lo jugué". Vale para `estelas` vs Snake también.

Ver también [[platform-game-contract]] y [[supabase-schema-constraints]] para
los límites que directamente descalifican un diseño.
