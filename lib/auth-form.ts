import { supabase } from "@/lib/supabase";

/**
 * Validación compartida por /auth/registro, /auth/login, /auth/nick y /cuenta.
 * El formato del nick es el mismo check que aplica la base de datos en
 * profiles.display_name: el cliente solo se adelanta, no decide.
 */

export const NICK_PATTERN = /^[A-Z0-9_]{3,10}$/;
export const PASSWORD_MIN = 8;

// No recorta a 10: truncar en silencio le cambia el nick a quien pega uno
// largo sin decírselo. Pasarse de largo es un error que se muestra.
export function normalizeNick(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validateNick(nick: string): string | null {
  if (!nick) return "Escribe un nick.";
  if (nick.length < 3) return "Mínimo 3 caracteres.";
  if (nick.length > 10) return "Máximo 10 caracteres.";
  if (!NICK_PATTERN.test(nick))
    return "Solo letras, números y guion bajo, hasta 10 caracteres.";
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Escribe tu correo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
    return "Ese correo no tiene un formato válido.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Escribe una contraseña.";
  if (password.length < PASSWORD_MIN)
    return `Mínimo ${PASSWORD_MIN} caracteres.`;
  return null;
}

/**
 * Cortesía, no garantía: entre esta consulta y el insert alguien puede quedarse
 * con el nick. La verdad es el índice único de profiles, y quien lo pierda ve
 * el mensaje de `translateAuthError`.
 */
export async function isNickTaken(nick: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", nick)
    .maybeSingle();
  if (error) return false;
  return data !== null;
}

/**
 * Supabase devuelve sus errores en inglés y sin códigos estables. Se traducen a
 * mano los casos que de verdad se dan; el resto cae en un mensaje genérico.
 */
export function translateAuthError(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (message.includes("email not confirmed"))
    return "Esta cuenta aún no está confirmada.";
  if (
    message.includes("user already registered") ||
    message.includes("already been registered")
  )
    return "Ese correo ya tiene cuenta.";
  // Supabase rechaza dominios de prueba (.test, .local, example.com) aunque el
  // formato sea correcto, así que el mensaje tiene que distinguirse del de arriba.
  if (message.includes("email address") && message.includes("invalid"))
    return "Supabase no acepta ese dominio de correo.";
  if (message.includes("duplicate key") || message.includes("23505"))
    return "Ese nick acaba de ocuparse. Prueba otro.";
  if (message.includes("password should be at least"))
    return `La contraseña necesita al menos ${PASSWORD_MIN} caracteres.`;
  if (message.includes("pkce") || message.includes("code verifier"))
    return "Ese acceso caducó o se abrió en otro navegador. Vuelve a intentarlo.";
  if (message.includes("access_denied") || message.includes("cancel"))
    return "Cancelaste el acceso con el proveedor.";
  if (message.includes("rate limit") || message.includes("too many"))
    return "Demasiados intentos. Espera un minuto.";
  if (message.includes("database error saving new user"))
    return "No se pudo crear la cuenta. Puede que ese nick acabe de ocuparse.";

  return "Algo falló al conectar con el servidor. Inténtalo de nuevo.";
}
