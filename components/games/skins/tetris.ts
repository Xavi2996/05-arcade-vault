import type { SkinPalettes } from "@/lib/skins";

/**
 * Paletas de TETRIS. Todos los hex y sus ratios de contraste salen de la ficha
 * de `references/game-themes.md` (diseñada 2026-09-22, medida contra `#000`).
 * No edites un color aquí sin volver a medirlo y actualizar la ficha.
 */

/** `solid` rellena la celda; `hollow` deja un anillo y vacía el interior. */
export type BlockFill = "solid" | "hollow";

export interface TetrisPalette {
  /** Fondo del tablero y del canvas de vista previa. */
  background: string;
  /** Rejilla del tablero. Rol decorado: basta con ≥ 1.5:1. */
  grid: string;
  /** Brillo de 4px en el borde superior de cada bloque. */
  gloss: string;
  /** Colores de las 8 piezas, en orden I, O, T, S, Z, J, L, N. */
  pieces: string[];
  /** Relleno de cada pieza, mismo orden que `pieces`. */
  fills: BlockFill[];
  ghost: {
    alpha: number;
    /** `null` = el fantasma hereda el color de su pieza. */
    color: string | null;
  };
  /** Color de la etiqueta DOM "SIGUIENTE". Rol texto: ≥ 4.5:1. */
  nextLabel: string;
}

const SOLID_8: BlockFill[] = Array(8).fill("solid");

export const TETRIS_SKINS: SkinPalettes<TetrisPalette> = {
  // Transcripción literal del array COLORS original. Arrastra deuda visual
  // conocida y medida: fantasma 1.22–1.49:1, grid 1.14:1, etiqueta 2.64:1, y
  // dos pares confundibles (I/J 1.05:1, L/O 1.23:1). Se conserva tal cual
  // porque es la línea base contra la que se comparan las otras dos.
  clasico: {
    background: "#000",
    grid: "rgba(255,255,255,0.08)",
    gloss: "rgba(255,255,255,0.12)",
    pieces: [
      "#4dd0e1", // I · 11.43:1
      "#ffd54f", // O · 14.88:1
      "#ba68c8", // T · 5.90:1
      "#81c784", // S · 10.44:1
      "#e57373", // Z · 7.03:1
      "#90caf9", // J · 12.00:1
      "#ffb74d", // L · 12.13:1
      "#9e9e9e", // N · 7.84:1
    ],
    fills: SOLID_8,
    ghost: { alpha: 0.2, color: null },
    nextLabel: "var(--ink-faint)",
  },

  // Ancla de catálogo: magenta (--magenta). Tiñe el entorno —grid, glow del
  // gabinete, etiqueta— en vez de una pieza: como color de pieza chocaba con
  // la Z (1.17:1). Las 8 piezas van de 4.57:1 a 19.19:1 y todos los pares
  // vecinos en matiz superan 1.5:1.
  neon: {
    background: "#000",
    // Sube el grid del 1.14:1 del default a 1.78:1.
    grid: "rgba(255,0,110,0.45)",
    gloss: "rgba(255,255,255,0.18)",
    pieces: [
      "#00f5ff", // I · --cyan · 15.50:1
      "#f5ff00", // O · --yellow · 19.19:1
      "#b026ff", // T · 4.57:1
      "#14cc70", // S · 9.90:1
      "#ff5c5c", // Z · 6.94:1
      "#7aa5ff", // J · 8.65:1
      "#ffb300", // L · 11.70:1
      "#c7d0e0", // N · --silver · 13.53:1
    ],
    fills: SOLID_8,
    // 0.40 no es negociable: a 0.35 el fantasma de la T se quedaba en 1.45:1;
    // a 0.40 el peor caso da exactamente 1.52:1.
    ghost: { alpha: 0.4, color: null },
    nextLabel: "#ff4fa3",
  },

  // Fósforo ámbar de gabinete: 4 tonos, cada escalón > 1.5:1. Cuatro tonos no
  // son ocho piezas, así que la otra mitad se separa por relleno hueco. El
  // emparejamiento deja los pares espejo separados por tono, no solo por
  // forma: S vs Z = 2.62:1, J vs L = 2.74:1.
  retro: {
    background: "#000",
    grid: "rgba(255,176,0,0.28)",
    gloss: "rgba(255,224,163,0.22)",
    pieces: [
      "#ffe0a3", // I · 16.44:1
      "#f0a300", // O · 9.94:1
      "#c47d00", // T · 6.28:1
      "#ffe0a3", // S · 16.44:1
      "#c47d00", // Z · 6.28:1
      "#f0a300", // J · 9.94:1
      "#8f5a00", // L · 3.63:1
      "#8f5a00", // N · 3.63:1
    ],
    fills: [
      "solid", // I · barra
      "solid", // O · cuadrado
      "solid", // T
      "hollow", // S
      "hollow", // Z
      "hollow", // J
      "hollow", // L
      "solid", // N · silueta única (anillo 3x3)
    ],
    // Tono fijo, no heredado: con #8f5a00 al 0.30 el fantasma caería a 1.1:1.
    // #ffb000 al 0.30 sobre #000 compone #4d3500 → 1.82:1.
    ghost: { alpha: 0.3, color: "#ffb000" },
    nextLabel: "#ffb000",
  },
};
