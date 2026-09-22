# Skins de los juegos

Registro de qué juego tiene sus skins diseñadas y con qué paleta exacta.

Lo mantiene el agente `@agent-skin-designer`, **un juego por invocación** y solo el juego que se le
nombre. Es diseño y verificación de contraste, no implementación: cuando una ficha está completa,
el siguiente paso es `/spec` → `/spec-impl`.

Toda skin se juzga sobre **fondo oscuro** — la app no tiene modo claro.

Las tres skins de todo juego:

| Skin      | Qué es                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `clasico` | El default: la paleta que el juego ya tiene en el código, transcrita y medida.                                               |
| `neon`    | Alta saturación anclada al color de catálogo del juego y a los tokens de `app/globals.css`. El glow va en CSS, no en canvas. |
| `retro`   | Fósforo CRT monocromo, máximo 4 tonos de una familia, sin glow ni gradientes.                                                |

Contrastes mínimos sobre el fondo del canvas: **≥ 3:1** elemento jugable, **≥ 4.5:1** texto,
**≥ 1.5:1** decorado. Y **≥ 1.5:1** entre dos elementos que el jugador deba distinguir entre sí.

## Estado

| Juego     | id          | Color catálogo | Skins                        | Estado              |
| --------- | ----------- | -------------- | ---------------------------- | ------------------- |
| ARKANOID  | `arkanoid`  | cyan           | —                            | sin diseñar         |
| ASTEROIDS | `asteroids` | yellow         | —                            | sin diseñar         |
| SNAKE     | `snake`     | green          | —                            | sin diseñar         |
| TETRIS    | `tetris`    | magenta        | `clasico` · `neon` · `retro` | diseñado 2026-09-22 |

Solo entran aquí los juegos jugables (`playable = true`, presentes en `REAL_GAMES` de
`components/GamePlayer.tsx`). Ver `references/implemented-games.md`.

## Fichas

<!-- Una sección `### TÍTULO (id)` por juego, añadida por skin-designer.
     Formato: Render + Fondo + fecha, una subsección por skin con su tabla
     Rol / Hex / Contraste, y cierre con Diferenciación, Integración y Riesgos. -->

### TETRIS (`tetris`)

**Render:** array `COLORS` a nivel de módulo en `components/games/TetrisGame.tsx:12-22` (índices 1-8) ·
**Fondo:** `#000` (`draw()` pinta `context.fillStyle = "#000"` en `TetrisGame.tsx:315`; el canvas de
vista previa usa `background: "#000"` inline en `TetrisGame.tsx:513`, y `.crt-screen` también es `#000`)
**Diseñado:** 2026-09-22

**Nota de inventario:** este Tetris tiene **8 piezas**, no 7 — las siete clásicas más `N`, una "tuerca"
de 3x3 con el centro hueco (`PIECES[8]`, `TetrisGame.tsx:61-65`). Toda skin debe rellenar 8 índices.

**Nota de texto:** dentro del canvas **no se dibuja ningún texto** (no hay un solo `fillText` en el
componente). El único texto del juego es la etiqueta `SIGUIENTE`, que es DOM y usa `var(--ink-faint)`
(`TetrisGame.tsx:493-503`). Se mide igual, porque cae sobre el mismo `#000` de `.crt-screen`.

#### clasico (default)

Transcripción literal del array `COLORS` actual. No se retoca nada: lo que no pasa el umbral se
documenta como deuda visual.

| Rol                    | Hex                       | Contraste               |
| ---------------------- | ------------------------- | ----------------------- |
| Pieza I (barra)        | `#4dd0e1`                 | 11.43:1 ✅              |
| Pieza O (cuadrado)     | `#ffd54f`                 | 14.88:1 ✅              |
| Pieza T                | `#ba68c8`                 | 5.90:1 ✅               |
| Pieza S                | `#81c784`                 | 10.44:1 ✅              |
| Pieza Z                | `#e57373`                 | 7.03:1 ✅               |
| Pieza J                | `#90caf9`                 | 12.00:1 ✅              |
| Pieza L                | `#ffb74d`                 | 12.13:1 ✅              |
| Pieza N (tuerca)       | `#9e9e9e`                 | 7.84:1 ✅               |
| Fantasma (pieza a 0.2) | `#0f2a2d` … `#33250f`     | 1.22–1.49:1 ⚠️ deuda    |
| Grid del tablero       | `rgba(255,255,255,0.08)`  | `#141414` · 1.14:1 ⚠️   |
| Brillo superior 4px    | `rgba(255,255,255,0.12)`  | 1.04–1.18:1 · decorado  |
| Etiqueta `SIGUIENTE`   | `#4a4f70` (`--ink-faint`) | 2.64:1 ⚠️ deuda (texto) |

