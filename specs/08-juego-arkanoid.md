# SPEC 08 — Juego real de Arkanoid (BLOQUE BUSTER → ARKANOID) integrado a la plataforma

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-09-18
> **Objetivo:** Portar el juego de rebote de pelota ya prototipado en `references/templates/started-games/04-arkanoid/` a un componente React (`components/games/ArkanoidGame.tsx`) que reemplaza el placeholder "BLOQUE BUSTER" del catálogo por "ARKANOID" jugable de verdad, sumando una entrada al registro genérico ya existente en `GamePlayer.tsx` y reutilizando sin cambios el leaderboard genérico de specs/06.

## Scope

**In:**

- Migración SQL que actualiza la fila existente `id: "bloque-buster"` en `games`: cambia `id` a `"arkanoid"` y `title` a `"ARKANOID"`, reescribe `short`/`long` para reflejar las mecánicas reales del port (paleta con control de mouse y teclado, pelota, 5 niveles de muros de bloques cromáticos, 3 vidas), y resetea `best`/`plays` a `0`/`"0"` (no se conservan los valores decorativos heredados del placeholder). Mantiene `cat: "ARCADE"`, `color: "cyan"`, `cover: "cover-bricks"` tal cual.
- Nuevo componente `components/games/ArkanoidGame.tsx`: puerto a React/TypeScript del contenido íntegro de `game.js` + `levels.js` + `assets/spritesheet.js` (paleta, pelota, colisión AABB contra bloques, rebotes en paredes/paleta, explosiones animadas, progresión de 5 niveles), montado vía `useRef`+`useEffect` con loop `requestAnimationFrame`, limpiando listeners/RAF al desmontar — mismo patrón que `AsteroidsGame.tsx` y `TetrisGame.tsx`.
- El componente expone el contrato estándar ya usado por Asteroids/Tetris: props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef`+`useImperativeHandle`.
- Controles idénticos al template: mover el mouse sobre el canvas y/o `ArrowLeft`/`ArrowRight` mueven la paleta. Rebote automático de la pelota contra paredes y paleta.
- `onLivesChange` reporta el valor real de vidas del template (arranca en 3, decrementa al perder la pelota, game over al llegar a 0) — a diferencia de Tetris, Arkanoid sí tiene vidas reales.
- `onLevelChange` reporta el nivel 1–5 actual (`currentLevel` del template), que sube automáticamente al limpiar todos los bloques del nivel activo, igual que define `levels.js` (velocidad de la pelota y layout de bloques por nivel, sin cambios respecto al original).
- Completar el nivel 5 (estado `"win"` del template) dispara `onGameOver(score)`, exactamente igual que perder las 3 vidas — se usa el mismo modal genérico "FIN DEL JUEGO" de `GamePlayer.tsx` sin distinguir victoria de derrota en el texto.
- Se portan los efectos de sonido (`ball-bounce.mp3`, `break-sound.mp3`) y el spritesheet (`spritesheet-breakout.png` + helpers `drawSprite`/`drawFrame`/`loadSpritesheet`) dentro del propio `useEffect` del componente, cargando el spritesheet de forma asíncrona antes de arrancar el loop — igual que hace `AsteroidsGame.tsx` con su propia configuración. Los archivos de `assets/` se copian a `public/games/arkanoid/` y se referencian por su ruta pública.
- Se eliminan del puerto: el HUD y los overlays canvas-drawn propios (`GAME OVER` / `¡Completaste el juego!`), la tecla `P`/`Escape` de pausa propia, y el **menú de pausa canvas-drawn con selección manual de nivel** (los 5 botones "Saltar al nivel") — el juego portado no ofrece salto manual de nivel; solo progresa limpiando bloques. Todo esto queda reemplazado por el HUD, pausa, reinicio y modal de fin de partida ya existentes en `GamePlayer.tsx`.
- `components/GamePlayer.tsx`: se agrega una entrada `arkanoid: ArkanoidGame` al registro `REAL_GAMES` ya existente (creado en specs/07) — sin ningún cambio estructural al registro ni al resto del componente.
- Nuevo bloque CSS `.cover-bricks` en `app/globals.css` actualizado (mismo nombre de clase que ya usa el placeholder) para reflejar visualmente el juego real portado; los stops exactos del gradiente son un detalle de implementación decidido en `/spec-impl`.
- El leaderboard real (aside "MEJORES PUNTUACIONES" en `/juegos/arkanoid` y el tab "ARKANOID" en Salón de la Fama) funciona automáticamente en cuanto exista la fila `id: "arkanoid"` en `games` — no requiere ningún cambio de código, ya que specs/06 lo dejó completamente genérico.

**Out of scope (para futuros specs):**

- El menú de pausa con salto manual de nivel (los 5 botones "1"–"5" del template) — se elimina y no se reimplementa de ninguna otra forma; el nivel solo avanza limpiando bloques.
- Soporte táctil/móvil (el port conserva mouse + teclado, nada de touch).
- Modo de dos jugadores / `VERSUS` — el juego queda como `ARCADE`, un solo jugador contra la CPU/física, sin mecánica competitiva local.
- Agregar niveles nuevos más allá de los 5 que ya define `levels.js`, o hacerlos infinitos/procedurales.
- Calcular `best`/`plays` en vivo desde `scores` — siguen siendo columnas manuales, decisión ya tomada en specs/06, no se reabre.
- Cualquier cambio a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx` — ya son completamente genéricos, no necesitan tocarse.
- Implementar el juego real de cualquier otro título restante del catálogo (invasores, gloton, ranaria, serpentina, duelo-pixel) — spec futuro, usando esta misma skill `/spec-juego`.

