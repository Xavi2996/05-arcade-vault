"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AuthCard from "@/components/AuthCard";
import OAuthButtons from "@/components/OAuthButtons";
import {
  isNickTaken,
  normalizeNick,
  translateAuthError,
  validateEmail,
  validateNick,
  validatePassword,
} from "@/lib/auth-form";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // El resultado viaja con el nick al que pertenece: así una respuesta
  // tardía de una consulta anterior nunca se muestra sobre otro valor.
  const [nickCheck, setNickCheck] = useState<{
    nick: string;
    taken: boolean;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nickError = validateNick(nick);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  // Disponibilidad en vivo, con pausa: escribir no debe disparar una consulta
  // por tecla, y el resultado de una consulta vieja no debe pisar a la nueva.
  useEffect(() => {
    if (nickError) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const taken = await isNickTaken(nick);
      if (!cancelled) setNickCheck({ nick, taken });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nick, nickError]);

  const checked = nickCheck?.nick === nick ? nickCheck : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ nick: true, email: true, password: true });
    setFormError(null);
    setNotice(null);
    if (nickError || emailError || passwordError) return;

    setLoading(true);
    try {
      if (await isNickTaken(nick)) {
        setNickCheck({ nick, taken: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        // El trigger handle_new_user lee display_name de aquí y crea el perfil
        // dentro de la misma transacción del alta.
        options: { data: { display_name: nick } },
      });
      if (error) {
        setFormError(translateAuthError(error));
        return;
      }
      if (!data.session) {
        // Solo pasa si "Confirm email" sigue activo en el dashboard.
        setNotice("Cuenta creada. Confírmala desde el enlace que te enviamos.");
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
    <AuthCard subtitle="ALTA DE JUGADOR · v2.6">
      <div className="auth-tabs">
        <button type="button" onClick={() => router.push("/auth/login")}>
          INICIAR SESIÓN
        </button>
        <button type="button" className="on">
          CREAR CUENTA
        </button>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="nick">Nick</label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(normalizeNick(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, nick: true }))}
            placeholder="PX_KAI"
            autoComplete="username"
            aria-invalid={Boolean(touched.nick && nickError)}
          />
          {touched.nick && nickError ? (
            <p className="field-error">{nickError}</p>
          ) : checked?.taken ? (
            <p className="field-error">Ese nick ya está ocupado.</p>
          ) : checked ? (
            <p className="field-ok">Nick libre.</p>
          ) : (
            <p className="field-hint">
              Así te verán en el Salón de la Fama. 3 a 10 caracteres.
            </p>
          )}
        </div>

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
            autoComplete="new-password"
            aria-invalid={Boolean(touched.password && passwordError)}
          />
          {touched.password && passwordError ? (
            <p className="field-error">{passwordError}</p>
          ) : (
            <p className="field-hint">Al menos 8 caracteres.</p>
          )}
        </div>

        {formError && <p className="form-error">{formError}</p>}
        {notice && <p className="form-notice">{notice}</p>}

        <button
          className="btn lg"
          type="submit"
          disabled={loading || checked?.taken === true}
          style={{ width: "100%", marginTop: 8 }}
        >
          {loading ? "CREANDO CUENTA…" : "CREAR Y JUGAR"}
        </button>
      </form>

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
