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

| Juego     | id          | Color catálogo | Skins                        | Estado                  |
| --------- | ----------- | -------------- | ---------------------------- | ----------------------- |
| ARKANOID  | `arkanoid`  | cyan           | `clasico` · `neon` · `retro` | implementado 2026-09-22 |
| ASTEROIDS | `asteroids` | yellow         | `clasico` · `neon` · `retro` | implementado 2026-09-22 |
| SNAKE     | `snake`     | green          | `clasico` · `neon` · `retro` | implementado 2026-09-22 |
| TETRIS    | `tetris`    | magenta        | `clasico` · `neon` · `retro` | implementado 2026-09-22 |

Solo entran aquí los juegos jugables (`playable = true`, presentes en `REAL_GAMES` de
`components/GamePlayer.tsx`). Ver `references/implemented-games.md`.

> **Las cuatro fichas están implementadas.** Cada juego tiene su paleta en
> `components/games/skins/<id>.ts`, acepta la prop `skin` y está listado en `GAMES_WITH_SKINS`
> (`components/GamePlayer.tsx`). Los apartados **Integración** y **Render y prerrequisitos** de cada
> ficha describen el estado del código **en el momento de diseñarla**, así que hablan en futuro de
> cosas que ya están hechas: léelos como la justificación del diseño, no como trabajo pendiente.

## Fichas

<!-- Una sección `### TÍTULO (id)` por juego, añadida por skin-designer.
     Formato: Render + Fondo + fecha, una subsección por skin con su tabla
     Rol / Hex / Contraste, y cierre con Diferenciación, Integración y Riesgos. -->

### SNAKE (`snake`)

**Render:** hex sueltos, sin constante de paleta — fondo en `SnakeGame.tsx:235`, grid en `:238`,
**ternario inline** cabeza/cuerpo en `:269`, borde y glow en el `style` del `<canvas>` (`:343-344`) ·
**Fondo:** `#04120a` (verde-negro, **no** `#000`; `draw()` lo pinta en `SnakeGame.tsx:235-236`)
**Diseñado:** 2026-09-22

**Nota de spritesheet (la restricción que manda en esta ficha):** la fruta **no es color de código**.
Se dibuja con `drawImage` desde `/games/snake/fruits.png` (3790x442, 22 recortes en
`components/games/snake-sprites.ts`). Ninguna skin puede "elegir" el hex de la fruta sin retintar el
PNG. Los hex de fruta que aparecen abajo en `clasico` son el **promedio real de píxeles opacos** de
cada recorte, extraídos del PNG; los de `neon` y `retro` solo son alcanzables retintando.

**Nota de texto:** el componente **no dibuja ni un `fillText`** — no hay texto dentro del canvas.
Tampoco usa `shadowBlur` ni `shadowColor`: el único glow ya vive en CSS (`boxShadow` inline del
canvas), que es exactamente donde la plataforma lo quiere. No lo muevas al canvas en ninguna skin.

**Nota de inventario:** solo hay **tres roles jugables** — cabeza, cuerpo y fruta. Con tan pocos
elementos **no aplica** la excepción aritmética de Tetris: aquí sí caben tres escalones de 1.5:1 en el
rango útil, así que las tres skins se exigen el umbral entre pares **sin excepciones**.

#### clasico (default)

Transcripción literal de los hex del componente. No se retoca nada; lo que no pasa se documenta.

| Rol                    | Hex                    | Contraste                 |
| ---------------------- | ---------------------- | ------------------------- |
| Fondo del canvas       | `#04120a`              | base                      |
| Cabeza de la serpiente | `#7dffb0`              | 15.33:1 ✅                |
| Cuerpo de la serpiente | `#22c55e`              | 8.41:1 ✅                 |
| Fruta (22 sprites PNG) | `#8c259e` … `#cbd2c4`  | 2.62–12.37:1 ⚠️ ver abajo |
| Rejilla 20x20          | `rgba(0,255,140,0.06)` | `#042012` · 1.11:1 ⚠️     |
| Borde 1px del canvas   | `rgba(0,255,140,0.35)` | `#07603b` · 2.58:1 ✅     |
| Glow del marco (CSS)   | `rgba(0,255,140,0.15)` | `#092f22` · 1.36:1 ⚠️     |

**Deuda visual de `clasico` (medida sobre los píxeles del PNG, no estimada):**

- **Dos frutas de 22 no llegan al 3:1 de elemento jugable:** `garlic` `#8c259e` **2.62:1** y `cherry`
  `#8c3c9a` **2.95:1** (ambas moradas). `carrot` `#b7390b` pasa raspando con 3.29:1. Cuando toca una
  de esas tres, el objetivo del juego es el elemento menos visible de la pantalla.
- **La rejilla está en 1.11:1**, por debajo del mínimo de decorado: prácticamente no se ve, y en un
  juego de grilla la rejilla es ayuda de lectura, no adorno.
- **El glow del marco está en 1.36:1**, también por debajo de 1.5:1.
- **Conflicto real fruta/cuerpo:** `peach` `#3cb422` contra el cuerpo `#22c55e` = **1.19:1**, y es
  verde contra verde (mismo matiz) — la fruta se camufla dentro de la serpiente. Es el único par
  fruta/cuerpo que falla **por luminancia y por matiz a la vez**.
- Otros pares fruta/cuerpo por debajo de 1.5:1 (`watermelon` 1.07, `apple` 1.12, `tomato` 1.13,
  `eggplant` 1.16, `broccoli` 1.16, `orange` 1.19, `berries` 1.25, `peanut` 1.46, `strawberry` 1.47,
  `grape` 1.48, `melon` 1.49) **se aceptan**: todos son naranja/rojo/azul contra verde, con Δmatiz muy
  superior a 45°. La separación la hace el matiz, no la luminancia.
- Cabeza vs cuerpo: **1.82:1** ✅ — lo único que el default resuelve bien de serie.

#### neon

Ancla de catálogo: **green** (`--green #00ff88`), que aquí sí va **en la serpiente** — es un juego de
un solo color y esconder el verde en el decorado no tendría sentido. La fruta se lleva al magenta para
que el objetivo nunca comparta familia de matiz con la serpiente. Fondo más profundo que el default.

| Rol                    | Hex                    | Contraste               |
| ---------------------- | ---------------------- | ----------------------- |
| Fondo del canvas       | `#020d08`              | base                    |
| Cabeza de la serpiente | `#00ff88` (`--green`)  | 14.72:1 ✅              |
| Cuerpo de la serpiente | `#00874a`              | 4.29:1 ✅               |
| Fruta (tinte del PNG)  | `#ff5cb8`              | 7.03:1 ✅               |
| Rejilla 20x20          | `rgba(0,255,136,0.20)` | `#023d22` · 1.59:1 ✅   |
| Borde 1px del canvas   | `rgba(0,255,136,0.60)` | `#049d58` · 5.61:1 ✅   |
| Glow del marco (CSS)   | `rgba(0,255,136,0.30)` | `#075433` · 2.19:1 ✅   |
| Acento HUD / `.crt`    | `#00ff88`              | 14.73:1 ✅ sobre `--bg` |

