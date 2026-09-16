# SPEC 05 — Juego real de Asteroids integrado a la plataforma

> **Estado:** Aprobado
> **Depende de:** Ninguno
> **Fecha:** 2026-09-16
> **Objetivo:** Portar el juego de Asteroids ya prototipado en `references/templates/started-games/02-asteroids/game.js` a un componente React (`components/games/AsteroidsGame.tsx`) que se ejecuta dentro de `GamePlayer.tsx` bajo la ruta `/juegos/asteroids/jugar`, reemplazando la simulación falsa por el juego jugable de verdad con su HUD, pausa y guardado de puntuación reales.

## Scope

**In:**

- Nueva entrada en el catálogo `data/games.ts`: `id: "asteroids"`, título "ASTEROIDS", categoría `SHOOTER`, color `yellow`, cover `cover-asteroids`, con `short`/`long` reescritos para reflejar las mecánicas reales del juego (nave, división de asteroides, power-up de disparo triple), reemplazando lo que hoy describe "ROCAS" (incluida la mención a "OVNIs", mecánica que no existe en el juego real).
- Eliminación de la entrada `"rocas"` de `data/games.ts` — es el mismo juego conceptual, ahora bajo `"asteroids"`.
- Renombrado en `app/globals.css` de las reglas `.cover-rocas`, `.cover-rocas::before` y `.cover-rocas::after` a `.cover-asteroids` (mismas declaraciones, solo cambia el nombre de la clase).
- Componente nuevo `components/games/AsteroidsGame.tsx`: puerto a React/TypeScript del contenido íntegro de `references/templates/started-games/02-asteroids/game.js` (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, física, colisiones, spawns, niveles), montado en un `<canvas>` fijo de 800×600 vía `useRef` + `useEffect`, con el loop `requestAnimationFrame` limpiado correctamente al desmontar (cancelación del frame y remoción de los listeners de teclado).
- El HUD dibujado dentro del canvas original (`drawHUD`: SCORE/NIVEL/iconos de vida) y el overlay de `GAME OVER` (`drawOverlay` + reinicio con Espacio) se eliminan del canvas: `AsteroidsGame` reporta `score`, `lives`, `level` y el fin de partida hacia arriba mediante props de callback (`onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`).
- `AsteroidsGame` acepta una prop `paused: boolean`: cuando es `true`, el loop deja de llamar a `update(dt)` (el juego se congela) pero sigue dibujando el último frame; cuando vuelve a `false`, continúa desde donde quedó, sin saltos de `dt`.
- `AsteroidsGame` expone un método `restart()` (vía `forwardRef` + `useImperativeHandle`) para que "JUGAR DE NUEVO" en el modal de fin de partida ya existente reinicie el juego real.
- `components/GamePlayer.tsx` se modifica para: si `game.id === "asteroids"`, renderizar `<AsteroidsGame />` dentro de `.crt-screen` en lugar del `.game-arena` decorativo, desactivar el `setInterval` de puntuación aleatoria para ese caso, y conectar `score`/`lives`/`level`/`over` al estado real reportado por el juego (en vez de la fórmula falsa `Math.floor(score/2500)+1` y del `setOver` disparado solo por el botón "FIN"). Para cualquier otro `game.id` del catálogo, `GamePlayer` conserva exactamente el comportamiento actual (simulación falsa) sin cambios.
- El botón "PAUSA"/"REANUDAR" ya existente en `GamePlayer.tsx` pasa a controlar la pausa real del juego (hoy no tiene efecto).
- El guardado de puntuación al finalizar (`localStorage["av_scores"]`, escritura ya existente y nunca releída) sigue funcionando igual, ahora con la puntuación real obtenida jugando.
- Controles: exactamente los mismos del template — solo teclado (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `Space`), incluyendo el power-up de disparo triple (`3x`) tal cual existe en el juego original.

**Out of scope (para futuros specs):**

- Soporte táctil/móvil o controles en pantalla — el juego sigue siendo solo de teclado, como el resto de la plataforma hoy.
- Persistencia real de puntuaciones (base de datos, Supabase) — se mantiene igual que hoy: solo escritura en `localStorage["av_scores"]`, sin lectura posterior, decisión ya tomada en `specs/01-mvp-visual.md`.
- El leaderboard mock de `app/juegos/asteroids/page.tsx` (`seededScores`) — sigue siendo data ficticia determinista, no relacionada con partidas reales.
- Sonido o música — el juego original no tiene, no se agrega aquí.
- Implementar el juego real para cualquier otro título del catálogo (tetris, arkanoid, etc.) — queda para specs futuros, uno por juego.
- Generalizar `GamePlayer.tsx` con un registro/mapa de "juegos implementados" — por ahora se resuelve con una comparación directa `game.id === "asteroids"`; si se agregan más juegos reales, un spec futuro decide cómo generalizarlo.
- Crear una carpeta de seguimiento `references/02-asteroids/` (patrón visto en `references/03-tetris/` y `references/04-arkanoid/`, ambas casi vacías) — no hay evidencia de que sea obligatorio y no se pidió.
- Actualizar el `CLAUDE.md` raíz (desactualizado respecto a que "no existen rutas custom") — fuera de alcance de este spec.

