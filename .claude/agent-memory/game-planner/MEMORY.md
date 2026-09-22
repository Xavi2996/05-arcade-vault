# Memoria — game-planner

El backlog vive en `references/game-suggestions.todo.md` — **esa es la fuente de
verdad** de qué juegos se proponen y en qué estado están. Esta memoria guarda
solo el _porqué_. No dupliques aquí la lista de candidatos.

Índice: lee el archivo que toque cuando su línea sea relevante.

## Cómo trabajar

- [Calibración: no recortes el alcance](calibration_dont_narrow_scope.md) — **léelo primero.** Dos veces asumí restricciones más duras que las reales y hubo que deshacer el trabajo.
- [Preferencias del usuario](user_preferences.md) — controles, alcance, y que puede corregirse a sí mismo.

## Restricciones que deciden qué se puede proponer

- [Política de crecimiento del catálogo](catalog_growth_policy.md) — la tabla `games` **SÍ** crece con filas nuevas; coste de una fila y cómo sobrescribir si hiciera falta.
- [Contrato y gotchas del HUD](platform_game_contract.md) — `forwardRef`, vidas 3–5, `reportedLives = -1`, sin fallback de nivel, los `cover` son CSS a mano.
- [Constraints de Supabase](supabase_schema_constraints.md) — `score > 0`, `player_name` ≤ 10, FK de `scores`, fuentes agotadas.
- [2P local en VERSUS](versus_2p_local.md) — aprobado; se persiste siempre el score del Jugador 1, marcador del rival en canvas.

## Criterio y contexto

- [Ronda de backlog 2026-09-21](backlog_round_2026_09_21.md) — 18 conceptos ya consolidados en el TODO: **no re-derivarlos**. Método, colisiones y decisiones de alcance.
- [Antipatrones de candidatos](candidate_antipatterns.md) — qué hunde a un juego en la rúbrica, con ejemplo de cada caso.
- [Historial de decisiones](decision_history.md) — recomendaciones fechadas; `duelo-pixel` es la vigente.

## Candidatos descartados

Ninguno al 2026-09-21. `tanques-neon` y `mortero-neon` están bloqueados por
redundancia (perdieron sus colisiones), no por falta de mérito. Cuando descartes
uno de verdad, anota motivo y fecha en
[antipatrones](candidate_antipatterns.md) y refléjalo en la sección ❌ del TODO.

## Última sincronización con Supabase

**2026-09-21** — `select id, title, cat, color, playable from public.games`:
4 jugables (arkanoid, asteroids, snake, tetris) y 4 filas escritas sin
implementar (duelo-pixel, gloton, invasores, ranaria). **Sin drift** entre la
tabla, el TODO e `implemented-games.md`.