## Data model

```sql
-- supabase/migrations/0003_replace_bloque_buster_with_arkanoid.sql
update public.games
set
  id = 'arkanoid',
  title = 'ARKANOID',
  short = 'Rebota la pelota y demuele muros de bloques de neón.',
  long = 'Domina una paleta luminosa y rebota una esfera de energía para pulverizar cinco niveles de muros cromáticos cada vez más traicioneros. Pierde la pelota tres veces y la partida termina — ¿lograrás limpiar el último muro?',
  best = 0,
  plays = '0'
where id = 'bloque-buster';
```

Verificado hoy vía `execute_sql` (`select game_id, count(*) from scores where game_id = 'bloque-buster' group by game_id`): no existe ninguna fila de `scores` con `game_id = "bloque-buster"`, así que este `UPDATE` de la primary key no viola la FK `scores.game_id references games(id)`. El paso 1 del plan de implementación re-verifica esto inmediatamente antes de aplicar la migración, por si cambiara entre la aprobación de este spec y su implementación.

Contrato del componente:

```ts
export interface ArkanoidGameHandle {
  restart: () => void;
}

interface ArkanoidGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // vidas reales, arranca en 3
  onLevelChange: (level: number) => void; // 1..5
  onGameOver: (finalScore: number) => void; // se dispara al perder las 3 vidas o al limpiar el nivel 5
}
```

Entrada añadida al registro ya existente en `GamePlayer.tsx` (forma ilustrativa, la implementación exacta la decide `/spec-impl`):

```ts
const REAL_GAMES: Record<string, RealGameComponent> = {
  asteroids: AsteroidsGame,
  tetris: TetrisGame,
  arkanoid: ArkanoidGame,
};
```

## Implementation plan

1. Verificar en Supabase que ninguna fila de `scores` referencia `game_id = "bloque-buster"` (`select game_id, count(*) from scores where game_id = 'bloque-buster'`); si existiera alguna, decidir manualmente cómo migrarla antes de continuar (no debería ocurrir, ver Data model y Risks).
2. Crear y aplicar `supabase/migrations/0003_replace_bloque_buster_with_arkanoid.sql` con el `UPDATE` de arriba; confirmar con `execute_sql`/`list_tables` que la fila `id: "arkanoid"` existe y `"bloque-buster"` ya no.
3. Copiar `references/templates/started-games/04-arkanoid/assets/spritesheet-breakout.png` y `references/templates/started-games/04-arkanoid/assets/sounds/*.mp3` a `public/games/arkanoid/`.
4. Crear `components/games/ArkanoidGame.tsx`: portar el estado y las funciones de `game.js`/`levels.js`/`assets/spritesheet.js` a TypeScript dentro de un client component, canvas 800×600, loop dentro de `useEffect` (setup en el mount, incluyendo la precarga asíncrona del spritesheet antes de arrancar el loop; cleanup con `cancelAnimationFrame` y remoción de los listeners de mouse/teclado en el unmount). Recibe `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`; expone `restart()` vía `forwardRef`/`useImperativeHandle`. Elimina el HUD/overlays canvas-drawn propios, la tecla `P`/`Escape`, y el menú de pausa con selección manual de nivel; llama a `onGameOver(score)` una sola vez tanto al perder la última vida como al completar el nivel 5.
5. Agregar la entrada `arkanoid: ArkanoidGame` al registro `REAL_GAMES` existente en `components/GamePlayer.tsx`, sin modificar su estructura.
6. Actualizar el bloque `.cover-bricks` en `app/globals.css` para reflejar visualmente el juego real portado (paleta/pelota/bloques), manteniendo el mismo nombre de clase.
7. Probar manualmente en el navegador (`npm run dev` → `/juegos/arkanoid/jugar`): mover la paleta con el mouse y con las flechas, rebotar la pelota contra paredes y paleta, romper bloques y escuchar los efectos de sonido, subir de nivel al limpiar todos los bloques (verificando que cambian el layout y la velocidad según `levels.js`), perder las 3 vidas y confirmar que abre el modal "FIN DEL JUEGO" existente con la puntuación real, completar el nivel 5 y confirmar que también dispara el mismo modal "FIN DEL JUEGO", guardar la puntuación, pulsar "JUGAR DE NUEVO" y confirmar un reinicio limpio (3 vidas, nivel 1, tablero del nivel 1), pulsar PAUSA/REANUDAR y confirmar que el juego se congela y continúa sin saltos ni menú de selección de nivel. Confirmar también que `/juegos/asteroids/jugar` y `/juegos/tetris/jugar` siguen funcionando exactamente igual tras agregar la entrada al registro.
8. Verificar que `/juegos/arkanoid` muestra el leaderboard real (aside "MEJORES PUNTUACIONES") y que el tab "ARKANOID" en `/salon-de-la-fama` refleja las puntuaciones guardadas, sin ningún cambio de código adicional (ya es genérico desde specs/06).
9. Ejecutar `npm run lint` y `npm run build` y confirmar que ambos terminan sin errores.

