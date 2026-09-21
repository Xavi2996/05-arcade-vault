# Sugerencias de juegos

Backlog de candidatos para el catálogo de Arcade Vault. Lo mantiene el agente
`game-planner` (`.claude/agents/game-planner.md`) — no lo edites a mano salvo
para corregir un error; el agente edita este archivo de forma incremental.

Flujo: `game-planner` decide y escribe aquí → tú lanzas `/spec-juego` con la
ficha del recomendado → `/spec-impl` lo implementa.

Fuente de verdad de lo ya jugable: `references/implemented-games.md`.

---

## 🎯 Próximo recomendado

_Pendiente — sin evaluar todavía. Invoca a `game-planner` para que analice el
catálogo y escriba aquí su recomendación con ficha completa._

## 📋 Backlog

Filas que ya existen en la tabla `games` con `playable = false`. Tienen título,
copy y cover escritos, así que implementarlas ahorra el trabajo de catálogo.
Ninguna ha sido evaluada aún por `game-planner`.

- [ ] **DUELO PIXEL** (`duelo-pixel`) · VERSUS · cyan
      sin evaluar · única fila VERSUS del catálogo
- [ ] **GLOTÓN** (`gloton`) · ARCADE · yellow
      sin evaluar
- [ ] **INVASORES** (`invasores`) · SHOOTER · green
      sin evaluar
- [ ] **RANARIA** (`ranaria`) · ARCADE · green
      sin evaluar

## ✅ Implementados

- [x] **ARKANOID** (`arkanoid`) · ARCADE · cyan → `specs/08-juego-arkanoid.md`
- [x] **ASTEROIDS** (`asteroids`) · SHOOTER · yellow → `specs/05-juego-asteroides.md`
- [x] **SNAKE** (`snake`) · ARCADE · green → `specs/09-juego-snake.md`
- [x] **TETRIS** (`tetris`) · PUZZLE · magenta → `specs/07-juego-tetris.md`

## ❌ Descartados

_Ninguno todavía._

---

## Estado del catálogo

Consultado en Supabase el 2026-09-21 (`select id, title, cat, color, playable
from public.games order by id;`).

| Categoría | Jugables | En catálogo sin implementar |
| --- | --- | --- |
| ARCADE | arkanoid, snake | gloton, ranaria |
| PUZZLE | tetris | — |
| SHOOTER | asteroids | invasores |
| VERSUS | **ninguno** | duelo-pixel |

| Color | Jugables |
| --- | --- |
| cyan | arkanoid |
| green | snake |
| magenta | tetris |
| yellow | asteroids |

Huecos visibles: **VERSUS no tiene ningún juego jugable**, y ARCADE está
sobrerrepresentada con 2 de 4.
