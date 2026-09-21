# VADO — diseño de juego

> **Jam:** Cruza la carretera y el río sin convertirte en papilla · **Concepto:** 3 de 3 · **Estado:** Borrador
> **Spec de integración:** [`./spec.md`](./spec.md)
> **Fecha:** 2026-09-21

## Pitch

No cruzas tú: colocas piedras delante de un caminante que avanza solo, una celda por cada apoyo que encuentre. La corriente arrastra el tablero entero hacia abajo y las piedras se hunden a los nueve segundos, así que construir por adelantado no sirve: hay que ir justo por delante de sus pies.

## Fantasía y tema

Lente **sistema**: la fuerza abstracta del tema es la corriente, esa cosa que se lleva todo lo que no está sujeto. Aquí es literal: cada pocos segundos el tablero completo baja una fila y lo que sale por abajo desaparece, piedras y caminante incluidos.

El avatar del jugador no está en pantalla. Tú eres la mano que suelta piedras. El caminante es un desconocido terco que sube por donde puede, y los obstáculos son la ausencia de suelo y el tiempo. La sensación buscada es la del tetris de la ansiedad invertido: no apilas para sobrevivir, apilas para que otro llegue.

## Mecánica central

- **Loop de 30 segundos:** miras dónde está el caminante, llevas el cursor a la celda de arriba, sueltas una piedra, ves cómo da el paso, y repites vigilando el stock, la erosión y el reloj de la corriente.
- **Entidades:**
  - **Cursor:** marco hueco de una celda, se mueve de celda en celda con las flechas.
  - **Piedra:** losa de 1 celda con un borde claro; sostiene al caminante y se hunde a los 9 s.
  - **Tablón:** losa de 2 celdas horizontales; aparece cada 5 piezas y permite cubrir dos opciones a la vez.
  - **Caminante:** ficha de 28 px con una cabeza redonda; avanza solo, un paso por evento.
  - **Corriente:** líneas horizontales animadas de fondo, que se mueven más rápido cuanto más corto es el intervalo.
- **Reglas:**
  - El caminante avanza si hay pieza en la celda de arriba; si no, en la de arriba-izquierda; si no, en la de arriba-derecha. Un paso por evaluación.
  - Se evalúa tras cada colocación válida y tras cada tick de corriente.
  - La corriente baja todo el tablero una fila cada `T` segundos; lo que pasa de la fila inferior se pierde.
  - Cada pieza desaparece 9 s después de colocarse, parpadeando el último segundo.
  - El stock es de 5 piezas y recupera 1 cada 1100 ms; colocar consume 1.
  - Una colocación inválida (celda ocupada, fuera de la grilla, o tablón sin sitio a la derecha) no cuesta stock.
  - Llegar a la fila superior completa el cruce: el tablero se limpia y el caminante reaparece abajo en una columna aleatoria.
- **Tensión:** el recurso escaso es el tiempo, en tres formas simultáneas: el stock que se recarga despacio, la erosión que borra lo construido y la corriente que baja el suelo bajo los pies del caminante.

## Controles

| Tecla   | Acción                                   |
| ------- | ---------------------------------------- |
| ↑ / W   | Mover el cursor una celda arriba         |
| ↓ / S   | Mover el cursor una celda abajo          |
| ← / A   | Mover el cursor una celda a la izquierda |
| → / D   | Mover el cursor una celda a la derecha   |
| Espacio | Colocar la pieza actual                  |

Sin ratón. Sin táctil. Cada pulsación mueve exactamente una celda: no hay repetición automática al mantener la tecla.

## Sistema de puntuación

| Evento                                     | Puntos |
| ------------------------------------------ | ------ |
| Paso del caminante                         | +10    |
| Cruce completo (llegar a la fila superior) | +100   |
| Pieza colocada sin que nadie la pise       | ±0     |

El score solo sube y solo lo hace cuando el caminante avanza de verdad, lo cual exige gastar stock y ganarle la carrera a la corriente. Colocar piedras por gusto no paga nada, así que no hay forma de inflar el marcador sin progresar: cada punto equivale a una fila subida, y una fila subida es una fila más cerca del cruce y del reinicio del tablero.

## Vidas, nivel y fin de partida

- **Vidas:** no hay. Se reporta el patrón `reportedLives = -1` con precedente en `components/games/TetrisGame.tsx`, porque el HUD arranca en 3 y `GamePlayer.restart()` lo resetea a ciegas: una sola emisión de `onLivesChange(0)` al montar dejaría tres corazones falsos tras "JUGAR DE NUEVO". El HUD debe mostrar `—` siempre.
- **Nivel:** `floor(pasos / 12) + 1` — cada nivel acorta el intervalo de la corriente.
- **Fin de partida:** un tick de corriente empuja al caminante por debajo de la fila inferior.

## Curva de dificultad y balance

