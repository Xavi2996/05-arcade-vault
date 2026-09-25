import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface SessionUser {
  id: string;
  name: string; // profiles.display_name ("" mientras el usuario no tenga perfil)
  email: string | null; // null si el proveedor no lo devuelve
}

/** Clave de la sesión falsa anterior a SPEC 13. Se borra, ya no significa nada. */
const LEGACY_KEY = "av_user";

let currentUser: SessionUser | null = null;
let started = false;
let pending = 0;
const listeners = new Set<() => void>();

function sameUser(a: SessionUser | null, b: SessionUser | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.name === b.name && a.email === b.email;
}

// useSyncExternalStore compara snapshots por referencia: getUser debe devolver
// EL MISMO objeto mientras la sesión no cambie de verdad, o cada render parece
// un snapshot nuevo y React entra en bucle.
function setSnapshot(next: SessionUser | null) {
  if (sameUser(next, currentUser)) return;
  currentUser = next;
  for (const listener of listeners) listener();
}

async function resolveUser(authUser: User | null): Promise<SessionUser | null> {
  if (!authUser) return null;
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", authUser.id)
    .maybeSingle();
  return {
    id: authUser.id,
    // Sin fila en profiles el nick queda vacío: es el usuario de OAuth recién
    // llegado, y proxy.ts lo manda a /auth/nick a elegirlo.
    name: data?.display_name ?? "",
    email: authUser.email ?? null,
  };
}

async function applyUser(authUser: User | null) {
  const token = ++pending;
  const next = await resolveUser(authUser);
  // Si mientras se resolvía el nick llegó otro cambio de sesión, este resultado
  // ya es viejo: descartarlo en vez de pisar el nuevo.
  if (token !== pending) return;
  setSnapshot(next);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // localStorage bloqueado: la clave huérfana es inofensiva.
  }

  void supabase.auth.getUser().then(({ data }) => applyUser(data.user ?? null));

  supabase.auth.onAuthStateChange((_event, session) => {
    // Dentro del callback no se puede await sobre el cliente de auth: bloquea
    // su propio lock. Se sale del callback antes de resolver el perfil.
    setTimeout(() => void applyUser(session?.user ?? null), 0);
  });
}

export function getUser(): SessionUser | null {
  // El estado de módulo se comparte entre peticiones en el servidor: devolver
  // null ahí evita que la sesión de un usuario se filtre a otro. El snapshot
  // de servidor lo aporta cada componente (ver Nav con initialUser).
  if (typeof window === "undefined") return null;
  return currentUser;
}

export function subscribeUser(callback: () => void) {
  start();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Siembra el snapshot que el servidor ya resolvió, para que el primer render
 * del cliente no parpadee de "Iniciar Sesión" al nick. No notifica: aún no hay
 * suscriptores, y una vez el store está vivo manda la sesión real.
 */
export function primeUser(user: SessionUser | null) {
  if (typeof window === "undefined" || started) return;
  if (sameUser(user, currentUser)) return;
  currentUser = user;
}

/**
 * Vuelve a leer el perfil de la sesión actual. Hace falta cuando cambia el nick
 * sin que cambie la sesión: elegirlo en /auth/nick o cambiarlo en /cuenta no
 * disparan onAuthStateChange.
 */
export async function refreshUser(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  await applyUser(data.user ?? null);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  setSnapshot(null);
}
