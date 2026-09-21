# SPEC GJ-01 — ASFALTO (jam: Cruza la carretera y el río sin convertirte en papilla)

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-09-21
> **Jam:** Cruza la carretera y el río sin convertirte en papilla · concepto 1 de 3 · diseño de juego en [`./design.md`](./design.md)
> **Promoción:** este spec vive fuera de `specs/`, así que `/spec-impl` **no lo encuentra**. Para implementarlo: copiarlo a `specs/<NN>-juego-asfalto.md` con el siguiente número libre de la serie principal, renombrar el título a `# SPEC <NN> — …`, cambiar el Estado a `Aprobado` a mano, y recién entonces ejecutar `/spec-impl <NN>-juego-asfalto`.
> **Objetivo:** Un juego de evasión continua donde cruzas una avenida de seis carriles a pie, ganando más puntos cuanto más al filo pasas.

## Scope

**In:**

- Migración `supabase/migrations/000X_add_asfalto.sql` con un `insert into public.games (...)` de **fila nueva** (no reemplaza ningún placeholder), con `playable = true`.
- Nuevo componente `components/games/AsfaltoGame.tsx`, construido desde cero: canvas único de 480×480, loop `requestAnimationFrame` con `dt` clamped, listeners montados y limpiados dentro de un `useEffect` — mismo patrón que `components/games/AsteroidsGame.tsx`.
- Contrato estándar: props `{ paused, onScoreChange, onLivesChange, onLevelChange, onGameOver }`, handle `{ restart }` vía `forwardRef` + `useImperativeHandle`.
- Controles: `ArrowUp`/`W` sube, `ArrowDown`/`S` baja, `ArrowLeft`/`A` izquierda, `ArrowRight`/`D` derecha. Movimiento continuo a 150 px/s, sin inercia, sin salto por celdas.
- Estructura del tramo: banda de salida inferior (72 px), 6 carriles de tráfico de 56 px, banda de meta superior (72 px). Cada carril tiene su propia dirección y velocidad.
- Puntuación: cruzar por primera vez un carril del tramo actual suma exactamente **10 puntos**. Si en el instante del cruce hay un coche de ese carril a menos de 24 px del jugador, el cruce suma **30 puntos** en lugar de 10 (bonus "al filo"). Cada carril puntúa una sola vez por tramo. Sin combos.
- Al alcanzar la banda de meta superior el tramo se regenera (nuevas velocidades y direcciones), el jugador vuelve a la banda de salida y los seis carriles vuelven a ser puntuables. Llegar arriba no da puntos por sí mismo.
- `onLivesChange`: **3 vidas iniciales**; ser atropellado resta una vida y devuelve al jugador a la banda de salida con 1200 ms de invulnerabilidad parpadeante. Morir **no** rehabilita los carriles ya puntuados del tramo.
- `onLevelChange`: `floor(carrilesCruzados / 8) + 1`; cada nivel sube la velocidad base de los coches desde 90 px/s en `+16 px/s`, con techo de 260 px/s.
- `onGameOver(score)` se dispara cuando la tercera vida se pierde por atropello.
- Nueva entrada `asfalto: AsfaltoGame` en el registro `REAL_GAMES` de `components/GamePlayer.tsx` — el registro ya existe desde specs/07, solo se añade una entrada, sin refactor.
- Nuevo bloque CSS `.cover-asfalto` en `app/globals.css`, siguiendo el estilo pixel-art a mano de las clases vecinas; los stops exactos del gradiente son un detalle de implementación de `/spec-impl`.
- El leaderboard de `/juegos/asfalto` y el tab del Salón de la Fama funcionan sin código nuevo en cuanto exista la fila con `playable = true` — specs/06 ya lo dejó genérico.

**Out of scope (para futuros specs):**

- Sección de río con troncos flotantes: este juego es solo asfalto; el agua es el territorio de `GJ-02` y `GJ-03`.
- Power-ups (casco, cámara lenta, semáforo en rojo) y vehículos especiales con patrón propio (ambulancia, moto zigzagueante).
- Carriles con obstáculos estáticos (islas, vallas, bocas de riego).
- Audio, soporte táctil/móvil y esquemas de control alternativos más allá de flechas + WASD.
- Modo contrarreloj o marcador de distancia acumulada entre partidas.
- Cambios a `lib/games.ts`, `lib/scores.ts`, `components/GameCard.tsx`, `app/juegos/[id]/page.tsx` — ya son completamente genéricos.
- Cálculo en vivo de `best` / `plays` desde `scores` — decisión cerrada en specs/06, no se reabre.
- Los otros dos juegos de este jam (`GJ-02`, `GJ-03`), cada uno con su propio spec.

## Data model

