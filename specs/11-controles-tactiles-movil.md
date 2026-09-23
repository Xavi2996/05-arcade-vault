# SPEC 11 — Controles táctiles para jugar en móvil

> **Estado:** APROBADO
> **Depende de:** SPEC 05, SPEC 07, SPEC 08, SPEC 09
> **Fecha:** 2026-09-22
> **Objetivo:** Que los cuatro juegos implementados se puedan jugar de principio a fin con el dedo en un móvil, mediante una barra de controles en pantalla que alimenta un bus de entrada compartido.

## Por qué existe este spec

Los specs 05, 07, 08, 09 y 10 declaran todos, en su sección de decisiones, «sin soporte táctil ni móvil». Este spec **reabre esa decisión a propósito** y la sustituye: a partir de aquí, la plataforma sí soporta táctil.

El layout ya es responsive — el bloque `@media (max-width: 720px)` de `app/globals.css` hace que `.crt` ocupe el ancho completo y derive su alto del `aspect-ratio` del juego. Lo que falta es exclusivamente la **entrada**: los cuatro juegos escuchan solo `keydown`/`keyup` en `window`, y en un móvil no existe ese teclado. Arkanoid además escucha `mousemove` sobre el canvas, evento que un dedo no dispara.

## Scope

**In:**

- Nuevo módulo `lib/input.ts`: bus de entrada virtual con el mismo patrón de store externo que `lib/skins.ts` y `lib/session.ts`. Expone `pressVirtualKey`, `releaseVirtualKey`, `subscribeVirtualInput` y la detección de puntero grueso (`subscribeCoarsePointer` / `getCoarsePointer`) consumible con `useSyncExternalStore`.
- Nuevo componente `components/TouchControls.tsx`: la barra de controles en pantalla, renderizada **bajo** el gabinete `.crt`, nunca superpuesta al canvas. Recibe el layout del juego activo y emite al bus.
- Cada juego exporta su propio mapa de controles (`export const TOUCH_CONTROLS`), igual que hoy exporta `ASPECT`. `GamePlayer.tsx` los agrupa en un registro `GAME_TOUCH_CONTROLS`, paralelo al `GAME_ASPECTS` ya existente.
- Los cuatro componentes de `components/games/` se suscriben al bus dentro de su `useEffect` principal, junto a su listener de teclado, y alimentan **el mismo estado interno** que ya alimenta el teclado (`keys`, `justPressed`, `pendingDirection`, o el `switch` de Tetris). El teclado sigue funcionando exactamente igual.
- Los controles aparecen **solo con puntero grueso** (`matchMedia("(pointer: coarse)")`). En escritorio con ratón no se renderiza nada, sea cual sea el ancho de la ventana.
- Botón de **pantalla completa** en el HUD, visible solo cuando los controles táctiles están activos y `document.fullscreenEnabled` es `true`.
- Endurecimiento táctil: `touch-action: none` en el canvas y en los controles, `user-select: none` y `-webkit-touch-callout: none` en los botones, `overscroll-behavior: contain` en la pantalla de juego.
- Revisión de áreas de toque en `app/globals.css`: `.btn`, `.skin-trigger` y los botones del modal de fin de partida pasan a un mínimo de 44×44 px efectivos; el `input` de iniciales sube a `font-size: 16px` para que iOS Safari no haga zoom automático al enfocarlo.
- Respeto de la zona segura inferior (`env(safe-area-inset-bottom)`) en la barra de controles.
- Reorganización del HUD en móvil para que juego y controles quepan a la vez sin desplazar: arriba solo la fila de botones (SKIN, PANTALLA, PAUSA, SALIR); puntuación, vidas y nivel bajan a una franja de peso mínimo bajo el gabinete; la barra de navegación de la app y el botón FIN se ocultan durante la partida; y el gabinete pasa a tener un alto máximo derivado del hueco que dejan HUD y controles.
- Actualización de `references/implemented-games.md` con los controles táctiles de cada juego.

**Out of scope (para futuros specs):**

- Gestos sobre el canvas (swipe, tap, arrastre). Se descartó en favor de botones explícitos.
- Control analógico de Arkanoid con el dedo (zona deslizable o arrastre sobre el canvas). En táctil la paleta se mueve con botones izquierda/derecha, igual que con el teclado.
- Layout específico para orientación horizontal (controles a los lados). Landscape sigue funcionando pero no se optimiza ni se verifica.
- Overlay de «gira el dispositivo».
- Interruptor manual para forzar u ocultar los controles.
- Vibración háptica (`navigator.vibrate`) al pulsar.
- Soporte táctil para `asfalto` (SPEC 10): su componente todavía no existe.
- Modificar el `meta viewport` global con `user-scalable=no`. Bloquear el pinch-zoom de todo el sitio es un problema de accesibilidad.
- Cambios en `lib/games.ts`, `lib/scores.ts`, `lib/skins.ts` y las migraciones de Supabase: este spec no toca datos persistidos.
- PWA, instalación en pantalla de inicio, modo sin conexión.