**Ajustes que impone la medición** (sin ellos la skin no pasa):

- **El cuerpo baja a `#00874a` (4.29:1), no se queda en un verde brillante.** Con el cuerpo en
  `#00a862` (6.37:1) la fruta magenta caía a **1.12:1** contra él. Los tres roles tienen que escalonarse
  14.72 → 7.03 → 4.29, que es lo que da fruta/cuerpo **1.64:1** y cabeza/cuerpo **3.43:1**.
- **La fruta no puede ser `--magenta #ff006e` puro:** a 5.15:1 contra el fondo se queda en 1.24:1
  contra el cuerpo. `#ff5cb8` es el mismo matiz subido en luminancia hasta pasar el umbral.
- **La rejilla necesita `0.20` de alpha, no menos:** a `0.16` da 1.42:1 ❌; a `0.20` da 1.59:1 ✅.
- **Glow solo en CSS.** El `boxShadow` del canvas sube de `0.15` a `0.30`; `shadowBlur`/`shadowColor`
  de canvas siguen prohibidos (hoy no se usan y no deben empezar a usarse).

#### retro

Fósforo verde **P1**, la familia que el propio juego ya sugiere. **4 tonos exactos**, sin glow, sin
gradientes, sin alpha: el `boxShadow` del canvas se apaga por completo y la rejilla pasa a color sólido.

| Rol                             | Hex       | Contraste  |
| ------------------------------- | --------- | ---------- |
| Fondo del canvas                | `#020a02` | base       |
| P1-1 — Fruta (tinte plano)      | `#33ff33` | 14.80:1 ✅ |
| P1-2 — Cabeza de la serpiente   | `#00cc00` | 9.21:1 ✅  |
| P1-3 — Cuerpo de la serpiente   | `#149614` | 5.16:1 ✅  |
| P1-4 — Rejilla y borde (sólido) | `#0b5c0b` | 2.44:1 ✅  |
| Glow del marco                  | ninguno   | apagado    |

Escalones medidos, todos por encima de 1.5:1: P1-1/P1-2 **1.61:1**, P1-2/P1-3 **1.78:1**,
P1-3/P1-4 **2.12:1**. Extremo fruta/cuerpo: **2.87:1**.

**Decisión de reparto:** la fruta se lleva el tono **más brillante**, no la cabeza. Es una sola celda
entre 400 y es el objetivo del juego; la cabeza se identifica además por ir al frente de una masa en
movimiento, así que puede permitirse el segundo escalón. Es también el comportamiento clásico de un
CRT monocromo, donde el objetivo destella.

**Ajuste que impone la medición:** la rejilla **deja de ser un `rgba`**. `rgba(51,255,51,0.18)` sobre
`#020a02` da 1.48:1 ❌ (falla el mínimo de decorado por dos centésimas). Pasa a `#0b5c0b` sólido
(2.44:1 ✅), que además es lo correcto para un fósforo sin capas de alpha. El borde del canvas
comparte ese mismo P1-4 (2.40:1 sobre `--bg`).

**Diferenciación**

- **Los tres pares jugables, sin excepciones, en las tres skins:**

  | Par           | `clasico`      | `neon`    | `retro`   |
  | ------------- | -------------- | --------- | --------- |
  | Cabeza/Cuerpo | 1.82:1 ✅      | 3.43:1 ✅ | 1.78:1 ✅ |
  | Cabeza/Fruta  | 1.24–2.72:1 ⚠️ | 2.09:1 ✅ | 1.61:1 ✅ |
  | Fruta/Cuerpo  | 1.07–8.41:1 ⚠️ | 1.64:1 ✅ | 2.87:1 ✅ |

- **`clasico` falla los dos pares que involucran fruta** porque la fruta es un PNG de 22 dibujos
  ajenos a la paleta: `strawberry` 1.24:1 y `peanut` 1.25:1 contra la cabeza, `peach` 1.19:1 contra el
  cuerpo. `neon` y `retro` lo arreglan **retintando**, que es la única vía posible.
- **Serpiente vs rejilla:** en las tres skins el peor caso es cuerpo vs rejilla — `clasico` 7.55:1,
  `neon` 2.70:1, `retro` 2.12:1. Nunca se confunden.
- Aquí **no hay fantasma, ni preview, ni bloque asentado**: el juego tiene tres roles y punto.

**Identidad**

Las tres skins cambian **solo color**. Nada de `COLS`/`ROWS` (20x20), `CELL` (24 px), el `-2` de
inset de cada celda, `START_STEP_MS`, `MIN_STEP_MS`, `FRUITS_PER_LEVEL` ni el recorte de sprite. El
retinte de la fruta se aplica sobre el mismo `drawImage` de 22x22 px: cambia el color de los píxeles
opacos, no la silueta ni la celda que ocupa.

**Render y prerrequisitos**

Arquitectura **desfavorable**: Snake no tiene ninguna constante de paleta. Antes de que ninguna skin
sea implementable hay que extraer, en este orden:

1. El **ternario inline** `i === 0 ? "#7dffb0" : "#22c55e"` del bucle de dibujo (`SnakeGame.tsx:269`)
   — es el caso de "hex suelto en el bucle" del manual.
2. `context.fillStyle = "#04120a"` del fondo (`SnakeGame.tsx:235`).
3. `context.strokeStyle = "rgba(0, 255, 140, 0.06)"` de la rejilla (`SnakeGame.tsx:238`).
4. El `border` y el `boxShadow` del `style` inline del `<canvas>` (`SnakeGame.tsx:343-344`). `retro`
   necesita apagar el `boxShadow` entero, cosa que un `style` inline fijo no permite.

Además, y es el punto caro de esta ficha: **`neon` y `retro` exigen retintar el spritesheet**. El
color de la fruta no está en el código, así que la skin solo puede alcanzarlo por una de estas dos
vías (ninguna implementada hoy):

- **Tinte por composición**, la recomendada: dibujar el recorte en un canvas offscreen de 22x22,
  aplicar `globalCompositeOperation = "source-atop"` y un `fillRect` del hex de la skin, y cachear el
  resultado por (sprite, skin). Preserva la silueta exacta y da un color plano medible — que es
  justo lo que `retro` quiere (fósforo monocromo) y lo que `neon` acepta.
- **PNG alterno** por skin. Descartado: son 22 sprites x 2 skins de arte nuevo.

El tinte plano **aplana el dibujo interior de la fruta** (se pierde el detalle del sprite y queda una
silueta sólida). Es intencional en `retro`; en `neon` es el precio de garantizar el 7.03:1. Si se
quiere conservar detalle en `neon`, la alternativa es tinte parcial (`globalAlpha` < 1), pero entonces
**el hex resultante depende de cada sprite y hay que volver a medir las 22 frutas** — no está medido
en esta ficha y no debe implementarse sin medirlo.

`clasico` no necesita retinte: se dibuja el PNG tal cual, como hoy.

**Integración**

Ojo: la infraestructura de skins **ya existe en el código** (se implementó después de la ficha de
Tetris). Snake no la inventa, la adopta:

- `lib/skins.ts` ya expone `SkinId`, `DEFAULT_SKIN`, `SkinPalettes<T>`, `resolvePalette`, `getSkin` /
  `setSkin` y la clave `av-skin-<gameId>` — **`localStorage["av-skin-snake"]` con fallback `clasico`
  sale gratis**, no hay que escribir persistencia.
- `RealGameProps` (`components/GamePlayer.tsx:42-51`) **ya tiene** `skin?: SkinId` y GamePlayer ya se
  la pasa a todos los juegos. `SnakeGame` hoy **no declara esa prop** (`SnakeGame.tsx:51-57`): hay que
  añadirla y leerla, igual que hace `TetrisGame.tsx:76,96`.
- El selector del HUD y el `data-skin` en `.av-player` y en `.crt`
  (`GamePlayer.tsx:190,283`) ya están hechos. El interruptor real es
  **`GAMES_WITH_SKINS` (`GamePlayer.tsx:83`), hoy `new Set(["tetris"])`**: hay que añadir `"snake"`, o
  el selector no aparece.
- Falta crear `components/games/skins/snake.ts` con `SNAKE_SKINS: SkinPalettes<SnakePalette>`,
  siguiendo `components/games/skins/tetris.ts`. Forma mínima de `SnakePalette`: `background`, `grid`,
  `head`, `body`, `fruitTint: string | null` (`null` = sin retinte, el caso de `clasico`),
  `border`, `glow: string | null` (`null` = sin glow, el caso de `retro`).

**Riesgos**

- **El riesgo dominante es el spritesheet.** Si el retinte no se implementa, `neon` y `retro` no
  existen: la fruta seguiría siendo el PNG naranja/morado original sobre un fondo y una serpiente
  rediseñados, y se llevaría por delante tanto la monocromía de `retro` como el escalonado medido de
  `neon` (la fruta original `garlic` a 2.62:1 no pasa ni el 3:1 de elemento jugable).
- **El CSS de skins es global, no por juego.** `app/globals.css:1221-1239` fija
  `[data-skin="neon"] { --skin-accent: var(--magenta) }` y `[data-skin="retro"] { --skin-accent:
#ffb000 }` — valores elegidos para Tetris. Con eso tal cual, la `neon` de Snake tendría marco y HUD
  **magenta** sobre un canvas verde, y la `retro` ámbar sobre fósforo verde. **Snake necesita que esas
  variables se puedan calificar por juego** (p. ej. un `data-game` en `.av-player`/`.crt`, que hoy no
  existe). Acentos correctos para Snake: `neon` → `--skin-accent: var(--green)` con
  `--skin-glow: rgba(0,255,136,0.3)`; `retro` → `--skin-accent: #33ff33` con el glow **anulado**.
- **`clasico` arrastra deuda que la ficha no maquilla:** rejilla a 1.11:1, dos frutas por debajo del
  3:1 y `peach` camuflándose en el cuerpo. Es la línea base, no un rediseño — arreglarlo sería cambiar
  el default, y eso es una decisión aparte.
- **El cuerpo de `neon` es deliberadamente apagado** (4.29:1). Es lo que exige el escalonado de tres
  roles; si alguien "mejora" el cuerpo subiéndolo a verde brillante, rompe fruta/cuerpo. El hex no es
  negociable sin volver a medir los tres pares.
- **Desalineación de nombres en el atlas de sprites** (observación, no bloqueante y **no la he
  tocado**): los nombres de `snake-sprites.ts` no corresponden a los dibujos reales — el recorte
  `garlic` es morado (uva/berenjena), `banana` es naranja, `lemon` es verde. Las coordenadas se
  copiaron literalmente de la fuente sin revisar las etiquetas. No afecta al juego (la fruta se elige
  al azar) pero sí confunde al leer esta ficha: **los hex de fruta de arriba van por recorte, no por
  el nombre que sugiere la clave**.

### ARKANOID (`arkanoid`)

**Render:** **spritesheet PNG** — `public/games/arkanoid/spritesheet-breakout.png` (559x337), recortado
por `SPRITES` / `EXPLOSION_FRAMES` en `components/games/ArkanoidGame.tsx:37-98`. **No hay ni un solo
hex de juego en el código**: el único `fillStyle` del componente es el `#000` del fondo
(`ArkanoidGame.tsx:478`). Sin `strokeStyle`, sin `fillText`, sin `shadowBlur`, sin `shadowColor` ·
**Fondo:** `#000` (`ArkanoidGame.tsx:478-479`; `.crt-screen` también es `#000`)
**Diseñado:** 2026-09-22

**Cómo se obtuvieron los hex de `clasico`:** leyendo los píxeles reales del PNG con `sharp` sobre las
coordenadas de `SPRITES`, y quedándose con el tono dominante de cada banda. No están en ningún
archivo de texto del repo: hay que sacarlos de la imagen.

**Nota de inventario — los nombres de color del código mienten.** El tipo `BlockColor`
(`ArkanoidGame.tsx:27-28`) usa siete etiquetas que **no describen** el píxel que pinta el
spritesheet. Cualquier skin debe respetar el tono **real**, no la etiqueta, o los cinco niveles
cambian de aspecto:

| Etiqueta en código | Tono real en el PNG    | Hex base  |
| ------------------ | ---------------------- | --------- |
| `red`              | carmín                 | `#c02a3e` |
| `yellow`           | mostaza                | `#d9bd4c` |
| `cyan`             | **menta / verde agua** | `#4fc99c` |
| `magenta`          | **violeta**            | `#632ff4` |
| `hotpink`          | **naranja**            | `#fc7d1c` |
| `green`            | **azul**               | `#44aaf3` |
| `gray`             | pizarra azulada        | `#323142` |

**Nota de texto:** dentro del canvas **no se dibuja ningún texto** (no hay `fillText`). No hay grid,
ni viñeta, ni scanlines propias del juego — el CRT lo pone `.crt` / `.crt-screen` en CSS. Por eso
esta ficha no tiene fila de texto ni de rejilla.

**Nota de función:** en este Arkanoid **el color del bloque no significa nada**. Todos los bloques
son de un impacto y valen 10 puntos (`ArkanoidGame.tsx:437-458`); el color solo agrupa filas. Por eso
el umbral de ≥ 1.5:1 **entre bloques** no se exige aquí: es bandeado decorativo. Los pares que sí son
funcionales son **pelota vs bloque** (la pelota cruza el muro) y **pelota vs paleta** (se tocan en
cada rebote).

#### clasico (default)

Transcripción literal del spritesheet. No se retoca nada: lo que no pasa el umbral se documenta como
deuda visual.