```sql
-- supabase/migrations/000X_add_asfalto.sql  (numeración real al promover el spec)
insert into public.games (id, title, short, long, cat, cover, color, best, plays, playable)
values (
  'asfalto',
  'ASFALTO',
  'Cruza seis carriles a pie y cobra más cuanto más cerca pasa el parachoques.',
  'Una avenida de seis carriles, cada uno con su propia velocidad y su propio sentido. Caminas libre, sin saltos ni casillas, y cada carril que superas suma diez puntos; si lo superas rozando un coche, suma treinta. Llegar a la acera de enfrente genera una avenida nueva y más rápida. Tres atropellos y se acabó.',
  'ARCADE',
  'cover-asfalto',
  'yellow',
  0,
  '0',
  true
);
```

Fila **nueva**: no toca ningún placeholder existente. Verificado el 2026-09-21 contra `public.games` que `'asfalto'` no existe (ids ocupados: `arkanoid`, `asteroids`, `duelo-pixel`, `gloton`, `invasores`, `ranaria`, `snake`, `tetris`), y contra `app/globals.css` que `cover-asfalto` no está definido.

```ts
export interface AsfaltoGameHandle {
  restart: () => void;
}

interface AsfaltoGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void; // 3 iniciales, -1 por atropello
  onLevelChange: (level: number) => void; // floor(carrilesCruzados / 8) + 1
  onGameOver: (finalScore: number) => void; // al perder la tercera vida
}
```

## Implementation plan

1. Crear y aplicar `supabase/migrations/000X_add_asfalto.sql`; confirmar con `execute_sql` que la fila existe con `playable = true`.
2. Crear `components/games/AsfaltoGame.tsx` con el esqueleto del contrato (canvas 480×480, loop vacío con `dt` clamped, callbacks cableados, `restart()` ya expuesto). Prueba manual: `/juegos/asfalto/jugar` renderiza el canvas sin errores de consola.
3. Implementar el dibujo del tramo (bandas de salida y meta, 6 carriles con línea discontinua) y el movimiento libre del jugador con flechas y WASD, con clamp a los bordes del canvas. Prueba manual: el cuadrado del jugador se mueve en las cuatro direcciones y no sale del lienzo.
4. Implementar los coches: un array por carril, rectángulos de ancho 48 u 84, reciclados al salir del canvas por el lado opuesto, con colisión AABB contra el jugador. Prueba manual: el tráfico fluye en ambos sentidos y atropellar resta una vida.
5. Implementar la puntuación (+10 por carril nuevo, +30 si hay un coche a menos de 24 px), el flag de carril ya puntuado y la regeneración del tramo al llegar a la meta, con `onScoreChange`.
6. Implementar la progresión de nivel (`onLevelChange`), la invulnerabilidad tras el atropello, `onGameOver` al agotar las 3 vidas y el reset completo en `restart()`.
7. Añadir la entrada `asfalto: AsfaltoGame` al registro `REAL_GAMES` de `components/GamePlayer.tsx`, sin cambiar su estructura.
8. Añadir el bloque `.cover-asfalto` a `app/globals.css`, siguiendo el estilo de las clases vecinas.
9. Prueba manual completa (`npm run dev`): jugar, puntuar normal y al filo, subir de nivel, morir tres veces, ver el modal "FIN DEL JUEGO", guardar la puntuación, "JUGAR DE NUEVO", PAUSA/REANUDAR, y confirmar que Asteroids, Tetris, Arkanoid y Snake siguen funcionando igual.
10. Confirmar la tarjeta en `/biblioteca`, el leaderboard en `/juegos/asfalto` y el tab en `/salon-de-la-fama`.
11. Ejecutar `npm run lint` y `npm run build`; ambos sin errores.

## Acceptance criteria

