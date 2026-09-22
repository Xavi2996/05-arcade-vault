---
name: paleta-desde-spritesheet
description: Cómo extraer los hex reales de un juego que pinta con spritesheet PNG (Arkanoid) y por qué las etiquetas de color del código no sirven
metadata:
  type: project
---

Cuando un juego de Arcade Vault pinta con **spritesheet PNG** en vez de `fillStyle`, la paleta de
`clasico` no está en ningún archivo de texto del repo: hay que **leer los píxeles**. El proyecto ya
tiene `sharp` en `node_modules` (dependencia transitiva de Next), así que sirve:

```bash
node -e 'const sharp=require("sharp"); sharp(F).ensureAlpha().raw().toBuffer({resolveWithObject:true}).then(({data,info})=>{ /* histograma de la región sx,sy,sw,sh y quedarse con el tono dominante */ })'
```

Se recorta cada región usando las coordenadas del objeto `SPRITES` del propio componente y se toma el
color **dominante** de cada banda (base / brillo / sombra / contorno), ignorando los píxeles con
`alpha < 10`.

**Trampa confirmada en Arkanoid (2026-09-22):** las etiquetas del tipo `BlockColor`
(`gray|red|yellow|cyan|magenta|hotpink|green`) **no describen el píxel**. `cyan` es menta `#4fc99c`,
`magenta` es violeta `#632ff4`, `hotpink` es naranja `#fc7d1c` y `green` es azul `#44aaf3`. Diseñar
contra la etiqueta en vez de contra el tono real cambiaría el aspecto de los cinco niveles.

**La misma trampa, confirmada en Snake (2026-09-22):** las claves de `components/games/snake-sprites.ts`
tampoco describen el dibujo — `garlic` es morado, `banana` es naranja, `lemon` es verde. Las
coordenadas se copiaron literalmente de la fuente sin revisar las etiquetas. Regla general: **en este
repo, el nombre de un sprite nunca es evidencia de su color.**

**Why:** un spritesheet hace que ninguna skin se pueda aplicar cambiando una constante — la ficha
debe elegir entre tintado en carga (`globalCompositeOperation = "source-atop"` sobre canvases
offscreen cacheados) o PNGs alternos por skin, y decirlo en vez de inventar hex inaplicables.
**How to apply:** ante un juego con `drawImage`, medir los píxeles antes de escribir nada, mapear
etiqueta → tono real en una tabla de la ficha, y cerrar con las dos vías de implementación.

Relacionado: [[skins-progreso]], [[criterio-piezas-multicolor]].
