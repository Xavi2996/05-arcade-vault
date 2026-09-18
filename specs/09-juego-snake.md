# SPEC 09 — Juego real de Snake (SERPENTINA → SNAKE) integrado a la plataforma

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-09-18
> **Objetivo:** Construir desde cero (sin template de `started-games`, usando los sprites de fruta provistos en `references/templates/source-assets/snake-assets/`) un Snake jugable en `components/games/SnakeGame.tsx` que reemplaza el placeholder "SERPENTINA" del catálogo por "SNAKE", sumando una entrada al registro genérico ya existente en `GamePlayer.tsx` y reutilizando sin cambios el leaderboard genérico de specs/06.

## Scope

**In:**

- Migración SQL que actualiza la fila existente `id: "serpentina"` en `games`: cambia `id` a `"snake"` y `title` a `"SNAKE"`, reescribe `short`/`long` para reflejar las mecánicas reales del port (grilla 20×20, frutas del sprite sheet, choque con borde o con la propia cola termina la partida), y marca `playable = true`. Mantiene `cat: "ARCADE"`, `color: "green"`, `cover: "cover-snake"`, `best: 7820`, `plays: "9.1K"` tal cual.
- Nuevo componente `components/games/SnakeGame.tsx`, construido desde cero (no hay `game.js` de referencia para Snake en `references/templates/started-games/`): grilla lógica de 20×20 celdas de 24px (canvas 480×480), movimiento a paso fijo dentro de un loop `requestAnimationFrame` con acumulador de tiempo, montado vía `useRef`+`useEffect`, limpiando listeners de teclado y `cancelAnimationFrame` al desmontar — mismo patrón que `AsteroidsGame.tsx`.
- El componente expone el contrato estándar ya usado por Asteroids/Tetris/Arkanoid: props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef`+`useImperativeHandle`.
- Controles: solo flechas (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`) cambian la dirección de movimiento; no se permite una reversa instantánea de 180° sobre el propio cuerpo.
- La serpiente crece un segmento y suma **+10 puntos fijos** por cada fruta comida (mismo valor para las 21 frutas del atlas, sin puntajes diferenciados).
- La comida usa en cada aparición un sprite aleatorio del atlas de 21 frutas provisto en `references/templates/source-assets/snake-assets/fruits.png` + `sprites.js`, colocado en una celda vacía del tablero.
- `sprites.js`, tal como está provisto, es un script global de navegador (`window.SPRITE_ATLAS = {...}`); se porta como una constante TypeScript (`FRUIT_SPRITES` o equivalente) dentro o junto a `SnakeGame.tsx`, copiando literalmente las 21 coordenadas — nunca cargado vía `<script src>` global.
- `fruits.png` se copia a `public/games/snake/fruits.png` y se referencia por su ruta pública.
- `onLivesChange` siempre reporta `0` (Snake no tiene concepto de vidas: la partida termina de una vez al primer choque) — mismo criterio que Tetris.
- `onLevelChange` reporta `floor(frutasComidas / 5) + 1`, acelerando el paso de movimiento: arranca en 150ms/paso, `-10ms` por nivel, con un piso de 60ms/paso.
- Chocar contra el borde del tablero **o** contra el propio cuerpo dispara `onGameOver(score)` — no hay wrap-around de bordes.
- `components/GamePlayer.tsx`: se agrega una entrada `snake: SnakeGame` al registro `REAL_GAMES` ya existente (creado en specs/07, verificado fresco en este spec con asteroids/tetris/arkanoid) — sin ningún cambio estructural al registro ni al resto del componente.
- Se actualiza el bloque CSS `.cover-snake` en `app/globals.css` (mismo nombre de clase que ya usa el placeholder) para reflejar visualmente el juego real portado; los stops exactos del gradiente son un detalle de implementación decidido en `/spec-impl`.
- El leaderboard real (aside "MEJORES PUNTUACIONES" en `/juegos/snake` y el tab "SNAKE" en Salón de la Fama) funciona automáticamente en cuanto exista la fila `id: "snake"` con `playable = true` en `games` — no requiere ningún cambio de código, ya que specs/06 lo dejó completamente genérico.