| Rol                           | Hex                          | Contraste          |
| ----------------------------- | ---------------------------- | ------------------ |
| Pelota — cuerpo               | `#babac5`                    | 10.92:1 ✅         |
| Pelota — brillo               | `#f6f2f2`                    | 18.90:1 ✅         |
| Pelota — sombra               | `#9291a5`                    | 6.82:1 ✅          |
| Paleta — cuerpo               | `#babac5`                    | 10.92:1 ✅         |
| Paleta — brillo               | `#f6f2f2` / `#ffffff`        | 18.90 / 21.00:1 ✅ |
| Paleta — acento rojo          | `#ff4545` (sombra `#af2a44`) | 6.19 / 3.24:1 ✅   |
| Bloque `red` (carmín)         | `#c02a3e` (brillo `#ef7b8b`) | 3.64:1 ✅          |
| Bloque `yellow` (mostaza)     | `#d9bd4c` (brillo `#eedd9b`) | 11.33:1 ✅         |
| Bloque `cyan` (menta)         | `#4fc99c` (brillo `#b8f4dc`) | 10.17:1 ✅         |
| Bloque `magenta` (violeta)    | `#632ff4` (brillo `#916afb`) | 3.24:1 ✅          |
| Bloque `hotpink` (naranja)    | `#fc7d1c` (brillo `#f7aa73`) | 8.09:1 ✅          |
| Bloque `green` (azul)         | `#44aaf3` (brillo `#b9d2f9`) | 8.29:1 ✅          |
| Bloque `gray` (pizarra)       | `#323142` (medio `#646373`)  | 1.65:1 ⚠️ deuda    |
| Contorno de todos los sprites | `#000000`                    | 1.00:1 · se funde  |
| Explosión (4 frames)          | hereda el tono de su bloque  | = fila del bloque  |

**Deuda visual de `clasico` (medida, no estimada):**

- **La pelota y la paleta son exactamente el mismo color** (`#babac5`, 1.00:1). En el instante del
  rebote —el único momento en que el jugador necesita leer la pelota contra la paleta— son
  indistinguibles salvo por el acento rojo de la paleta y por el tamaño. Es el defecto más grave del
  default, y es el que arreglan `neon` y `retro`.
- El **bloque `gray`** se queda en **1.65:1** con su tono dominante: por debajo del 3:1 de elemento
  jugable. Solo es legible porque sus bandas media (`#646373`, 3.57:1) y alta (`#9998ab`, 7.43:1)
  ocupan el 40 % del sprite.
- **Pelota vs bloque, por debajo de 1.5:1:** `yellow` **1.04**, `cyan` **1.07**, `green` **1.32**,
  `hotpink` **1.35**. Contra `red` 3.00, `magenta` 3.37 y `gray` 6.60 sí pasa. Cuando la pelota
  atraviesa una fila mostaza o menta, se apoya solo en el matiz.
- El **contorno negro** de todos los sprites está a 1.00:1 del fondo: no delimita nada, simplemente
  recorta el sprite.

#### neon

Ancla de catálogo: **cyan** (`--cyan #00f5ff`). El cyan puro vive en el **glow CSS del gabinete**, no
en el canvas: a 15.50:1 chocaba con la pelota blanca (1.35:1), y la pelota es el objeto que nunca se
puede perder. Dentro del canvas el ancla la lleva la **paleta**, en cyan profundo.

Los siete bloques conservan su **matiz real** (menta, violeta, naranja, azul…), no la etiqueta del
código: los cinco niveles siguen viéndose como hoy, solo que saturados.

| Rol                        | Hex                    | Contraste         |
| -------------------------- | ---------------------- | ----------------- |
| Pelota                     | `#ffffff`              | 21.00:1 ✅        |
| Paleta — cuerpo            | `#0b7d92`              | 4.36:1 ✅         |
| Paleta — brillo            | `#5fd8e8`              | 12.47:1 ✅        |
| Paleta — acento            | `#ff4d94`              | 6.74:1 ✅         |
| Bloque `red` (carmín)      | `#ff3860`              | 5.99:1 ✅         |
| Bloque `yellow` (mostaza)  | `#e0c000`              | 11.71:1 ✅        |
| Bloque `cyan` (menta)      | `#00c9a7`              | 9.91:1 ✅         |
| Bloque `magenta` (violeta) | `#9b5cff`              | 5.37:1 ✅         |
| Bloque `hotpink` (naranja) | `#ff8c1a`              | 9.02:1 ✅         |
| Bloque `green` (azul)      | `#3d8bff`              | 6.34:1 ✅         |
| Bloque `gray` (neutro)     | `#c7d0e0` (`--silver`) | 13.53:1 ✅        |
| Glow del gabinete (CSS)    | `#00f5ff` (`--cyan`)   | solo `box-shadow` |

**Ajustes que impone la medición** (sin ellos la skin no pasa):

- **La pelota pasa a blanco puro.** Es el único valor que se separa ≥ 1.5:1 de los siete bloques a la
  vez: el peor caso es `yellow` con **1.79:1**, y el resto va de 2.12 a 3.91. Arregla de un golpe los
  cuatro pares rotos de `clasico`.
- **El cuerpo de la paleta baja a `#0b7d92`** (4.36:1). Con `#00f5ff` (15.50:1) la pelota blanca se
  quedaba en 1.35:1 contra ella; con `#0b7d92` da **4.81:1** ✅. El cyan brillante se recupera en la
  banda de brillo `#5fd8e8` (1.68:1 contra la pelota ✅).
- **El acento de la paleta pasa de rojo a `#ff4d94`.** Contra `#0b7d92` da 1.55:1 ✅; el `--magenta`
  puro `#ff006e` se quedaba en 1.23:1 y desaparecía sobre el cuerpo cyan.
- **El bloque `gray` sube a `--silver #c7d0e0`** (13.53:1), que saca del 1.65:1 la única fila que hoy
  no pasa el umbral. No puede quedarse en un azul acerado tipo `#8892b0`: contra el bloque `green`
  `#3d8bff` daba 1.07:1 **compartiendo familia de matiz**, que es justamente el caso en el que el
  1.5:1 entre elementos sí es exigible.
- **Glow en CSS, nunca en canvas.** `box-shadow` sobre `.crt` / `.crt-screen` vía `--skin-glow`. No
  tocar `shadowBlur` ni `shadowColor`: el componente hoy no los usa y no debe empezar a usarlos.

#### retro

Fósforo ámbar de gabinete, **4 tonos exactos**, sin glow, sin gradientes. Se reutiliza a propósito la
misma escala calibrada de la ficha de TETRIS: `retro` es "el monitor monocromo de la máquina", un
acabado de plataforma, no una identidad por juego — y el token `[data-skin="retro"]` de
`app/globals.css:1234` ya es ámbar `#ffb000` para todos.

| Rol                                                  | Hex       | Contraste  |
| ---------------------------------------------------- | --------- | ---------- |
| Ámbar 1 — claro · **pelota**                         | `#ffe0a3` | 16.44:1 ✅ |
| Ámbar 2 — base · **paleta** + bloque alto            | `#f0a300` | 9.94:1 ✅  |
| Ámbar 3 — medio · bloque medio + sombra de la paleta | `#c47d00` | 6.28:1 ✅  |
| Ámbar 4 — oscuro · bloque bajo                       | `#8f5a00` | 3.63:1 ✅  |

Escalones medidos: `#ffe0a3`/`#f0a300` **1.65:1**, `#f0a300`/`#c47d00` **1.58:1**,
`#c47d00`/`#8f5a00` **1.73:1**. Extremos: `#ffe0a3`/`#8f5a00` **4.53:1**.

