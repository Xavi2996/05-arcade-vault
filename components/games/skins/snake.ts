import type { SkinPalettes } from "@/lib/skins";

/**
 * Paletas de SNAKE. Todos los hex y sus ratios de contraste salen de la ficha
 * de `references/game-themes.md` (diseñada 2026-09-22). Ojo: Snake **no** pinta
 * sobre `#000` — cada skin declara su propio fondo y todo se midió contra él.
 * No edites un color aquí sin volver a medirlo y actualizar la ficha.
 *
 * Solo hay tres roles jugables (cabeza, cuerpo, fruta), así que caben tres
 * escalones de 1.5:1 en el rango útil: aquí el umbral entre pares se exige
 * **sin excepciones**, a diferencia de Tetris.
 */
export interface SnakePalette {
  /** Fondo del canvas. Distinto en cada skin. */
  background: string;
  /** Rejilla 20x20. Rol decorado: basta con ≥ 1.5:1. */
  grid: string;
  /** Cabeza de la serpiente. */
  head: string;
  /** Cuerpo de la serpiente. */
  body: string;
  /**
   * Tinte plano de la fruta. `null` = se dibuja el PNG tal cual (el caso de
   * `clasico`). El color de la fruta no está en el código: vive en
   * `/games/snake/fruits.png`, así que la única vía es retintar por composición.
   */
  fruitTint: string | null;
  /** Borde de 1px del canvas. */
  border: string;
  /** Glow del marco, en CSS. `null` = apagado (el caso de `retro`). */
  glow: string | null;
}

export const SNAKE_SKINS: SkinPalettes<SnakePalette> = {
  // Transcripción literal de los hex del componente. Arrastra deuda medida
  // sobre los píxeles del PNG: rejilla a 1.11:1, dos frutas por debajo del 3:1
  // (garlic 2.62:1, cherry 2.95:1) y peach camuflándose en el cuerpo (1.19:1,
  // verde sobre verde). Es la línea base, no un rediseño.
  clasico: {
    background: "#04120a",
    grid: "rgba(0, 255, 140, 0.06)", // compone #042012 · 1.11:1
    head: "#7dffb0", // 15.33:1
    body: "#22c55e", // 8.41:1
    fruitTint: null, // el PNG original, sin tocar
    border: "rgba(0, 255, 140, 0.35)", // compone #07603b · 2.58:1
    glow: "rgba(0, 255, 140, 0.15)", // compone #092f22 · 1.36:1
  },

  // Ancla de catálogo: green (--green) en la SERPIENTE — es un juego de un solo
  // color y esconder el verde en el decorado no tendría sentido. La fruta se va
  // al magenta para que el objetivo nunca comparta matiz con la serpiente.
  neon: {
    background: "#020d08",
    // 0.20 de alpha no es negociable: a 0.16 daba 1.42:1.
    grid: "rgba(0, 255, 136, 0.20)", // compone #023d22 · 1.59:1
    head: "#00ff88", // --green · 14.72:1
    // Deliberadamente apagado. Los tres roles tienen que escalonarse
    // 14.72 → 7.03 → 4.29; subirlo a verde brillante rompe fruta/cuerpo.
    body: "#00874a", // 4.29:1
    // No puede ser --magenta #ff006e puro: contra el cuerpo daba 1.24:1.
    // Mismo matiz subido en luminancia hasta pasar el umbral (1.64:1).
    fruitTint: "#ff5cb8", // 7.03:1
    border: "rgba(0, 255, 136, 0.60)", // compone #049d58 · 5.61:1
    glow: "rgba(0, 255, 136, 0.30)", // compone #075433 · 2.19:1
  },

  // Fósforo verde P1, la familia que el propio juego ya sugiere. 4 tonos, sin
  // glow, sin gradientes, sin alpha. Escalones: 1.61:1 · 1.78:1 · 2.12:1.
  retro: {
    background: "#020a02",
    // Deja de ser rgba: rgba(51,255,51,0.18) daba 1.48:1, fallaba por dos
    // centésimas. Sólido es además lo correcto para un fósforo sin capas.
    grid: "#0b5c0b", // P1-4 · 2.44:1
    head: "#00cc00", // P1-2 · 9.21:1
    body: "#149614", // P1-3 · 5.16:1
    // La fruta se lleva el tono MÁS brillante, no la cabeza: es una celda entre
    // 400 y es el objetivo del juego. En un CRT monocromo el objetivo destella.
    fruitTint: "#33ff33", // P1-1 · 14.80:1
    border: "#0b5c0b", // P1-4 · 2.40:1 sobre --bg
    glow: null, // apagado: el fósforo no tiene halo
  },
};
