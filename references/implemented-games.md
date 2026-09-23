# Juegos implementados en Arcade Vault

Fuente: tabla `games` en Supabase (`playable = true`), consultada el 2026-09-23. Estos son los únicos juegos con un componente real en `components/games/` wireado a través del registro `REAL_GAMES` de `components/GamePlayer.tsx` y con leaderboard funcional en `/juegos/<id>` y en Salón de la Fama. El resto de filas de `games` (`duelo-pixel`, `gloton`, `invasores`) son entradas de catálogo con `playable = false` — aún no tienen juego real, solo la simulación de relleno.

---

## 🧱 Arkanoid

- **id:** `arkanoid`
- **Categoría / color:** ARCADE · cyan
- **Descripción:** Rebota la pelota y demuele muros de bloques de neón. Domina una paleta luminosa y pulveriza cinco niveles de muros cromáticos cada vez más traicioneros. Pierde la pelota tres veces y la partida termina.
- **Controles:** mover el mouse sobre el canvas y/o `ArrowLeft`/`ArrowRight` mueven la paleta. Rebote automático de la pelota contra paredes y paleta.
- **Controles táctiles:** cruz de dos direcciones, ◀ ▶ con repetición. Movimiento por botones, no analógico: el dedo sobre el canvas no mueve la paleta (el `mousemove` sigue siendo solo para ratón).
- **Componente:** `components/games/ArkanoidGame.tsx`
- **Spec:** `specs/08-juego-arkanoid.md` (Aprobado, 2026-09-18)

## ☄️ Asteroids

- **id:** `asteroids`
- **Categoría / color:** SHOOTER · yellow
- **Descripción:** Pulveriza asteroides en gravedad cero. Nave triangular en vacío absoluto: dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Power-up periódico de disparo triple (`3x`).
- **Controles:** `ArrowLeft`/`ArrowRight` rotar, `ArrowUp` empuje, `ArrowDown` retroceso, `Space` disparar.
- **Controles táctiles:** cruz completa ▲ ▼ ◀ ▶ con repetición (empuje, retroceso y giro) más un botón de acción ● disparar, de un toque. Girar y disparar a la vez funciona con dos dedos.
- **Componente:** `components/games/AsteroidsGame.tsx`
- **Spec:** `specs/05-juego-asteroides.md` (Aprobado, 2026-09-16) — primer juego portado, sirve de referencia de implementación para los siguientes.

## 🐸 Frogger

- **id:** `frogger`
- **Categoría / color:** ARCADE · green
- **Descripción:** Cruza la carretera y el río sin convertirte en papilla. Cuadrícula de 16×14 celdas de 40 px (canvas 640×560) repartida en cuatro zonas: bocas destino (fila 0), río (filas 1–6), franja segura (fila 7), carretera (filas 8–12) y base de inicio (fila 13). Cinco carriles de coches y camiones abajo; arriba, seis carriles de troncos y tortugas que se sumergen cada 3 s / 1,5 s y dejan de sostener. Llenar las cinco bocas cierra la ronda: +200 pts, nivel +1 y todas las velocidades ×1,15.
- **Puntuación:** +10 por cada fila nueva ganada en la subida actual (el contador se reinicia al volver a la base, por meta o por muerte), +50 al ocupar una boca, + `segundos restantes × 10` de bonus, +200 al completar la ronda.
- **Vidas y tiempo:** 3 vidas. Temporizador de ronda de 15 s, `-1 s` por nivel con suelo de 7 s. Se muere por vehículo, por agua, por tortuga sumergida, por arrastre fuera del cauce, por tiempo agotado y por saltar a una boca ocupada o a la fila 0 fuera de boca.
- **Controles:** solo flechas (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`); salto discreto de una celda con animación de 120 ms. La rana no puede salir por los bordes laterales por voluntad propia.
- **Controles táctiles:** cruz completa ▲ ▼ ◀ ▶ sin repetición — se consume una dirección por salto, así que mantener pulsado no aporta nada. Sin botones de acción.
- **HUD interno:** comparte la fila 0 con las bocas (16 px de HUD arriba, 24 px de boca abajo): barra de tiempo, score a la izquierda, nivel al centro e iconos de rana a la derecha.
- **Componente:** `components/games/FroggerGame.tsx`
- **Spec:** `specs/12-juego-frogger.md` (Aprobado, 2026-09-23) — promovido desde `specs/game-jam/frogger/01-frogger-core.md` y reemplazó a la entrada de catálogo "Ranaria".

## 🐍 Snake

- **id:** `snake`
- **Categoría / color:** ARCADE · green
- **Descripción:** Crece serpenteando y devora frutas de neón sin morder tu propia cola. Grilla de 20x20, 18+ frutas pixel-art al azar; cada bocado alarga la serpiente y acelera el ritmo cada 5 frutas. Chocar contra el borde o contra la propia cola termina la partida al instante.
- **Controles:** solo flechas (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`); no se permite reversa instantánea de 180°. Sin esquema WASD (descartado a propósito).
- **Controles táctiles:** cruz completa ▲ ▼ ◀ ▶ sin repetición — el juego consume una dirección por tick, así que mantener pulsado no aporta nada. Sin botones de acción.
- **Componente:** `components/games/SnakeGame.tsx` (sprites en `components/games/snake-sprites.ts`)
- **Spec:** `specs/09-juego-snake.md` (Aprobado, 2026-09-18) — reemplazó a la entrada de catálogo "Serpentina".

