# SPEC 07 — Juego real de Tetris (CAÍDA → TETRIS) integrado a la plataforma

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-09-17
> **Objetivo:** Portar el juego de piezas que caen ya prototipado en `references/templates/started-games/03-tetris/game.js` a un componente React (`components/games/TetrisGame.tsx`) que reemplaza el placeholder "CAÍDA" del catálogo por "TETRIS" jugable de verdad, generalizando `GamePlayer.tsx` a un registro de juegos reales (Asteroids + Tetris) y reutilizando sin cambios el leaderboard genérico de specs/06.

## Scope

**In:**

- Migración SQL que actualiza la fila existente `id: "caida"` en `games`: cambia `id` a `"tetris"` y `title` a `"TETRIS"`, reescribe `short`/`long` para reflejar las mecánicas reales del port (tablero 10×20, 8 piezas incluida una "tuerca" extra fuera de las 7 clásicas, pieza fantasma, wall kicks al rotar, vista previa de la siguiente pieza). Mantiene `cat: "PUZZLE"`, `color: "magenta"`, `cover: "cover-tetro"`, `best: 184220`, `plays: "31.8K"` tal cual.
- Nuevo componente `components/games/TetrisGame.tsx`: puerto a React/TypeScript del contenido íntegro de `game.js` (tablero, generación y colisión de piezas, rotación con wall kicks `[0,-1,1,-2,2]`, limpieza de líneas, pieza fantasma, canvas de vista previa), montado vía `useRef`+`useEffect` con loop `requestAnimationFrame`, limpiando listeners/RAF al desmontar — mismo patrón que `AsteroidsGame.tsx`.
- El componente expone el contrato estándar ya usado por Asteroids: props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef`+`useImperativeHandle`.
- `onLivesChange` siempre reporta `0` (Tetris no tiene concepto de vidas: termina cuando una pieza nueva no entra). El HUD de `GamePlayer.tsx` no cambia de estructura — el slot "Vidas" simplemente no muestra corazones durante esta partida.
- `onLevelChange` reporta `floor(lineasEliminadas / 10) + 1`, igual que el original, acelerando la velocidad de caída (`dropInterval = max(100, 1000 - (nivel-1)*90)` ms).
- Se eliminan del puerto: el HUD en DOM propio (`#score`/`#lines`/`#level`), el overlay compartido de pausa/game-over propio, la tecla `P` de pausa propia, el botón de reinicio propio, y el selector de tema claro/oscuro (`localStorage["tetris-theme"]`) — todo reemplazado por el HUD, pausa, reinicio y modal de fin de partida ya existentes en `GamePlayer.tsx`.
- Se mantiene el segundo `<canvas>` de vista previa de la próxima pieza, renderizado dentro del mismo componente (no rompe el contrato de props/handle hacia `GamePlayer`).
- Controles idénticos al template: `ArrowLeft`/`ArrowRight` mover, `ArrowDown` caída suave (+1 punto/fila), `ArrowUp` o `KeyX` rotar, `Space` caída instantánea (+2 puntos/celda). Puntuación de líneas: `[0,100,300,500,800][cleared] * nivel`, igual que el original.
- `components/GamePlayer.tsx` se generaliza: el booleano `isAsteroids` se reemplaza por un registro/mapa `game.id → { Component, ref }` (o estructura equivalente), migrando también la entrada de Asteroids a ese mismo registro. La rama de "simulación falsa" (`setInterval` de puntuación aleatoria) sigue aplicándose a cualquier `game.id` que no esté en el registro, sin cambios de comportamiento para el resto del catálogo.
- El leaderboard real (aside "MEJORES PUNTUACIONES" en `/juegos/tetris` y el tab "TETRIS" en Salón de la Fama) funciona automáticamente en cuanto exista la fila `id: "tetris"` en `games` — no requiere ningún cambio de código, ya que specs/06 lo dejó completamente genérico.

