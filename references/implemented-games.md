# Juegos implementados en Arcade Vault

Fuente: tabla `games` en Supabase (`playable = true`), consultada el 2026-09-18. Estos son los únicos juegos con un componente real en `components/games/` wireado a través del registro `REAL_GAMES` de `components/GamePlayer.tsx` y con leaderboard funcional en `/juegos/<id>` y en Salón de la Fama. El resto de filas de `games` (`duelo-pixel`, `gloton`, `invasores`, `ranaria`) son entradas de catálogo con `playable = false` — aún no tienen juego real, solo la simulación de relleno.

---

## 🧱 Arkanoid

- **id:** `arkanoid`
- **Categoría / color:** ARCADE · cyan
- **Descripción:** Rebota la pelota y demuele muros de bloques de neón. Domina una paleta luminosa y pulveriza cinco niveles de muros cromáticos cada vez más traicioneros. Pierde la pelota tres veces y la partida termina.
- **Controles:** mover el mouse sobre el canvas y/o `ArrowLeft`/`ArrowRight` mueven la paleta. Rebote automático de la pelota contra paredes y paleta.
- **Componente:** `components/games/ArkanoidGame.tsx`
- **Spec:** `specs/08-juego-arkanoid.md` (Aprobado, 2026-09-18)

## ☄️ Asteroids

- **id:** `asteroids`
- **Categoría / color:** SHOOTER · yellow
- **Descripción:** Pulveriza asteroides en gravedad cero. Nave triangular en vacío absoluto: dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Power-up periódico de disparo triple (`3x`).
- **Controles:** solo teclado — `ArrowLeft`/`ArrowRight` rotar, `ArrowUp` empuje, `Space` disparar.
- **Componente:** `components/games/AsteroidsGame.tsx`
- **Spec:** `specs/05-juego-asteroides.md` (Aprobado, 2026-09-16) — primer juego portado, sirve de referencia de implementación para los siguientes.

## 🐍 Snake

- **id:** `snake`
- **Categoría / color:** ARCADE · green
- **Descripción:** Crece serpenteando y devora frutas de neón sin morder tu propia cola. Grilla de 20x20, 18+ frutas pixel-art al azar; cada bocado alarga la serpiente y acelera el ritmo cada 5 frutas. Chocar contra el borde o contra la propia cola termina la partida al instante.
- **Controles:** solo flechas (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`); no se permite reversa instantánea de 180°. Sin esquema WASD (descartado a propósito).
- **Componente:** `components/games/SnakeGame.tsx` (sprites en `components/games/snake-sprites.ts`)
- **Spec:** `specs/09-juego-snake.md` (Aprobado, 2026-09-18) — reemplazó a la entrada de catálogo "Serpentina".

## 🧩 Tetris

- **id:** `tetris`
- **Categoría / color:** PUZZLE · magenta
- **Descripción:** Encaja piezas antes de que el tablero se desborde. Ocho piezas geométricas (las siete clásicas + una "tuerca" extra) caen en un tablero de 10x20, con wall kicks, pieza fantasma y vista previa. La velocidad aumenta cada 10 líneas.
- **Controles:** `ArrowLeft`/`ArrowRight` mover, `ArrowDown` caída suave (+1 punto/fila), `ArrowUp` o `KeyX` rotar, `Space` caída instantánea (+2 puntos/celda). Puntuación de líneas: `[0,100,300,500,800][cleared] * nivel`.
- **Componente:** `components/games/TetrisGame.tsx`
- **Spec:** `specs/07-juego-tetris.md` (Aprobado, 2026-09-17) — reemplazó a la entrada de catálogo "Caída".

---

## Patrón común

Los cuatro comparten el mismo contrato con `GamePlayer.tsx`:

- Componente `forwardRef<{ restart }, { paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }>`.
- HUD (jugador, puntuación, vidas, nivel), pausa y modal de fin de partida los gestiona `GamePlayer.tsx`, no cada juego.
- El leaderboard (`lib/scores.ts` → tabla `scores`) es genérico: dar de alta un nuevo juego real requiere solo una fila nueva en `games` + su componente, sin tocar el esquema ni el código del leaderboard (ver `specs/06-catalogo-y-leaderboard-supabase.md`).

Para agregar un juego nuevo a esta lista, usar la skill `/spec-juego`.