- [ ] `public.games` contiene una fila `id: 'asfalto'` con `cat: 'ARCADE'`, `color: 'yellow'`, `cover: 'cover-asfalto'` y `playable: true`.
- [ ] La tarjeta "ASFALTO" aparece en `/biblioteca` y se filtra correctamente con la categoría ARCADE.
- [ ] `/juegos/asfalto` carga sin error 404 y "JUGAR AHORA" apunta a `/juegos/asfalto/jugar`.
- [ ] Las flechas y WASD mueven al jugador en las cuatro direcciones de forma continua, sin saltos por casillas, y el jugador nunca sale del canvas.
- [ ] Cruzar un carril por primera vez en el tramo suma exactamente 10 puntos; hacerlo con un coche de ese carril a menos de 24 px suma exactamente 30.
- [ ] Volver a cruzar un carril ya puntuado dentro del mismo tramo no suma puntos, ni siquiera tras perder una vida.
- [ ] Llegar a la banda de meta regenera el tramo y vuelve a habilitar los seis carriles para puntuar.
- [ ] El nivel del HUD sube según `floor(carrilesCruzados / 8) + 1` y la velocidad del tráfico aumenta de forma perceptible, sin pasar de 260 px/s.
- [ ] El indicador de Vidas del HUD muestra 3 corazones al empezar, baja de uno en uno al ser atropellado, y vuelve a 3 tras pulsar "JUGAR DE NUEVO".
- [ ] Perder la tercera vida abre el modal "FIN DEL JUEGO" con la puntuación real, sin ningún overlay propio dibujado en el canvas.
- [ ] Guardar la puntuación inserta una fila real en `scores` con `game_id: 'asfalto'`.
- [ ] "JUGAR DE NUEVO" reinicia a puntuación 0, nivel 1, 3 vidas y tramo inicial.
- [ ] "PAUSA"/"REANUDAR" congela el juego y lo continúa sin saltos ni pérdida de progreso.
- [ ] `/juegos/asteroids/jugar`, `/juegos/tetris/jugar`, `/juegos/arkanoid/jugar` y `/juegos/snake/jugar` siguen funcionando exactamente igual.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** evasión continua con movimiento libre en vez de salto discreto por casillas — es lo que separa este juego del `ranaria` (Frogger) que ya existe como placeholder en el catálogo; aquí el reto es medir distancias analógicas, no elegir el tick correcto.
- **Sí:** solo asfalto, sin río — el jam reparte el tema en tres piezas y el agua queda para `GJ-02` y `GJ-03`; mezclar ambos entornos en un mismo juego duplicaría el esfuerzo y solaparía los tres conceptos.
- **Sí:** `cat: ARCADE` y `color: yellow` — la avenida pide señalización amarilla, y el amarillo evita el `green` que ya cargan `snake`, `invasores` y `ranaria`; ARCADE es la categoría natural de un juego de reflejos puros.
- **Sí:** fila nueva en `games` en vez de reutilizar un placeholder — `ranaria` tiene identidad propia (Frogger con río y troncos) y sigue viva en el backlog; pisarla con este concepto borraría una entrada que el usuario quiere conservar.
- **Sí:** `playable = true` en el mismo `insert` — sin eso, `lib/games.ts#getGames()` filtra la fila y la tarjeta nunca aparece en `/biblioteca`.
- **Sí:** 3 vidas y no 5 — el HUD pinta `"♥ ".repeat(lives)` y arranca en `useState(3)`, así que 3 es el único valor que coincide con el estado inicial sin necesidad de un `onLivesChange` de arranque; aun así el componente emite las vidas en el primer frame para no depender de esa coincidencia.
- **Sí:** el bonus "al filo" sustituye a un bonus por tramo completado — con puntos por llegar arriba el jugador óptimo correría en línea recta; premiando el roce, el riesgo es la fuente de puntos y el score sigue siendo monótono creciente.
- **No:** sin audio, sin assets externos, sin dependencias npm nuevas — todo se dibuja con primitivas de canvas.
- **No:** sin soporte táctil ni móvil.
- **No:** no se introducen tablas ni columnas nuevas; `lib/games.ts` y `lib/scores.ts` quedan intactos.
- **No:** se descartó el scroll vertical infinito de la avenida (estilo endless runner) — obliga a gestionar generación y reciclaje de carriles fuera de pantalla, y este concepto es el de esfuerzo bajo del trío.

## Risks

| Riesgo                                                                                                               | Mitigación                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El bonus "al filo" podría farmearse quedándose pegado a un carril y entrando y saliendo de él.                       | Cada carril puntúa una sola vez por tramo, y el flag no se reinicia al morir: solo al regenerar el tramo tras llegar a la meta. El criterio de aceptación lo verifica.  |
| Con el tráfico al techo de 260 px/s puede aparecer una pared infranqueable de coches y el juego se vuelve injugable. | Cada carril garantiza un hueco mínimo de 110 px entre coches consecutivos en el momento de generarlos; el paso 9 incluye jugar al menos hasta el nivel 10 para validar. |
| Con `dt` grande (pestaña en segundo plano) un coche podría atravesar al jugador sin registrar colisión.              | El `dt` se clampa a 1/30 s como en `AsteroidsGame.tsx`, y el desplazamiento máximo por frame queda por debajo del ancho del coche más estrecho (48 px).                 |
| Añadir la entrada al registro `REAL_GAMES` podría romper alguno de los cuatro juegos ya implementados.               | El paso 9 exige probar explícitamente Asteroids, Tetris, Arkanoid y Snake después del cambio.                                                                           |

## Lo que **no** está en este spec

- Sección de río con troncos flotantes.
- Power-ups y vehículos con patrón especial.
- Obstáculos estáticos en los carriles.
- Audio, táctil/móvil y controles alternativos.
- Modo contrarreloj o distancia acumulada entre partidas.
- Cálculo en vivo de `best` / `plays`.
- Los otros dos conceptos del jam «Cruza la carretera y el río sin convertirte en papilla».
