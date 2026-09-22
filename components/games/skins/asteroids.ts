import type { SkinPalettes } from "@/lib/skins";

/**
 * Paletas de ASTEROIDS. Todos los hex y sus ratios de contraste salen de la
 * ficha de `references/game-themes.md` (diseñada 2026-09-22, medida contra
 * `#000`). No edites un color aquí sin volver a medirlo y actualizar la ficha.
 *
 * Asteroids es vectorial: todo es `stroke()` salvo la bala. No existe el
 * recurso "relleno hueco vs sólido" que usa Tetris para desdoblar tonos —
 * aquí la diferenciación no cromática es geometría y posición.
 */
export interface AsteroidsPalette {
  /** Fondo del canvas. */
  background: string;
  /** Contorno de la nave. */
  ship: string;
  /** Contorno del asteroide. */
  asteroid: string;
  /** Disco lleno de la bala. */
  bullet: string;
  /** Marco del power-up `3x`. */
  powerUp: string;
  /** Glifo `3x` dentro del marco. Rol texto: ≥ 4.5:1. */
  powerUpText: string;
  /** Llama de empuje, en la cola de la nave. */
  thrust: string;
  /** Llama de frenado, en la nariz de la nave. */
  reverse: string;
  /**
   * Canal RGB de las partículas de explosión, sin alpha: el alpha lo pone
   * `Particle.draw()` en cada frame decayendo de 1 a 0. Formato `"r,g,b"`.
   */
  particleRgb: string;
}

export const ASTEROIDS_SKINS: SkinPalettes<AsteroidsPalette> = {
  // Transcripción literal del código original: el vector monocromo de 1979 con
  // dos añadidos de color (power-up cyan y las dos llamas). Arrastra deuda
  // visual conocida y medida: nave, asteroide y bala son el mismo #ffffff
  // (1.00:1 entre los tres) y el power-up queda en 1.25:1 contra el asteroide.
  // Se conserva tal cual porque es la línea base, no un rediseño.
  clasico: {
    background: "#000",
    ship: "#ffffff", // 21.00:1
    asteroid: "#ffffff", // 21.00:1
    bullet: "#ffffff", // 21.00:1
    powerUp: "#00ffff", // 16.75:1
    powerUpText: "#00ffff", // 16.75:1
    thrust: "rgba(255, 130, 0, 0.85)", // compone #d96e00 · 6.18:1
    reverse: "rgba(0, 210, 255, 0.85)", // compone #00b2d9 · 8.37:1
    particleRgb: "255,255,255",
  },

  // Ancla de catálogo: yellow (--yellow) en la NAVE — en un shooter el color de
  // categoría va en lo que el jugador controla, no en el entorno. Los seis
  // elementos cromáticos caben bajo el umbral donde la aritmética de luminancia
  // se rompe, así que los pares críticos sí pasan 1.5:1.
  neon: {
    background: "#000",
    ship: "#f5ff00", // --yellow · 19.19:1
    // No puede ser #00f5ff puro: contra la nave daba 1.24:1, y es el par más
    // crítico del juego. A #00a8c8 sube a 2.58:1 y sigue en 7.44:1 sobre fondo.
    asteroid: "#00a8c8", // 7.44:1
    bullet: "#ffffff", // 21.00:1
    // No puede ser #ff006e: contra el asteroide daba 1.36:1 (premio vs cosa que
    // te mata). Con --green el par crítico sube a 2.11:1.
    powerUp: "#00ff88", // --green · 15.66:1
    powerUpText: "#00ff88", // --green · 15.66:1
    thrust: "#ff006e", // --magenta · 5.48:1
    reverse: "#00f5ff", // --cyan · 15.50:1
    particleRgb: "255,255,255",
  },

  // Fósforo ámbar P3 de gabinete: 3 tonos bastan para un juego vectorial.
  // A1 #ffe8c4 17.59:1 · A2 #ffb000 11.46:1 · A3 #a86a00 4.73:1.
  // Escalones: A1/A2 1.53:1 · A2/A3 2.43:1 · A1/A3 3.72:1.
  retro: {
    background: "#000",
    ship: "#ffb000", // A2 · 11.46:1
    asteroid: "#a86a00", // A3 · 4.73:1
    bullet: "#ffe8c4", // A1 · 17.59:1
    powerUp: "#ffe8c4", // A1 · 17.59:1
    powerUpText: "#ffe8c4", // A1 · 17.59:1
    // Las dos llamas se separan por tono (3.72:1), no por matiz: el monocromo
    // no tiene el recurso naranja-vs-cyan del clasico.
    thrust: "#ffe8c4", // A1 · 17.59:1
    reverse: "#a86a00", // A3 · 4.73:1
    // Blanco rompería la monocromía del fósforo; mismo decaimiento de alpha.
    particleRgb: "255,176,0",
  },
};
