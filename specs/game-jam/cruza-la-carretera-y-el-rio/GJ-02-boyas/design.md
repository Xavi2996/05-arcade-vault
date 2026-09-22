# BOYAS — diseño de juego

> **Jam:** Cruza la carretera y el río sin convertirte en papilla · **Concepto:** 2 de 3 · **Estado:** Borrador
> **Spec de integración:** [`./spec.md`](./spec.md)
> **Fecha:** 2026-09-21

## Pitch

Eres el socorrista del peor tramo del río y disparas flotadores a los bañistas que la corriente arrastra hacia la cascada. Te hunde la aritmética: seis flotadores en la orilla, recarga lenta, y cuatro corrientes que nunca traen la gente de una en una.

## Fantasía y tema

Lente **rol**: dentro del tema hay alguien trabajando, y es el que se queda en la orilla viendo cómo otros no consiguen cruzar. El avatar es un puesto de socorro sobre ruedas que se desliza por la arena. Los «obstáculos» son en realidad víctimas: cada bañista que escapa por el borde no te mata a ti, te quita el puesto.

La sensación buscada es la del triaje: siempre hay dos personas a punto de irse por la cascada y solo munición para una. Elegir a cuál salvar, y cobrar el doble por la más difícil, es todo el juego.

## Mecánica central

- **Loop de 30 segundos:** miras qué carril está más comprometido, te colocas por delante del bañista, calculas el adelanto, disparas, y cuentas los flotadores que te quedan antes de comprometerte con el siguiente.
- **Entidades:**
  - **Puesto de socorro:** rectángulo de 44×22 con un mástil, se desliza por la orilla inferior a 200 px/s.
  - **Flotador:** anillo (dos círculos concéntricos) de 12 px de radio que sube en vertical a 380 px/s.
  - **Bañista:** cuerpo de 26×18 con una cabeza y dos brazos agitándose; se desplaza por su carril a la velocidad de la corriente.
  - **Carril de corriente:** franja de 96 px con sentido propio y líneas de espuma animadas.
  - **Boya de stock:** seis circulitos en la orilla que representan la munición disponible.
- **Reglas:**
  - El flotador impacta si la distancia entre su centro y el centro del bañista baja de 20 px.
  - Un bañista impactado se rescata, suma puntos y desaparece con una pequeña explosión de espuma.
  - Un bañista que alcanza su borde de escape resta una vida y se pierde para siempre.
  - Los carriles 1 y 3 arrastran hacia la derecha; los 2 y 4, hacia la izquierda.
  - Cada bañista aparece en un carril aleatorio, en el borde contrario a su escape.
  - Disparar cuesta un flotador del stock; sin stock no hay disparo, ni siquiera un clic en falso.
  - El stock recupera un flotador cada 900 ms hasta el máximo de 6.
- **Tensión:** el recurso escaso son los flotadores. La recarga de 900 ms es más lenta que el ritmo de aparición a partir del nivel 6, así que el juego se convierte en decidir qué rescates no vas a intentar.

## Controles

| Tecla   | Acción                         |
| ------- | ------------------------------ |
| ← / A   | Mover el puesto a la izquierda |
| → / D   | Mover el puesto a la derecha   |
| Espacio | Lanzar un flotador (vertical)  |

Sin ratón. Sin táctil. `Space` no dispara en ráfaga: cada disparo necesita un `keydown` nuevo.

## Sistema de puntuación

| Evento                                                | Puntos               |
| ----------------------------------------------------- | -------------------- |
| Rescatar un bañista en los carriles 1, 2 o 3          | +25                  |
| Rescatar un bañista en el carril 4 (corriente fuerte) | +50                  |
| Bañista perdido por la cascada                        | ±0 (cuesta una vida) |

El score solo sube y solo lo hace por impacto, que es un evento discreto y limitado por la munición. No se puede inflar disparando a lo loco: el stock finito y la recarga lenta imponen un techo duro de puntos por segundo, y el carril que paga doble es justo el que más lejos está y más rápido se mueve.

## Vidas, nivel y fin de partida

- **Vidas:** 5 iniciales, una menos por cada bañista que alcanza su borde de escape. El componente emite `onLivesChange(5)` al montar y en cada `restart()`, porque el HUD arranca en `useState(3)` y `GamePlayer.restart()` lo devuelve a 3 a ciegas.
- **Nivel:** `floor(rescates / 6) + 1` — sube la velocidad de la corriente y acorta el intervalo de aparición.
- **Fin de partida:** perder la quinta vida.

## Curva de dificultad y balance