**Out of scope (para futuros specs):**

- Wrap-around de bordes (la serpiente muere al chocar contra el borde, no reaparece del lado opuesto) — decisión explícita del usuario.
- Power-ups, obstáculos, o frutas con efectos/puntajes distintos entre sí — las 21 frutas valen exactamente lo mismo.
- Sonido o música (no hay assets de audio en `snake-assets/` y no se pidió).
- Soporte táctil/móvil.
- Esquema de controles alternativo (WASD) — se descartó a favor de solo flechas.
- Calcular `best`/`plays` en vivo desde `scores` — siguen siendo columnas manuales heredadas de `serpentina`, decisión ya tomada en specs/06, no se reabre.
- Cualquier cambio de código a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx` — ya son completamente genéricos. La columna `playable` de `lib/games.ts#getGames()` no se modifica como código: solo se actualiza su **valor** para la fila `snake` vía la migración de este spec.
- Implementar el juego real de cualquier otro título restante del catálogo (invasores, gloton, ranaria, duelo-pixel) — spec futuro, usando esta misma skill `/spec-juego`.

## Data model

```sql
-- supabase/migrations/0005_replace_serpentina_with_snake.sql
update public.games
set
  id = 'snake',
  title = 'SNAKE',
  short = 'Crece serpenteando y devora frutas de neón sin morder tu propia cola.',
  long = 'Guía una serpiente de píxeles por una grilla de 20x20 en busca de frutas pixel-art —manzana, sandía, uva y dieciocho más, siempre al azar—. Cada bocado la alarga y acelera su paso cada cinco frutas. Chocar contra el borde del tablero o contra tu propia cola termina la partida al instante.',
  playable = true
where id = 'serpentina';
```

**Hallazgo fresco de este spec (no documentado en specs 01-08):** la migración `0004_add_games_playable_column.sql`, ya aplicada, agregó `games.playable boolean not null default false` y solo marcó `true` a `asteroids`/`tetris`/`arkanoid`. `lib/games.ts#getGames()` ahora filtra `.eq("playable", true)`, así que cualquier fila con `playable = false` (como `serpentina` hoy) **no aparece en `/biblioteca`**, aunque sigue siendo alcanzable directamente en `/juegos/serpentina` vía `getGameById` (que no filtra por `playable`). Sin el `playable = true` incluido arriba, el resto de este spec podría implementarse perfectamente y la tarjeta "SNAKE" seguiría sin aparecer en el catálogo.

Verificado hoy vía `execute_sql` (`select game_id, count(*) from scores where game_id = 'serpentina' group by game_id`): no existe ninguna fila de `scores` con `game_id = "serpentina"`, así que este `UPDATE` de la primary key no viola la FK `scores.game_id references games(id)`. El paso 1 del plan de implementación re-verifica esto inmediatamente antes de aplicar la migración.

Contrato del componente:

```ts
export interface SnakeGameHandle {
  restart: () => void;
}

interface SnakeGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // siempre reporta 0
  onLevelChange: (level: number) => void; // floor(frutasComidas / 5) + 1
  onGameOver: (finalScore: number) => void; // se dispara al chocar contra el borde o contra el propio cuerpo
}
```

Entrada añadida al registro ya existente en `GamePlayer.tsx` (forma ilustrativa, la implementación exacta la decide `/spec-impl`):

```ts
const REAL_GAMES: Record<string, RealGameComponent> = {
  asteroids: AsteroidsGame,
  tetris: TetrisGame,
  arkanoid: ArkanoidGame,
  snake: SnakeGame,
};
```

## Implementation plan

