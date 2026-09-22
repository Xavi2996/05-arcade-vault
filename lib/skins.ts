/**
 * Núcleo genérico de skins — agnóstico del juego.
 *
 * Cada juego define su propia paleta (la forma la decide el juego: Tetris
 * necesita 8 piezas, Snake una cabeza y un cuerpo) pero todos comparten los
 * mismos tres ids, la misma persistencia y el mismo fallback. Ver
 * `references/game-themes.md` para los hex y sus contrastes medidos.
 */

export const SKIN_IDS = ["clasico", "neon", "retro"] as const;

export type SkinId = (typeof SKIN_IDS)[number];

export const DEFAULT_SKIN: SkinId = "clasico";

/** Etiqueta corta para el selector del HUD. */
export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};

/** Una paleta por skin. `T` es la forma concreta que define cada juego. */
export type SkinPalettes<T> = Record<SkinId, T>;

export function isSkinId(value: unknown): value is SkinId {
  return (
    typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value)
  );
}

export function skinStorageKey(gameId: string): string {
  return `av-skin-${gameId}`;
}

/* ===== store externo sobre localStorage =====
   Mismo patrón que `lib/session.ts`: se consume con useSyncExternalStore, así
   el componente no arranca con un setState en un efecto. El caché mantiene la
   identidad estable del snapshot, que es lo que React exige para no repintar
   en bucle. */

const listeners = new Set<() => void>();
const cache = new Map<string, SkinId>();

function readSkin(gameId: string): SkinId {
  if (typeof window === "undefined") return DEFAULT_SKIN;
  try {
    const raw = window.localStorage.getItem(skinStorageKey(gameId));
    return isSkinId(raw) ? raw : DEFAULT_SKIN;
  } catch {
    // Modo privado o almacenamiento bloqueado.
    return DEFAULT_SKIN;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Otra pestaña cambió la skin: invalida el caché y repinta. */
function onStorage(event: StorageEvent): void {
  if (!event.key?.startsWith("av-skin-")) return;
  cache.delete(event.key.slice("av-skin-".length));
  emit();
}

export function subscribeSkin(onChange: () => void): () => void {
  listeners.add(onChange);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

/** Snapshot de la skin de un juego. Cae a `clasico` si no hay nada guardado. */
export function getSkin(gameId: string): SkinId {
  const cached = cache.get(gameId);
  if (cached !== undefined) return cached;
  const value = readSkin(gameId);
  cache.set(gameId, value);
  return value;
}

export function setSkin(gameId: string, skin: SkinId): void {
  cache.set(gameId, skin);
  try {
    window.localStorage.setItem(skinStorageKey(gameId), skin);
  } catch {
    // Sin persistencia la skin sigue viva en memoria hasta recargar.
  }
  emit();
}

/** Resuelve la paleta activa, con `clasico` como red de seguridad. */
export function resolvePalette<T>(
  palettes: SkinPalettes<T>,
  skin: SkinId | undefined,
): T {
  return palettes[skin ?? DEFAULT_SKIN] ?? palettes[DEFAULT_SKIN];
}