**Deuda visual de `clasico` (medida, no estimada):**

- El **fantasma** nunca llega a 1.5:1 contra el fondo (el mejor caso, la pieza O, se queda en 1.49:1;
  el peor, la T, en 1.22:1). Con `globalAlpha 0.2` la ayuda de posicionamiento es casi invisible.
- El **grid** está en 1.14:1: por debajo del mínimo de decorado, prácticamente no se ve.
- La etiqueta `SIGUIENTE` está en 2.64:1, muy por debajo del 4.5:1 de texto.
- Pares de piezas que **no se distinguen por luminancia** y además comparten familia de matiz:
  I/J `1.05:1` (cyan claro vs azul claro, Δmatiz ~18°), S/I `1.09:1`, N/Z `1.11:1`, T/Z `1.19:1`,
  L/O `1.23:1` (ámbar vs amarillo, Δmatiz ~9°). El par I/J y el par L/O son los dos casos reales de
  confusión del default.

#### neon

Ancla de catálogo: **magenta** (`--magenta #ff006e`), que aquí tiñe el **entorno** (grid, glow del
marco, etiqueta) en vez de una pieza — así las 8 piezas conservan la semántica de color del Tetris
moderno y el magenta sigue identificando la categoría PUZZLE. Tokens de `:root` usados directamente:
`--cyan`, `--yellow`, `--silver`, `--magenta`.

| Rol                     | Hex                      | Contraste             |
| ----------------------- | ------------------------ | --------------------- |
| Pieza I (barra)         | `#00f5ff` (`--cyan`)     | 15.50:1 ✅            |
| Pieza O (cuadrado)      | `#f5ff00` (`--yellow`)   | 19.19:1 ✅            |
| Pieza T                 | `#b026ff`                | 4.57:1 ✅             |
| Pieza S                 | `#14cc70`                | 9.90:1 ✅             |
| Pieza Z                 | `#ff5c5c`                | 6.94:1 ✅             |
| Pieza J                 | `#7aa5ff`                | 8.65:1 ✅             |
| Pieza L                 | `#ffb300`                | 11.70:1 ✅            |
| Pieza N (tuerca)        | `#c7d0e0` (`--silver`)   | 13.53:1 ✅            |
| Fantasma (pieza a 0.40) | `#460f66` … `#626600`    | 1.52–3.42:1 ✅        |
| Grid del tablero        | `rgba(255,0,110,0.45)`   | `#730032` · 1.78:1 ✅ |
| Brillo superior 4px     | `rgba(255,255,255,0.18)` | 1.25:1 · decorado     |
| Etiqueta `SIGUIENTE`    | `#ff4fa3`                | 6.90:1 ✅             |

**Ajustes que impone la medición** (no son opcionales, sin ellos la skin no pasa):

- El **`globalAlpha` del fantasma sube de `0.2` a `0.40`**. A 0.35 la pieza T se quedaba en 1.45:1;
  a 0.40 el peor caso (T) da exactamente 1.52:1 ✅.
- El **grid deja de ser blanco** y pasa a magenta `rgba(255,0,110,0.45)` → 1.78:1, que es lo que lo
  saca del 1.14:1 del default.
- El `#ff006e` puro **no se usa como color de pieza**: da 5.48:1 contra el fondo (pasa), pero choca
  con la Z (`1.17:1` contra `#ff4d4d`) — por eso vive en el grid y en el glow CSS, no en el tablero.
- **Glow en CSS, nunca en canvas:** `box-shadow` sobre `.crt-screen` / `text-shadow` en el HUD. No
  tocar `shadowBlur` ni `shadowColor` — el componente hoy no los usa y no debe empezar a usarlos.