1. Verificar en Supabase que ninguna fila de `scores` referencia `game_id = "serpentina"` (`select game_id, count(*) from scores where game_id = 'serpentina'`); si existiera alguna, decidir manualmente cómo migrarla antes de continuar (no debería ocurrir, ver Data model y Risks).
2. Crear y aplicar `supabase/migrations/0005_replace_serpentina_with_snake.sql` con el `UPDATE` de arriba (incluyendo `playable = true`); confirmar con `execute_sql`/`list_tables` que la fila `id: "snake"` existe con `playable = true`, y que `"serpentina"` ya no existe.
3. Copiar `references/templates/source-assets/snake-assets/fruits.png` a `public/games/snake/fruits.png`; portar el atlas `SPRITE_ATLAS.fruits` de `sprites.js` (21 entradas) a una constante TypeScript dentro de (o junto a) `components/games/SnakeGame.tsx`, copiando las coordenadas literalmente, sin cargarlo como script global.
4. Crear `components/games/SnakeGame.tsx`: grilla lógica 20×20 celdas de 24px (canvas 480×480), loop dentro de `useEffect` con `requestAnimationFrame` + acumulador de tiempo fijo por paso (150ms inicial, `-10ms` por nivel, piso de 60ms), estado de la serpiente como array de segmentos, dirección controlada por flechas (bloqueando la reversa de 180°), spawn de fruta en celda vacía con sprite aleatorio del atlas portado, crecimiento de +1 segmento y +10 puntos por fruta, `onLevelChange = floor(frutasComidas / 5) + 1`, `onLivesChange` siempre `0`, `onGameOver` al chocar contra el borde o contra el propio cuerpo. Expone `restart()` vía `forwardRef`/`useImperativeHandle`. Cleanup de listeners de teclado y `cancelAnimationFrame` en el unmount, mismo patrón que `AsteroidsGame.tsx`.
5. Agregar la entrada `snake: SnakeGame` al registro `REAL_GAMES` existente en `components/GamePlayer.tsx`, sin modificar su estructura.
6. Actualizar el bloque `.cover-snake` en `app/globals.css` para reflejar visualmente el juego real portado (serpiente/fruta), manteniendo el mismo nombre de clase.
7. Probar manualmente en el navegador (`npm run dev` → `/juegos/snake/jugar`): mover la serpiente con las flechas, comer frutas con sprites aleatorios del atlas, crecer y sumar 10 puntos por fruta, subir de nivel cada 5 frutas y notar el aumento de velocidad, chocar contra el borde y confirmar que abre el modal "FIN DEL JUEGO" existente con la puntuación real, chocar contra el propio cuerpo y confirmar el mismo modal, guardar la puntuación, pulsar "JUGAR DE NUEVO" y confirmar un reinicio limpio (serpiente de tamaño inicial, puntuación 0, nivel 1), pulsar PAUSA/REANUDAR y confirmar que el juego se congela y continúa sin saltos. Confirmar que `/juegos/asteroids/jugar`, `/juegos/tetris/jugar` y `/juegos/arkanoid/jugar` siguen funcionando exactamente igual tras el cambio en el registro. Confirmar que la tarjeta "SNAKE" aparece en `/biblioteca` (gracias a `playable = true`) y se filtra correctamente con la categoría ARCADE.
8. Verificar que `/juegos/snake` muestra el leaderboard real (aside "MEJORES PUNTUACIONES") y que el tab "SNAKE" en `/salon-de-la-fama` refleja las puntuaciones guardadas, sin ningún cambio de código adicional (ya es genérico desde specs/06).
9. Ejecutar `npm run lint` y `npm run build` y confirmar que ambos terminan sin errores.

## Acceptance criteria

