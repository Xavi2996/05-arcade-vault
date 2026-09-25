import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Vuelta del OAuth. Supabase manda aquí un `code` de un solo uso que hay que
 * canjear por la sesión; el verificador PKCE lo dejó el cliente del navegador
 * en una cookie, y por eso el canje tiene que hacerse en el servidor.
 *
 * proxy.ts excluye esta ruta de su matcher a propósito: la guarda de perfil
 * correría antes del canje y devolvería al usuario a /auth/login sin sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    const url = new URL("/auth/login", origin);
    url.searchParams.set("error", oauthError);
    return NextResponse.redirect(url);
  }

  if (!code) return NextResponse.redirect(new URL("/auth/login", origin));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const url = new URL("/auth/login", origin);
    url.searchParams.set("error", error?.message ?? "oauth");
    return NextResponse.redirect(url);
  }

  // Google y GitHub no devuelven nada que sirva como nick de 10 caracteres, así
  // que la primera vez el usuario pasa por /auth/nick a elegirlo.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.redirect(
    new URL(profile ? "/biblioteca" : "/auth/nick", origin),
  );
}
