"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import type { Game } from "@/lib/games";
import {
  DEFAULT_SKIN,
  SKIN_IDS,
  SKIN_LABELS,
  getSkin,
  setSkin,
  subscribeSkin,
  type SkinId,
} from "@/lib/skins";
import { getUser, subscribeUser } from "@/lib/session";
import { saveScore as saveScoreToDb } from "@/lib/scores";
import AsteroidsGame from "@/components/games/AsteroidsGame";
import TetrisGame from "@/components/games/TetrisGame";
import ArkanoidGame from "@/components/games/ArkanoidGame";
import SnakeGame from "@/components/games/SnakeGame";

interface RealGameHandle {
  restart: () => void;
}

interface RealGameProps {
  paused: boolean;
  /**
   * Skin activa. Opcional: un juego que todavía no tenga paletas diseñadas
   * simplemente la ignora y sigue pintando como hoy.
   */
  skin?: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

type RealGameComponent = ForwardRefExoticComponent<
  RealGameProps & RefAttributes<RealGameHandle>
>;

const REAL_GAMES: Record<string, RealGameComponent> = {
  asteroids: AsteroidsGame,
  tetris: TetrisGame,
  arkanoid: ArkanoidGame,
  snake: SnakeGame,
};

/**
 * Juegos cuyas paletas ya están diseñadas en `references/game-themes.md` e
 * implementadas en `components/games/skins/`. Solo a estos se les muestra el
 * selector. Al dar skins a un juego nuevo, añade aquí su id y nada más.
 */
const GAMES_WITH_SKINS = new Set<string>(["tetris"]);

export default function GamePlayer({ game }: { game: Game }) {
  const RealGame = REAL_GAMES[game.id];
  const isRealGame = !!RealGame;
  const sessionUser = useSyncExternalStore(subscribeUser, getUser, () => null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [realLevel, setRealLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const realGameRef = useRef<RealGameHandle>(null);

  // El servidor no conoce el localStorage del cliente, así que renderiza
  // `clasico` y React reconcilia tras hidratar: sin desajuste de hidratación
  // y sin un setState en un efecto.
  const skin = useSyncExternalStore(
    subscribeSkin,
    useCallback(() => getSkin(game.id), [game.id]),
    () => DEFAULT_SKIN,
  );

  const level = isRealGame ? realLevel : Math.floor(score / 2500) + 1;
  const name = nameOverride ?? sessionUser?.name ?? "INVITADO";
  const hasSkins = isRealGame && GAMES_WITH_SKINS.has(game.id);

  const [skinOpen, setSkinOpen] = useState(false);
  const [skinCursor, setSkinCursor] = useState(0);
  const skinBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!skinOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!skinBoxRef.current?.contains(e.target as Node)) setSkinOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [skinOpen]);

  const onSkinKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const handled = ["ArrowDown", "ArrowUp", "Escape", "Enter", " "];
    if (!handled.includes(e.key)) return;
    // El juego escucha las flechas y el espacio en window: sin cortar aquí la
    // propagación, navegar el menú movería la pieza en el tablero.
    e.stopPropagation();
    e.preventDefault();

    if (!skinOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setSkinCursor(SKIN_IDS.indexOf(skin));
        setSkinOpen(true);
      }
      return;
    }

    const last = SKIN_IDS.length - 1;
    switch (e.key) {
      case "Escape":
        setSkinOpen(false);
        break;
      case "ArrowDown":
        setSkinCursor((i) => (i === last ? 0 : i + 1));
        break;
      case "ArrowUp":
        setSkinCursor((i) => (i === 0 ? last : i - 1));
        break;
      case "Enter":
      case " ":
        setSkin(game.id, SKIN_IDS[skinCursor]);
        setSkinOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (isRealGame || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [isRealGame, over, paused]);

  const endGame = () => setOver(true);
  const restart = () => {
    setScore(0);
    setLives(3);
    setRealLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setNameOverride(null);
    realGameRef.current?.restart();
  };

  const saveScore = async () => {
    try {
      await saveScoreToDb(game.id, name, score);
      setSaved(true);
    } catch (err) {
      console.error("No se pudo guardar la puntuación", err);
    }
  };

  return (
    <div className="av-player fade-in" data-skin={hasSkins ? skin : undefined}>
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          {hasSkins && (
            <div
              className="skin-pick"
              data-open={skinOpen || undefined}
              ref={skinBoxRef}
              onKeyDown={onSkinKeyDown}
            >
              <button
                type="button"
                className="skin-trigger"
                // Patrón "select-only combobox" de las prácticas ARIA: es el
                // rol que admite aria-activedescendant, que role=button no.
                role="combobox"
                aria-label="Skin visual del juego"
                aria-haspopup="listbox"
                aria-expanded={skinOpen}
                aria-controls="skin-menu"
                aria-activedescendant={
                  skinOpen ? `skin-opt-${SKIN_IDS[skinCursor]}` : undefined
                }
                onClick={() => {
                  setSkinCursor(SKIN_IDS.indexOf(skin));
                  setSkinOpen((o) => !o);
                }}
              >
                <span className="l">SKIN</span>
                <span className="v">{SKIN_LABELS[skin]}</span>
                <span className="caret" aria-hidden="true" />
              </button>
              {skinOpen && (
                <ul
                  className="skin-menu"
                  id="skin-menu"
                  role="listbox"
                  aria-label="Skin visual del juego"
                >
                  {SKIN_IDS.map((id, i) => (
                    <li
                      key={id}
                      id={`skin-opt-${id}`}
                      role="option"
                      aria-selected={skin === id}
                      data-cursor={i === skinCursor || undefined}
                      onMouseEnter={() => setSkinCursor(i)}
                      onClick={() => {
                        setSkin(game.id, id);
                        setSkinOpen(false);
                      }}
                    >
                      {SKIN_LABELS[id]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt" data-skin={hasSkins ? skin : undefined}>
        <div className="crt-screen">
          {RealGame ? (
            <RealGame
              ref={realGameRef}
              paused={paused || over}
              skin={skin}
              onScoreChange={setScore}
              onLivesChange={setLives}
              onLevelChange={setRealLevel}
              onGameOver={endGame}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setNameOverride(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={saveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