## Acceptance criteria

- [ ] `public.games` ya no contiene ninguna fila con `id: "bloque-buster"`; contiene una fila `id: "arkanoid"`, `title: "ARKANOID"`, `cat: "ARCADE"`, `color: "cyan"`, `cover: "cover-bricks"`, `best: 0`, `plays: "0"`.
- [ ] La tarjeta "ARKANOID" aparece en `/biblioteca` y se filtra correctamente con la categoría ARCADE.
- [ ] `/juegos/arkanoid` (detalle) carga sin error 404 y el botón "JUGAR AHORA" apunta a `/juegos/arkanoid/jugar`.
- [ ] `/juegos/arkanoid/jugar` muestra un tablero jugable donde la paleta se mueve con el mouse y con las flechas, la pelota rebota en paredes/paleta/bloques, y se escuchan los efectos de sonido de rebote y de bloque destruido.
- [ ] Romper un bloque suma 10 puntos; limpiar todos los bloques de un nivel avanza al siguiente (hasta 5), cambiando layout y velocidad de la pelota según `levels.js`.
- [ ] El HUD de `GamePlayer.tsx` (Puntuación, Vidas, Nivel) refleja el estado real del juego: vidas arranca en 3 y baja al perder la pelota; nivel sube de 1 a 5.
- [ ] Perder las 3 vidas abre el modal "FIN DEL JUEGO" existente con la puntuación real, sin mostrar ningún overlay propio del canvas.
- [ ] Completar el nivel 5 también abre el modal "FIN DEL JUEGO" existente (mismo comportamiento que perder, sin overlay de "victoria" propio).
- [ ] Guardar la puntuación desde el modal inserta una fila real en `scores` con `game_id: "arkanoid"`.
- [ ] "JUGAR DE NUEVO" reinicia el juego real (3 vidas, puntuación 0, nivel 1, tablero del nivel 1).
- [ ] "PAUSA"/"REANUDAR" congela visualmente el juego y lo continúa sin saltos ni reiniciar el progreso; la tecla `P`/`Escape` propia del template ya no tiene ningún efecto, y no aparece ningún menú de selección de nivel.
- [ ] `/juegos/arkanoid` muestra el leaderboard real con las puntuaciones guardadas, o el estado vacío si todavía no hay ninguna.
- [ ] El tab "ARKANOID" en `/salon-de-la-fama` muestra las puntuaciones reales guardadas para este juego.
- [ ] `/juegos/asteroids/jugar` y `/juegos/tetris/jugar` siguen funcionando exactamente igual que antes de agregar la entrada al registro en `GamePlayer.tsx`.
- [ ] El resto de juegos del catálogo (no implementados) siguen mostrando la simulación falsa de `GamePlayer.tsx` sin cambios de comportamiento.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** se reemplaza la entrada `bloque-buster` por `arkanoid` en vez de crear un id nuevo, replicando el patrón de specs/05 y specs/07 (rocas→asteroids, caida→tetris) — evita un placeholder fantasma conviviendo con la implementación real.
- **Sí:** `best`/`plays` se resetean a `0`/`"0"` en vez de heredar los valores decorativos de `bloque-buster` (28450/"12.4K") — decisión explícita del usuario, distinta al criterio usado en specs/07 (que sí heredó los valores de `caida`).
- **Sí:** se mantienen `category=ARCADE`, `color=cyan` y `cover=cover-bricks` del placeholder tal cual, sin renombrar la clase CSS — mismo criterio que specs/07 usó con `cover-tetro`, para minimizar el diff de CSS.
- **Sí:** `GamePlayer.tsx` ya tiene el registro genérico `REAL_GAMES` creado en specs/07 (verificado fresco en este spec); este spec solo agrega la entrada `arkanoid`, sin ningún refactor adicional.
- **Sí:** se portan los sonidos y el spritesheet del template (a diferencia de Tetris/Asteroids, que no usan assets externos) — decisión explícita del usuario, cargados dentro del `useEffect` del componente y no vía `<script src>` globales, copiando los archivos a `public/games/arkanoid/`.
- **Sí:** `onLivesChange` reporta vidas reales (a diferencia de Tetris, que siempre reporta `0`) — Arkanoid sí tiene un concepto tradicional de vidas en el template original.
- **Sí:** se mantienen los 5 niveles fijos de `levels.js` sin cambios, en vez de ciclarlos infinitamente o generarlos proceduralmente.
- **Sí:** completar el nivel 5 (estado `"win"` del original) dispara el mismo `onGameOver` que perder las 3 vidas, mostrando el modal genérico "FIN DEL JUEGO" sin distinguir victoria — se prioriza el alcance acotado y la reutilización del modal existente sobre un mensaje de victoria dedicado.
- **Sí:** se elimina por completo el menú de pausa canvas-drawn con salto manual de nivel (los 5 botones "1"–"5") — la plataforma ya cubre pausa/reinicio con su propia UI, y el salto manual de nivel es una funcionalidad de depuración del template, no parte del juego en sí.
- **Sí:** se conservan tanto el control por mouse como por teclado para la paleta, igual que el template original.
- **No:** no se agrega soporte táctil/móvil — el template original no lo tiene y no se pidió.
- **No:** no se implementa un modo de dos jugadores (`VERSUS`) — el juego queda como `ARCADE` de un solo jugador.
- **No:** no se calculan `best`/`plays` en vivo desde `scores` — decisión ya tomada en specs/06, no se reabre aquí.

