# SPEC GJ-02 — BOYAS (jam: Cruza la carretera y el río sin convertirte en papilla)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-09-21
> **Jam:** Cruza la carretera y el río sin convertirte en papilla · concepto 2 de 3 · diseño de juego en [`./design.md`](./design.md)
> **Promoción:** este spec vive fuera de `specs/`, así que `/spec-impl` **no lo encuentra**. Para implementarlo: copiarlo a `specs/<NN>-juego-boyas.md` con el siguiente número libre de la serie principal, renombrar el título a `# SPEC <NN> — …`, cambiar el Estado a `Aprobado` a mano, y recién entonces ejecutar `/spec-impl <NN>-juego-boyas`.
> **Objetivo:** Un juego de puntería donde disparas flotadores desde la orilla para rescatar bañistas que la corriente arrastra hacia la cascada.

## Scope

**In:**

- Migración `supabase/migrations/000X_add_boyas.sql` con un `insert into public.games (...)` de **fila nueva** (no reemplaza ningún placeholder), con `playable = true`.
- Nuevo componente `components/games/BoyasGame.tsx`, construido desde cero: canvas único de 480×480, loop `requestAnimationFrame` con `dt` clamped, listeners montados y limpiados dentro de un `useEffect` — mismo patrón que `components/games/AsteroidsGame.tsx`.
- Contrato estándar: props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef` + `useImperativeHandle`.
- Controles: `ArrowLeft`/`A` y `ArrowRight`/`D` desplazan el lanzador por la orilla inferior a 200 px/s; `Space` dispara un flotador en vertical. Mantener `Space` pulsado **no** dispara en ráfaga: hace falta un `keydown` nuevo por disparo.
- Estructura del cauce: orilla inferior de 96 px con el lanzador, y cuatro carriles de corriente de 96 px sobre ella. El borde por el que escapan los bañistas (la cascada) alterna por carril: carriles 1 y 3 escapan por la derecha, carriles 2 y 4 por la izquierda.
- Munición: stock máximo de 6 flotadores, dibujado como seis boyas en la orilla; se recarga 1 flotador cada 900 ms. Sin stock no se puede disparar.
- Proyectil: el flotador sube en vertical a 380 px/s y desaparece al salir del canvas (no se recupera).
- Puntuación: impactar un bañista lo rescata y suma exactamente **25 puntos**. Si el rescate ocurre en el **carril 4** (el más lejano y rápido, "corriente fuerte"), suma **50 puntos** en lugar de 25. Sin combos.
- `onLivesChange`: **5 vidas iniciales**; cada bañista que alcanza su borde de escape resta una vida. El componente emite `onLivesChange(5)` al montar y en cada `restart()`, porque el HUD arranca en `useState(3)` y sin esa emisión mostraría tres corazones falsos.
- `onLevelChange`: `floor(rescates / 6) + 1`; cada nivel sube la velocidad de la corriente desde 70 px/s en `+12 px/s` con techo de 190 px/s, y baja el intervalo de aparición desde 1600 ms en `-90 ms` con piso de 550 ms.
- `onGameOver(score)` se dispara cuando la quinta vida se pierde, es decir, cuando el quinto bañista alcanza su borde de escape.
- Nueva entrada `boyas: BoyasGame` en el registro `REAL_GAMES` de `components/GamePlayer.tsx` — el registro ya existe desde specs/07, solo se añade una entrada, sin refactor.
- Nuevo bloque CSS `.cover-boyas` en `app/globals.css`, siguiendo el estilo pixel-art a mano de las clases vecinas; los stops exactos del gradiente son un detalle de implementación de `/spec-impl`.
- El leaderboard de `/juegos/boyas` y el tab del Salón de la Fama funcionan sin código nuevo en cuanto exista la fila con `playable = true` — specs/06 ya lo dejó genérico.

**Out of scope (para futuros specs):**

- Disparo en ángulo con rotación del lanzador: en este spec el flotador sale siempre en vertical.
- Bañistas con comportamiento especial (que nadan contra corriente, que se hunden y reaparecen, que rebotan entre carriles).
- Power-ups: flotador doble, red que barre un carril entero, ralentizador de corriente.
- Obstáculos flotantes (troncos, barcas) que bloqueen el proyectil.
- Audio, soporte táctil/móvil y esquemas de control alternativos más allá de flechas + WASD + `Space`.
- Cambios a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx` — ya son completamente genéricos.
- Cálculo en vivo de `best` / `plays` desde `scores` — decisión cerrada en specs/06, no se reabre.
- Los otros dos juegos de este jam (`GJ-01`, `GJ-03`), cada uno con su propio spec.

## Data model

