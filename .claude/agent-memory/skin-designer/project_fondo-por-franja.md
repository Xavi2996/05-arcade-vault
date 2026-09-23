---
name: fondo-por-franja
description: Cómo medir skins en juegos que pintan varias franjas de fondo (Frogger) en vez de un fondo único, y por qué la escalera de contraste se satura
metadata:
  type: project
---

Hay juegos que **no tienen un fondo único**: pintan zonas con su propio color y dibujan cada elemento
encima de su zona. Frogger es el primero (`riverBand` filas 1-6, `safeBand` filas 7 y 13, `roadBand`
filas 8-12, y `background` solo visible en la fila 0). Medir todo contra `background` da números
falsos y bonitos.

**How to apply:**

1. Medir cada rol **contra la franja sobre la que se dibuja**, no contra `background`. Los roles que
   atraviesan varias zonas (el jugador) se miden contra **todas** y la ficha lista las tres filas.
2. Medir también los **detalles interiores que reutilizan un color de franja** (vetas del tronco,
   escama de la tortuga, ruedas y parabrisas en Frogger): son un par elemento/franja más.
3. **Franjas entre sí:** exigir ≥ 1.5:1 solo a las que son **adyacentes en el layout**. En Frogger
   río y carretera nunca se tocan (la franja segura de la fila 7 los separa), así que su 1.00-1.17:1
   se declara como excepción y el presupuesto de luminancia se gasta donde importa.
4. **La escalera se satura rápido.** Con 4 elementos apilados sobre la misma franja (sumergida →
   tortuga → tronco → rana) el mínimo es `3 x 1.5^3 = 10.13`, y el techo lo pone el color más
   brillante disponible sobre esa franja. En el `neon` de Frogger el techo real era 14.34:1 y los
   pasos quedaron en 1.52-1.54: **cero holgura**. La palanca para ganar margen es **oscurecer la
   franja**, no subir los elementos. Escribirlo en Riesgos: cualquier retoque obliga a remedir los
   cuatro peldaños, no solo el que se movió.
5. En `retro` (4 tonos) los tonos se **comparten entre zonas** (coche y tronco pueden ser el mismo
   tono si nunca coexisten en la misma franja) y la escalera completa se exige **dentro** de cada
   zona. Las franjas se declaran como **sustrato apagado**, fuera del presupuesto de 4 tonos.

**Cuidado con los helpers de dibujo reutilizados:** en Frogger `frogShape()` se usa para la rana
(`frog` + `frogEye`), para la boca ocupada (`goalFilled` + `goalEmpty`) y para los **iconos de vida
del HUD** (`frog` + `hud`). Eso convierte `hud` vs `frog` en un par medible, y obligó a bajar el
texto del HUD de `neon` de `#cfffe6` (1.22:1 contra la rana) a `#45c48e` (1.64:1). Antes de elegir un
hex de HUD, comprobar si el código lo usa como detalle de otra silueta.

Relacionado: [[skins-progreso]], [[criterio-piezas-multicolor]], [[acento-css-por-juego]].
