# SPEC GJ-03 — VADO (jam: Cruza la carretera y el río sin convertirte en papilla)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-09-21
> **Jam:** Cruza la carretera y el río sin convertirte en papilla · concepto 3 de 3 · diseño de juego en [`./design.md`](./design.md)
> **Promoción:** este spec vive fuera de `specs/`, así que `/spec-impl` **no lo encuentra**. Para implementarlo: copiarlo a `specs/<NN>-juego-vado.md` con el siguiente número libre de la serie principal, renombrar el título a `# SPEC <NN> — …`, cambiar el Estado a `Aprobado` a mano, y recién entonces ejecutar `/spec-impl <NN>-juego-vado`.
> **Objetivo:** Un puzzle de colocación en grilla donde pones piedras delante de un caminante para que suba de orilla a orilla mientras la corriente arrastra el tablero entero hacia abajo.

## Scope

**In:**

- Migración `supabase/migrations/000X_add_vado.sql` con un `insert into public.games (...)` de **fila nueva** (no reemplaza ningún placeholder), con `playable = true`.
- Nuevo componente `components/games/VadoGame.tsx`, construido desde cero: canvas único de 480×480, grilla lógica de **9 columnas × 9 filas** de 48 px con margen de 24 px, loop `requestAnimationFrame` con `dt` clamped y acumuladores de tiempo, listeners montados y limpiados dentro de un `useEffect` — mismo patrón que `components/games/AsteroidsGame.tsx`.
- Contrato estándar: props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef` + `useImperativeHandle`.
- Controles: `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight` (y `W`/`A`/`S`/`D`) mueven el cursor una celda por pulsación; `Space` coloca la pieza actual bajo el cursor. Sin repetición automática al mantener la tecla.
- Piezas: **piedra** (ocupa 1 celda) y **tablón** (ocupa 2 celdas horizontales, la del cursor y la de su derecha). Cada 5 piezas colocadas, la siguiente es un tablón; el resto son piedras. La pieza actual y la siguiente se dibujan dentro del canvas.
- Stock: máximo 5 piezas, recarga 1 cada 1100 ms, dibujado dentro del canvas. Colocar consume 1. Sin stock no se puede colocar.
- Colocación inválida (celda ocupada, fuera de la grilla, o segunda celda del tablón ocupada) no consume stock y muestra un parpadeo rojo en el cursor.
- Erosión: cada piedra o tablón desaparece **9 segundos** después de colocarse, parpadeando durante el último segundo.
- Caminante: ficha que empieza en la fila 8 (la inferior) en la columna 4. Tras cada colocación y tras cada tick de corriente, avanza **un solo paso** si hay pieza en `(fila-1, col)`; si no, en `(fila-1, col-1)`; si no, en `(fila-1, col+1)`; si ninguna, se queda quieto. Es una comprobación de tres celdas, no un pathfinding.
- Corriente: cada `T` ms todo el contenido del tablero (piezas y caminante) baja **una fila**; lo que sale por debajo de la fila 8 se pierde.
- Puntuación: cada paso del caminante suma exactamente **10 puntos**. Alcanzar la fila 0 completa un cruce y suma **100 puntos** adicionales; el tablero se limpia y el caminante reaparece en la fila 8, en una columna aleatoria. Sin combos.
- `onLivesChange`: el juego **no tiene vidas**. Se implementa el patrón `reportedLives = -1` con precedente en `components/games/TetrisGame.tsx` (líneas del bloque `reportedLives`): una variable local arranca en `-1`, se emite `onLivesChange(0)` en cuanto difiere de `0`, y `restart()` vuelve a ponerla en `-1` para forzar la re-emisión, porque `GamePlayer.restart()` resetea el HUD a 3 vidas a ciegas.
- `onLevelChange`: `floor(pasos / 12) + 1`; cada nivel acorta el intervalo de la corriente desde 5000 ms en `-350 ms`, con piso de 1800 ms.
- `onGameOver(score)` se dispara cuando un tick de corriente empuja al caminante por debajo de la fila 8, es decir, fuera del tablero.
- Nueva entrada `vado: VadoGame` en el registro `REAL_GAMES` de `components/GamePlayer.tsx` — el registro ya existe desde specs/07, solo se añade una entrada, sin refactor.
- Nuevo bloque CSS `.cover-vado` en `app/globals.css`, siguiendo el estilo pixel-art a mano de las clases vecinas; los stops exactos del gradiente son un detalle de implementación de `/spec-impl`.
- El leaderboard de `/juegos/vado` y el tab del Salón de la Fama funcionan sin código nuevo en cuanto exista la fila con `playable = true` — specs/06 ya lo dejó genérico.

**Out of scope (para futuros specs):**

- Más tipos de pieza (roca resistente a la erosión, pilote que fija una columna, barca que se mueve sola).
- Varios caminantes simultáneos o caminantes con velocidad propia.
- Obstáculos fijos en el cauce (rocas del fondo, remolinos que anulan celdas).
- Modo sin corriente o modo de puzzles diseñados a mano.
- Audio, soporte táctil/móvil y control con ratón para colocar piezas.
- Cambios a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx` — ya son completamente genéricos.
- Cálculo en vivo de `best` / `plays` desde `scores` — decisión cerrada en specs/06, no se reabre.
- Los otros dos juegos de este jam (`GJ-01`, `GJ-02`), cada uno con su propio spec.