**Reparto de los 7 bloques en 3 tonos** — se agrupan **respetando el orden de luminancia del
original**, para que los patrones de los cinco niveles conserven su estructura de claros y oscuros:

| Tono ámbar | Bloques (etiqueta del código) | Luminancia original |
| ---------- | ----------------------------- | ------------------- |
| `#f0a300`  | `yellow`, `cyan`              | 11.33 · 10.17       |
| `#c47d00`  | `hotpink`, `green`            | 8.09 · 8.29         |
| `#8f5a00`  | `red`, `magenta`, `gray`      | 3.64 · 3.24 · 1.65  |

La agrupación **arregla la deuda del bloque `gray`**: pasa de 1.65:1 a 3.63:1 ✅.

**Ajuste que impone la medición:** la paleta comparte tono con la fila más clara de bloques
(`#f0a300`). Se acepta y se declara: paleta y bloques **nunca ocupan la misma región del canvas**
(bloques en `y = 80…224`, paleta en `y = 560`) y sus siluetas no se parecen (81x14 móvil vs 64x24
en rejilla). La paleta se separa además por su banda inferior `#c47d00` (1.58:1 contra su cuerpo).

**Diferenciación**

- **Aritmética previa, para no fingir:** con ≥ 3:1 obligatorio contra `#000`, el rango útil va de 3:1
  a 21:1 — un factor 7. A 1.5x por escalón solo caben ~5 niveles (`1.5^4 = 5.06`, `1.5^5 = 7.59` ya
  se sale). Arkanoid tiene **9 elementos coloreados** (7 bloques + pelota + paleta): separarlos todos
  por luminancia es imposible. Por eso el 1.5:1 se exige solo a los pares **funcionales** y a los
  pares que **comparten familia de matiz**.
- **Pelota vs paleta** — `clasico` **1.00:1** ⚠️ (mismo hex) · `neon` **4.81:1** ✅ ·
  `retro` **1.65:1** ✅.
- **Pelota vs bloque, el peor caso de cada skin** — `clasico` **1.04:1** ⚠️ (`yellow`) ·
  `neon` **1.79:1** ✅ (`yellow`) · `retro` **1.65:1** ✅ (tono alto).
- **Bloque vs bloque: no se exige.** El color de bloque no tiene función (todos 1 impacto, 10
  puntos). En `neon` quedan ocho pares por debajo de 1.5:1 —`red/magenta` 1.12, `red/green` 1.06,
  `yellow/cyan` 1.18, `yellow/hotpink` 1.30, `cyan/hotpink` 1.10, `magenta/green` 1.18,
  `hotpink/green` 1.42, `gray/yellow` 1.16 y `gray/cyan` 1.36— y todos se separan por **matiz**
  (carmín vs violeta, mostaza vs menta, naranja vs azul…). `gray` es además **acromático**, misma
  excepción declarada que la pieza N de TETRIS.
- **Familia de matiz — el único par que sí se corrigió:** `gray/green`. Con `#8892b0` vs `#3d8bff`
  ambos eran azules a ~9° de distancia y daban 1.07:1; con `--silver #c7d0e0` suben a **2.14:1** ✅.
- **Explosión vs bloque:** los 4 frames heredan el tono de su bloque en las tres skins. No necesitan
  contraste entre sí: duran 150 ms y sustituyen al bloque, no conviven con él.

**Identidad**

Las tres skins cambian **solo color**. Nada de `PADDLE_W 81`, `PADDLE_H 14`, `BALL_SIZE 16`,
`BLOCK_W 64`, `BLOCK_H 24`, `BLOCK_COLS 10`, `PADDLE_SPEED 400`, velocidades de `LEVELS`, ni la
geometría de los cinco niveles. **Ninguna skin puede sustituir un sprite por un `fillRect`**: la
pelota y la paleta tienen bordes redondeados y biselados en el PNG, y repintarlas como rectángulos
planos cambiaría la silueta, que es lo único que esta ficha no puede tocar.

**Render y prerrequisitos — leer antes de escribir el spec**

Arquitectura **desfavorable**: es el caso "spritesheet PNG" de la rúbrica. **El color de Arkanoid no
está en el código**, así que ninguna de estas paletas se aplica cambiando una constante. Hay dos vías
y el spec debe elegir una:

1. **Tintado en carga (recomendado).** El componente ya vuelca el PNG en un canvas offscreen
   (`ArkanoidGame.tsx:547-559`). Extender eso a una **caché de canvases pre-tintados**, uno por
   (sprite × tono de la skin), con `globalCompositeOperation = "source-atop"` y un `fillRect` del hex
   plano. Conserva la silueta y el recorte alfa exactos, cuesta una sola pasada al cargar y aplana
   las bandas de sombreado — lo cual es **deseable** en `retro` (sin gradientes) y aceptable en
   `neon` (alta saturación). Si se quiere conservar el bisel en `neon`, hay que tintar **por banda**
   (cuerpo / brillo / sombra), comparando el píxel origen contra los hex de `clasico` de esta ficha.
2. **PNG alterno por skin** (`spritesheet-breakout-neon.png`, `-retro.png`). Fidelidad total y coste
   cero en runtime, pero exige producir dos assets nuevos y mantenerlos sincronizados con las
   coordenadas de `SPRITES` y `EXPLOSION_FRAMES`.

Además, sea cual sea la vía:

- El `context.fillStyle = "#000"` del fondo (`ArkanoidGame.tsx:478`) hay que sacarlo a la paleta.
- `EXPLOSION_FRAMES` (`ArkanoidGame.tsx:55-98`) tiene **7 entradas × 4 frames**: el tintado debe
  cubrirlas o las explosiones seguirán saliendo con los colores de `clasico`.
- `drawSprite` / `drawBlockSprite` / `drawFrame` (`ArkanoidGame.tsx:262-305`) leen `ssImg` directo;
  con la vía 1 pasan a leer del canvas tintado que toque.
- El componente **no acepta hoy la prop `skin`**: su `ArkanoidGameProps`
  (`ArkanoidGame.tsx:213-219`) no la declara, aunque `RealGameProps` de `GamePlayer` ya la tiene.

**Integración**

La infraestructura de skins **ya existe** (se construyó con TETRIS); esta ficha solo se engancha:

- `lib/skins.ts` — núcleo genérico ya hecho: `SKIN_IDS`, `DEFAULT_SKIN = "clasico"`, `getSkin` /
  `setSkin` sobre `localStorage`, `resolvePalette`. **No hay que tocarlo.**
- Prop `skin?: SkinId` en `RealGameProps` (`components/GamePlayer.tsx:44-48`): **ya existe**. Falta
  declararla y consumirla en `ArkanoidGameProps`.
- `data-skin` en `.av-player` y en `.crt` (`components/GamePlayer.tsx:190` y `:281-283`): **ya
  existe**, condicionado a `GAMES_WITH_SKINS`.
- Selector del HUD junto a Pausa / Reiniciar (`.skin-pick`): **ya existe**, se activa solo para los
  ids de `GAMES_WITH_SKINS` (`components/GamePlayer.tsx:84`), que hoy es `new Set(["tetris"])`.
  **Añadir `"arkanoid"` a ese Set es el interruptor de esta ficha.**