## Data model

Este spec **no introduce datos persistidos**. No hay tablas, columnas ni claves de `localStorage` nuevas. Todo el estado nuevo es efímero y vive en memoria.

Las estructuras nuevas son las del bus de entrada y el mapa de controles:

```ts
// lib/input.ts

/** Las únicas teclas virtuales que existen: la intersección de lo que
    escuchan los cuatro juegos. Coinciden con KeyboardEvent.code. */
export type VirtualKey =
  "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Space" | "KeyX";

export interface VirtualInputEvent {
  key: VirtualKey;
  type: "down" | "up";
}

export function pressVirtualKey(key: VirtualKey): void;
export function releaseVirtualKey(key: VirtualKey): void;
export function subscribeVirtualInput(
  listener: (event: VirtualInputEvent) => void,
): () => void;

/** Store externo para useSyncExternalStore. El snapshot del servidor es
    siempre `false`: el servidor no conoce el puntero del cliente. */
export function getCoarsePointer(): boolean;
export function subscribeCoarsePointer(listener: () => void): () => void;
```

```ts
// components/games/<Juego>.tsx — exportado junto a ASPECT

export interface TouchButton {
  key: VirtualKey;
  /** Glifo del botón: "◀", "▶", "▲", "▼", "↻", "⤓". */
  glyph: string;
  /** Etiqueta accesible: "Izquierda", "Rotar", "Disparar". */
  label: string;
  /** true → mantener pulsado reemite `down` (mover pieza, girar la nave).
      false → una pulsación, un evento (soltar pieza, disparar). */
  repeat: boolean;
}

export interface TouchControlsLayout {
  /** Cruz direccional. Las direcciones ausentes se pintan como hueco vacío,
      así la cruz conserva su forma en los juegos de tres direcciones. */
  dpad: TouchButton[];
  /** Botones de acción a la derecha de la cruz. Puede estar vacío. */
  actions: TouchButton[];
}

export const TOUCH_CONTROLS: TouchControlsLayout;
```

Mapa de controles por juego, derivado de lo que cada componente ya escucha hoy:

| Juego         | Cruz direccional         | Acciones                             | Notas                                                                     |
| ------------- | ------------------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| **Snake**     | ▲ ▼ ◀ ▶ (sin repetición) | —                                    | El juego consume una dirección por tick; repetir no aporta nada.          |
| **Tetris**    | ◀ ▼ ▶ (con repetición)   | ↻ rotar (`KeyX`), ⤓ soltar (`Space`) | ▲ no se pinta: en Tetris `ArrowUp` es rotar y ya tiene su botón dedicado. |
| **Asteroids** | ▲ ▼ ◀ ▶ (con repetición) | ● disparar (`Space`)                 | ▲ empuje y ▼ retroceso, ambos continuos; disparar no repite.              |
| **Arkanoid**  | ◀ ▶ (con repetición)     | —                                    | Movimiento por botones, no analógico. Decisión cerrada.                   |

Convenciones de la repetición:

- `repeat: true` → al mantener pulsado, se reemite `down` cada **90 ms** tras una retención inicial de **250 ms**. Imita el auto-repeat del teclado del sistema, que es lo que hoy siente un jugador de escritorio en Tetris.
- Los juegos que leen estado sostenido (Asteroids, Arkanoid) mantienen la tecla en `down` hasta el `up`; la repetición solo afecta a `justPressed`.
- `repeat: false` → exactamente un `down` y un `up` por pulsación.

## Implementation plan

