"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { getUser, setUser, subscribeUser } from "@/lib/session";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useSyncExternalStore(subscribeUser, getUser, () => null);

  const close = () => setOpen(false);
  const handleSignOut = () => {
    setUser(null);
    close();
  };

  const libraryActive = pathname === "/" || pathname.startsWith("/juegos");
  const hallActive = pathname === "/salon-de-la-fama";
  const authActive = pathname === "/auth";

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={libraryActive ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon-de-la-fama" className={hallActive ? "active" : ""}>
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={handleSignOut}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link href="/" className={libraryActive ? "active" : ""} onClick={close}>
          Biblioteca
        </Link>
        <Link
          href="/salon-de-la-fama"
          className={hallActive ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link href="/auth" className={authActive ? "active" : ""} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
