import type { ReactNode } from "react";

/** Marco compartido por /auth/login, /auth/registro y /auth/nick. */
export default function AuthCard({
  subtitle,
  children,
}: {
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            {subtitle}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