```sql
-- supabase/migrations/000X_add_boyas.sql  (numeración real al promover el spec)
insert into public.games (id, title, short, long, cat, cover, color, best, plays, playable)
values (
  'boyas',
  'BOYAS',
  'Dispara flotadores desde la orilla y saca del río a todo el que la corriente se lleva.',
  'Eres el socorrista del peor tramo del río. Cuatro corrientes arrastran bañistas de lado a lado y solo tienes seis flotadores en la orilla, que se reponen despacio. Cada rescate suma veinticinco puntos, y el doble si lo haces en la corriente fuerte del fondo. Cinco bañistas por la cascada y cierras el puesto.',
  'SHOOTER',
  'cover-boyas',
  'cyan',
  0,
  '0',
  true
);
```

Fila **nueva**: no toca ningún placeholder existente. Verificado el 2026-09-21 contra `public.games` que `'boyas'` no existe (ids ocupados: `arkanoid`, `asteroids`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `snake`, `tetris`), y contra `app/globals.css` que `cover-boyas` no está definido.

```ts
export interface BoyasGameHandle {
  restart: () => void;
}

interface BoyasGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // 5 iniciales, -1 por bañista perdido
  onLevelChange: (level: number) => void; // floor(rescates / 6) + 1
  onGameOver: (finalScore: number) => void; // al perder la quinta vida
}
```

## Implementation plan

1. Crear y aplicar `supabase/migrations/000X_add_boyas.sql`; confirmar con `execute_sql` que la fila existe con `playable = true`.
2. Crear `components/games/BoyasGame.tsx` con el esqueleto del contrato (canvas 480×480, loop vacío con `dt` clamped, callbacks cableados, `restart()` ya expuesto). Prueba manual: `/juegos/boyas/jugar` renderiza el canvas sin errores de consola.
3. Implementar el dibujo del cauce (cuatro carriles con líneas de corriente animadas y la orilla inferior) y el desplazamiento lateral del lanzador con flechas y WASD, con clamp a los bordes.
4. Implementar el disparo: stock de 6 con recarga cada 900 ms, un flotador por `keydown` de `Space`, proyectil vertical a 380 px/s, indicador de stock dibujado en la orilla.
5. Implementar los bañistas: aparición por carril según el intervalo del nivel, arrastre horizontal hacia su borde de escape, colisión por distancia contra el flotador, `onScoreChange` con +25 y +50 en el carril 4.
6. Implementar la pérdida de vida cuando un bañista alcanza su borde, la emisión de `onLivesChange(5)` al montar, la progresión de nivel (`onLevelChange`), `onGameOver` al agotar las 5 vidas y el reset completo en `restart()`.
7. Añadir la entrada `boyas: BoyasGame` al registro `REAL_GAMES` de `components/GamePlayer.tsx`, sin cambiar su estructura.
8. Añadir el bloque `.cover-boyas` a `app/globals.css`, siguiendo el estilo de las clases vecinas.
9. Prueba manual completa (`npm run dev`): rescatar en carriles cercanos y en el carril 4, quedarse sin stock y esperar recarga, perder las cinco vidas, ver el modal "FIN DEL JUEGO", guardar la puntuación, "JUGAR DE NUEVO", PAUSA/REANUDAR, y confirmar que Asteroids, Tetris, Arkanoid y Snake siguen funcionando igual.
10. Confirmar la tarjeta en `/biblioteca`, el leaderboard en `/juegos/boyas` y el tab en `/salon-de-la-fama`.
11. Ejecutar `npm run lint` y `npm run build`; ambos sin errores.

## Acceptance criteria

