import Link from "next/link";
import { redirect } from "next/navigation";
import CuentaClient from "@/components/CuentaClient";
import { getBestScoresByUser } from "@/lib/scores";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const PROVIDER_LABEL: Record<string, string> = {
  email: "Correo y contraseña",
  google: "Google",
  github: "GitHub",
};

export default async function CuentaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts ya cubre esta ruta; la comprobación aquí es la red de seguridad
  // por si el matcher cambia.
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/auth/nick");

  const provider = user.app_metadata?.provider ?? "email";
  const bestScores = await getBestScoresByUser(user.id);

  return (
    <div className="av-cuenta fade-in">
      <header className="cuenta-head">
        <h1 className="neon-cyan">{profile.display_name}</h1>
        <p className="cuenta-sub">
          Jugando desde el{" "}
          {new Date(profile.created_at).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <div className="cuenta-grid">
        <section className="cuenta-card">
          <h2>Tu cuenta</h2>
          <dl className="cuenta-datos">
            <dt>Nick</dt>
            <dd>{profile.display_name}</dd>
            <dt>Correo</dt>
            <dd>{user.email ?? "—"}</dd>
            <dt>Acceso</dt>
            <dd>{PROVIDER_LABEL[provider] ?? provider}</dd>
          </dl>
          <CuentaClient currentNick={profile.display_name} />
        </section>

        <section className="cuenta-card">
          <h2>Tus mejores marcas</h2>
          {bestScores.length === 0 ? (
            <div className="cuenta-vacio">
              <p>Todavía no has guardado ninguna puntuación.</p>
              <Link href="/biblioteca" className="btn">
                ELEGIR JUEGO
              </Link>
            </div>
          ) : (
            <ul className="cuenta-marcas">
              {bestScores.map((mark) => (
                <li key={mark.gameId}>
                  <Link href={`/juegos/${mark.gameId}`}>{mark.gameTitle}</Link>
                  <span className="marca-score">
                    {mark.score.toLocaleString("es-ES")}
                  </span>
                  <span className="marca-fecha">{mark.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
