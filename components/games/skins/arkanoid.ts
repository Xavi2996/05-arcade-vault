import type { SkinPalettes } from "@/lib/skins";

/**
 * Paletas de ARKANOID. Todos los hex y sus ratios de contraste salen de la
 * ficha de `references/game-themes.md` (diseñada 2026-09-22, medida contra
 * `#000`). No edites un color aquí sin volver a medirlo y actualizar la ficha.
 *
 * Arkanoid es el único juego cuyo color **no está en el código**: vive en
 * `public/games/arkanoid/spritesheet-breakout.png`. Los hex de `clasico` se
 * extrajeron leyendo los píxeles del PNG, y `neon` / `retro` solo son
 * alcanzables retintando ese spritesheet en carga.
 */

/**
 * Las siete etiquetas del juego. **Mienten**: no describen el píxel que pinta
 * el spritesheet — `cyan` es menta, `magenta` es violeta, `hotpink` es naranja
 * y `green` es azul. Toda paleta se escribe contra la etiqueta, pero se diseña
 * contra el tono real. Renombrarlas sería un refactor aparte.
 */
export type BlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

/**
 * Bandas reales del sprite de la paleta en el PNG, medidas con `sharp`. El
 * retintado las usa como clasificador: cada píxel opaco se asigna a la banda
 * más cercana en RGB y se sustituye por el color que la skin le asigne. El
 * contorno negro entra en la clasificación para quedarse como está — recorta
 * el sprite y en las tres skins se funde con el fondo.
 */
export const PADDLE_SOURCE_BANDS = {
  body: "#babac5",
  gloss: "#f6f2f2",
  glossHi: "#ffffff",
  accent: "#ff4545",
  accentShadow: "#af2a44",
  outline: "#000000",
} as const;

export interface ArkanoidPalette {
  /** Fondo del canvas. */
  background: string;
  /**
   * Tinte plano de la pelota. `null` = el PNG tal cual (el caso de `clasico`).
   * Un `null` aquí desactiva el retintado del spritesheet entero.
   */
  ball: string | null;
  /**
   * Paleta del jugador, por bandas: el tinte plano borraría el bisel y el
   * acento, así que estas tres se mapean desde `PADDLE_SOURCE_BANDS`
   * (`gloss`+`glossHi` → `gloss`, `accent`+`accentShadow` → `accent`).
   */
  paddle: {
    body: string;
    gloss: string;
    accent: string;
  };
  /** Un tinte plano por fila de bloques. Las explosiones heredan el suyo. */
  blocks: Record<BlockColor, string>;
}

export const ARKANOID_SKINS: SkinPalettes<ArkanoidPalette> = {
  // Transcripción de los píxeles del spritesheet. `ball: null` corta el
  // retintado: el PNG se dibuja tal cual, como hoy. Arrastra deuda medida:
  // pelota y paleta son el mismo #babac5 (1.00:1), el bloque gray se queda en
  // 1.65:1, y la pelota cae por debajo de 1.5:1 contra cuatro filas.
  clasico: {
    background: "#000",
    ball: null,
    paddle: {
      body: "#babac5", // 10.92:1
      gloss: "#f6f2f2", // 18.90:1
      accent: "#ff4545", // 6.19:1
    },
    blocks: {
      gray: "#323142", // 1.65:1 · deuda
      red: "#c02a3e", // 3.64:1 · carmín
      yellow: "#d9bd4c", // 11.33:1 · mostaza
      cyan: "#4fc99c", // 10.17:1 · menta
      magenta: "#632ff4", // 3.24:1 · violeta
      hotpink: "#fc7d1c", // 8.09:1 · naranja
      green: "#44aaf3", // 8.29:1 · azul
    },
  },

  // Ancla de catálogo: cyan (--cyan). El cyan puro vive en el glow CSS del
  // gabinete, no en el canvas: a 15.50:1 chocaba con la pelota (1.35:1) y la
  // pelota es el objeto que nunca se puede perder. Los siete bloques conservan
  // su matiz real, solo que saturados: los cinco niveles se ven como hoy.
  neon: {
    background: "#000",
    // Blanco puro es el único valor que se separa >= 1.5:1 de los siete
    // bloques a la vez (peor caso yellow, 1.79:1). Arregla de un golpe los
    // cuatro pares rotos de clasico.
    ball: "#ffffff", // 21.00:1
    paddle: {
      // No puede ser #00f5ff: contra la pelota blanca daba 1.35:1. A #0b7d92
      // sube a 4.81:1, y el cyan brillante se recupera en la banda de brillo.
      body: "#0b7d92", // 4.36:1
      gloss: "#5fd8e8", // 12.47:1
      // Rosa y no --magenta puro: #ff006e daba 1.23:1 contra el cuerpo cyan.
      accent: "#ff4d94", // 6.74:1
    },
    blocks: {
      // --silver, no un azul acerado: contra el bloque `green` un #8892b0 daba
      // 1.07:1 compartiendo familia de matiz. Además saca a `gray` del 1.65:1.
      gray: "#c7d0e0", // --silver · 13.53:1
      red: "#ff3860", // 5.99:1
      yellow: "#e0c000", // 11.71:1
      cyan: "#00c9a7", // 9.91:1
      magenta: "#9b5cff", // 5.37:1
      hotpink: "#ff8c1a", // 9.02:1
      green: "#3d8bff", // 6.34:1
    },
  },

  // Fósforo ámbar de gabinete: 4 tonos, misma escala calibrada que TETRIS a
  // propósito — `retro` es el monitor monocromo de la máquina, un acabado de
  // plataforma, no una identidad por juego.
  retro: {
    background: "#000",
    ball: "#ffe0a3", // A1 · 16.44:1
    paddle: {
      body: "#f0a300", // A2 · 9.94:1 · contra la pelota 1.65:1
      gloss: "#f0a300", // el fósforo no tiene banda de brillo
      accent: "#c47d00", // A3 · 6.28:1 · la "banda inferior" de la paleta
    },
    // Los 7 bloques se agrupan en 3 tonos RESPETANDO el orden de luminancia
    // del original, para que los patrones de los cinco niveles conserven su
    // estructura de claros y oscuros. De paso, `gray` pasa de 1.65:1 a 3.63:1.
    blocks: {
      yellow: "#f0a300", // A2 · original 11.33
      cyan: "#f0a300", // A2 · original 10.17
      hotpink: "#c47d00", // A3 · original 8.09
      green: "#c47d00", // A3 · original 8.29
      red: "#8f5a00", // A4 · original 3.64
      magenta: "#8f5a00", // A4 · original 3.24
      gray: "#8f5a00", // A4 · original 1.65 → 3.63:1
    },
  },
};