- Persistencia en `localStorage["av-skin-arkanoid"]`, con `clasico` como fallback si no hay valor o
  si el guardado no es una de las tres skins — lo resuelve ya `readSkin` en `lib/skins.ts`.
- Paleta nueva en `components/games/skins/arkanoid.ts`, con la forma propia del juego: `background`,
  `ball`, `paddle` (cuerpo / brillo / acento) y `blocks: Record<BlockColor, string>`.

**Riesgos**

- **El riesgo principal es el spritesheet**, no el color. Si el spec no resuelve el tintado o los PNG
  alternos, `neon` y `retro` **no se pueden implementar en absoluto**: no hay ninguna constante que
  cambiar. Es el único juego de los cuatro con este problema.
- **Tintar con `source-atop` plano borra el bisel** de la pelota y la paleta. En `retro` es lo
  correcto; en `neon` deja los bloques planos. Si el usuario quiere conservar el volumen en `neon`,
  el tintado tiene que ser por banda y el coste de implementación sube bastante.
- **`[data-skin="neon"]` de `app/globals.css:1228` está fijado en magenta**, heredado de TETRIS, que
  es magenta de catálogo. Arkanoid es **cyan**: si no se scopea ese bloque por juego, el gabinete de
  Arkanoid en `neon` brillará magenta mientras el canvas es cyan. **Prerrequisito de CSS, no de esta
  ficha** — hay que decidir si el acento `neon` es por juego o global.
- **Los nombres de `BlockColor` seguirán mintiendo.** `green` es azul y `hotpink` es naranja. Toda
  paleta nueva se escribe contra la etiqueta, no contra el tono; es una trampa fácil para quien
  implemente. Renombrar el tipo sería un cambio de refactor aparte, fuera de esta ficha.
- **`clasico` deja la pelota y la paleta del mismo color (1.00:1)**. La ficha lo conserva a propósito:
  `clasico` es la línea base, no un rediseño. Es la comparación que el usuario va a hacer nada más
  probar `neon`, y donde la mejora se nota más.
- El **sonido y las explosiones no se tematizan**. Las skins son solo color.

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
  que cuando se escribió esta ficha **no existía** — ninguna prop de presentación estaba en el
  contrato. Se añadió al implementar estas skins y hoy la reciben los cuatro juegos.
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

### ASTEROIDS (`asteroids`)

**Render:** **sin constante de paleta** — nueve hex sueltos repartidos por los métodos `draw()` de las
cinco clases de módulo de `components/games/AsteroidsGame.tsx` (`Bullet:49`, `Asteroid:113`,
`PowerUp:160,165`, `Ship:257,274,283`, `Particle:321`) más el fondo en `draw()` (`AsteroidsGame.tsx:562`) ·
**Fondo:** `#000` (`context.fillStyle = "#000"`, `AsteroidsGame.tsx:562`; el `<canvas>` no lleva
`background` inline, y `.crt-screen` también es `#000`)
**Diseñado:** 2026-09-22

**Nota de inventario:** Asteroids es un juego **vectorial**: todo se pinta con `stroke()` de
`lineWidth` 1.5–2 salvo la bala (`fill()` de un `arc` de r=2). No hay `fillRect` de entidades ni
spritesheets. Consecuencia práctica: **no existe "relleno hueco vs sólido"** como recurso de
diferenciación — todas las siluetas ya son huecas. La diferenciación no cromática disponible es
**geometría y posición**, no relleno.

**Nota de texto:** el único texto dentro del canvas es el glifo `"3x"` del power-up
(`ctx.fillText("3x", ...)`, `AsteroidsGame.tsx:169`, `bold 12px monospace`). Se mide con el umbral de
texto (≥ 4.5:1). El HUD (puntuación, vidas, nivel) es DOM de `GamePlayer.tsx`, fuera de esta ficha.

**Nota de opacidad:** dos colores del juego son `rgba()` sobre `#000`. Como el fondo es negro puro,
el compuesto es exacto y medible: `rgba(255,130,0,0.85)` → `#d96e00` y `rgba(0,210,255,0.85)` →
`#00b2d9`. Las partículas (`rgba(255,255,255,α)`) llevan α variable de 1 → 0, así que se miden en su
valor de nacimiento (α = 1) y se declaran decorado.

#### clasico (default)

Transcripción literal del código actual. Es el Asteroids de vector monocromo de 1979 con dos añadidos
de color: el power-up cyan y las dos llamas. No se retoca nada.

| Rol                      | Hex                              | Contraste                 |
| ------------------------ | -------------------------------- | ------------------------- |
| Nave (contorno)          | `#ffffff`                        | 21.00:1 ✅                |
| Asteroide (contorno)     | `#ffffff`                        | 21.00:1 ✅                |
| Bala                     | `#ffffff`                        | 21.00:1 ✅                |
| Power-up `3x` (marco)    | `#00ffff` (`#0ff`)               | 16.75:1 ✅                |
| Texto `3x`               | `#00ffff` (`#0ff`)               | 16.75:1 ✅ (texto)        |
| Llama de empuje (cola)   | `rgba(255,130,0,0.85)` `#d96e00` | 6.18:1 ✅                 |
| Llama de frenado (nariz) | `rgba(0,210,255,0.85)` `#00b2d9` | 8.37:1 ✅                 |
| Partículas de explosión  | `rgba(255,255,255,α)` α 1 → 0    | 21.00:1 al nacer·decorado |
| Fondo del canvas         | `#000000`                        | —                         |

**Deuda visual de `clasico` (medida, no estimada):**

- **Nave, asteroide y bala son el mismo `#ffffff` exacto: 1.00:1 entre los tres.** Es el peor par
  posible y afecta al par más crítico del juego (tu nave contra la roca que te mata). Se sostiene
  **solo por silueta**: triángulo con muesca trasera (32 px) vs polígono irregular de 8–13 vértices
  (radio 16/30/50) vs disco lleno de 4 px. Funciona, porque es literalmente el diseño original, pero
  no pasa el criterio de legibilidad funcional y hay que decirlo.
- **Power-up vs asteroide = 1.25:1** (`#00ffff` vs `#ffffff`). Por debajo de 1.5:1 en el par que
  decide si te acercas o te apartas. Lo salva el matiz (cyan vs acromático), el glifo `3x` y el
  parpadeo de los últimos 2 s (`AsteroidsGame.tsx:155`).
- **Llama de frenado vs power-up = 2.00:1** ✅, pero comparten familia cyan: a distancia, un destello
  de frenado se lee como un power-up lejano. Es el caso de confusión más sutil del default.

#### neon

Ancla de catálogo: **yellow** (`--yellow #f5ff00`), aplicada a la **nave** — en un shooter el color
de categoría debe ir en la cosa que el jugador controla y mira todo el rato, no en el entorno. Los
asteroides bajan a un cyan apagado (`#00a8c8`) para que dejen de competir en luminancia con la nave.
Tokens de `:root` usados directamente: `--yellow`, `--green`, `--magenta`, `--cyan`.

