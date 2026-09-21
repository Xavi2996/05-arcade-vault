# ASFALTO — diseño de juego

> **Jam:** Cruza la carretera y el río sin convertirte en papilla · **Concepto:** 1 de 3 · **Estado:** Borrador
> **Spec de integración:** [`./spec.md`](./spec.md)
> **Fecha:** 2026-09-21

## Pitch

Caminas a pie por una avenida de seis carriles y cada franja que superas vale diez puntos, pero si la superas rozando un parachoques vale treinta. Te mata la impaciencia: el juego te paga por hacer exactamente lo que no deberías hacer.

## Fantasía y tema

Lente **literal**: el objeto del tema es la carretera misma, con sus carriles, sus sentidos alternos y sus vehículos. El avatar es un peatón cabezón de dieciséis píxeles que decidió no usar el paso de cebra. Los obstáculos son coches y camiones que no frenan nunca y no te ven. La sensación buscada es la del cruce imprudente: ese medio segundo en el que ya te comprometiste y solo queda seguir andando.

La palabra «papilla» del tema se paga literalmente: el atropello dispara una salpicadura de partículas y un parpadeo del carril culpable.

## Mecánica central

- **Loop de 30 segundos:** miras el hueco, entras al carril, mides si te da tiempo, decides si sales limpio o si apuras para cobrar el triple, y repites seis veces hasta la acera de enfrente.
- **Entidades:**
  - **Peatón:** cuadrado de 16×16 con dos píxeles de cabeza, se mueve libre a 150 px/s en cuatro direcciones, sin inercia.
  - **Coche:** rectángulo de 48×30 con dos ventanillas oscuras; viaja recto por su carril a velocidad fija.
  - **Camión:** el mismo rectángulo con ancho 84; aparece a partir del nivel 3 en los carriles lentos.
  - **Carril:** franja horizontal de 56 px con sentido y velocidad propios, y un flag de «ya puntuado en este tramo».
- **Reglas:**
  - Colisión AABB entre peatón y vehículo: pierdes una vida y reapareces en la banda de salida.
  - Cruzar por primera vez la frontera superior de un carril lo marca como puntuado y suma puntos.
  - Un carril puntuado no vuelve a pagar hasta que se regenere el tramo, ni siquiera tras morir.
  - Llegar a la banda de meta regenera el tramo entero: nuevas velocidades, nuevos sentidos, carriles otra vez puntuables.
  - Los carriles alternan sentido (impares hacia la derecha, pares hacia la izquierda) y cada uno tiene una velocidad entre el 80 % y el 130 % de la velocidad base del nivel.
  - Tras el atropello hay 1200 ms de invulnerabilidad con parpadeo a 8 Hz.
  - Los vehículos se generan con un hueco mínimo garantizado de 110 px entre uno y el siguiente.
- **Tensión:** el recurso escaso son las vidas, pero la tensión real es la codicia: el triple de puntos solo llega si aceptas cruzar cuando todavía hay un coche encima.

## Controles

| Tecla | Acción                     |
| ----- | -------------------------- |
| ↑ / W | Avanzar hacia la meta      |
| ↓ / S | Retroceder hacia la salida |
| ← / A | Desplazarse a la izquierda |
| → / D | Desplazarse a la derecha   |

Sin ratón. Sin táctil. Las teclas se leen por estado (`keydown`/`keyup` sobre un set), no por repetición del sistema.

## Sistema de puntuación

| Evento                                                           | Puntos |
| ---------------------------------------------------------------- | ------ |
| Cruzar un carril nuevo del tramo                                 | +10    |
| Cruzarlo con un coche de ese carril a menos de 24 px («al filo») | +30    |
| Llegar a la banda de meta                                        | +0     |

El score solo sube y solo lo hace en el instante del cruce, que es un evento único por carril y por tramo. No hay ninguna acción repetible sin avanzar que genere puntos, así que la única forma de subir el marcador es seguir cruzando avenidas cada vez más rápidas. Llegar a la meta no paga: su recompensa es el tramo nuevo, es decir, seis carriles frescos que sí pagan.

## Vidas, nivel y fin de partida

- **Vidas:** 3 iniciales, una menos por atropello. El HUD arranca en 3 por defecto, así que el valor coincide desde el primer frame; aun así el componente emite `onLivesChange(3)` al montar y al reiniciar.
- **Nivel:** `floor(carrilesCruzados / 8) + 1` — cada nivel sube la velocidad base del tráfico.
- **Fin de partida:** perder la tercera vida. No hay otra condición de derrota.

## Curva de dificultad y balance

