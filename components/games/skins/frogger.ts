import type { SkinPalettes } from "@/lib/skins";

/**
 * Paletas de FROGGER. Todos los hex y sus ratios de contraste salen de la ficha
 * de `references/game-themes.md` (diseñada 2026-09-23).
 *
 * Ojo con la peculiaridad de este juego: **no hay un fondo único**. Cada zona
 * pinta su propia franja sobre `background`, y `background` solo queda a la
 * vista en la fila 0 (bocas + HUD interno). Por eso cada rol está medido contra
 * la franja sobre la que de verdad se dibuja, y la rana contra las tres.
 * No edites un color aquí sin volver a medirlo contra SU franja y actualizar la
 * ficha.
 */
export interface FroggerPalette {
  /** Fondo base. Solo visible en la fila 0 (bocas + HUD). */
  background: string;
  /** Franja de carretera, filas 8-12. */
  roadBand: string;
  /** Franja de río, filas 1-6. */
  riverBand: string;
  /** Franjas seguras, filas 7 y 13. */
  safeBand: string;
  /** Coches. Sus ruedas y parabrisas se pintan en `roadBand`. */
  car: string;
  /** Camiones. Sus ruedas y franja de cabina se pintan en `roadBand`. */
  truck: string;
  /** Troncos. Sus vetas se pintan en `riverBand`. */
  log: string;
  /** Tortugas visibles (dan soporte). Su escama se pinta en `riverBand`. */
  turtle: string;
  /**
   * Tortugas sumergidas: NO dan soporte. Se dibuja solo como contorno de 2 px,
   * la menor superficie del juego para la decisión más letal — por eso `neon` y
   * `retro` le dan margen por encima del 3:1 mínimo.
   */
  turtleSubmerged: string;
  /** Cuerpo de la rana. Reutilizado como cuerpo de los iconos de vida del HUD. */
  frog: string;
  /** Ojos de la rana. */
  frogEye: string;
  /** Boca destino libre. Se dibuja con un contorno de 2 px en `goalFilled`. */
  goalEmpty: string;
  /** Boca destino ocupada, y silueta de rana dentro de la boca. */
  goalFilled: string;
  /** Texto del HUD interno (12 px) y OJO de los iconos de vida sobre `frog`. */
  hud: string;
  /** Barra de tiempo. Un solo color: la urgencia va por longitud y parpadeo. */
  timerBar: string;
  /** Borde de 1px del canvas. */
  border: string;
  /** Glow del marco, en CSS. `null` = apagado (el caso de `retro`). */
  glow: string | null;
}