1. Crear `lib/input.ts` con el bus (`pressVirtualKey` / `releaseVirtualKey` / `subscribeVirtualInput`) y la detección de puntero grueso. Prueba manual: desde la consola del navegador, suscribirse y comprobar que las emisiones llegan.
2. Suscribir `components/games/SnakeGame.tsx` al bus dentro de su `useEffect`, escribiendo en el mismo `pendingDirection` que escribe `onKeyDown`, con desuscripción en el `return` de limpieza. Prueba manual: llamar a `pressVirtualKey("ArrowUp")` desde la consola con Snake abierto y ver girar la serpiente.
3. Crear `components/TouchControls.tsx` con la cruz y los botones de acción, usando eventos `pointerdown` / `pointerup` / `pointercancel` con `setPointerCapture`, soporte multitáctil (dos botones a la vez) y la lógica de repetición. Añadir `export const TOUCH_CONTROLS` a `SnakeGame.tsx`.
4. Renderizar `<TouchControls>` en `GamePlayer.tsx` bajo el bloque `.crt`, solo si el juego está en el registro y `getCoarsePointer()` es `true`, con el registro `GAME_TOUCH_CONTROLS` paralelo a `GAME_ASPECTS`. Prueba manual: Snake jugable de principio a fin con el dedo en el emulador de Chrome DevTools.
5. Añadir los estilos de `.touch-controls` en `app/globals.css`: cruz y acciones, botones de 56×56 px mínimo, `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, estado `:active` visible, y `padding-bottom: env(safe-area-inset-bottom)`.
6. Suscribir y exportar `TOUCH_CONTROLS` en `ArkanoidGame.tsx` (◀ ▶ sobre el mismo `keys` que llena su `onKeyDown`). Prueba manual: la paleta se mueve con los botones y la partida se puede completar.
7. Suscribir y exportar `TOUCH_CONTROLS` en `AsteroidsGame.tsx` (▲ ◀ ▶ + disparo, alimentando `keys` y `justPressed`). Prueba manual: girar y disparar simultáneamente funciona con dos dedos.
8. Suscribir y exportar `TOUCH_CONTROLS` en `TetrisGame.tsx` (◀ ▼ ▶ + rotar + soltar, reutilizando el `switch` de `onKeyDown` extraído a una función `handleAction(code)`). Prueba manual: mantener ◀ desplaza la pieza de forma continua; ⤓ hace caída instantánea una sola vez por pulsación.
9. Aplicar el endurecimiento táctil: `touch-action: none` en `.crt-screen canvas`, `overscroll-behavior: contain` en `.av-player`. Prueba manual: arrastrar sobre el canvas y sobre los controles no hace scroll ni pull-to-refresh.
10. Añadir el botón de pantalla completa al HUD: `requestFullscreen()` sobre el elemento `.av-player`, escucha de `fullscreenchange` para alternar la etiqueta, y no renderizarlo si `document.fullscreenEnabled` es `false`.
11. Revisar en `app/globals.css` las áreas de toque de `.btn`, `.skin-trigger` y el modal de fin de partida (mínimo 44×44 px), y subir el `input` de iniciales a `font-size: 16px`.
12. Actualizar `references/implemented-games.md` con la fila de controles táctiles de cada juego.
13. Verificación en móvil real: `npm run dev -- -H 0.0.0.0`, abrir por IP de la red local y jugar los cuatro juegos hasta el modal de fin de partida, guardando la puntuación.
14. Ejecutar `npm run lint` y `npm run build`; ambos sin errores.

## Acceptance criteria

- [ ] En un móvil real, `/juegos/snake/jugar` muestra una cruz direccional bajo el gabinete y la serpiente responde a las cuatro direcciones.
- [ ] En `/juegos/tetris/jugar` los botones táctiles mueven, rotan (↻) y sueltan la pieza (⤓); mantener ◀ o ▶ pulsado desplaza la pieza de forma continua tras la retención inicial.
- [ ] En `/juegos/asteroids/jugar` se puede girar y disparar a la vez con dos dedos, sin que una pulsación cancele la otra.
- [ ] En `/juegos/arkanoid/jugar` los botones ◀ ▶ mueven la paleta y la partida se puede completar sin teclado ni ratón.
- [ ] Soltar el dedo fuera del botón (arrastrándolo) libera la tecla: la nave deja de girar y la pieza deja de moverse.
- [ ] Arrastrar el dedo sobre el canvas o sobre los controles no hace scroll de la página, ni pull-to-refresh, ni selecciona texto.
- [ ] En un escritorio con ratón, los controles táctiles **no** se renderizan en ninguno de los cuatro juegos, ni siquiera con la ventana estrechada por debajo de 720 px.
- [ ] El teclado sigue funcionando exactamente igual en los cuatro juegos: flechas, `Space` y `KeyX` responden como antes de este spec.
- [ ] El botón de pantalla completa pone `.av-player` a pantalla completa y salir con el gesto del sistema devuelve la etiqueta a su estado original.
- [ ] El botón de pantalla completa no aparece cuando `document.fullscreenEnabled` es `false`.
- [ ] Los botones PAUSA, FIN, SALIR y el selector SKIN miden al menos 44×44 px en móvil y se pueden pulsar sin acertar por casualidad.
- [ ] Enfocar el input de iniciales del modal de fin de partida en iOS Safari no hace zoom automático de la página.
- [ ] Desde el modal de fin de partida se puede escribir el nombre y pulsar GUARDAR PUNTUACIÓN con el teclado virtual abierto, sin que el botón quede fuera de la pantalla.
- [ ] La barra de controles no queda tapada por el indicador de inicio del dispositivo (zona segura inferior respetada).
- [ ] Pausar con PAUSA congela el juego y los controles táctiles no lo reanudan por accidente.
- [ ] En un móvil de 375×667 o mayor, el gabinete, el HUD y los controles caben a la vez sin desplazar la página en los cuatro juegos.
- [ ] `references/implemented-games.md` documenta los controles táctiles de los cuatro juegos.
- [ ] `npm run lint` finaliza sin errores.
- [ ] `npm run build` finaliza sin errores.

## Decisions

- **Sí:** se reabre la decisión «sin soporte táctil ni móvil» de los specs 05, 07, 08, 09 y 10. Era una decisión de alcance de cada juego, no un principio de la plataforma, y este spec la sustituye para los cuatro juegos implementados.
- **Sí:** bus de entrada en `lib/input.ts` en vez de sintetizar `KeyboardEvent` sobre `window`. Sintetizar era tentador (cero cambios en los juegos) pero es frágil: Arkanoid lee `e.key` mientras Asteroids, Snake y Tetris leen `e.code`, así que un evento sintético mal formado falla en silencio en un solo juego. El bus es explícito, tipado, y el compilador avisa.
- **No:** prop `touchInput` en `RealGameProps`. Sería coherente con cómo se añadió `skin`, pero metería estado de React en un loop de canvas que hoy lee la entrada desde variables locales del `useEffect`; cada pulsación provocaría un render.
- **Sí:** los controles viven **bajo** el gabinete, fuera de `.crt-screen`. Un overlay aprovecharía más alto, pero el pulgar taparía el área jugable y habría que pelear el `z-index` con la pausa y el modal. Además así ningún efecto del CRT (scanlines, viñeta) contamina los botones.
- **Sí:** cada juego exporta su `TOUCH_CONTROLS`, igual que ya exporta `ASPECT`. El mapa de controles vive junto al código que interpreta esas teclas; un registro centralizado en `GamePlayer` se desincronizaría al primer cambio de mecánica.
- **Sí:** activación por `(pointer: coarse)` y no por ancho de viewport. Detecta la capacidad real: una tablet grande los recibe y una ventana de escritorio estrechada no.
- **Sí:** Arkanoid con botones ◀ ▶ y no con control analógico. Pierde precisión frente al ratón, pero no añade un segundo lenguaje de entrada ni obliga a mapear coordenadas del dedo a coordenadas del canvas. El control analógico táctil queda apuntado para otro spec.
- **Sí:** durante la partida en móvil desaparecen la barra de navegación (96px) y el botón FIN. La nav no aporta nada jugando y SALIR ya devuelve a la ficha del juego; FIN es el más prescindible de los cinco botones — la partida termina jugando — y sin él los cuatro restantes caben en una sola fila, que vale 55px de juego. En escritorio ambos siguen intactos.
- **Sí:** en móvil el botón de pausa alterna PAUSA/SEGUIR y no PAUSA/REANUDAR, con ancho mínimo fijo. "REANUDAR" desbordaba la fila y la partía en dos al pausar. En escritorio sigue diciendo REANUDAR.
- **Sí:** las etiquetas de skin pierden la tilde (CLASICO, NEON). La fuente pixel no tiene mayúsculas acentuadas, así que el navegador las sustituía por otra fuente y el menú se veía descuadrado.
- **Sí:** el estado de la partida (puntuación, vidas, nivel) vive bajo el gabinete y no sobre él. Es donde cae la mirada mientras se juega, y despeja la franja superior para las acciones.
- **Sí:** los controles se anclan al fondo del viewport y el gabinete se centra en el hueco sobrante. El pulgar espera los botones abajo, y los `auto` reparten el aire en vez de dejar un vacío que parezca un fallo de maquetación.
- **Sí:** el gabinete se acota en móvil. Su alto deriva del ancho, así que se acota el ancho: el hueco vertical libre convertido a ancho por la proporción del juego (`--screen-aspect-num`), descontando las filas de botones que ese juego realmente usa (`--touch-rows`: una en Arkanoid, dos en Tetris, tres en Snake y Asteroids). Sin esto el Tetris de un móvil medía 493px de alto y empujaba la cruz fuera de la pantalla. Por debajo de un suelo de 160px se prefiere el desplazamiento a un gabinete ilegible.
- **Sí:** las filas vacías de la cruz colapsan en vez de reservar su hueco. El spec original las pintaba como hueco vacío; conservan su forma igual porque las columnas siguen siendo fijas, y se recuperan 64px de alto en Tetris y 128px en Arkanoid.
- **Sí:** vertical es el modo soportado y verificado. Horizontal sigue funcionando — el CSS actual no lo rompe — pero no se optimiza ni entra en los criterios de aceptación.
- **Sí:** repetición de 250 ms iniciales y 90 ms de intervalo. Es el rango en el que se mueve el auto-repeat del teclado del sistema, que es la sensación que ya tiene el jugador de escritorio en Tetris.
- **Sí:** botón de pantalla completa sobre `.av-player`. Oculta la barra del navegador, que en móvil se come una franja considerable del viewport. Se degrada limpiamente donde la API no existe (Safari en iPhone no soporta `Element.requestFullscreen`).
- **No:** `user-scalable=no` en el `meta viewport`. Bloquearía el pinch-zoom de todo el sitio, no solo de la pantalla de juego, y eso es una barrera de accesibilidad real. El doble-tap se controla con CSS local a los controles.
- **No:** gestos (swipe / tap / arrastre). No son descubribles, el swipe añade latencia de reconocimiento, y en Tetris hay cinco acciones distintas que no caben en un vocabulario de gestos sin ambigüedad.
- **No:** interruptor manual para mostrar u ocultar los controles. Añadiría estado, UI y persistencia para un caso que la detección de puntero ya resuelve.
- **No:** vibración háptica. Mejora el tacto pero es una capa aparte, con su propio soporte desigual entre navegadores.
- **No:** no se toca `asfalto` (SPEC 10). Su componente no existe todavía; cuando se implemente, exportará su `TOUCH_CONTROLS` como parte de su propio spec.

## Risks

| Riesgo                                                                                                                                                     | Mitigación                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Con la barra de controles añadida, el gabinete y el HUD pueden no caber en el viewport de un móvil pequeño y obligar a hacer scroll durante la partida.    | El bloque `@media (max-width: 720px)` ya libera el alto fijo (`height: auto`). El paso 13 verifica en dispositivo real que el canvas y los controles son visibles a la vez; si no cabe, se reduce el `padding` del HUD. |
| `useSyncExternalStore` con puntero grueso renderiza `false` en el servidor y `true` tras hidratar, provocando un salto visible del layout al cargar.       | Mismo patrón y misma consecuencia que el selector de skin, que ya es aceptable en producción. Los controles se renderizan bajo el CRT, así que su aparición no desplaza el área jugable.                                |
| Una pulsación que empieza en un botón y termina fuera podría dejar la tecla enganchada en `down`, con la nave girando sin parar.                           | `setPointerCapture` en `pointerdown` garantiza que el `pointerup` llegue al mismo botón, y `pointercancel` también libera. Hay un criterio de aceptación dedicado.                                                      |
| Extraer el `switch` de `onKeyDown` de Tetris a una función compartida podría alterar el comportamiento del teclado (guardas de pausa y de fin de partida). | La guarda `if (pausedRef.current \|\| gameOverState) return;` se mantiene **antes** de la llamada a `handleAction`, en ambos caminos. El criterio de aceptación exige que el teclado siga idéntico.                     |
| `touch-action: none` sobre el canvas podría impedir cualquier scroll en la página de juego en dispositivos donde el gabinete ocupa casi todo el viewport.  | Se aplica solo al canvas y a los controles, no a `.av-player` ni al documento. El resto de la página sigue siendo desplazable con el dedo.                                                                              |
| Tocar los cuatro componentes de juego puede romper alguno de los otros tres.                                                                               | Cada juego se suscribe en su propio paso (2, 6, 7, 8) y el plan intercala prueba manual. El paso 13 exige jugar los cuatro hasta el modal de fin de partida.                                                            |

## Lo que **no** está en este spec

- Gestos sobre el canvas (swipe, tap, arrastre).
- Control analógico táctil de la paleta de Arkanoid.
- Layout optimizado para orientación horizontal ni aviso de rotar el dispositivo.
- Interruptor manual para mostrar u ocultar los controles.
- Vibración háptica.
- Soporte táctil del juego `asfalto` (SPEC 10).
- `user-scalable=no` en el `meta viewport` global.
- PWA, instalación en pantalla de inicio y modo sin conexión.
- Cambios en el esquema de Supabase o en cualquier dato persistido.