| Nivel       | Velocidad base  | Camiones               | Hueco medio entre vehículos |
| ----------- | --------------- | ---------------------- | --------------------------- |
| 1           | 90 px/s         | no                     | ~190 px                     |
| 5           | 154 px/s        | sí, carriles lentos    | ~150 px                     |
| 10          | 234 px/s        | sí, hasta 2 por carril | ~120 px                     |
| 12+ (techo) | 260 px/s (tope) | igual que nivel 10     | 110 px (mínimo garantizado) |

La velocidad base sube `+16 px/s` por nivel y se topa en 260 px/s a partir del nivel 12; el hueco mínimo nunca baja de 110 px, así que siempre existe una ventana de paso. Una partida mala dura unos 40 segundos (tres atropellos en el primer o segundo tramo). Una partida buena ronda los tres minutos y llega al nivel 10 con unos 900 puntos.

## Dirección de arte

- **Paleta:** el amarillo del catálogo para la señalización, las líneas discontinuas y el HUD interno; asfalto en gris muy oscuro casi negro; los coches en cian frío y magenta apagado para distinguir sentidos; la salpicadura del atropello en un rojo sucio.
- **Formas:** el peatón es un rectángulo con un rectángulo menor encima; los vehículos son rectángulos con dos ventanillas oscuras y dos puntos de faro; las líneas de carril son segmentos discontinuos dibujados con `setLineDash`.
- **Fondo:** bandas de acera texturizadas con puntos en la salida y la meta, y el asfalto liso en medio. Un ligero degradado vertical sugiere el farol de la esquina.
- **Concepto del `cover-asfalto`:** tres formas — una franja diagonal oscura (el asfalto), una línea discontinua amarilla cruzándola, y un cuadradito claro a medio camino (el peatón atrapado). Ánimo cromático: negro alquitrán con amarillo de señal, tenso y nocturno.

## Feedback y game feel

Cada cruce válido dispara un destello en la frontera del carril y un número flotante (`+10` o `+30`) que sube y se desvanece en 600 ms; el `+30` sale en amarillo brillante y con el doble de tamaño. El atropello congela el juego 120 ms, sacude el canvas 6 px durante 200 ms y lanza doce partículas rectangulares rojas. La invulnerabilidad se lee por el parpadeo del peatón.

Dentro del canvas se dibujan dos cosas que no caben en el HUD: la barra de progreso del tramo (seis marcas en el borde izquierdo, una por carril, encendidas al puntuar) y el indicador de velocidad del tráfico en la esquina superior derecha, en texto monoespaciado pequeño.

## Referencias y anti-referencias

- **Se parece a:** el cruce de los primeros minutos de _Freeway_ de Activision y a los tramos peatonales de _Paperboy_, pero con movimiento analógico y recompensa por el riesgo.
- **No se solapa con:**
  - **Asteroids** — allí el verbo es disparar y rotar con inercia en un espacio sin fricción; aquí no hay disparo ni rotación, y el movimiento es directo y sin deriva.
  - **Tetris** — allí colocas piezas en una grilla discreta; aquí no hay grilla ni colocación, solo un avatar en movimiento continuo.
  - **Arkanoid** — allí controlas una paleta en un eje y la pelota hace el trabajo; aquí controlas al avatar en dos ejes y no hay proyectil propio.
  - **Snake** — allí el cuerpo crece y el peligro es tu propio rastro por pasos discretos; aquí no hay rastro, ni crecimiento, ni pasos.
  - **`ranaria` (placeholder de Frogger en el catálogo)** — Frogger salta de casilla en casilla y su mitad superior es un río con troncos; ASFALTO es movimiento continuo, sin casillas, sin agua y sin plataformas móviles.
- **Diferencia con los otros dos juegos de este jam:**
  - **BOYAS (GJ-02)** — allí disparas desde una posición fija a objetivos que huyen; aquí eres tú quien atraviesa el peligro.
  - **VADO (GJ-03)** — allí colocas piezas en una grilla y otro personaje camina solo; aquí controlas directamente al que cruza.

## Ideas descartadas

- **Añadir la mitad de río con troncos flotantes.** Doblaba el número de sistemas (plataformas móviles que arrastran al jugador) y pisaba de lleno tanto a `ranaria` como a los otros dos conceptos del jam.
- **Scroll vertical infinito de la avenida.** Más vistoso, pero obliga a generar y reciclar carriles fuera de pantalla; este era el concepto de esfuerzo bajo del trío y el tramo con regeneración logra lo mismo con una fracción del código.
- **Un semáforo global que detiene todos los carriles cada cierto tiempo.** Daba respiro pero rompía la curva: el jugador esperaría el semáforo y el juego se convertiría en un juego de paciencia en vez de uno de reflejos.