## Data model

No introduce persistencia nueva. Sí cambia el catálogo existente en `data/games.ts` — se elimina el objeto `"rocas"` y se agrega este en su lugar:

```ts
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Pulveriza asteroides en gravedad cero.",
  long: "Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cada cierto tiempo aparece un power-up de disparo triple.",
  cat: "SHOOTER",
  cover: "cover-asteroids",
  color: "yellow",
  best: 41200,
  plays: "15.6K",
}
```

`best` y `plays` se heredan tal cual de la entrada `"rocas"` — son datos decorativos de catálogo, no ligados a partidas reales.

Contrato de props de `components/games/AsteroidsGame.tsx`:

```ts
interface AsteroidsGameHandle {
  restart: () => void;
}

interface AsteroidsGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

## Implementation plan

1. Actualizar `data/games.ts`: eliminar el objeto con `id: "rocas"` y agregar el objeto `id: "asteroids"` con el copy definido arriba.
2. Renombrar en `app/globals.css` las reglas `.cover-rocas`, `.cover-rocas::before` y `.cover-rocas::after` a `.cover-asteroids`, sin cambiar sus declaraciones.
3. Crear `components/games/AsteroidsGame.tsx`: portar el estado y las clases de `game.js` a TypeScript dentro de un client component, montando el canvas vía `useRef<HTMLCanvasElement>` y ejecutando el loop dentro de `useEffect` (setup en el mount; cleanup con `cancelAnimationFrame` y remoción de los listeners de teclado en el unmount). Recibe las props `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`, y expone `restart()` vía `forwardRef`/`useImperativeHandle`. Elimina `drawHUD` y `drawOverlay` del dibujo en canvas; en su lugar invoca los callbacks cuando cambian `score`/`lives`/`level`, y llama a `onGameOver(score)` una sola vez cuando el estado interno pasa a `'gameover'` (sin esperar Espacio para reiniciar).
4. Modificar `components/GamePlayer.tsx`: agregar una rama condicional `game.id === "asteroids"` que renderiza `<AsteroidsGame ref={...} paused={paused} onScoreChange={setScore} onLivesChange={setLives} onLevelChange={setLevel} onGameOver={endGame} />` dentro de `.crt-screen` en lugar de `.game-arena`; desactivar el `useEffect` con `setInterval` de puntuación aleatoria cuando `game.id === "asteroids"`; agregar estado `level` alimentado por `onLevelChange` para ese caso (en vez de la fórmula derivada `Math.floor(score/2500)+1`); conectar el botón PAUSA a la prop `paused` de `AsteroidsGame`; conectar "JUGAR DE NUEVO" del modal para que también llame a `restart()` sobre el ref de `AsteroidsGame`.
5. Probar manualmente el flujo completo en el navegador (`npm run dev` → `/juegos/asteroids/jugar`): mover la nave, disparar, dividir asteroides, recoger el power-up de disparo triple, perder una vida y reaparecer con invencibilidad parpadeante, perder las 3 vidas y ver el modal de fin de partida con la puntuación real, guardar la puntuación, pulsar "JUGAR DE NUEVO" y confirmar que el juego reinicia limpio, pulsar PAUSA/REANUDAR y confirmar que el juego se congela y continúa.
6. Ejecutar `npm run lint` y `npm run build` y confirmar que ambos terminan sin errores.

## Acceptance criteria

- [ ] `data/games.ts` ya no contiene ningún objeto con `id: "rocas"`.
- [ ] `data/games.ts` contiene un objeto con `id: "asteroids"`, `cat: "SHOOTER"`, `cover: "cover-asteroids"`.
- [ ] La tarjeta "ASTEROIDS" aparece en `/biblioteca` y se filtra correctamente con la categoría SHOOTER.
- [ ] `/juegos/asteroids` (detalle) carga sin error 404 y el botón "JUGAR AHORA" apunta a `/juegos/asteroids/jugar`.
- [ ] `/juegos/asteroids/jugar` muestra un `<canvas>` real de 800×600 donde la nave rota con las flechas, propulsa con flecha arriba y dispara con espacio.
- [ ] Destruir un asteroide grande lo divide en dos medianos, un mediano en dos pequeños, y un pequeño desaparece sin dividirse, sumando los puntos correspondientes (100/50/20) al HUD de React.
- [ ] El HUD de `GamePlayer.tsx` (Puntuación, Vidas, Nivel) refleja en todo momento el estado real del juego, sin usar la fórmula falsa anterior.
- [ ] Recolectar el power-up activa el indicador de disparo triple y dispara 3 balas en abanico mientras dura.
- [ ] Perder una vida resta un corazón del HUD y la nave reaparece con parpadeo de invencibilidad temporal.
- [ ] Perder la tercera vida abre el modal "FIN DEL JUEGO" existente con la puntuación real obtenida, sin mostrar el overlay de "GAME OVER" del canvas.
- [ ] Guardar la puntuación desde el modal escribe una entrada nueva en `localStorage["av_scores"]` con el `score` real de la partida.
- [ ] Pulsar "JUGAR DE NUEVO" desde el modal reinicia el juego real (nave al centro, 3 vidas, puntuación en 0, nivel 1).
- [ ] Pulsar "PAUSA" congela visualmente el juego (nave, asteroides y balas dejan de moverse) y "REANUDAR" lo continúa sin resetear el progreso ni provocar saltos bruscos.
- [ ] Navegar a otra ruta y volver a `/juegos/asteroids/jugar` no deja listeners de teclado duplicados ni un loop de animación corriendo en segundo plano.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.
- [ ] El resto de juegos del catálogo (ej. "CAÍDA", "INVASORES") siguen mostrando la simulación falsa de `GamePlayer.tsx` sin cambios de comportamiento.

## Decisions

- **Sí:** se crea una entrada nueva `id: "asteroids"` en el catálogo y se elimina `"rocas"`, en vez de reutilizar el id existente, para alinear el nombre del juego con "Asteroids" y no arrastrar copy (OVNIs) que no corresponde a la mecánica real.
- **Sí:** se reescribe el copy largo del juego para reflejar el power-up de disparo triple real, en vez de mantener la mención a OVNIs inexistentes.
- **Sí:** `best` y `plays` se heredan tal cual de la entrada `"rocas"` — son datos decorativos de catálogo no ligados a partidas reales, no hay razón para inventar otros valores.
- **Sí:** el HUD del juego pasa a ser uno solo, el de React (`GamePlayer.tsx`); se elimina el HUD dibujado en canvas para no duplicar información en pantalla.
- **Sí:** el fin de partida se resuelve con el modal existente de `GamePlayer.tsx` (guardar puntuación); se elimina el overlay de "GAME OVER" y el reinicio con Espacio propios del canvas, para tener un solo flujo de fin de juego consistente con el resto de la plataforma.
- **Sí:** la pausa pasa a tener efecto real sobre el loop del juego, aprovechando el botón que ya existía en la UI pero no hacía nada.
- **Sí:** el canvas mantiene tamaño fijo 800×600 (igual que el template original) en lugar de escalarlo, porque la física del juego (velocidades, radios, distancias de spawn) está calibrada para esas dimensiones exactas.
- **Sí:** se mantienen los controles exclusivamente de teclado y el power-up de disparo triple tal cual el template, sin agregar soporte táctil ni quitar mecánicas ya construidas.
- **Sí:** la integración se resuelve con una comparación directa `game.id === "asteroids"` dentro de `GamePlayer.tsx`, sin crear todavía un registro/mapa de "juegos implementados" — es prematuro con un solo juego real; se generaliza cuando se agregue el segundo (tetris o arkanoid).
- **No:** no se agrega soporte táctil/móvil — el resto de la plataforma tampoco lo tiene todavía.
- **No:** no se persiste la puntuación en Supabase ni se cambia el comportamiento de `localStorage["av_scores"]` (solo escritura, nunca releída) — decisión ya tomada en `specs/01-mvp-visual.md`, no se reabre aquí.
- **No:** no se crea una carpeta de seguimiento `references/02-asteroids/` — no hay evidencia de que el patrón visto en `03-tetris`/`04-arkanoid` sea obligatorio.

## Risks

| Riesgo                                                                                                                                                                    | Mitigación                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los listeners globales de teclado (`window.addEventListener('keydown'/'keyup')`) del juego original quedan activos si no se limpian al desmontar, afectando otras páginas | El puerto a React limpia los listeners y cancela el `requestAnimationFrame` explícitamente en el cleanup del `useEffect` (paso 3 del plan).                    |
| La física está calibrada en píxeles absolutos para un canvas de 800×600; escalarlo o cambiar su tamaño rompería la sensación original                                     | Se mantiene el canvas fijo 800×600 (decisión tomada), sin lógica de escalado.                                                                                  |
| Congelar el loop en pausa podría dejar el `dt` acumulado y causar un salto brusco al reanudar                                                                             | El cálculo de `dt` usa el timestamp del frame anterior con clamp a 50ms; al reanudar simplemente se retoma el cálculo normal, sin acumular el tiempo en pausa. |

## Lo que **no** está en este spec

- Soporte táctil/móvil o controles en pantalla.
- Persistencia real de puntuaciones (Supabase u otra base de datos).
- Cambios al leaderboard mock (`seededScores`) del detalle o del Salón de la Fama.
- Sonido o música.
- Implementación real de cualquier otro juego del catálogo.
- Un registro/mapa general de "juegos implementados" en `GamePlayer.tsx`.
- Una carpeta de seguimiento `references/02-asteroids/`.
