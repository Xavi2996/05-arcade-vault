import { createBrowserClient } from "@supabase/ssr";

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

// createBrowserClient en vez de createClient: la sesión se persiste en cookies,
// no en localStorage, para que proxy.ts y las Server Components la vean.
// La exportación conserva nombre y API: lib/games.ts y lib/scores.ts no cambian.
export const supabase = createBrowserClient(
  supabaseUrl,
  supabasePublishableKey,
);
