# SPEC 12 — Juego real de Frogger (RANARIA → FROGGER) integrado a la plataforma

> **Estado:** Aprobado
> **Depende de:** SPEC 06, SPEC 09, SPEC 11
> **Fecha:** 2026-09-23
> **Origen:** promovido desde `specs/game-jam/frogger/01-frogger-core.md` (game jam, `@agent-game-jam`), corrigiendo su contrato de integración para la arquitectura real del repo.
> **Objetivo:** Construir desde cero un Frogger jugable en `components/games/FroggerGame.tsx` que reemplaza el placeholder "RANARIA" del catálogo por "FROGGER", sumando una entrada al registro genérico de `GamePlayer.tsx` y reutilizando sin cambios el leaderboard genérico de specs/06.

---

## Nota de promoción — qué cambia respecto al spec de la jam

El spec original se escribió contra un esqueleto que este repositorio ya no tiene. Se corrige:

| Spec de la jam                                                                         | Este spec (arquitectura real)                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/games/frogger/play/page.tsx` (play-page propia)                                   | **Ninguna ruta nueva.** `app/juegos/[id]/jugar` + `GamePlayer.tsx` ya son genéricos; el juego solo se registra en `REAL_GAMES`                                                                                                                                                                                                                                             |
| Modal de game over, HUD React, guardado en Supabase y `gameKey` dentro de la play-page | Ya los posee `GamePlayer.tsx` (HUD compartido, pausa, modal, `saveScore`, `restart` vía ref)                                                                                                                                                                                                                                                                               |
| `lib/supabase/types.ts` (`GameRow`, `ScoreRow`)                                        | `lib/games.ts` (`Game`) y `lib/scores.ts` (`saveScore`)                                                                                                                                                                                                                                                                                                                    |
| `INSERT` de fila nueva con `color: 'lime'`                                             | **`UPDATE` de la fila `ranaria`** con `color: 'green'`. `games_color_check` solo admite `cyan`, `magenta`, `yellow` o `green`: `'lime'` haría fallar el SQL. Decisión del usuario (2026-09-23), coherente con specs 02/03/05                                                                                                                                               |
| Rutas `/games/frogger/play`, `/games/frogger`, `/hall-of-fame`                         | `/juegos/frogger/jugar`, `/juegos/frogger`, `/salon-de-la-fama`                                                                                                                                                                                                                                                                                                            |
| Sin mención de skins                                                                   | `skin?: SkinId` + `resolvePalette`, contrato vigente de `RealGameProps`                                                                                                                                                                                                                                                                                                    |
| Sin mención de controles táctiles                                                      | `export const TOUCH_CONTROLS` (specs/11)                                                                                                                                                                                                                                                                                                                                   |
| Canvas descrito como "480 × 640" en Scope                                              | **640 × 560.** Es la única lectura consistente con sus propias constantes (`COLS=16`, `ROWS=14`, `CELL=40`) y con sus criterios de aceptación; el "480 × 640" es un resto obsoleto. Se hereda el desajuste: el mapa de Frogger es conceptualmente vertical pero 640×560 es apaisado — se acepta tal cual porque la cuadrícula 16×14 es la que define el diseño de carriles |
| `localStorage['av_player_name']`                                                       | No aplica: el nombre sale de `lib/session.ts` vía `GamePlayer`                                                                                                                                                                                                                                                                                                             |

El diseño de juego (zonas, carriles, tortugas, temporizador, puntuación, vidas) se conserva íntegro.

---

## Scope

**In:**

- Migración `supabase/migrations/0006_replace_ranaria_with_frogger.sql`: `UPDATE` de la fila existente `id: "ranaria"` → `id: "frogger"`, `title: "FROGGER"`, `short`/`long` reescritos para reflejar las mecánicas reales, `playable = true`. Mantiene `cat: "ARCADE"`, `color: "green"`, `cover: "cover-rana"`, `best: 18900`, `plays: "6.4K"` tal cual.
- Nuevo componente `components/games/FroggerGame.tsx`, `"use client"`, construido desde cero (no hay fuente en `references/templates/started-games/`). Canvas 640 × 560 px: cuadrícula de 16 columnas × 14 filas de 40 × 40 px.
- El componente expone el contrato estándar de la plataforma: props `{ paused, skin?, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef` + `useImperativeHandle`, más los exports `ASPECT` y `TOUCH_CONTROLS`.
- Zonas fijas del mapa (fila 0 = arriba): fila 0 = bocas destino, filas 1–6 = río, fila 7 = franja segura intermedia, filas 8–12 = carretera, fila 13 = base de inicio.
- Entidades de carretera (filas 8–12): coches y camiones de 1–3 celdas, velocidad y sentido por carril, movimiento horizontal en loop continuo; colisión con la rana es letal.
- Entidades de río (filas 1–6): troncos de 2–4 celdas y grupos de tortugas de 2–3. La rana sobrevive solo si descansa sobre un tronco o sobre tortugas visibles. Las tortugas ciclan visible (3 s) → sumergidas (1,5 s); sumergidas no dan soporte.
- Movimiento de la rana: saltos discretos de 1 celda en 4 direcciones, con animación de 120 ms. No puede salir por los bordes laterales por voluntad propia.
- Meta: 5 bocas destino en la fila 0, cada una de 2 columnas. Una boca ocupada no se reutiliza en la misma ronda; al llenar las 5 se completa la ronda.
- Muerte por: (a) vehículo, (b) caída al agua, (c) tortuga que se sumerge bajo la rana, (d) arrastre fuera del borde lateral montada en el río, (e) temporizador agotado, (f) salto a una boca ya ocupada o a la fila 0 fuera de boca.
- Vidas: arranca en 3. Cada muerte llama `onLivesChange(lives - 1)`. Al llegar a 0, `onLivesChange(0)` y después `onGameOver(score)`.
- Puntuación: +10 por cada fila nueva avanzada hacia arriba en la ronda; +50 al ocupar una boca; + `tiempo_restante × 10` de bonus al ocupar una boca; +200 al completar la ronda.
- Temporizador de ronda: 15 s iniciales, decrecientes por nivel. Velocidad de todas las entidades +15 % por nivel.
- HUD interno del canvas (score, nivel, vidas como iconos, barra de tiempo) — patrón de doble HUD, igual que los demás juegos.
- `paused` congela `update()` pero sigue llamando a `draw()`.
- Entrada: `keydown`/`keyup` sobre `window` leyendo `e.code`, **más** suscripción a `subscribeVirtualInput` de `lib/input.ts` alimentando el mismo estado interno (specs/11). Ambos se limpian en el `return` del `useEffect`, junto a `cancelAnimationFrame`.
- `components/GamePlayer.tsx`: entrada `frogger: FroggerGame` en `REAL_GAMES`, `FROGGER_ASPECT` en `GAME_ASPECTS`, `FROGGER_TOUCH` en `GAME_TOUCH_CONTROLS`, y `"frogger"` en `GAMES_WITH_SKINS`. Sin cambios estructurales.
- Skins: `components/games/skins/frogger.ts` con `FROGGER_SKINS: SkinPalettes<FroggerPalette>` para `clasico` / `neon` / `retro`. Los hex exactos **los diseña `@agent-skin-designer`** en la fase de cierre y quedan registrados en `references/game-themes.md`; este spec solo fija la forma de `FroggerPalette` y prohíbe cualquier color hardcodeado en el canvas.
- Se actualiza el bloque CSS `.cover-rana` en `app/globals.css` (mismo nombre de clase que ya usa el placeholder) para reflejar el juego real; los stops exactos son detalle de implementación.
- El leaderboard real (aside en `/juegos/frogger` y tab en `/salon-de-la-fama`) funciona automáticamente en cuanto la fila `frogger` tenga `playable = true` — cero cambios de código.

**Fuera de alcance:**

- Sprites bitmap externos: todo se dibuja con primitivas canvas. No se carga ninguna imagen.
- Animaciones de muerte elaboradas (explosiones, partículas).
- Power-ups (mosca bonus en la boca, cocodrilo disfrazado de tronco, rana rosa de rescate).
- Sonido o música.
- Componente genérico `CanvasGame` (YAGNI).
- Supabase Auth y RLS; realtime en el leaderboard.
- Calcular `best`/`plays` en vivo desde `scores` — siguen siendo columnas manuales heredadas de `ranaria`, decisión ya tomada en specs/06.
- Cualquier cambio a `lib/games.ts`, `lib/scores.ts`, `lib/skins.ts`, `lib/input.ts`, `components/GameCard.tsx`, `components/TouchControls.tsx` o `app/juegos/[id]/**` — ya son genéricos.
- Implementar los placeholders restantes (`invasores`, `gloton`, `duelo-pixel`).

---

## Data model

```sql
-- supabase/migrations/0006_replace_ranaria_with_frogger.sql
update public.games
set
  id = 'frogger',
  title = 'FROGGER',
  short = 'Cruza la carretera y el río sin convertirte en papilla.',
  long = 'Guía a tu rana por cinco carriles de tráfico y un río de troncos y tortugas que se sumergen sin avisar. Llena las cinco bocas del otro lado para cerrar la ronda: cada nivel acelera todo un 15% y te recorta el tiempo. Tres vidas, quince segundos por intento y mucho asfalto por delante.',
  playable = true
where id = 'ranaria';
```

Se conservan `cat = 'ARCADE'`, `color = 'green'`, `cover = 'cover-rana'`, `best = 18900`, `plays = '6.4K'`.

**A verificar antes de aplicar la migración** (paso 1 del plan): que no exista ninguna fila en `scores` con `game_id = 'ranaria'`, porque el `UPDATE` toca la primary key y `scores.game_id` la referencia por FK. Mismo chequeo que hizo specs/09 con `serpentina`.

### Contrato del componente

```ts
export const ASPECT = `${W} / ${H}`; // "640 / 560"
export const TOUCH_CONTROLS: TouchControlsLayout; // dpad de 4 direcciones, repeat: false; actions: []

export interface FroggerGameHandle {
  restart: () => void;
}

interface FroggerGameProps {
  paused: boolean;
  skin?: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

`onLivesChange` y `onLevelChange` solo se llaman cuando el valor **cambia**, no en cada frame.

### Forma de la paleta

```ts
export interface FroggerPalette {
  background: string; // fondo base del canvas
  roadBand: string; // franja de carretera
  riverBand: string; // franja de río
  safeBand: string; // franjas seguras (inicio + intermedia)
  car: string; // coches
  truck: string; // camiones
  log: string; // troncos
  turtle: string; // tortugas visibles
  turtleSubmerged: string; // tortugas sumergidas (aviso, no soporte)
  frog: string; // cuerpo de la rana
  frogEye: string; // ojos
  goalEmpty: string; // boca destino libre
  goalFilled: string; // boca destino ocupada
  hud: string; // texto del HUD interno
  timerBar: string; // barra de tiempo
  border: string; // borde de 1px del canvas
  glow: string | null; // glow del marco, en CSS; null = apagado (retro)
}
```

Los hex los fija `@agent-skin-designer`; la forma es la que este spec congela. Ningún color literal puede quedar en `draw()`.

---

## Implementation plan

1. **Verificar y aplicar la migración.** `select count(*) from scores where game_id = 'ranaria'` → debe ser 0. Escribir `0006_replace_ranaria_with_frogger.sql` y aplicarla vía `mcp__supabase__apply_migration`. Verificación: `select * from games where id = 'frogger'` devuelve la fila con `playable = true`.

2. **Esqueleto del componente** `components/games/FroggerGame.tsx`: constantes (`COLS`, `ROWS`, `CELL`, `W`, `H`, índices de zona), tipos locales (`Direction`, `Lane`, `Entity`, `Frog`), exports `ASPECT` y `TOUCH_CONTROLS`, `forwardRef` + `useImperativeHandle({ restart })`, `useRef` del canvas y `useEffect` con `requestAnimationFrame`. Verificación: compila y pinta el fondo por zonas.

3. **`buildLanes(level)`** — carretera (filas 8–12): velocidades 1,5–4 px/frame escaladas por nivel, sentidos alternos, huecos atravesables garantizados. Río (filas 1–6): velocidades 1–3 px/frame, troncos de 2–4 celdas con hueco mínimo de 1 celda, grupos de tortugas de 2–3 con ciclo 3 s / 1,5 s. Cada nivel multiplica todas las velocidades por 1,15. Verificación: cada carril tiene ≥ 2 entidades y huecos visibles.

4. **Entrada** — teclado (`e.code`: `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`) + `subscribeVirtualInput`, ambos escribiendo en un único `pendingDir`. Limpieza completa al desmontar.

5. **`update(dt)`** — avanzar entidades y reinyectarlas por el lado opuesto; consumir `pendingDir` solo si la rana no está animando; avanzar `animT` y resolver la celda destino al completar el salto; arrastrar la rana con su soporte cuando está en el río; decrementar el temporizador; emitir callbacks solo ante cambio. Con `paused`, salir sin tocar nada.

6. **Colisiones y soporte** — `checkRoadCollision(frog, lanes)`, `getSupport(frog, lanes)` (devuelve `null` si la tortuga está sumergida), `checkGoal(frog, goals)`.

7. **`killFrog()` y `completeRound()`** — según las reglas de vidas, reset de posición/temporizador, incremento de nivel y reconstrucción de carriles.

8. **`draw()`** — franjas por zona, entidades, rana, bocas, y HUD interno (score, nivel, iconos de vida, barra de tiempo). Todos los colores desde la paleta resuelta.

9. **Wireado en `GamePlayer.tsx`** — `REAL_GAMES`, `GAME_ASPECTS`, `GAME_TOUCH_CONTROLS`. (`GAMES_WITH_SKINS` se añade en el paso 11, junto con las paletas reales.)

10. **`.cover-rana` en `app/globals.css`** — restyle para el juego real.

11. **Skins** — tras la ficha de `@agent-skin-designer`: crear `components/games/skins/frogger.ts`, sustituir cualquier color literal por `resolvePalette(FROGGER_SKINS, skin)` y añadir `"frogger"` a `GAMES_WITH_SKINS`. El glow va en `app/globals.css`, nunca en el canvas; `retro` sin glow.

12. **Verificación final** — `npm run lint` y `npm run build` sin errores.

---

## Acceptance criteria

- [ ] La fila `frogger` existe en `games` con `playable = true`, `cat = 'ARCADE'`, `color = 'green'`, `cover = 'cover-rana'`; la fila `ranaria` ya no existe.
- [ ] La card de FROGGER aparece en `/biblioteca`.
- [ ] `/juegos/frogger` y `/juegos/frogger/jugar` cargan sin errores de SSR ni de TypeScript.
- [ ] El canvas (640 × 560) muestra las cuatro zonas visualmente diferenciadas.
- [ ] La rana aparece centrada en la fila de inicio al cargar.
- [ ] La rana salta exactamente una celda por pulsación, con animación de 120 ms.
- [ ] La rana no puede salir por los bordes laterales por voluntad propia.
- [ ] Coches y camiones se mueven en loop y se reinyectan por el lado opuesto.
- [ ] Troncos y tortugas se mueven en loop; las tortugas alternan visible/sumergida con el ciclo definido.
- [ ] La rana muere por vehículo, por agua, por tortuga sumergida, por arrastre fuera del borde y por temporizador agotado.
- [ ] Al morir, `onLivesChange(lives - 1)` se dispara y la rana vuelve a la fila de inicio.
- [ ] Al llegar a una boca libre, la boca queda marcada y se suman los 50 pts + bonus de tiempo.
- [ ] Al saltar a una boca ocupada o a la fila 0 fuera de boca, la rana muere.
- [ ] Al completar las 5 bocas, la ronda termina, `onLevelChange(level)` se dispara y las velocidades suben un 15 %.
- [ ] `onScoreChange(score)` se dispara en cada cambio de puntuación.
- [ ] El HUD interno del canvas se dibuja correctamente.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón "PAUSA" congela el game loop; "REANUDAR" lo reanuda.
- [ ] Al llegar a `lives = 0`, `onLivesChange(0)` y `onGameOver(score)` se disparan y aparece el modal de la plataforma.
- [ ] "JUGAR DE NUEVO" reinicia la partida vía el handle `restart`.
- [ ] El score guardado aparece en `/juegos/frogger` y en `/salon-de-la-fama` al recargar.
- [ ] En un dispositivo de puntero grueso aparecen los cuatro botones direccionales y mueven la rana.
- [ ] El selector de skin aparece en el HUD y las tres skins cambian el canvas; la elección persiste en `localStorage["av-skin-frogger"]`.
- [ ] Ningún color del canvas está hardcodeado: todos salen de la paleta resuelta.
- [ ] `npm run lint` y `npm run build` terminan sin errores.

---

## Decisions

- **Sí: reemplazar el placeholder `ranaria`** en vez de insertar una fila nueva. Razón: decisión explícita del usuario (2026-09-23) y patrón establecido por specs 02/03/05 — deja el catálogo sin filas muertas y hereda `best`/`plays`.
- **Sí: `color = 'green'`** en lugar del `'lime'` del spec de la jam. Razón: `games_color_check` solo admite cuatro valores; `'lime'` haría fallar el SQL.
- **Sí: ninguna ruta nueva.** Razón: `app/juegos/[id]/jugar` + `GamePlayer.tsx` ya son genéricos desde specs/06-07; una play-page propia duplicaría HUD, pausa, modal y guardado.
- **Sí: primitivas canvas sin sprites bitmap.** Razón: no hay assets de Frogger en el repo; dibujar por código elimina la carga de imágenes y hace medible el contraste de cada skin.
- **Sí: cuadrícula discreta de 40 px con salto de 120 ms.** Razón: mecánica canónica; el movimiento discreto simplifica colisiones y soporte al comparar filas/columnas enteras.
- **Sí: doble HUD.** Razón: coherencia con los cuatro juegos existentes.
- **Sí: 3 vidas.** Razón: fiel al original y coherente con Arkanoid.
- **Sí: tortugas con ciclo de inmersión.** Razón: es la mecánica que distingue el río de Frogger de un simple carril de troncos.
- **Sí: temporizador de ronda de 15 s.** Razón: mecánica original; impide esperar indefinidamente en la zona segura.
- **Sí: canvas 640 × 560.** Razón: única lectura consistente con `COLS=16` × `ROWS=14` × `CELL=40` y con los criterios de aceptación del spec de origen.
- **No: movimiento continuo interpolado.** Razón: exigiría colisiones AABB en espacio continuo sin añadir diversión.
- **No: power-ups (mosca, cocodrilo, rana de rescate).** Razón: capas de dificultad independientes de la mecánica base; spec futuro.
- **No: componente genérico `CanvasGame`.** Razón: YAGNI.
- **No: RLS ni realtime.** Razón: decisiones ya tomadas en specs/06, no se reabren aquí.