## Risks

| Riesgo                                                                                                                                                                                                                                 | Mitigación                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El `UPDATE` del `id` en `games` (`bloque-buster` → `arkanoid`) podría fallar por la FK `scores.game_id` si alguien guardó una puntuación real jugando la simulación falsa de "bloque-buster" antes de este spec.                       | Verificado el día de este spec: no existe ninguna fila de `scores` con `game_id = "bloque-buster"`. El paso 1 del plan de implementación re-verifica esto inmediatamente antes de aplicar la migración; si existiera alguna, se decide manualmente (insertar `"arkanoid"` como fila nueva, migrar `scores.game_id`, borrar `"bloque-buster"`) en vez de aplicar el `UPDATE` directo. |
| Cargar un spritesheet PNG y archivos de audio dentro de un componente React de forma asíncrona podría introducir parpadeos o errores si la carga falla o tarda (a diferencia de Asteroids/Tetris, que no dependen de assets externos). | El componente sigue el mismo patrón que `loadSpritesheet(cb)` del template: no arranca el loop de juego hasta que el callback de carga se resuelve; se prueba manualmente en el paso 7 del plan de implementación.                                                                                                                                                                   |
| Agregar la entrada `arkanoid` al registro `REAL_GAMES` podría introducir una regresión en Asteroids o Tetris si la edición del objeto no es cuidadosa.                                                                                 | El paso 7 del plan de implementación exige probar explícitamente `/juegos/asteroids/jugar` y `/juegos/tetris/jugar` después del cambio, no solo Arkanoid.                                                                                                                                                                                                                            |

## Lo que **no** está en este spec

- El menú de pausa con salto manual de nivel del template original.
- Soporte táctil/móvil.
- Modo de dos jugadores (`VERSUS`).
- Niveles adicionales a los 5 ya definidos en `levels.js`, o generación procedural de niveles.
- Cálculo en vivo de `best`/`plays` desde `scores`.
- Cambios a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx`.
- Implementación real de cualquier otro título restante del catálogo.