export const FROGGER_SKINS: SkinPalettes<FroggerPalette> = {
  // Transcripción literal de la paleta borrador del componente. Los seis pares
  // obligatorios pasan, pero arrastra deuda medida CONTRA LAS FRANJAS: tortuga
  // sumergida 1.55:1 sobre el agua (la peor, y con la menor superficie del
  // juego), tronco 2.67:1, boca libre 1.96:1, las tres franjas entre 1.05 y
  // 1.39:1 contra el fondo, ojos de la rana 1.25:1 sobre su cuerpo e iconos de
  // vida a 1.15:1. Es la línea base, no un rediseño: arreglarla sería redefinir
  // el default, no ajustar una skin.
  clasico: {
    background: "#04120a",
    roadBand: "#14141c", // 1.05:1 sobre background
    riverBand: "#0a2440", // 1.22:1
    safeBand: "#123322", // 1.39:1
    car: "#ff5c5c", // 6.05:1 sobre roadBand
    truck: "#c8ccd4", // 11.38:1 sobre roadBand
    log: "#8a5a2b", // 2.67:1 sobre riverBand — por debajo del 3:1
    turtle: "#3fa66a", // 5.13:1 sobre riverBand
    turtleSubmerged: "#1c4a33", // 1.55:1 sobre riverBand — la peor deuda
    frog: "#7dffb0", // 14.65 / 12.55 / 11.04:1 sobre las tres franjas
    frogEye: "#ffffff", // 1.25:1 sobre frog
    goalEmpty: "#1a4d33", // 1.96:1 sobre background
    goalFilled: "#7dffb0", // 15.33:1
    hud: "#d8ffe8", // 17.69:1 de texto, pero 1.15:1 como ojo sobre frog
    timerBar: "#00ff88", // 14.29:1
    border: "rgba(0, 255, 140, 0.35)", // 2.58:1 sobre --bg
    glow: "rgba(0, 255, 140, 0.15)", // 1.36:1
  },

  // Ancla de catálogo: green (--green) en la RANA — es el protagonista y lo
  // único que recorre las tres zonas. Cada zona toma su propia familia de
  // matiz para que nunca haya que comparar dos cosas del mismo tono: río cian
  // con el tronco ámbar como único cuerpo cálido, carretera magenta + azul
  // hielo. El río es el azul más oscuro de las tres skins a propósito: su
  // escalera está saturada (4.00 -> 6.09 -> 9.36 -> 14.34, pasos de ~1.53) y
  // cada centésima que se le quita al agua es margen que gana.
  neon: {
    background: "#03070f",
    roadBand: "#0e0e18",
    riverBand: "#020f20", // el más oscuro: la escalera del río no tiene holgura
    safeBand: "#10422c", // 1.77:1 — la única franja que se gana separación
    car: "#ff2d6f", // 5.35:1 sobre roadBand
    // No es blanco puro: con #dbe7ff el par rana/camión caía a 1.08:1 y la rana
    // desaparecía dentro de la caja. Aquí el par sube a 1.57:1.
    truck: "#9ab4dd", // 9.09:1 sobre roadBand
    log: "#ff9e42", // 9.36:1 sobre riverBand
    turtle: "#0f9fb5", // 6.09:1 sobre riverBand
    // 4.00:1 y no 3.0:1 a propósito: es contorno de 2 px y con el mínimo justo
    // desaparecía. El margen sale del color, nunca de engordar la línea.
    turtleSubmerged: "#0d7d92",
    frog: "#00ff88", // --green · 14.31 / 14.34 / 8.52:1
    frogEye: "#041a10", // 13.49:1 sobre frog
    goalEmpty: "#0e8a5a", // 4.61:1
    goalFilled: "#00ff88", // 15.04:1
    // No puede ser el #cfffe6 obvio: `hud` es también el ojo de los iconos de
    // vida sobre un cuerpo `frog`, y ese par caía a 1.22:1. Así da 9.16:1 de
    // texto y 1.64:1 de par.
    hud: "#45c48e",
    // --yellow, no el verde del ancla: vive en los 4 px superiores, no compite
    // con nada jugable, y el amarillo es la lectura universal de cronómetro.
    timerBar: "#f5ff00", // 18.43:1
    border: "rgba(0, 255, 136, 0.60)", // 5.61:1
    glow: "rgba(0, 255, 136, 0.30)", // 2.19:1
  },

  // Fósforo verde P1: 4 tonos encendidos exactos, sin glow, sin gradientes.
  // Escalones 1.53 / 1.55 / 1.60. Los tonos se COMPARTEN entre zonas (coche y
  // tronco = P1-2; camión y tortuga = P1-3) porque nunca coexisten en la misma
  // franja: la ambigüedad se resuelve por zona, no por tono. Dentro de cada
  // zona sí hay escalera completa.
  retro: {
    // Sustrato: pantalla apagada, fuera del presupuesto de 4 tonos. Ninguna
    // franja puede llevarse un peldaño de fósforo sin quitárselo a un elemento
    // jugable.
    background: "#030d03",
    roadBand: "#050b05",
    riverBand: "#071507",
    safeBand: "#0d430d", // la única con separación real: 1.63:1 vs río
    car: "#19cc19", // P1-2 · 9.17:1 sobre roadBand
    truck: "#12a312", // P1-3 · 5.94:1 — el más ancho se lleva el tono más bajo
    log: "#19cc19", // P1-2 · 8.66:1 sobre riverBand
    turtle: "#12a312", // P1-3 · 5.60:1
    turtleSubmerged: "#0c800c", // P1-4 · 3.67:1
    frog: "#33ff33", // P1-1 · 14.66 / 13.84 / 8.49:1
    frogEye: "#030d03", // el fondo base · 14.58:1 sobre frog
    goalEmpty: "#0c800c", // P1-4 · 3.87:1
    goalFilled: "#33ff33", // P1-1 · 14.58:1
    hud: "#19cc19", // P1-2 · 9.12:1 de texto, 1.60:1 como ojo sobre frog
    timerBar: "#33ff33", // P1-1 · 14.58:1
    border: "#0c800c", // P1-4 · 3.86:1 sobre --bg
    glow: null, // apagado: el fósforo no tiene halo
  },
};