- [ ] `public.games` ya no contiene ninguna fila con `id: "serpentina"`; contiene una fila `id: "snake"`, `title: "SNAKE"`, `cat: "ARCADE"`, `color: "green"`, `cover: "cover-snake"`, `playable: true`, `best: 7820`, `plays: "9.1K"`.
- [ ] La tarjeta "SNAKE" aparece en `/biblioteca` y se filtra correctamente con la categoría ARCADE.
- [ ] `/juegos/snake` (detalle) carga sin error 404 y el botón "JUGAR AHORA" apunta a `/juegos/snake/jugar`.
- [ ] `/juegos/snake/jugar` muestra un tablero jugable de 20×20 donde la serpiente se mueve con las flechas y no puede revertir instantáneamente sobre su propio cuerpo.
- [ ] La comida se dibuja con sprites de fruta aleatorios del atlas portado (no siempre el mismo sprite); comer una fruta suma exactamente 10 puntos y agrega un segmento a la serpiente.
- [ ] Cada 5 frutas comidas sube el nivel y se nota el aumento de velocidad de movimiento (hasta el piso de 60ms/paso).
- [ ] El HUD de `GamePlayer.tsx` (Puntuación, Vidas, Nivel) refleja el estado real del juego; Vidas se mantiene en 0 durante toda la partida.
- [ ] Chocar contra el borde del tablero abre el modal "FIN DEL JUEGO" existente con la puntuación real, sin mostrar ningún overlay propio del canvas.
- [ ] Chocar contra el propio cuerpo también abre el mismo modal "FIN DEL JUEGO".
- [ ] La serpiente no reaparece del lado opuesto del tablero al tocar un borde (no hay wrap-around).
- [ ] Guardar la puntuación desde el modal inserta una fila real en `scores` con `game_id: "snake"`.
- [ ] "JUGAR DE NUEVO" reinicia el juego real (serpiente de tamaño inicial, puntuación 0, nivel 1, nueva fruta).
- [ ] "PAUSA"/"REANUDAR" congela visualmente el juego y lo continúa sin saltos ni reiniciar el progreso.
- [ ] `/juegos/snake` muestra el leaderboard real con las puntuaciones guardadas, o el estado vacío si todavía no hay ninguna.
- [ ] El tab "SNAKE" en `/salon-de-la-fama` muestra las puntuaciones reales guardadas para este juego.
- [ ] `/juegos/asteroids/jugar`, `/juegos/tetris/jugar` y `/juegos/arkanoid/jugar` siguen funcionando exactamente igual que antes de agregar la entrada al registro en `GamePlayer.tsx`.
- [ ] El resto de juegos del catálogo (no implementados) siguen mostrando la simulación falsa de `GamePlayer.tsx` sin cambios de comportamiento, y siguen sin aparecer en `/biblioteca` por tener `playable = false`.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** se reemplaza la entrada `serpentina` por `snake` en vez de crear un id nuevo, replicando el patrón de specs/05, /07 y /08 (rocas→asteroids, caída→tetris, bloque-buster→arkanoid) — evita un placeholder fantasma conviviendo con la implementación real.
- **Sí:** se descubrió en este spec (no documentado en specs 01-08) que la migración `0004_add_games_playable_column.sql` agregó `games.playable` y que `lib/games.ts#getGames()` ya filtra por ella; este spec la setea explícitamente a `true` para `snake` en la misma migración de reemplazo, sin lo cual la tarjeta nunca aparecería en `/biblioteca`.
- **Sí:** se mantienen `category=ARCADE`, `color=green`, `cover=cover-snake` y los valores decorativos `best`/`plays` heredados de `"serpentina"` tal cual, sin resetear — mismo criterio que specs/07 usó con Tetris (a diferencia de specs/08, que sí reseteó `best`/`plays` para Arkanoid).
- **Sí:** se construye desde cero, sin portar ningún `game.js` de `references/templates/started-games/` (no existe uno para Snake) — solo se reutilizan los sprites de fruta provistos en `references/templates/source-assets/snake-assets/`.
- **Sí:** `sprites.js` se porta como constante TypeScript dentro del componente, no como script global `window.SPRITE_ATLAS` vía `<script src>`.
- **Sí:** la comida usa un sprite aleatorio entre las 21 frutas del atlas en cada aparición; todas valen el mismo puntaje (+10), sin diferenciar por tipo de fruta.
- **Sí:** `onLivesChange` siempre reporta `0` (Snake no tiene concepto real de vidas) — mismo criterio que Tetris.
- **Sí:** `onLevelChange` sube cada 5 frutas comidas, acelerando el paso de movimiento (150ms inicial, `-10ms`/nivel, piso de 60ms) — a diferencia de Tetris/Arkanoid que heredan su progresión de nivel del template, aquí se define desde cero por no existir un template de referencia.
- **Sí:** chocar contra el borde del tablero termina la partida (no hay wrap-around) — decisión explícita del usuario.
- **Sí:** solo flechas mueven la serpiente (no se agrega WASD) — decisión explícita del usuario.
- **Sí:** `GamePlayer.tsx` ya tiene el registro genérico `REAL_GAMES` creado en specs/07 (verificado fresco en este spec, con asteroids/tetris/arkanoid ya presentes); este spec solo agrega la entrada `snake`, sin ningún refactor adicional.
- **No:** no se agrega sonido — no hay assets de audio en `snake-assets/` y no se pidió.
- **No:** no se agrega soporte táctil/móvil.
- **No:** no se agregan power-ups, obstáculos ni frutas con efectos/puntajes distintos entre sí.
- **No:** no se calculan `best`/`plays` en vivo desde `scores` — decisión ya tomada en specs/06, no se reabre aquí.

