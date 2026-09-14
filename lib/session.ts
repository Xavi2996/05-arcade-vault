export interface SessionUser {
  name: string;
}

const KEY = "av_user";
const EVENT = "av-session-change";

let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;

// useSyncExternalStore compares snapshots by reference: getUser must return
// the SAME object while the underlying localStorage value hasn't changed,
// otherwise every render looks like a new snapshot and React loops forever.
export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? JSON.parse(raw) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

export function setUser(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeUser(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