#### retro

Fósforo ámbar de gabinete, **4 tonos exactos** de la misma familia, sin glow, sin gradientes. Escala
calibrada para que **cada escalón supere 1.5:1** y el tono más oscuro siga pasando el 3:1 de elemento
jugable.

| Rol                          | Hex                        | Contraste              |
| ---------------------------- | -------------------------- | ---------------------- |
| Ámbar 1 — claro              | `#ffe0a3`                  | 16.44:1 ✅             |
| Ámbar 2 — base               | `#f0a300`                  | 9.94:1 ✅              |
| Ámbar 3 — medio              | `#c47d00`                  | 6.28:1 ✅              |
| Ámbar 4 — oscuro             | `#8f5a00`                  | 3.63:1 ✅              |
| Fantasma (tono fijo, a 0.30) | `#4d3500` (`#ffb000`@0.30) | 1.82:1 ✅              |
| Grid del tablero             | `rgba(255,176,0,0.28)`     | `#473100` · 1.71:1 ✅  |
| Brillo superior 4px          | `rgba(255,224,163,0.22)`   | 1.33–1.47:1 · decorado |
| Etiqueta `SIGUIENTE`         | `#ffb000`                  | 11.46:1 ✅             |

Escalones medidos: `#ffe0a3`/`#f0a300` **1.65:1**, `#f0a300`/`#c47d00` **1.58:1**,
`#c47d00`/`#8f5a00` **1.73:1**. Extremos: `#ffe0a3`/`#8f5a00` 4.53:1.

**Reparto de las 8 piezas en 4 tonos** — cuatro tonos no son ocho piezas, así que la mitad se
diferencia por **relleno**, no por color:

| Pieza | Tono      | Relleno                            |
| ----- | --------- | ---------------------------------- |
| I     | `#ffe0a3` | sólido                             |
| O     | `#f0a300` | sólido                             |
| T     | `#c47d00` | sólido                             |
| N     | `#8f5a00` | sólido (silueta única: anillo 3x3) |
| S     | `#ffe0a3` | hueco (borde 4px, interior `#000`) |
| Z     | `#c47d00` | hueco                              |
| J     | `#f0a300` | hueco                              |
| L     | `#8f5a00` | hueco                              |

El emparejamiento está elegido para que los dos pares espejo —los que más se confunden— queden
separados **por tono y no solo por relleno**: S `#ffe0a3` vs Z `#c47d00` = 2.62:1; J `#f0a300` vs
L `#8f5a00` = 2.74:1. Cada tono repetido enfrenta siluetas muy distintas (I barra vs S zigzag,
O cuadrado vs J, T vs Z, N anillo vs L).

**Ajuste que impone la medición:** el fantasma retro **no toma el tono de su pieza**. Con `#8f5a00`
al 0.30 caería a 1.1:1 contra el fondo; en su lugar se dibuja siempre con `#4d3500` fijo (1.82:1 ✅).
Contra ese fantasma, la pieza más oscura mantiene 1.99:1 ✅ y la más clara 9.01:1. Además, monocromar
el fantasma es lo correcto para un CRT de un solo fósforo.

**Diferenciación**

- **Aritmética previa, para no fingir:** con 8 piezas es **imposible** separarlas todas por luminancia.
  Exigir ≥ 3:1 contra `#000` deja el rango útil entre 3:1 y 21:1, es decir un factor 7 total; a 1.5x
  por escalón solo caben ~5 niveles (`1.5^4 = 5.06`, `1.5^5 = 7.59` ya se sale). Por eso en `clasico`
  y `neon` la diferenciación primaria es el **matiz**, y el umbral de 1.5:1 se exige únicamente a
  (a) los pares que comparten familia de matiz (Δ ≲ 45°) y (b) pieza vs fantasma.
- **`neon` — pares vecinos en matiz, todos medidos y aprobados:** I/S 1.57 · I/J 1.79 · J/T 1.89 ·
  T/Z 1.52 · Z/L 1.69 · L/O 1.64 · O/S 1.94. ✅
- **`neon` — excepciones declaradas:** N/I 1.15:1 y N/L 1.16:1. Se aceptan porque `N` es el único
  color **acromático** de la paleta (`#c7d0e0`) y además la única pieza con silueta 3x3 en anillo:
  no hay confusión posible ni por saturación ni por forma.