## Data model

```sql
-- supabase/migrations/000X_add_vado.sql  (numeración real al promover el spec)
insert into public.games (id, title, short, long, cat, cover, color, best, plays, playable)
values (
  'vado',
  'VADO',
  'Coloca piedras delante del caminante para que cruce antes de que la corriente se lo lleve.',
  'Tú no cruzas: construyes el paso. En una grilla de nueve por nueve vas soltando piedras y tablones justo delante de un caminante que avanza solo, una celda por cada apoyo que encuentre. La corriente arrastra todo el tablero una fila hacia abajo cada pocos segundos y las piedras se hunden a los nueve segundos. Si el caminante sale por abajo, se acabó.',
  'PUZZLE',
  'cover-vado',
  'magenta',
  0,
  '0',
  true
);
```

Fila **nueva**: no toca ningún placeholder existente. Verificado el 2026-09-21 contra `public.games` que `'vado'` no existe (ids ocupados: `arkanoid`, `asteroids`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `snake`, `tetris`), y contra `app/globals.css` que `cover-vado` no está definido.

```ts
export interface VadoGameHandle {
  restart: () => void;
}

interface VadoGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // siempre 0, vía el patrón reportedLives = -1
  onLevelChange: (level: number) => void; // floor(pasos / 12) + 1
  onGameOver: (finalScore: number) => void; // el caminante sale del tablero por abajo
}
```

## Implementation plan

1. Crear y aplicar `supabase/migrations/000X_add_vado.sql`; confirmar con `execute_sql` que la fila existe con `playable = true`.
2. Crear `components/games/VadoGame.tsx` con el esqueleto del contrato (canvas 480×480, grilla 9×9 dibujada, loop vacío con `dt` clamped, callbacks cableados, `restart()` ya expuesto). Prueba manual: `/juegos/vado/jugar` renderiza la grilla sin errores de consola.
3. Implementar el cursor (movimiento de una celda por pulsación, con clamp a la grilla) y la colocación de piedras con `Space`, incluyendo el stock de 5 con recarga cada 1100 ms y el rechazo de colocaciones inválidas.
4. Implementar la erosión: marca de tiempo por pieza, desaparición a los 9 s con parpadeo en el último segundo.
5. Implementar el caminante y su regla de avance de tres comprobaciones, con `onScoreChange` de +10 por paso, y el cruce completado (+100, limpieza del tablero, reaparición abajo).
6. Implementar la corriente (tick que baja todo una fila), el tablón cada 5 piezas, la progresión de nivel (`onLevelChange`), el patrón `reportedLives = -1` copiado de `TetrisGame.tsx`, `onGameOver` y el reset completo en `restart()`.
7. Añadir la entrada `vado: VadoGame` al registro `REAL_GAMES` de `components/GamePlayer.tsx`, sin cambiar su estructura.
8. Añadir el bloque `.cover-vado` a `app/globals.css`, siguiendo el estilo de las clases vecinas.
9. Prueba manual completa (`npm run dev`): colocar piedras y tablones, ver avanzar al caminante, completar un cruce, quedarse sin stock, ver hundirse una piedra, perder por arrastre, ver el modal "FIN DEL JUEGO", guardar la puntuación, "JUGAR DE NUEVO" comprobando que el HUD de Vidas vuelve a `—`, PAUSA/REANUDAR, y confirmar que Asteroids, Tetris, Arkanoid y Snake siguen funcionando igual.
10. Confirmar la tarjeta en `/biblioteca`, el leaderboard en `/juegos/vado` y el tab en `/salon-de-la-fama`.
11. Ejecutar `npm run lint` y `npm run build`; ambos sin errores.