| Rol                      | Hex                           | Contraste                 |
| ------------------------ | ----------------------------- | ------------------------- |
| Nave (contorno)          | `#f5ff00` (`--yellow`)        | 19.19:1 ✅                |
| Asteroide (contorno)     | `#00a8c8`                     | 7.44:1 ✅                 |
| Bala                     | `#ffffff`                     | 21.00:1 ✅                |
| Power-up `3x` (marco)    | `#00ff88` (`--green`)         | 15.66:1 ✅                |
| Texto `3x`               | `#00ff88` (`--green`)         | 15.66:1 ✅ (texto)        |
| Llama de empuje (cola)   | `#ff006e` (`--magenta`)       | 5.48:1 ✅                 |
| Llama de frenado (nariz) | `#00f5ff` (`--cyan`)          | 15.50:1 ✅                |
| Partículas de explosión  | `rgba(255,255,255,α)` α 1 → 0 | 21.00:1 al nacer·decorado |
| Fondo del canvas         | `#000000`                     | —                         |

**Ajustes que impone la medición** (sin ellos la skin no pasa):

- El asteroide **no puede ser `#00f5ff` puro**: contra la nave amarilla da 1.24:1, por debajo del
  umbral, en el par que más importa. Bajado a `#00a8c8` sube a **2.58:1 ✅** y sigue en 7.44:1 contra
  el fondo, muy por encima del 3:1 de elemento jugable.
- El power-up **no puede ser `#ff006e`**: contra el asteroide cyan da 1.36:1 ❌ y ese es el par crítico
  del juego (premio vs cosa que te mata). Con `#00ff88` el par sube a **2.11:1 ✅**. El magenta se
  reasigna a la llama de empuje, donde compite solo contra la nave (3.50:1 ✅).
- **Glow en CSS, nunca en canvas:** `box-shadow` sobre `.crt-screen` / `text-shadow` en el HUD, vía el
  `data-skin="neon"` que ya existe en `app/globals.css:1228`. El componente hoy no usa `shadowBlur` ni
  `shadowColor` en ningún punto y **no debe empezar a usarlos**: con ~60 entidades vectoriales por
  frame, un `shadowBlur` de canvas hunde el framerate. Este es el motivo técnico, no estético.

#### retro

Fósforo **ámbar P3** de gabinete, **3 tonos** (el máximo permitido es 4; con 3 basta y es más honesto
para un juego vectorial). Ámbar y no verde P1 por dos razones: es coherente con el `yellow` de catálogo
de Asteroids, y evita que el `retro` de Asteroids sea indistinguible del de un juego `green`. Sin glow,
sin gradientes, sin alpha fija.

| Tono | Hex       | Contraste sobre `#000` |
| ---- | --------- | ---------------------- |
| A1   | `#ffe8c4` | 17.59:1 ✅             |
| A2   | `#ffb000` | 11.46:1 ✅             |
| A3   | `#a86a00` | 4.73:1 ✅              |

Escalones medidos: A1/A2 **1.53:1 ✅** · A2/A3 **2.43:1 ✅** · A1/A3 **3.72:1 ✅**. Los tres escalones
superan 1.5:1, y el más oscuro (A3) sigue por encima del 3:1 de elemento jugable.

| Rol                      | Hex                         | Contraste                 |
| ------------------------ | --------------------------- | ------------------------- |
| Nave (contorno)          | `#ffb000` (A2)              | 11.46:1 ✅                |
| Asteroide (contorno)     | `#a86a00` (A3)              | 4.73:1 ✅                 |
| Bala                     | `#ffe8c4` (A1)              | 17.59:1 ✅                |
| Power-up `3x` (marco)    | `#ffe8c4` (A1)              | 17.59:1 ✅                |
| Texto `3x`               | `#ffe8c4` (A1)              | 17.59:1 ✅ (texto)        |
| Llama de empuje (cola)   | `#ffe8c4` (A1)              | 17.59:1 ✅                |
| Llama de frenado (nariz) | `#a86a00` (A3)              | 4.73:1 ✅                 |
| Partículas de explosión  | `rgba(255,176,0,α)` α 1 → 0 | 11.46:1 al nacer·decorado |
| Fondo del canvas         | `#000000`                   | —                         |

**Ajustes que impone la medición:**

- Las **partículas dejan de ser blancas**: `rgba(255,255,255,α)` rompe la monocromía del fósforo. Pasan
  a `rgba(255,176,0,α)` (A2) conservando exactamente el mismo decaimiento de α que hoy
  (`AsteroidsGame.tsx:320-321`). Es un cambio de color, no de física de partículas.
- El **A1 no es `#ffd899`**: contra la nave `#ffb000` se quedaba en 1.36:1 ❌. Subido a `#ffe8c4` da
  1.53:1 ✅ y mantiene el matiz ámbar (no se blanquea a gris).
- Las **dos llamas se separan por tono**, no solo por posición: empuje en A1 y frenado en A3, 3.72:1
  entre sí ✅. En `clasico` se separaban por matiz (naranja vs cyan), recurso que el monocromo no tiene.

**Diferenciación**

Asteroids tiene **6 elementos cromáticos** (nave, asteroide, bala, power-up, dos llamas), por debajo
del umbral de ~5 en el que la aritmética de luminancia se rompe — así que aquí **sí** se puede exigir
el 1.5:1 a casi todos los pares, a diferencia de Tetris. Los pares se ordenan por criticidad real:

| Par                     | Por qué importa                     | `clasico` | `neon`  | `retro` |
| ----------------------- | ----------------------------------- | --------- | ------- | ------- |
| Asteroide vs power-up   | **crítico** — te mata vs te premia  | 1.25 ⚠️   | 2.11 ✅ | 3.72 ✅ |
| Asteroide vs nave       | **crítico** — lo que esquivas vs tú | 1.00 ⚠️   | 2.58 ✅ | 2.43 ✅ |
| Asteroide vs bala       | leer si tu disparo va a impactar    | 1.00 ⚠️   | 2.82 ✅ | 3.72 ✅ |
| Asteroide vs frenado    | destello cyan/ámbar vs roca         | 2.51 ✅   | 2.09 ✅ | 2.43 ✅ |
| Nave vs llama de empuje | feedback de aceleración             | 3.40 ✅   | 3.50 ✅ | 1.53 ✅ |
| Empuje vs frenado       | qué dirección estás acelerando      | 2.71 ✅   | 2.83 ✅ | 3.72 ✅ |

**Excepciones declaradas** (pares que no llegan a 1.5:1 y por qué se aceptan):

- **`neon` — nave vs bala 1.09:1** (`#f5ff00` vs `#ffffff`). La bala **nace en la nariz de la nave** y
  sale a 520 px/s: en el frame 2 ya está a 8 px y separándose. Además es un **disco lleno de 4 px**
  frente a un **contorno hueco de 32 px**. Mismo caso en `clasico` (1.00:1) y resuelto en `retro`
  (1.53:1 ✅).
