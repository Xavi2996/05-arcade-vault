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
import AsteroidsGame, {
  ASPECT as ASTEROIDS_ASPECT,
  TOUCH_CONTROLS as ASTEROIDS_TOUCH,
} from "@/components/games/AsteroidsGame";
import TetrisGame, {
  ASPECT as TETRIS_ASPECT,
  TOUCH_CONTROLS as TETRIS_TOUCH,
} from "@/components/games/TetrisGame";
import ArkanoidGame, {
  ASPECT as ARKANOID_ASPECT,
  TOUCH_CONTROLS as ARKANOID_TOUCH,
} from "@/components/games/ArkanoidGame";
import SnakeGame, {
  ASPECT as SNAKE_ASPECT,
  TOUCH_CONTROLS as SNAKE_TOUCH,
} from "@/components/games/SnakeGame";
import TouchControls from "@/components/TouchControls";
import {
  getCoarsePointer,
  subscribeCoarsePointer,
  type TouchControlsLayout,
  type VirtualKey,
} from "@/lib/input";

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
 * Proporción del área jugable de cada juego. El gabinete la adopta para
 * recortarse alrededor del juego en vez de dejar franjas negras muertas a los
 * lados; un juego sin entrada aquí cae al 4/3 clásico de CRT.
 */
const GAME_ASPECTS: Record<string, string> = {
  asteroids: ASTEROIDS_ASPECT,
  tetris: TETRIS_ASPECT,
  arkanoid: ARKANOID_ASPECT,
  snake: SNAKE_ASPECT,
};

/**
 * Controles táctiles de cada juego, en el mismo formato en que cada uno los
 * declara. Un juego ausente de aquí simplemente no muestra controles: el
 * teclado sigue siendo su única entrada.
 */
const GAME_TOUCH_CONTROLS: Record<string, TouchControlsLayout> = {
  arkanoid: ARKANOID_TOUCH,
  asteroids: ASTEROIDS_TOUCH,
  snake: SNAKE_TOUCH,
  tetris: TETRIS_TOUCH,
};

/**
 * Juegos cuyas paletas ya están diseñadas en `references/game-themes.md` e
 * implementadas en `components/games/skins/`. Solo a estos se les muestra el
 * selector. Al dar skins a un juego nuevo, añade aquí su id y nada más.
 */
const GAMES_WITH_SKINS = new Set<string>([
  "tetris",
  "asteroids",
  "snake",
  "arkanoid",
]);

/* Pantalla completa como store externo. Salir con el gesto del sistema no
   pasa por nuestro botón, así que la etiqueta se sincroniza con el evento. */