## Acceptance criteria

- [ ] `public.games` contiene una fila `id: 'vado'` con `cat: 'PUZZLE'`, `color: 'magenta'`, `cover: 'cover-vado'` y `playable: true`.
- [ ] La tarjeta "VADO" aparece en `/biblioteca` y se filtra correctamente con la categoría PUZZLE.
- [ ] `/juegos/vado` carga sin error 404 y "JUGAR AHORA" apunta a `/juegos/vado/jugar`.
- [ ] Las flechas y WASD mueven el cursor exactamente una celda por pulsación, sin repetición al mantener la tecla, y el cursor no sale de la grilla.
- [ ] `Space` coloca la pieza actual; una colocación inválida no consume stock y parpadea en rojo.
- [ ] Cada 5 piezas colocadas, la siguiente es un tablón de 2 celdas, y la pieza actual y la siguiente se ven dibujadas dentro del canvas.
- [ ] El stock nunca supera 5, baja 1 por colocación válida, se repone 1 cada 1100 ms y bloquea la colocación cuando está a 0.
- [ ] Una pieza colocada desaparece a los 9 segundos y parpadea durante el último segundo antes de hacerlo.
- [ ] El caminante avanza una sola celda por evento, priorizando arriba, luego arriba-izquierda, luego arriba-derecha, y cada paso suma exactamente 10 puntos.
- [ ] Alcanzar la fila superior suma exactamente 100 puntos adicionales, limpia el tablero y coloca al caminante de nuevo en la fila inferior.
- [ ] La corriente baja todo el tablero una fila en cada tick, y el intervalo sigue `5000 ms - 350 ms por nivel` sin bajar de 1800 ms.
- [ ] El nivel del HUD sube según `floor(pasos / 12) + 1`.
- [ ] El indicador de Vidas del HUD muestra `—` durante toda la partida, **y sigue mostrando `—` después de pulsar "JUGAR DE NUEVO"** (patrón `reportedLives = -1`).
- [ ] Que la corriente empuje al caminante fuera del tablero por abajo abre el modal "FIN DEL JUEGO" con la puntuación real, sin ningún overlay propio dibujado en el canvas.
- [ ] Guardar la puntuación inserta una fila real en `scores` con `game_id: 'vado'`.
- [ ] "JUGAR DE NUEVO" reinicia a puntuación 0, nivel 1, tablero vacío, stock lleno y caminante en la fila inferior.
- [ ] "PAUSA"/"REANUDAR" congela el juego y lo continúa sin saltos: al reanudar, ni la corriente ni la erosión ni la recarga descuentan el tiempo transcurrido en pausa.
- [ ] `/juegos/asteroids/jugar`, `/juegos/tetris/jugar`, `/juegos/arkanoid/jugar` y `/juegos/snake/jugar` siguen funcionando exactamente igual.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** colocación libre con cursor en vez de piezas que caen — es lo que separa a VADO de Tetris: no hay gravedad, no hay rotación, no hay tetrominós y no se despejan filas completas.
- **Sí:** el avance del caminante se resuelve con tres comprobaciones fijas y deterministas (arriba, arriba-izquierda, arriba-derecha) — un pathfinding real está fuera del presupuesto de esfuerzo y además haría el juego menos legible.
- **Sí:** `cat: PUZZLE` y `color: magenta` — es el único juego de decisiones discretas del trío, y el magenta completa la terna amarillo/cian/magenta evitando el `green` saturado del catálogo.
- **Sí:** la lente es el **sistema** — la fuerza abstracta del tema es la corriente que arrastra, traducida literalmente a un tablero que baja una fila cada pocos segundos.
- **Sí:** fila nueva en `games` en vez de reutilizar un placeholder — el único placeholder afín por tema es `ranaria`, reservado para un Frogger clásico con salto por casillas, que no es este juego.
- **Sí:** `playable = true` en el mismo `insert` — sin eso, `lib/games.ts#getGames()` filtra la fila y la tarjeta nunca aparece en `/biblioteca`.
- **Sí:** sin vidas, con el patrón `reportedLives = -1` de `components/games/TetrisGame.tsx` — el juego termina de una vez y no hay nada que perder tres veces; el patrón es obligatorio porque `GamePlayer.restart()` pone el HUD en 3 vidas a ciegas y una sola emisión de `onLivesChange(0)` al montar dejaría tres corazones falsos tras "JUGAR DE NUEVO".
- **Sí:** erosión a 9 segundos por pieza — obliga a construir hacia adelante en vez de preparar un puente entero antes de mover al caminante, que era la forma trivial de romper el juego.
- **No:** sin audio, sin assets externos, sin dependencias npm nuevas — todo se dibuja con primitivas de canvas.
- **No:** sin soporte táctil ni móvil, y sin colocación con ratón.
- **No:** no se introducen tablas ni columnas nuevas; `lib/games.ts` y `lib/scores.ts` quedan intactos.
- **No:** se descartó el despeje de filas completas al estilo Tetris — solapaba directamente con un juego ya implementado en la plataforma.

