import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL no está configurada en las variables de entorno.",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no está configurada en las variables de entorno.",
  );
}

/**
 * Cliente de Supabase para el servidor (Server Components, route handlers).
 * `cookies()` es asíncrono en Next 16: no hay variante síncrona, así que la
 * función tiene que ser async y hay que crear un cliente nuevo por petición.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Escribir cookies desde una Server Component lanza. El refresco del
          // token lo hace proxy.ts, que sí puede escribirlas, así que aquí se
          // ignora sin consecuencias.
        }
      },
    },
  });
}

/**
 * El usuario tal y como lo ve el servidor, con el nick ya resuelto. El layout
 * lo pasa al Nav para que el primer render muestre la sesión en vez de
 * parpadear de "Iniciar Sesión" al nick al hidratar.
 */
export async function getServerSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    name: profile?.display_name ?? "",
    email: user.email ?? null,
  };
}
