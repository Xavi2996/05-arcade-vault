/**
 * Bus de entrada virtual — agnóstico del juego.
 *
 * Los cuatro juegos leen la entrada desde variables locales de su `useEffect`
 * y solo escuchan `keydown`/`keyup`. En un móvil ese teclado no existe, así
 * que los controles en pantalla emiten aquí y cada juego se suscribe junto a
 * su listener de teclado, alimentando el MISMO estado interno.
 *
 * No se sintetizan `KeyboardEvent` sobre `window` a propósito: Arkanoid lee
 * `e.key` mientras los otros tres leen `e.code`, así que un evento sintético
 * mal formado fallaría en silencio en un solo juego. Ver specs/11.
 */

/** Las únicas teclas virtuales que existen: la intersección de lo que
    escuchan los cuatro juegos. Coinciden con `KeyboardEvent.code`. */
export type VirtualKey =
  "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Space" | "KeyX";

export interface VirtualInputEvent {
  key: VirtualKey;
  type: "down" | "up";
}

/* ===== bus de eventos =====
   Un Set de listeners, sin estado propio: el bus no recuerda qué teclas están
   pulsadas. Ese estado ya vive dentro de cada juego (`keys`, `justPressed`,
   `pendingDirection`), que es exactamente donde el teclado lo escribe. */

const inputListeners = new Set<(event: VirtualInputEvent) => void>();

function emitVirtualInput(event: VirtualInputEvent): void {
  // Copia defensiva: un juego podría desuscribirse desde su propio listener
  // (desmontaje durante el game over) y mutar el Set mientras se recorre.
  for (const listener of [...inputListeners]) listener(event);
}

export function pressVirtualKey(key: VirtualKey): void {
  emitVirtualInput({ key, type: "down" });
}

export function releaseVirtualKey(key: VirtualKey): void {
  emitVirtualInput({ key, type: "up" });
}

export function subscribeVirtualInput(
  listener: (event: VirtualInputEvent) => void,
): () => void {
  inputListeners.add(listener);
  return () => {
    inputListeners.delete(listener);
  };
}

/* ===== mapa de controles =====
   Cada juego exporta su propio `TOUCH_CONTROLS`, igual que ya exporta
   `ASPECT`: el mapa vive junto al código que interpreta esas teclas. Los
   tipos viven aquí porque los comparten los juegos y `TouchControls.tsx`. */

export interface TouchButton {
  key: VirtualKey;
  /** Glifo del botón: "◀", "▶", "▲", "▼", "↻", "⤓". */
  glyph: string;
  /** Etiqueta accesible: "Izquierda", "Rotar", "Disparar". */
  label: string;
  /** true → mantener pulsado reemite `down` (mover pieza, girar la nave).
      false → una pulsación, un evento (soltar pieza, disparar). */
  repeat: boolean;
}

export interface TouchControlsLayout {
  /** Cruz direccional. Las direcciones ausentes se pintan como hueco vacío,
      así la cruz conserva su forma en los juegos de tres direcciones. */
  dpad: TouchButton[];
  /** Botones de acción a la derecha de la cruz. Puede estar vacío. */
  actions: TouchButton[];
}

/* ===== puntero grueso =====
   Store externo para useSyncExternalStore, mismo patrón que `lib/skins.ts`.
   Se detecta la CAPACIDAD del puntero, no el ancho del viewport: una tablet
   grande recibe los controles y una ventana de escritorio estrechada no. */

const COARSE_QUERY = "(pointer: coarse)";

const coarseListeners = new Set<() => void>();

let mediaQuery: MediaQueryList | null = null;
let coarseCache: boolean | null = null;

function getMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  mediaQuery ??= window.matchMedia(COARSE_QUERY);
  return mediaQuery;
}

function onCoarseChange(): void {
  coarseCache = null;
  for (const listener of [...coarseListeners]) listener();
}

/** Snapshot del puntero. En el servidor siempre `false`: no conoce el
    dispositivo del cliente, así que el HTML nace sin controles y estos
    aparecen al hidratar. */
export function getCoarsePointer(): boolean {
  if (coarseCache !== null) return coarseCache;
  coarseCache = getMediaQuery()?.matches ?? false;
  return coarseCache;
}

export function subscribeCoarsePointer(listener: () => void): () => void {
  coarseListeners.add(listener);
  const query = getMediaQuery();
  if (coarseListeners.size === 1 && query) {
    query.addEventListener("change", onCoarseChange);
  }
  return () => {
    coarseListeners.delete(listener);
    if (coarseListeners.size === 0 && query) {
      query.removeEventListener("change", onCoarseChange);
    }
  };
}
