"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  isNickTaken,
  normalizeNick,
  translateAuthError,
  validateNick,
} from "@/lib/auth-form";
import { refreshUser, signOut } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export default function CuentaClient({ currentNick }: { currentNick: string }) {
  const router = useRouter();
  const [nick, setNick] = useState(currentNick);
  // Igual que en el registro: el resultado lleva su nick para que una
  // respuesta tardía no se muestre sobre otro valor.
  const [nickCheck, setNickCheck] = useState<{
    nick: string;
    taken: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const nickError = validateNick(nick);
  const unchanged = nick === currentNick;

  useEffect(() => {
    if (nickError || unchanged) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const busy = await isNickTaken(nick);
      if (!cancelled) setNickCheck({ nick, taken: busy });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nick, nickError, unchanged]);

  const taken = nickCheck?.nick === nick && nickCheck.taken;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (nickError || unchanged) return;

    setLoading(true);
    try {
      // rename_profile va en una sola transacción: cambia el perfil y reescribe
      // scores.player_name, para que el Salón de la Fama no muestre al mismo
      // jugador con dos nombres.
      const { error: rpcError } = await supabase.rpc("rename_profile", {
        new_name: nick,
      });
      if (rpcError) {
        setError(translateAuthError(rpcError));
        return;
      }
      await refreshUser();
      setSaved(true);
      router.refresh();
    } catch (rpcError) {
      setError(translateAuthError(rpcError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="cuenta-rename" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="nick">Cambiar nick</label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => {
              setNick(normalizeNick(e.target.value));
              setSaved(false);
            }}
            autoComplete="username"
            aria-invalid={Boolean(nickError)}
          />
          {nickError ? (
            <p className="field-error">{nickError}</p>
          ) : taken ? (
            <p className="field-error">Ese nick ya está ocupado.</p>
          ) : saved ? (
            <p className="field-ok">Nick actualizado en todas tus marcas.</p>
          ) : (
            <p className="field-hint">
              Se reescribe también en tus puntuaciones del Salón de la Fama.
            </p>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn"
          type="submit"
          disabled={loading || unchanged || Boolean(nickError) || taken}
        >
          {loading ? "GUARDANDO…" : "GUARDAR NICK"}
        </button>
      </form>

      <button
        className="btn ghost"
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
      >
        CERRAR SESIÓN
      </button>
    </>
  );
}