**Out of scope (para futuros specs):**

- Mecánica de "hold" de pieza, o cualquier funcionalidad no presente en el template original.
- Sonido o música (el template no tiene).
- Soporte táctil/móvil.
- Cambiar la etiqueta "Vidas" del HUD por "Líneas" — se prioriza mantener el HUD genérico sin cambios estructurales (ver Decisions).
- Selector de tema claro/oscuro — la plataforma no tiene sistema de temas; se descarta junto con el resto del "chrome" propio del template.
- Calcular `best`/`plays` en vivo desde `scores` — siguen siendo columnas manuales heredadas de `caida`, decisión ya tomada en specs/06, no se reabre.
- Cualquier cambio a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx` — ya son completamente genéricos, no necesitan tocarse.
- Implementar el juego real de Arkanoid u otro título del catálogo — spec futuro, usando esta misma skill `/spec-juego`.

## Data model

```sql
-- supabase/migrations/0002_replace_caida_with_tetris.sql
update public.games
set
  id = 'tetris',
  title = 'TETRIS',
  short = 'Encaja piezas antes de que el tablero se desborde.',
  long = 'Ocho piezas geométricas (las siete clásicas más una "tuerca" extra) descienden por un tablero de 10x20. Rótalas con wall kicks, usa la pieza fantasma para apuntar y la vista previa para planear, y limpia líneas antes de que el tablero se desborde. La velocidad aumenta cada 10 líneas.'
where id = 'caida';
```

Verificado hoy vía `execute_sql` (`select game_id, count(*) from scores group by game_id`): la única puntuación real guardada hasta ahora es de `"asteroids"`. Ninguna fila de `scores` referencia `game_id = "caida"`, así que este `UPDATE` de la primary key no viola la FK `scores.game_id references games(id)`. El paso 1 del plan de implementación re-verifica esto inmediatamente antes de aplicar la migración, por si cambiara entre la aprobación de este spec y su implementación.

Contrato del componente:

```ts
export interface TetrisGameHandle {
  restart: () => void;
}

interface TetrisGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // siempre reporta 0
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

Forma ilustrativa del registro en `GamePlayer.tsx` (la implementación exacta la decide `/spec-impl`, esto solo fija la intención):

```ts
const REAL_GAMES: Record<string, { Component: RealGameComponent }> = {
  asteroids: { Component: AsteroidsGame },
  tetris: { Component: TetrisGame },
};
```

## Implementation plan

1. Verificar en Supabase que ninguna fila de `scores` referencia `game_id = "caida"` (`select game_id, count(*) from scores where game_id = 'caida'`); si existiera alguna, decidir manualmente cómo migrarla antes de continuar (no debería ocurrir, ver Data model y Risks).
2. Crear y aplicar `supabase/migrations/0002_replace_caida_with_tetris.sql` con el `UPDATE` de arriba; confirmar con `execute_sql`/`list_tables` que la fila `id: "tetris"` existe y `"caida"` ya no.
3. Crear `components/games/TetrisGame.tsx`: portar el estado y las funciones de `game.js` a TypeScript dentro de un client component, canvas principal 300×600 (10 columnas × 20 filas × 30px) más el canvas de vista previa 120×120, loop dentro de `useEffect` (setup en el mount; cleanup con `cancelAnimationFrame` y remoción de los listeners de teclado en el unmount). Recibe `paused`, `onScoreChange`, `onLivesChange` (siempre `0`), `onLevelChange`, `onGameOver`; expone `restart()` vía `forwardRef`/`useImperativeHandle`. Elimina el HUD DOM, el overlay propio, la tecla `P`, el botón de reinicio propio y el theme toggle; llama a `onGameOver(score)` una sola vez cuando el estado interno pasa a game-over (equivalente al `endGame()` del original).
4. Refactorizar `components/GamePlayer.tsx`: reemplazar el booleano `isAsteroids` por un registro `game.id → { Component, ref }` que incluya `asteroids` y `tetris`; adaptar el `useEffect` de la simulación falsa, el cálculo de `level`, `restart()` y el render condicional para que funcionen a partir del registro en vez de un booleano fijo. Cualquier `game.id` fuera del registro sigue usando la simulación falsa exactamente igual que hoy.
5. Probar manualmente en el navegador (`npm run dev` → `/juegos/tetris/jugar`): mover piezas, rotar con wall kicks, caída suave e instantánea, ver la pieza fantasma y la vista previa de la siguiente pieza, limpiar líneas y ver subir el nivel junto con la velocidad, provocar un "top out" y confirmar que abre el modal "FIN DEL JUEGO" existente con la puntuación real (sin overlay propio del canvas), guardar la puntuación, pulsar "JUGAR DE NUEVO" y confirmar un reinicio limpio, pulsar PAUSA/REANUDAR y confirmar que el juego se congela y continúa sin saltos. Confirmar también que `/juegos/asteroids/jugar` sigue funcionando exactamente igual tras el refactor del registro.
6. Verificar que `/juegos/tetris` muestra el leaderboard real (aside "MEJORES PUNTUACIONES") y que el tab "TETRIS" en `/salon-de-la-fama` refleja las puntuaciones guardadas, sin ningún cambio de código adicional (ya es genérico desde specs/06).
7. Ejecutar `npm run lint` y `npm run build` y confirmar que ambos terminan sin errores.