## 🧩 Tetris

- **id:** `tetris`
- **Categoría / color:** PUZZLE · magenta
- **Descripción:** Encaja piezas antes de que el tablero se desborde. Ocho piezas geométricas (las siete clásicas + una "tuerca" extra) caen en un tablero de 10x20, con wall kicks, pieza fantasma y vista previa. La velocidad aumenta cada 10 líneas.
- **Controles:** `ArrowLeft`/`ArrowRight` mover, `ArrowDown` caída suave (+1 punto/fila), `ArrowUp` o `KeyX` rotar, `Space` caída instantánea (+2 puntos/celda). Puntuación de líneas: `[0,100,300,500,800][cleared] * nivel`.
- **Controles táctiles:** cruz de tres direcciones ◀ ▼ ▶ con repetición, más dos botones de acción de un toque: ↻ rotar (`KeyX`) y ⤓ soltar (`Space`). ▲ no se pinta porque rotar ya tiene su propio botón.
- **Componente:** `components/games/TetrisGame.tsx`
- **Spec:** `specs/07-juego-tetris.md` (Aprobado, 2026-09-17) — reemplazó a la entrada de catálogo "Caída".

---

## Patrón común

Los cinco comparten el mismo contrato con `GamePlayer.tsx`:

- Componente `forwardRef<{ restart }, { paused, skin?, onScoreChange, onLivesChange, onLevelChange, onGameOver }>`.
- Cada juego exporta además `ASPECT` (proporción del área jugable) y `TOUCH_CONTROLS` (su mapa de controles táctiles), que `GamePlayer.tsx` agrupa en los registros `GAME_ASPECTS` y `GAME_TOUCH_CONTROLS`.
- HUD (jugador, puntuación, vidas, nivel), pausa y modal de fin de partida los gestiona `GamePlayer.tsx`, no cada juego.
- El leaderboard (`lib/scores.ts` → tabla `scores`) es genérico: dar de alta un nuevo juego real requiere solo una fila nueva en `games` + su componente, sin tocar el esquema ni el código del leaderboard (ver `specs/06-catalogo-y-leaderboard-supabase.md`).

### Entrada táctil

Los cinco juegos siguen leyendo el teclado exactamente igual que antes; el táctil es una segunda fuente que alimenta el mismo estado interno. Los botones en pantalla emiten al bus de `lib/input.ts` (`pressVirtualKey` / `releaseVirtualKey`) y cada juego se suscribe con `subscribeVirtualInput` dentro de su `useEffect` principal. La barra se renderiza bajo el gabinete, nunca encima del canvas, y solo con puntero grueso (`(pointer: coarse)`), así que en escritorio con ratón no existe. Ver `specs/11-controles-tactiles-movil.md`.

Para agregar un juego nuevo a esta lista, usar la skill `/spec-juego` para redactar el spec y `/spec-impl-game` para implementarlo y cerrarlo (catálogo, fichas y skins).