## Risks

| Riesgo                                                                                                                | Mitigación                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin el patrón `reportedLives = -1`, el HUD mostraría 3 corazones falsos tras cada "JUGAR DE NUEVO".                   | El spec exige copiar el patrón de `components/games/TetrisGame.tsx` y el criterio de aceptación verifica el `—` **después** de reiniciar, no solo durante la primera partida.                                                                                          |
| El jugador podría construir un puente completo por adelantado y ganar sin tensión.                                    | Stock máximo de 5 piezas con recarga de 1100 ms, más la erosión de 9 s: no alcanza para preparar ocho filas antes de que la primera se hunda. El paso 9 incluye intentar esta estrategia explícitamente.                                                               |
| El caminante podría quedarse bloqueado sin ninguna opción y el jugador perder sin poder hacer nada.                   | El caminante nunca queda atrapado: cualquier celda libre de la fila superior adyacente es colocable, y si el stock está a 0 la recarga llega antes que el siguiente tick de corriente en todos los niveles (1100 ms de recarga frente a 1800 ms de piso de corriente). |
| Al reanudar tras una pausa larga, los acumuladores de corriente, erosión y recarga podrían dispararse todos a la vez. | Los tres acumuladores avanzan con el `dt` clamped del loop, que no corre mientras `paused` es `true`; el criterio de aceptación lo verifica de forma explícita.                                                                                                        |
| El tablón de 2 celdas puede colocarse parcialmente fuera de la grilla en la última columna.                           | La colocación se valida antes de consumir stock: si la celda de la derecha no existe o está ocupada, la acción se rechaza con parpadeo rojo y sin coste.                                                                                                               |
| Añadir la entrada al registro `REAL_GAMES` podría romper alguno de los cuatro juegos ya implementados.                | El paso 9 exige probar explícitamente Asteroids, Tetris, Arkanoid y Snake después del cambio.                                                                                                                                                                          |

## Lo que **no** está en este spec

- Más tipos de pieza y caminantes múltiples.
- Obstáculos fijos en el cauce.
- Modo sin corriente o puzzles diseñados a mano.
- Audio, táctil/móvil y colocación con ratón.
- Cálculo en vivo de `best` / `plays`.
- Los otros dos conceptos del jam «Cruza la carretera y el río sin convertirte en papilla».