## Acceptance criteria

- [ ] `public.games` ya no contiene ninguna fila con `id: "caida"`; contiene una fila `id: "tetris"`, `title: "TETRIS"`, `cat: "PUZZLE"`, `color: "magenta"`, `cover: "cover-tetro"`.
- [ ] La tarjeta "TETRIS" aparece en `/biblioteca` y se filtra correctamente con la categoría PUZZLE.
- [ ] `/juegos/tetris` (detalle) carga sin error 404 y el botón "JUGAR AHORA" apunta a `/juegos/tetris/jugar`.
- [ ] `/juegos/tetris/jugar` muestra un tablero jugable donde las piezas caen, se mueven con las flechas, rotan con flecha arriba o `X` (con wall kicks), caen instantáneamente con espacio, y se ven tanto la pieza fantasma como la vista previa de la siguiente pieza.
- [ ] Limpiar líneas suma los puntos correctos (`[0,100,300,500,800][n] * nivel`); cada 10 líneas eliminadas sube el nivel y acelera la caída.
- [ ] El HUD de `GamePlayer.tsx` (Puntuación, Vidas, Nivel) refleja el estado real del juego; Vidas se mantiene en 0 durante toda la partida.
- [ ] Provocar un "top out" (una pieza nueva no entra) abre el modal "FIN DEL JUEGO" existente con la puntuación real, sin mostrar ningún overlay propio del canvas.
- [ ] Guardar la puntuación desde el modal inserta una fila real en `scores` con `game_id: "tetris"`.
- [ ] "JUGAR DE NUEVO" reinicia el juego real (tablero vacío, puntuación 0, nivel 1).
- [ ] "PAUSA"/"REANUDAR" congela visualmente el juego y lo continúa sin saltos ni reiniciar el progreso; la tecla `P` propia del template ya no tiene ningún efecto.
- [ ] El botón de reinicio propio del template y el selector de tema claro/oscuro no existen en la versión portada.
- [ ] `/juegos/tetris` muestra el leaderboard real con las puntuaciones guardadas, o el estado vacío si todavía no hay ninguna.
- [ ] El tab "TETRIS" en `/salon-de-la-fama` muestra las puntuaciones reales guardadas para este juego.
- [ ] `/juegos/asteroids/jugar` sigue funcionando exactamente igual que antes del refactor del registro en `GamePlayer.tsx`.
- [ ] El resto de juegos del catálogo (no implementados) siguen mostrando la simulación falsa de `GamePlayer.tsx` sin cambios de comportamiento.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** se reemplaza la entrada `caida` por `tetris` en vez de crear un id nuevo, replicando el patrón de specs/05 (asteroids reemplazó a rocas) — evita un placeholder fantasma conviviendo con la implementación real.
- **Sí:** el título visible es "TETRIS" (decisión explícita del usuario), aunque "Tetris" es una marca registrada activamente protegida por The Tetris Company. El riesgo se señaló explícitamente antes de decidir; el usuario optó por usarlo igual. No se investigó licenciamiento ni alternativas legales.
- **Sí:** se mantienen `category=PUZZLE`, `color=magenta`, `cover=cover-tetro` y los valores decorativos `best`/`plays` heredados de `"caida"` tal cual, sin inventar otros — ya estaban diseñados pensando en este tipo de juego.
- **Sí:** `onLivesChange` siempre reporta `0` (Tetris no tiene concepto real de vidas); no se modifica la estructura del HUD de `GamePlayer.tsx` para mostrar una etiqueta distinta ("Líneas") en su lugar — se prioriza el alcance acotado sobre la fidelidad total al concepto de "líneas eliminadas" en el HUD.
- **Sí:** se generaliza `GamePlayer.tsx` de un booleano `isAsteroids` a un registro `game.id → componente`, migrando también Asteroids a ese mismo registro — es exactamente el punto que specs/05 dejó pendiente ("se generaliza cuando se agregue el segundo juego real").
- **Sí:** se elimina el pausado propio (tecla `P` + overlay), el botón de reinicio propio y el selector de tema claro/oscuro del template — la plataforma ya cubre pausa/reinicio con su propia UI y no tiene sistema de temas claro/oscuro.
- **Sí:** se mantiene el segundo canvas de vista previa de la próxima pieza dentro del mismo componente portado.
- **Sí:** controles y fórmulas de puntuación/nivel idénticos al template original, sin agregar mecánicas nuevas (hold, etc.) ni quitar las existentes.
- **No:** no se calculan `best`/`plays` en vivo desde `scores` — decisión ya tomada en specs/06, no se reabre aquí.
- **No:** no se agrega soporte táctil/móvil ni sonido — el template original no lo tiene y no se pidió.