- **`neon` — pieza vs fantasma:** 3.00:1 (T, el peor) a 5.61:1 (O). ✅
- **`retro` — pieza vs fantasma:** 1.99:1 (L/N, el peor) a 9.01:1 (I/S). ✅
- **Pieza activa vs bloque asentado:** comparten color en las tres skins y se distinguen por
  movimiento, igual que hoy. Ninguna skin cambia esto.

**Identidad**

Las tres skins cambian **solo color y relleno**. Nada de tamaño de bloque (`BLOCK = 30`), número de
piezas (8), geometría de `PIECES`, `dropInterval`, wall kicks ni layout tablero + preview. El relleno
hueco de `retro` ocupa exactamente la misma celda de 28x28 px que el sólido: cambia el pintado, no la
silueta ni la hitbox.

**Render y prerrequisitos**

Arquitectura favorable: la paleta ya es una **constante de módulo** (`COLORS`, `TetrisGame.tsx:12-22`),
así que `clasico` y `neon` son literalmente otro array. Pero hay cuatro valores **fuera** de esa
constante que toda skin necesita, y que hay que extraer antes:

1. `context.fillStyle = "#000"` del fondo (`TetrisGame.tsx:315`) y el `background: "#000"` inline del
   canvas de preview (`TetrisGame.tsx:513`).
2. `rgba(255,255,255,0.08)` del grid, hardcodeado en `drawGrid()` (`TetrisGame.tsx:286`).
3. `rgba(255,255,255,0.12)` del brillo superior, hardcodeado en `drawBlock()` (`TetrisGame.tsx:279`).
4. El `0.2` del fantasma, pasado como literal en la llamada a `drawBlock()` (`TetrisGame.tsx:333`) —
   `neon` lo necesita en `0.40` y `retro` en `0.30` con color fijo.

Además, `retro` exige que `drawBlock()` acepte un **modo de relleno** (`solid` | `hollow`), que hoy no
existe: solo hace `fillRect`. Es el único cambio estructural de render de toda la ficha.
Sin spritesheets: Tetris pinta 100% con `fillRect`, no hay PNG que retintar.

**Integración**

- Prop opcional `skin?: "clasico" | "neon" | "retro"` en `RealGameProps` (`components/GamePlayer.tsx:24-30`),
  que hoy **no existe** — ninguna prop de presentación está en el contrato.
- `data-skin` en el `<div className="crt">` (`components/GamePlayer.tsx:125`), para retematizar HUD,
  marco CRT, scanlines y overlay solo con CSS (ahí es donde vive el glow de `neon` y donde `retro`
  lo apaga).
- Selector visible en el HUD, junto a los botones de Pausa / Reiniciar.
- Persistencia en `localStorage["av-skin-tetris"]`, con `clasico` como fallback si no hay valor o si
  el valor guardado no es una de las tres skins.

**Riesgos**

- **`retro` colapsa 8 piezas en 4 tonos** → cuatro sólidas (I/O/T/N) y cuatro huecas (S/Z/J/L). Depende
  por completo de que `drawBlock()` soporte relleno hueco; si eso no se implementa, la skin tiene
  cuatro colisiones de color exactas y es injugable.
- **El fantasma de `clasico` está roto hoy** (1.22–1.49:1). La ficha lo deja tal cual a propósito:
  `clasico` es la línea base, no un rediseño. Si se quiere arreglar, es un cambio de gameplay-feel
  separado, no parte de esta ficha.
- **`clasico` confunde I/J (1.05:1) y L/O (1.23:1)**. Es la deuda más visible del default, y es la
  comparación que va a hacer el usuario al probar `neon` por primera vez.
- El **brillo superior de 4px** rompe la monocromía estricta de `retro` si se deja en blanco: hay que
  cambiarlo a ámbar claro `rgba(255,224,163,0.22)` o apagarlo.
- El canvas de **vista previa** (`drawNext()`) comparte `COLORS` y `drawBlock()`: hereda la skin
  gratis, pero su fondo `#000` está en un `style` inline de JSX, no en CSS — no se retematiza con
  `data-skin` solo.
