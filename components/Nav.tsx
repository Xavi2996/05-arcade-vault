"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getUser,
  primeUser,
  signOut,
  subscribeUser,
  type SessionUser,
} from "@/lib/session";

export default function Nav({
  initialUser,
}: {
  initialUser: SessionUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Siembra el snapshot que el servidor ya resolvió antes de que el store lea:
  // así el primer render del cliente coincide con el del servidor y el Nav no
  // parpadea de "Iniciar Sesión" al nick. Es idempotente.
  primeUser(initialUser);
  const user = useSyncExternalStore(subscribeUser, getUser, () => initialUser);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    close();
    await signOut();
    router.push("/");
    router.refresh();
  };

  const homeActive = pathname === "/";
  const libraryActive =
    pathname === "/biblioteca" || pathname.startsWith("/juegos");
  const hallActive = pathname === "/salon-de-la-fama";
  const accountActive = pathname === "/cuenta" || pathname.startsWith("/auth");
  const aboutActive = pathname === "/acerca-de";

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
          <Link href="/" className={homeActive ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/biblioteca" className={libraryActive ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon-de-la-fama" className={hallActive ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/acerca-de" className={aboutActive ? "active" : ""}>
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <div className="account" ref={menuRef}>
            <button
              className="btn ghost auth-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {user.name || "CUENTA"} ▾
            </button>
            {menuOpen && (
              <div className="account-menu" role="menu">
                <Link
                  href="/cuenta"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    close();
                  }}
                >
                  CUENTA
                </Link>
                <button type="button" role="menuitem" onClick={handleSignOut}>
                  CERRAR SESIÓN
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/login" className="btn auth-btn">
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
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link href="/" className={homeActive ? "active" : ""} onClick={close}>
          Inicio
        </Link>
        <Link
          href="/biblioteca"
          className={libraryActive ? "active" : ""}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/salon-de-la-fama"
          className={hallActive ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/acerca-de"
          className={aboutActive ? "active" : ""}
          onClick={close}
        >
          Acerca de
        </Link>
        <Link
          href={user ? "/cuenta" : "/auth/login"}
          className={accountActive ? "active" : ""}
          onClick={close}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        {user && (
          <button
            type="button"
            className="mobile-signout"
            onClick={handleSignOut}
          >
            Cerrar sesión
          </button>
        )}
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
