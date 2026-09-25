"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AuthCard from "@/components/AuthCard";
import OAuthButtons from "@/components/OAuthButtons";
import {
  translateAuthError,
  validateEmail,
  validatePassword,
} from "@/lib/auth-form";
import { supabase } from "@/lib/supabase";

export default function LoginForm({
  initialError,
}: {
  initialError: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // El error del callback de OAuth llega ya resuelto desde el servidor: sin
  // efecto, sin setState en el primer render y sin parpadeo.
  const [formError, setFormError] = useState<string | null>(() =>
    initialError ? translateAuthError({ message: initialError }) : null,
  );
  const [loading, setLoading] = useState(false);

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  // Limpiar el ?error= de la barra de direcciones para que recargar no lo
  // resucite. Solo toca el historial: no hay estado de React de por medio.
  useEffect(() => {
    if (!initialError) return;
    window.history.replaceState(null, "", window.location.pathname);
  }, [initialError]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);
    if (emailError || passwordError) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setFormError(translateAuthError(error));
        return;
      }
      router.push("/biblioteca");
      router.refresh();
    } catch (error) {
      setFormError(translateAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="ACCESO AL SISTEMA · v2.6">
      <div className="auth-tabs">
        <button type="button" className="on">
          INICIAR SESIÓN
        </button>
        <button type="button" onClick={() => router.push("/auth/registro")}>
          CREAR CUENTA
        </button>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="jugador@vault.gg"
            autoComplete="email"
            aria-invalid={Boolean(touched.email && emailError)}
          />
          {touched.email && emailError && (
            <p className="field-error">{emailError}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={Boolean(touched.password && passwordError)}
          />
          {touched.password && passwordError && (
            <p className="field-error">{passwordError}</p>
          )}
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button
          className="btn lg"
          type="submit"
          disabled={loading}
          style={{ width: "100%", marginTop: 8 }}
        >
          {loading ? "ENTRANDO…" : "ENTRAR AL VAULT"}
        </button>
      </form>

      <p className="auth-switch">
        ¿Primera vez aquí?{" "}
        <button type="button" onClick={() => router.push("/auth/registro")}>
          Crea tu cuenta
        </button>
      </p>

      <OAuthButtons onError={(message) => setFormError(message || null)} />

      <button
        className="btn ghost"
        style={{ width: "100%", marginTop: 10 }}
        onClick={() => router.push("/biblioteca")}
      >
        JUGAR COMO INVITADO
      </button>
    </AuthCard>
  );
}