## Risks

| Riesgo                                                                                                                                                                                                          | Mitigación                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El `UPDATE` del `id` en `games` (`serpentina` → `snake`) podría fallar por la FK `scores.game_id` si alguien guardó una puntuación real jugando la simulación falsa de "serpentina" antes de este spec.         | Verificado el día de este spec: no existe ninguna fila de `scores` con `game_id = "serpentina"`. El paso 1 del plan de implementación re-verifica esto inmediatamente antes de aplicar la migración; si existiera alguna, se decide manualmente (insertar `"snake"` como fila nueva, migrar `scores.game_id`, borrar `"serpentina"`) en vez de aplicar el `UPDATE` directo. |
| Olvidar el `playable = true` en la migración dejaría la fila `snake` invisible en `/biblioteca` pese a que el resto del juego funcione perfectamente en `/juegos/snake/jugar` (accesible solo por URL directa). | Se incluye `playable = true` explícitamente en el `UPDATE` de la migración (paso 2) y el paso 7 del plan de implementación verifica de forma explícita que la tarjeta aparece en `/biblioteca`, no solo que la ruta de detalle carga.                                                                                                                                       |
| Portar manualmente las 21 coordenadas de `sprites.js` a una constante TypeScript podría introducir errores de transcripción (un `x`/`y`/`w`/`h` mal copiado desalinea el recorte del sprite).                   | Se copian los valores literalmente del archivo fuente sin recalcular ni redondear; el paso 7 del plan de implementación incluye probar visualmente que las frutas se ven completas y sin recortes al jugar.                                                                                                                                                                 |
| Agregar la entrada `snake` al registro `REAL_GAMES` podría introducir una regresión en Asteroids, Tetris o Arkanoid si la edición del objeto no es cuidadosa.                                                   | El paso 7 del plan de implementación exige probar explícitamente los tres juegos ya portados después del cambio, no solo Snake.                                                                                                                                                                                                                                             |

## Lo que **no** está en este spec

- Wrap-around de bordes.
- Power-ups, obstáculos, o frutas con efectos/puntajes distintos entre sí.
- Sonido o música.
- Soporte táctil/móvil.
- Esquema de controles WASD.
- Cálculo en vivo de `best`/`plays` desde `scores`.
- Cambios de código a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx`.
- Implementación real de cualquier otro título restante del catálogo.