| Nivel       | Velocidad de corriente | Intervalo de aparición | Bañistas simultáneos (típico) |
| ----------- | ---------------------- | ---------------------- | ----------------------------- |
| 1           | 70 px/s                | 1600 ms                | 1–2                           |
| 5           | 118 px/s               | 1240 ms                | 2–3                           |
| 10          | 178 px/s               | 790 ms                 | 4–5                           |
| 12+ (techo) | 190 px/s (tope)        | 610 ms                 | 5–6                           |
| 13+ (piso)  | 190 px/s (tope)        | 550 ms (piso)          | 6                             |

La corriente sube `+12 px/s` por nivel hasta topar en 190 px/s; el intervalo baja `-90 ms` por nivel hasta el piso de 550 ms. A partir del nivel 13 el juego ya no aprieta más: la partida termina por saturación de munición, no por velocidad imposible. Una partida mala dura unos 50 segundos; una buena pasa de los tres minutos y supera los 1000 puntos.

## Dirección de arte

- **Paleta:** el cian del catálogo para el agua y las líneas de espuma, con azul profundo para el fondo del cauce; la arena de la orilla en un ocre apagado; los flotadores en blanco y naranja de rescate; el borde de la cascada marcado con una franja magenta sucia que avisa del peligro.
- **Formas:** todo son círculos y rectángulos. El bañista es un rectángulo redondeado con un círculo de cabeza y dos líneas de brazos que oscilan con un seno. El flotador son dos círculos concéntricos. La espuma son segmentos horizontales que se desplazan a la velocidad del carril.
- **Fondo:** el cauce se dibuja con cuatro bandas de azul cada vez más oscuro hacia arriba, sugiriendo profundidad, y una franja de cascada parpadeante en cada borde de escape.
- **Concepto del `cover-boyas`:** tres formas — una franja horizontal de agua, un anillo blanco flotando en ella, y un punto pequeño a la deriva justo delante del anillo. Ánimo cromático: cian frío sobre azul profundo, con un acento naranja mínimo.

## Feedback y game feel

El impacto produce un anillo de espuma que se expande y desaparece en 350 ms, más seis partículas blancas, y un número flotante (`+25` o `+50`). Perder un bañista tiñe el borde de escape de magenta durante 400 ms y sacude el canvas 4 px. Cuando el stock llega a 0, las seis boyas de la orilla parpadean en rojo hasta que entra la primera recarga.

Dentro del canvas se dibujan dos indicadores que no caben en el HUD: el stock de flotadores (las seis boyas en la orilla, con la que está recargando dibujada a medias) y una marca de «corriente fuerte» sobre el carril 4, para que su bonus sea legible sin leer el manual.

## Referencias y anti-referencias

- **Se parece a:** las casetas de tiro de feria y al _Missile Command_ de interceptar cosas antes de que lleguen a su destino, con el giro moral de que los blancos son a quienes quieres salvar.
- **No se solapa con:**
  - **Asteroids** — allí la nave rota con inercia en un espacio abierto y los blancos se dividen al recibir impacto y te matan al tocarte; aquí la base se desliza en un eje, los blancos no se dividen y nunca te alcanzan a ti.
  - **Tetris** — allí colocas piezas en una grilla; aquí no hay grilla ni colocación, solo puntería en tiempo real.
  - **Arkanoid** — allí la pelota rebota indefinidamente y tú solo la rediriges; aquí el proyectil es de un solo uso, viaja recto y se pierde si falla.
  - **Snake** — allí el cuerpo crece por pasos discretos; aquí no hay avatar que crezca ni pasos.
  - **`invasores` (placeholder de Space Invaders)** — allí una formación desciende hacia ti y te dispara; aquí los blancos huyen lateralmente, nunca se acercan a la orilla y jamás disparan.
- **Diferencia con los otros dos juegos de este jam:**
  - **ASFALTO (GJ-01)** — allí tú eres el que cruza y esquiva; aquí te quedas en la orilla y actúas a distancia.
  - **VADO (GJ-03)** — allí construyes el camino para que otro cruce; aquí no se cruza nada, se rescata.

## Ideas descartadas

- **Lanzador con ángulo rotable.** Añadía trigonometría y una tecla más sin mejorar la decisión central, que es elegir a quién salvar y cuándo gastar munición.
- **Cuerda tensada que arrastra al bañista de vuelta a la orilla.** Visualmente precioso y mecánicamente caro: exigía una segunda fase de arrastre por rescate, con su propio estado y sus propias colisiones.
- **Bañistas que nadan contra corriente y se mueven en diagonal.** Rompía la lectura del adelanto necesario para acertar, que es justo la habilidad que el juego quiere enseñar.
