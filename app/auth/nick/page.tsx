"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AuthCard from "@/components/AuthCard";
import {
  isNickTaken,
  normalizeNick,
  translateAuthError,
  validateNick,
} from "@/lib/auth-form";
import { refreshUser, signOut } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/**
 * Google y GitHub no devuelven nada que sirva como nick de 10 caracteres, y
 * dejar que el sistema lo invente produce nombres feos e irrepetibles. El
 * trigger handle_new_user solo crea el perfil cuando el alta trae nick, así
 * que todo el que llega por OAuth pasa por aquí. proxy.ts lo garantiza.
 */
export default function NickPage() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  // El resultado viaja con el nick al que pertenece: así una respuesta
  // tardía de una consulta anterior nunca se muestra sobre otro valor.
  const [nickCheck, setNickCheck] = useState<{
    nick: string;
    taken: boolean;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nickError = validateNick(nick);

  useEffect(() => {
    void supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

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
    setTouched(true);
    setFormError(null);
    if (nickError) return;

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // La política "users insert their own profile" exige id = auth.uid():
      // el nick solo lo puede reclamar el dueño de la sesión.
      const { error } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: nick });
      if (error) {
        setFormError(translateAuthError(error));
        setNickCheck({ nick, taken: true });
        return;
      }

      // El perfil cambia sin que cambie la sesión, así que onAuthStateChange
      // no dispara y hay que releerlo a mano para que el Nav se entere.
      await refreshUser();
      router.push("/biblioteca");
      router.refresh();
    } catch (error) {
      setFormError(translateAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="ELIGE TU NOMBRE DE JUGADOR">
      <p className="auth-lead">
        Tu cuenta ya existe{email ? ` (${email})` : ""}. Falta el nombre con el
        que aparecerás en el Salón de la Fama.
      </p>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="nick">Nick</label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(normalizeNick(e.target.value))}
            onBlur={() => setTouched(true)}
            placeholder="PX_KAI"
            autoComplete="username"
            autoFocus
            aria-invalid={Boolean(touched && nickError)}
          />
          {touched && nickError ? (
            <p className="field-error">{nickError}</p>
          ) : checked?.taken ? (
            <p className="field-error">Ese nick ya está ocupado.</p>
          ) : checked ? (
            <p className="field-ok">Nick libre.</p>
          ) : (
            <p className="field-hint">
              De 3 a 10 caracteres: letras, números y guion bajo.
            </p>
          )}
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button
          className="btn lg"
          type="submit"
          disabled={loading || checked?.taken === true}
          style={{ width: "100%", marginTop: 8 }}
        >
          {loading ? "GUARDANDO…" : "RESERVAR NICK"}
        </button>
      </form>

      <p className="auth-switch">
        ¿Prefieres otra cuenta?{" "}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/auth/login");
            router.refresh();
          }}
        >
          Cierra sesión
        </button>
      </p>
    </AuthCard>
  );
}