function subscribeFullscreen(onChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

function getFullscreen(): boolean {
  return document.fullscreenElement !== null;
}

/** `fullscreenEnabled` no cambia en toda la vida del documento: no hay nada a
    lo que suscribirse, pero el snapshot del servidor sigue siendo `false`. */
function subscribeNothing(): () => void {
  return () => {};
}

function getFullscreenEnabled(): boolean {
  return document.fullscreenEnabled;
}

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
  const playerRef = useRef<HTMLDivElement>(null);

  // Mismo patrón de store externo que la skin y la sesión: el servidor no
  // tiene `document`, así que ambos snapshots nacen en `false` y React
  // reconcilia tras hidratar, sin un setState en un efecto.
  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreen,
    () => false,
  );
  const fullscreenAvailable = useSyncExternalStore(
    subscribeNothing,
    getFullscreenEnabled,
    () => false,
  );

  // El servidor no conoce el localStorage del cliente, así que renderiza
  // `clasico` y React reconcilia tras hidratar: sin desajuste de hidratación
  // y sin un setState en un efecto.
  const skin = useSyncExternalStore(
    subscribeSkin,
    useCallback(() => getSkin(game.id), [game.id]),
    () => DEFAULT_SKIN,
  );

  // Se detecta la capacidad del puntero, no el ancho de la ventana: una
  // tablet recibe los controles y un escritorio estrechado no. El servidor
  // renderiza `false` y React los añade tras hidratar, bajo el gabinete, así
  // que su aparición no desplaza el área jugable.
  const coarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointer,
    () => false,
  );
  const touchLayout = GAME_TOUCH_CONTROLS[game.id];

  // Cuántas filas de botones ocupa la barra: Arkanoid usa una, Tetris dos,
  // Snake y Asteroids tres. El CSS lo necesita para reservar solo el alto que
  // esos botones van a ocupar de verdad y dejarle el resto al gabinete.
  const DPAD_ROWS: VirtualKey[][] = [
    ["ArrowUp"],
    ["ArrowLeft", "ArrowRight"],
    ["ArrowDown"],
  ];
  const touchBarRows = touchLayout
    ? Math.max(
        DPAD_ROWS.filter((row) =>
          touchLayout.dpad.some((b) => row.includes(b.key)),
        ).length,
        touchLayout.actions.length,
      )
    : 0;

  // La proporción, además de como `aspect-ratio`, como número: en móvil el
  // gabinete deriva su alto del ancho, así que acotarlo por alto exige
  // convertir el hueco vertical disponible en un ancho máximo.
  const aspect = GAME_ASPECTS[game.id] ?? "4 / 3";
  const [aspectW, aspectH] = aspect.split("/").map((n) => Number(n.trim()));
  const aspectNum = aspectH ? aspectW / aspectH : 4 / 3;

  const level = isRealGame ? realLevel : Math.floor(score / 2500) + 1;
  const name = nameOverride ?? sessionUser?.name ?? "INVITADO";
  const hasSkins = isRealGame && GAMES_WITH_SKINS.has(game.id);

  const [skinOpen, setSkinOpen] = useState(false);
  const [skinCursor, setSkinCursor] = useState(0);
  const skinBoxRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      playerRef.current?.requestFullscreen().catch(() => {});
    }
  };

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
    <div
      ref={playerRef}
      className="av-player fade-in"
      // Con la barra de controles ocupando su franja, el gabinete dispone de
      // bastante menos alto: el CSS lo necesita saber.
      data-touch={coarsePointer && touchLayout ? "" : undefined}
      style={{ "--touch-rows": touchBarRows } as React.CSSProperties}
      data-skin={hasSkins ? skin : undefined}
      // El acento de `neon` es el color de catálogo del juego, no uno de
      // plataforma: sin esto, el gabinete de Arkanoid brillaría magenta.
      data-game={hasSkins ? game.id : undefined}
    >
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat player">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat score">
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
          {coarsePointer && fullscreenAvailable && (
            <button
              className="btn ghost"
              onClick={toggleFullscreen}
              aria-label={
                fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
              }
            >
              {fullscreen ? "VENTANA" : "PANTALLA"}
            </button>
          )}
          <button
            className="btn yellow hud-pause"
            onClick={() => setPaused((p) => !p)}
          >
            {/* En móvil, "REANUDAR" no cabe en la fila y la parte en dos.
                "SEGUIR" ocupa lo mismo que "PAUSA". */}
            {paused ? (coarsePointer ? "SEGUIR" : "REANUDAR") : "PAUSA"}
          </button>
          <button className="btn magenta hud-end" onClick={endGame}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div
        className="crt"
        data-skin={hasSkins ? skin : undefined}
        data-game={hasSkins ? game.id : undefined}
        style={
          {
            "--screen-aspect": aspect,
            "--screen-aspect-num": String(aspectNum),
          } as React.CSSProperties
        }
      >
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
      </div>

      {/* En móvil el HUD de arriba se queda solo con los botones; el estado de
          la partida baja aquí, a una franja pegada a los controles, donde cae
          la mirada mientras se juega. En escritorio este bloque no existe. */}
      <div className="player-substats">
        <span className="ps-score" aria-label="Puntuación">
          {score.toLocaleString("es-ES")}
        </span>
        <span className="ps-lives" aria-label={`${lives} vidas`}>
          {"♥ ".repeat(lives).trim() || "—"}
        </span>
        <span className="ps-level" aria-label={`Nivel ${level}`}>
          NV {String(level).padStart(2, "0")}
        </span>
      </div>

      {coarsePointer && touchLayout && <TouchControls layout={touchLayout} />}

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
