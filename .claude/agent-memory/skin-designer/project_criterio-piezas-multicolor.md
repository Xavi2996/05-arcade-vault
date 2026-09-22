---
name: criterio-piezas-multicolor
description: Cómo aplicar el umbral de 1.5:1 entre elementos cuando un juego tiene más de 5 elementos que distinguir entre sí
metadata:
  type: project
---

Cuando un juego tiene **más de ~5 elementos** que el jugador debe distinguir entre sí, el umbral de
≥ 1.5:1 de luminancia **no se puede aplicar a todos los pares**. Se aplica solo a: (a) pares que
comparten familia de matiz (Δtono ≲ 45°) y (b) elemento vs su variante fantasma/alpha. Los pares con
matiz muy separado, o un elemento acromático frente a uno saturado, se declaran como excepción
justificada en la ficha — nunca se ocultan.

**Why:** es aritmética, no pereza. Con ≥ 3:1 obligatorio contra `#000`, el rango útil va de 3:1 a
21:1 — un factor 7 total. A 1.5x por escalón solo caben ~5 niveles (`1.5^4 = 5.06`, `1.5^5 = 7.59`
ya se sale del rango). Tetris tiene 8 piezas: separarlas todas por luminancia es imposible, punto.

**How to apply:** en cualquier juego con muchos elementos coloreados, escribir esta aritmética
explícita en la sección **Diferenciación** de la ficha antes de listar los pares, medir los pares
vecinos en matiz, y nombrar una por una las excepciones con su motivo (acromático, silueta única).
Para la skin `retro`, donde los 4 tonos nunca alcanzan, la diferenciación pasa a **relleno**
(sólido vs hueco) y hay que declarar que el juego necesita soporte de modo de relleno en su función
de dibujo.

Relacionado: [[skins-progreso]].
