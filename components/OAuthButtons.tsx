"use client";

import { useState } from "react";
import { translateAuthError } from "@/lib/auth-form";
import { supabase } from "@/lib/supabase";

type Provider = "google" | "github";

export default function OAuthButtons({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState<Provider | null>(null);

  const signIn = async (provider: Provider) => {
    setBusy(provider);
    onError("");
    // NEXT_PUBLIC_SITE_URL manda sobre el origen del navegador: es la única
    // URL que está registrada en las Redirect URLs de Supabase.
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${base}/auth/callback` },
    });
    // Si todo va bien el navegador ya se fue al proveedor y esto no se ejecuta.
    if (error) {
      onError(translateAuthError(error));
      setBusy(null);
    }
  };

  return (
    <>
      <div className="auth-divider">O CONTINÚA CON</div>
      <div className="social">
        <button
          className="btn ghost"
          type="button"
          disabled={busy !== null}
          onClick={() => signIn("google")}
        >
          {busy === "google" ? "ABRIENDO…" : "◆ GOOGLE"}
        </button>
        <button
          className="btn ghost"
          type="button"
          disabled={busy !== null}
          onClick={() => signIn("github")}
        >
          {busy === "github" ? "ABRIENDO…" : "▣ GITHUB"}
        </button>
      </div>
    </>
  );
}