| Nivel      | Intervalo de corriente | Piezas disponibles por tick | Margen sobre la erosión (9 s) |
| ---------- | ---------------------- | --------------------------- | ----------------------------- |
| 1          | 5000 ms                | ~4,5                        | holgado: 1,8 ticks por piedra |
| 5          | 3600 ms                | ~3,3                        | 2,5 ticks por piedra          |
| 9          | 2200 ms                | ~2,0                        | 4 ticks por piedra            |
| 10+ (piso) | 1800 ms (piso)         | ~1,6                        | 5 ticks por piedra            |

El intervalo baja `-350 ms` por nivel y se topa en 1800 ms, que sigue siendo mayor que los 1100 ms de recarga del stock: incluso en el peor caso, el jugador tiene al menos una pieza disponible entre tick y tick, así que nunca pierde por no poder actuar. A partir del nivel 10 la dificultad deja de subir y la partida termina por errores de colocación, no por imposibilidad. Un cruce son 8 pasos (80 puntos) más el bonus de 100. Una partida mala dura unos 30 segundos sin completar ningún cruce; una buena encadena cinco o seis cruces y ronda los 1000 puntos.

## Dirección de arte

- **Paleta:** el magenta del catálogo para el cursor, los bordes de las piezas y el caminante; el cauce en violeta muy oscuro con líneas de corriente en un morado apagado; las piedras en gris cálido con el borde superior iluminado; el parpadeo de erosión en blanco.
- **Formas:** todo son rectángulos y círculos. La grilla es una retícula de líneas finas; las piezas son rectángulos con un borde de dos píxeles; el caminante es un rectángulo vertical coronado por un círculo; las líneas de corriente son segmentos que se desplazan y se reciclan.
- **Fondo:** un degradado vertical del violeta profundo de abajo (el fondo del cauce) al morado claro de arriba (la orilla de destino), con la fila superior marcada como tierra firme mediante una banda punteada.
- **Concepto del `cover-vado`:** tres formas — una banda vertical oscura (el cauce), dos losas escalonadas cruzándola en diagonal, y una figura pequeña sobre la losa más baja. Ánimo cromático: violeta nocturno con acentos magenta, inquieto y frío.

## Feedback y game feel

Cada paso del caminante dispara un pequeño salto vertical de 4 px con retorno en 120 ms y un `+10` flotante. El cruce completado hace un destello blanco de toda la fila superior, lanza dieciséis partículas magenta y muestra `+100` en grande durante 700 ms. El tick de corriente sacude el tablero 3 px hacia abajo y acelera un instante las líneas de fondo, para que se vea venir. Una colocación inválida parpadea el cursor en rojo durante 150 ms.

Dentro del canvas se dibujan tres indicadores que no caben en el HUD: el stock (cinco losas pequeñas en el margen inferior, con la que está recargando dibujada a medias), la pieza actual y la siguiente en el margen superior, y una barra fina en el borde derecho que muestra cuánto falta para el próximo tick de corriente.

## Referencias y anti-referencias

- **Se parece a:** los juegos de trazar rutas tipo _Pipe Mania_ y a la construcción reactiva de _Lemmings_, pero comprimido a una sola pantalla y con un reloj que borra el trabajo hecho.
- **No se solapa con:**
  - **Asteroids** — allí disparas y rotas con inercia; aquí no hay proyectiles, ni avatar con física, ni movimiento continuo.
  - **Tetris** — allí caen tetrominós que rotas y encajas, y despejas filas completas; aquí no hay gravedad, ni rotación, ni piezas multiceldas complejas, ni despeje por fila llena: el despeje llega cuando un personaje termina de cruzar.
  - **Arkanoid** — allí hay paleta y pelota con rebotes; aquí no hay nada que rebote ni ningún eje único de control.
  - **Snake** — allí controlas directamente un cuerpo que crece por una grilla; aquí no controlas al que se mueve, controlas el suelo que pisa.
  - **`ranaria` (placeholder de Frogger)** — allí controlas a la rana que salta entre casillas y plataformas; aquí el que cruza es autónomo y tú eres el terreno.
- **Diferencia con los otros dos juegos de este jam:**
  - **ASFALTO (GJ-01)** — allí eres el que cruza, en movimiento continuo y a reflejos; aquí decides en celdas discretas y no cruzas nada.
  - **BOYAS (GJ-02)** — allí disparas a objetivos que huyen; aquí no hay proyectil ni puntería, sino planificación.

## Ideas descartadas

- **Despejar filas completas de orilla a orilla al estilo Tetris.** Era el camino obvio para un puzzle de río, y precisamente por eso se descartó: solapa de frente con un juego ya implementado en la plataforma.
- **Pathfinding real del caminante con búsqueda de ruta.** Habría permitido tableros más ricos, pero rompe el presupuesto de un archivo de 300–450 líneas y vuelve el comportamiento difícil de predecir, que es justo lo contrario de lo que un puzzle necesita.
- **Que el jugador pudiera empujar al caminante con una tecla.** Diluía la fantasía (si puedes moverlo, ya no eres el terreno) y convertía el juego en un Frogger con pasos manuales, es decir, en `ranaria`.
