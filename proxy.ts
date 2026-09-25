import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16: middleware.ts está deprecado en favor de proxy.ts, y el runtime
// edge no está soportado aquí.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Rutas que exigen sesión. Sin ella, a /auth/login. */
const PROTECTED = ["/cuenta", "/auth/nick"];
/** Rutas que solo tienen sentido sin sesión. Con ella, fuera. */
const ANONYMOUS_ONLY = ["/auth", "/auth/login", "/auth/registro"];

const HOME_WITH_SESSION = "/biblioteca";

function isUnder(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export async function proxy(request: NextRequest) {
  // Se reasigna dentro de setAll: cuando Supabase refresca el token hay que
  // reconstruir la respuesta para que las cookies nuevas viajen de vuelta.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Una respuesta que escribe cookies de sesión no se puede cachear en
        // un CDN, o el token de un usuario acabaría servido a otro.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // getUser() valida el token contra Supabase y, de paso, lo refresca. Tiene
  // que ir antes de generar cualquier respuesta, o el token nuevo se pierde.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Arrastrar las cookies refrescadas: si no, la redirección pierde la
    // sesión recién renovada y el siguiente request vuelve a refrescar.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (!user) {
    if (isUnder(pathname, PROTECTED)) return redirectTo("/auth/login");
    return response;
  }

  // Hay sesión. Solo ahora se consulta profiles, y solo en las rutas que el
  // matcher deja pasar: nada de una query extra por cada navegación.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Usuario de OAuth recién llegado: no sale de /auth/nick hasta elegirlo.
    if (pathname !== "/auth/nick") return redirectTo("/auth/nick");
    return response;
  }

  if (pathname === "/auth/nick") return redirectTo(HOME_WITH_SESSION);
  if (isUnder(pathname, ANONYMOUS_ONLY)) return redirectTo(HOME_WITH_SESSION);

  return response;
}

export const config = {
  matcher: [
    /*
     * Todo menos:
     * - /api            (route handlers, incluido /auth/callback bajo app/)
     * - /auth/callback  (intercambia el código de OAuth por su cuenta)
     * - /juegos/**      (las rutas de juego: no necesitan la guarda y son las
     *                    más sensibles a una petición extra por navegación)
     * - _next/**, y cualquier fichero con extensión (estáticos)
     */
    "/((?!api|auth/callback|juegos|_next/static|_next/image|.*\\.[^/]*$).*)",
  ],
};