## Risks

| Riesgo                                                                                                                                                                                         | Mitigación                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El `UPDATE` del `id` en `games` (`caida` → `tetris`) podría fallar por la FK `scores.game_id` si alguien guardó una puntuación real jugando la simulación falsa de "caida" antes de este spec. | Verificado el día de este spec: no existe ninguna fila de `scores` con `game_id = "caida"`. El paso 1 del plan de implementación re-verifica esto inmediatamente antes de aplicar la migración; si existiera alguna, se decide manualmente (insertar `"tetris"` como fila nueva, migrar `scores.game_id`, borrar `"caida"`) en vez de aplicar el `UPDATE` directo. |
| Generalizar `GamePlayer.tsx` a un registro podría introducir una regresión en Asteroids si la migración del branch existente no se hace con cuidado.                                           | El paso 5 del plan de implementación exige probar Asteroids explícitamente después del refactor, no solo Tetris.                                                                                                                                                                                                                                                   |
| "TETRIS" es una marca registrada de un tercero (The Tetris Company).                                                                                                                           | Riesgo señalado explícitamente al usuario antes de decidir; el uso del nombre quedó documentado arriba como una decisión consciente, no un descuido.                                                                                                                                                                                                               |

## Lo que **no** está en este spec

- Mecánica de "hold" de pieza u otras mecánicas ausentes en el template original.
- Sonido o música.
- Soporte táctil/móvil.
- Cambio de la etiqueta "Vidas" por "Líneas" en el HUD.
- Selector de tema claro/oscuro.
- Cálculo en vivo de `best`/`plays` desde `scores`.
- Cambios a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx`.
- Implementación real de Arkanoid u otro título del catálogo.