- [ ] `public.games` contiene una fila `id: 'boyas'` con `cat: 'SHOOTER'`, `color: 'cyan'`, `cover: 'cover-boyas'` y `playable: true`.
- [ ] La tarjeta "BOYAS" aparece en `/biblioteca` y se filtra correctamente con la categoría SHOOTER.
- [ ] `/juegos/boyas` carga sin error 404 y "JUGAR AHORA" apunta a `/juegos/boyas/jugar`.
- [ ] Las flechas y WASD desplazan el lanzador por la orilla sin salirse del canvas, y `Space` dispara un flotador vertical.
- [ ] Mantener `Space` pulsado dispara un solo flotador; hace falta soltar y volver a pulsar para disparar otro.
- [ ] El stock de flotadores nunca supera 6, baja 1 por disparo, se repone 1 cada 900 ms y bloquea el disparo cuando está a 0; el estado se ve dibujado dentro del canvas.
- [ ] Rescatar un bañista en los carriles 1, 2 o 3 suma exactamente 25 puntos; hacerlo en el carril 4 suma exactamente 50.
- [ ] El nivel del HUD sube según `floor(rescates / 6) + 1`, la corriente acelera sin pasar de 190 px/s y el intervalo de aparición baja sin bajar de 550 ms.
- [ ] El indicador de Vidas del HUD muestra 5 corazones desde el primer frame de la partida, baja de uno en uno por cada bañista perdido, y vuelve a mostrar 5 tras pulsar "JUGAR DE NUEVO".
- [ ] Perder la quinta vida abre el modal "FIN DEL JUEGO" con la puntuación real, sin ningún overlay propio dibujado en el canvas.
- [ ] Guardar la puntuación inserta una fila real en `scores` con `game_id: 'boyas'`.
- [ ] "JUGAR DE NUEVO" reinicia a puntuación 0, nivel 1, 5 vidas, stock lleno y cauce vacío.
- [ ] "PAUSA"/"REANUDAR" congela el juego y lo continúa sin saltos ni pérdida de progreso.
- [ ] `/juegos/asteroids/jugar`, `/juegos/tetris/jugar`, `/juegos/arkanoid/jugar` y `/juegos/snake/jugar` siguen funcionando exactamente igual.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** puntería por anticipación con proyectil vertical y base móvil, en vez de cañón que rota — la dificultad interesante está en liderar un blanco que se mueve lateralmente, y evita toda la trigonometría de apuntado, que no aporta nada al tema.
- **Sí:** `cat: SHOOTER` y `color: cyan` — es el único disparo del trío y el cian es el agua; el trío queda con amarillo (asfalto), cian (río) y magenta (la crecida abstracta), sin repetir el `green` saturado del catálogo.
- **Sí:** la lente es el **rol** — el socorrista es quien trabaja dentro del tema, y su presión es un recurso finito de flotadores frente a un río que no para.
- **Sí:** fila nueva en `games` en vez de reutilizar un placeholder — `invasores` es SHOOTER pero es un Space Invaders reconocible con identidad propia, y `ranaria` sigue reservada para Frogger.
- **Sí:** `playable = true` en el mismo `insert` — sin eso, `lib/games.ts#getGames()` filtra la fila y la tarjeta nunca aparece en `/biblioteca`.
- **Sí:** 5 vidas, no 3 — perder bañistas es la moneda habitual del juego y con 3 la partida se corta antes de que la curva se ponga interesante; 5 sigue dentro del rango que el HUD pinta sin desbordarse. Se emite `onLivesChange(5)` al montar y al reiniciar porque el HUD arranca en `useState(3)` y `GamePlayer.restart()` lo devuelve a 3 a ciegas.
- **Sí:** el carril 4 paga el doble — da una decisión constante (rescatar barato y seguro o caro y arriesgado) sin añadir ningún sistema nuevo.
- **No:** sin audio, sin assets externos, sin dependencias npm nuevas — todo se dibuja con primitivas de canvas.
- **No:** sin soporte táctil ni móvil.
- **No:** no se introducen tablas ni columnas nuevas; `lib/games.ts` y `lib/scores.ts` quedan intactos.
- **No:** se descartó que los bañistas disparen, ataquen o dañen al jugador — el fallo es dejarlos escapar, no ser alcanzado; eso mantiene el juego lejos de Asteroids y de `invasores`.

## Risks

| Riesgo                                                                                                                            | Mitigación                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Con proyectil vertical y objetivos horizontales, los carriles lejanos pueden volverse imposibles al llegar al techo de velocidad. | La corriente se topa en 190 px/s y el flotador viaja a 380 px/s: incluso desde la orilla, el tiempo de vuelo al carril 4 permite un adelanto inferior a media pantalla. El paso 9 lo valida jugando hasta el nivel 10. |
| El HUD mostraría 3 corazones falsos si el componente no emite las vidas al montar y tras `restart()`.                             | El spec exige `onLivesChange(5)` en el montaje y en cada `restart()`, y el criterio de aceptación verifica los 5 corazones desde el primer frame y después de "JUGAR DE NUEVO".                                        |
| Con `Space` en auto-repeat del sistema el stock se vaciaría de golpe y el juego perdería su recurso escaso.                       | El disparo se gestiona con un flag de tecla ya procesada que solo se limpia en `keyup`; el criterio de aceptación lo verifica de forma explícita.                                                                      |
| La tecla `Space` puede hacer scroll de la página mientras se juega.                                                               | El handler llama a `preventDefault()` sobre `Space` y las flechas, igual que hacen los juegos ya implementados.                                                                                                        |
| Añadir la entrada al registro `REAL_GAMES` podría romper alguno de los cuatro juegos ya implementados.                            | El paso 9 exige probar explícitamente Asteroids, Tetris, Arkanoid y Snake después del cambio.                                                                                                                          |

## Lo que **no** está en este spec

- Disparo en ángulo con lanzador que rota.
- Bañistas con comportamiento especial.
- Power-ups y obstáculos flotantes.
- Audio, táctil/móvil y controles alternativos.
- Cálculo en vivo de `best` / `plays`.
- Los otros dos conceptos del jam «Cruza la carretera y el río sin convertirte en papilla».
