import Link from "next/link";

export default function NotFound() {
  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-magenta">ERROR 404</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            CARTUCHO NO ENCONTRADO
          </div>
        </div>
        <p style={{ color: "var(--ink-dim)", fontSize: 13, lineHeight: 1.7 }}>
          Esta pantalla no existe en el Vault. Puede que el juego haya sido
          retirado o el enlace esté mal escrito.
        </p>
        <Link href="/" className="btn lg" style={{ width: "100%", marginTop: 18 }}>
          VOLVER AL VAULT
        </Link>
      </div>
    </div>
  );
}