- **`neon` — nave vs power-up 1.23:1** (`#f5ff00` vs `#00ff88`). Par **no crítico**: la nave la
  controlas tú y siempre sabes dónde está. Se sacrifica a propósito para ganar el par crítico
  asteroide vs power-up (2.11:1). Separación por matiz de 90° (amarillo 62° vs verde primavera 152°)
  y por forma (triángulo vs cuadrado rotado 45° con glifo `3x` y pulso senoidal).
- **`neon` — nave vs llama de frenado 1.24:1** (`#f5ff00` vs `#00f5ff`). La llama está **dibujada
  dentro del `ctx.translate`/`rotate` de la nave** (`AsteroidsGame.tsx:278-285`): no es una entidad
  independiente que haya que identificar, es un apéndice de 10 px en la nariz que solo aparece al
  pulsar `ArrowDown`, y encima 1 frame de cada ~1.5 (`Math.random() > 0.35`).
- **`neon` — power-up vs llama de frenado 1.01:1** (`#00ff88` vs `#00f5ff`). Misma razón: la llama de
  frenado está anclada a la nave, nunca compite por identificación con un ítem que flota libre.
- **`neon` — asteroide vs llama de empuje 1.36:1** (`#00a8c8` vs `#ff006e`). Anclada a la cola de la
  nave; matiz opuesto (cyan 190° vs magenta 330°).
- **`retro` — bala vs power-up 1.00:1** (ambos A1, mismo tono). Inevitable en 3 tonos y **el par menos
  crítico de la lista**: disco lleno de 4 px que viaja a 520 px/s y muere en 1.1 s, frente a un
  cuadrado hueco de 24 px que pulsa, flota a 20–40 px/s y lleva el texto `3x` dentro.
- **`clasico` — nave/asteroide/bala 1.00:1 entre los tres.** Deuda del default, documentada arriba. No
  se maquilla: `clasico` es la línea base.

**Identidad**

Las tres skins cambian **solo color**. Nada de `W`/`H` (800×600), `RADII = [0,16,30,50]`,
`SPEEDS`, `POINTS`, geometría del triángulo de la nave, número de vértices del asteroide (8–13),
`ship.radius = 12`, `POWERUP_DROP_CHANCE`, `TRIPLE_SPREAD` ni el wrap toroidal. `retro` **no** recurre
a relleno hueco porque en un juego vectorial ya todo es hueco: su recurso es la escala de 3 tonos.

**Render y prerrequisitos**

Arquitectura **desfavorable**: a diferencia de Tetris, aquí **no hay ninguna constante de paleta**. Los
nueve colores son literales incrustados en los `draw()` de cinco clases declaradas **a nivel de módulo**,
fuera del componente — así que no ven ni props ni estado de React. Antes de que `skin` sirva de algo hay
que hacer dos cosas:

1. **Extraer los nueve literales** a un `components/games/skins/asteroids.ts` con la misma forma que
   `tetris.ts` (`SkinPalettes<AsteroidsPalette>` de `lib/skins.ts`). Roles a cubrir: `background`,
   `ship`, `asteroid`, `bullet`, `powerUp`, `powerUpText`, `thrust`, `reverse`, `particle`.
2. **Hacer llegar la paleta a las clases.** Las cinco clases están fuera del componente y sus `draw()`
   solo reciben `ctx`. Hay que pasar la paleta como segundo argumento —
   `draw(ctx: CanvasRenderingContext2D, p: AsteroidsPalette)` en `Bullet`, `Asteroid`, `PowerUp`,
   `Ship` y `Particle`— y propagarla desde la función `draw()` del `useEffect`
   (`AsteroidsGame.tsx:560-570`). Es el único cambio estructural de la ficha.
3. **El `useEffect` tiene `[]` como array de dependencias** (`AsteroidsGame.tsx:625`). Cambiar de skin
   **no debe reiniciar la partida**: la paleta debe leerse desde un `ref` actualizado en cada render
   (mismo patrón que `pausedRef`, `AsteroidsGame.tsx:350-351`), nunca añadiendo `skin` a las
   dependencias del efecto.
4. `AsteroidsGameProps` (`AsteroidsGame.tsx:336-342`) aún no declara `skin?: SkinId`, aunque
   `RealGameProps` ya se la pasa a todos los juegos.

Sin spritesheets: Asteroids pinta 100% con paths de canvas, no hay ningún PNG que retintar.

**Integración**

La infraestructura de skins **ya existe** (se implementó con Tetris) y es agnóstica del juego, así que
para Asteroids no hay que construir nada nuevo — solo enchufarlo:

- `lib/skins.ts` ya aporta `SKIN_IDS`, `SkinId`, `DEFAULT_SKIN = "clasico"`, `getSkin`/`setSkin`/
  `subscribeSkin` sobre `localStorage`, y `resolvePalette()` con fallback a `clasico`.
- `RealGameProps` ya tiene `skin?: SkinId` (`components/GamePlayer.tsx:41-52`) y ya se la pasa al juego
  activo. Falta que `AsteroidsGameProps` la acepte.
- El `<div className="av-player">` y `.crt` ya llevan `data-skin` (`GamePlayer.tsx:190,283`), y
  `app/globals.css:1218-1240` ya conmuta el acento del gabinete por `[data-skin="neon"]` /
  `[data-skin="retro"]`. Ahí es donde vive el glow de `neon` y donde `retro` lo apaga.
- El selector del HUD ya está construido, junto a Pausa / Reiniciar. **Solo se muestra a los juegos
  listados en `GAMES_WITH_SKINS` (`GamePlayer.tsx:83`), que hoy es `new Set(["tetris"])`** — hay que
  añadir `"asteroids"`.
- Persistencia: `localStorage["av-skin-asteroids"]`, derivada automáticamente de `skinStorageKey()`.
  Fallback a `clasico` si no hay valor o si el guardado no es una de las tres skins.

**Riesgos**

- **Riesgo principal: la extracción de la paleta, no los colores.** Las cinco clases de módulo con
  `draw(ctx)` son el trabajo real; los hex de esta ficha son la parte fácil. Si la extracción se hace
  a medias, quedan literales blancos sueltos que ignoran la skin y rompen `retro` visiblemente.
- **`clasico` arrastra 1.00:1 entre nave, asteroide y bala.** Es fiel al original y se deja intacto,
  pero significa que `neon` y `retro` van a verse _objetivamente mejor_ que el default. Conviene
  esperar la pregunta "¿por qué el clásico se ve peor?" — la respuesta es que es el arcade de 1979.
- **`retro` con 3 tonos deja bala y power-up en el mismo A1.** Aceptado arriba, pero si en pruebas
  molesta, la salida **no** es añadir un cuarto color al power-up: es subir su `lineWidth` de 2 a 3,
  que es forma y no paleta.
- **Nunca usar `shadowBlur` para el glow de `neon`.** El juego dibuja ~60 entidades vectoriales por
  frame a 60 fps; un `shadowBlur` por entidad lo mata. El glow va en CSS sobre `.crt-screen`.
- **El HUD de Asteroids muestra vidas** (`onLivesChange`): las vidas son DOM de `GamePlayer.tsx` y ya
  se retematizan solas por `data-skin`. Ninguna skin tiene que tocarlas.
