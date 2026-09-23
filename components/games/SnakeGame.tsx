"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  FRUIT_SPRITES,
  FRUIT_SPRITE_KEYS,
  FRUIT_SPRITE_SHEET_SRC,
  type SpriteRect,
} from "@/components/games/snake-sprites";
import { DEFAULT_SKIN, resolvePalette, type SkinId } from "@/lib/skins";
import { SNAKE_SKINS } from "@/components/games/skins/snake";
import { subscribeVirtualInput, type TouchControlsLayout } from "@/lib/input";

const COLS = 20;
const ROWS = 20;
const CELL = 24;
const W = COLS * CELL;
const H = ROWS * CELL;
/** Proporción del área jugable; la consume .crt-screen en GamePlayer. */
export const ASPECT = `${W} / ${H}`;

/** Controles táctiles: las cuatro direcciones, sin repetición. El juego
    consume una dirección por tick, así que mantener pulsado no aporta nada. */
export const TOUCH_CONTROLS: TouchControlsLayout = {
  dpad: [
    { key: "ArrowUp", glyph: "▲", label: "Arriba", repeat: false },
    { key: "ArrowLeft", glyph: "◀", label: "Izquierda", repeat: false },
    { key: "ArrowRight", glyph: "▶", label: "Derecha", repeat: false },
    { key: "ArrowDown", glyph: "▼", label: "Abajo", repeat: false },
  ],
  actions: [],
};

const START_STEP_MS = 150;
const MIN_STEP_MS = 60;
const STEP_DECREMENT_MS = 10;
const FRUITS_PER_LEVEL = 5;
const POINTS_PER_FRUIT = 10;

// Shared across mounts so a remount (e.g. React Fast Refresh during dev) never
// interrupts a load already in flight or re-triggers a redundant fetch.
let sharedSpriteSheet: HTMLImageElement | null = null;
let sharedSpriteSheetLoaded = false;
function getSpriteSheet(): HTMLImageElement {
  if (!sharedSpriteSheet) {
    sharedSpriteSheet = new Image();
    sharedSpriteSheet.onload = () => {
      sharedSpriteSheetLoaded = true;
    };
    sharedSpriteSheet.src = FRUIT_SPRITE_SHEET_SRC;
  }
  if (sharedSpriteSheet.complete) sharedSpriteSheetLoaded = true;
  return sharedSpriteSheet;
}

/**
 * El color de la fruta no está en el código: vive en el spritesheet. Para que
 * una skin pueda cambiarlo, el recorte se redibuja en un canvas offscreen y se
 * rellena con `source-atop`, que respeta el alpha del sprite y por tanto su
 * silueta exacta. El resultado es un color plano —se pierde el dibujo interior
 * de la fruta— y eso es intencional: es lo que hace medible el contraste.
 *
 * El caché vive a nivel de módulo, como el propio spritesheet: un remonte no
 * debe rehacer 22 canvas. Se indexa por (sprite, tinte), así que alternar entre
 * skins no invalida lo ya tintado.
 */
const tintedSpriteCache = new Map<string, HTMLCanvasElement>();

function getTintedSprite(
  sheet: HTMLImageElement,
  spriteKey: string,
  rect: SpriteRect,
  tint: string,
): HTMLCanvasElement | null {
  const cacheKey = `${spriteKey}|${tint}`;
  const cached = tintedSpriteCache.get(cacheKey);
  if (cached) return cached;

  const off = document.createElement("canvas");
  off.width = rect.w;
  off.height = rect.h;
  const offContext = off.getContext("2d");
  if (!offContext) return null;

  offContext.drawImage(
    sheet,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    0,
    0,
    rect.w,
    rect.h,
  );
  offContext.globalCompositeOperation = "source-atop";
  offContext.fillStyle = tint;
  offContext.fillRect(0, 0, rect.w, rect.h);

  tintedSpriteCache.set(cacheKey, off);
  return off;
}

interface Cell {
  x: number;
  y: number;
}

type GameState = "playing" | "gameover";

export interface SnakeGameHandle {
  restart: () => void;
}

interface SnakeGameProps {
  paused: boolean;
  skin?: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

const SnakeGame = forwardRef<SnakeGameHandle, SnakeGameProps>(
  function SnakeGame(
    { paused, skin, onScoreChange, onLivesChange, onLevelChange, onGameOver },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    // La skin entra por ref, no por dependencia del efecto: el bucle de juego
    // se monta una sola vez y cambiar de skin no debe reiniciar la partida.
    const skinRef = useRef<SkinId>(skin ?? DEFAULT_SKIN);
    skinRef.current = skin ?? DEFAULT_SKIN;
    // El borde y el glow sí son DOM, así que se resuelven en el render.
    const palette = resolvePalette(SNAKE_SKINS, skin);

    const callbacksRef = useRef({
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    });
    callbacksRef.current = {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    };

    const restartRef = useRef<() => void>(() => {});

    useImperativeHandle(
      ref,
      () => ({
        restart: () => restartRef.current(),
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;

      const spriteSheet = getSpriteSheet();

      const GAME_KEYS = new Set([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ]);

      let pendingDirection: Cell | null = null;

      // Un solo camino para teclado y controles táctiles: los dos escriben el
      // mismo `pendingDirection` que consume el tick.
      const applyDirection = (code: string) => {
        if (code === "ArrowUp") pendingDirection = { x: 0, y: -1 };
        else if (code === "ArrowDown") pendingDirection = { x: 0, y: 1 };
        else if (code === "ArrowLeft") pendingDirection = { x: -1, y: 0 };
        else if (code === "ArrowRight") pendingDirection = { x: 1, y: 0 };
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (!GAME_KEYS.has(e.code)) return;
        e.preventDefault();
        applyDirection(e.code);
      };
      window.addEventListener("keydown", onKeyDown, { passive: false });

      // El juego consume una dirección por tick, así que solo importa el
      // `down`: mantener pulsado no aporta nada.
      const unsubscribeInput = subscribeVirtualInput((event) => {
        if (event.type !== "down" || !GAME_KEYS.has(event.key)) return;
        applyDirection(event.key);
      });

      let snake: Cell[] = [];
      let direction: Cell = { x: 1, y: 0 };
      let food: { pos: Cell; sprite: string } = {
        pos: { x: 0, y: 0 },
        sprite: FRUIT_SPRITE_KEYS[0],
      };
      let score = 0;
      let fruitsEaten = 0;
      let level = 1;
      let stepMs = START_STEP_MS;
      let moveAccumulatorMs = 0;
      let state: GameState = "playing";

      let reportedScore = -1;
      let reportedLevel = -1;
      let gameOverReported = false;

      function randomEmptyCell(): Cell {
        let cell: Cell;
        do {
          cell = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
          };
        } while (snake.some((s) => s.x === cell.x && s.y === cell.y));
        return cell;
      }

      function spawnFood() {
        food = {
          pos: randomEmptyCell(),
          sprite:
            FRUIT_SPRITE_KEYS[
              Math.floor(Math.random() * FRUIT_SPRITE_KEYS.length)
            ],
        };
      }

      function initGame() {
        const startX = Math.floor(COLS / 2);
        const startY = Math.floor(ROWS / 2);
        snake = [
          { x: startX, y: startY },
          { x: startX - 1, y: startY },
          { x: startX - 2, y: startY },
          { x: startX - 3, y: startY },
        ];
        direction = { x: 1, y: 0 };
        pendingDirection = null;
        score = 0;
        fruitsEaten = 0;
        level = 1;
        stepMs = START_STEP_MS;
        moveAccumulatorMs = 0;
        state = "playing";
        gameOverReported = false;
        spawnFood();
      }

      function step() {
        if (pendingDirection) {
          const isReversal =
            pendingDirection.x === -direction.x &&
            pendingDirection.y === -direction.y;
          if (!isReversal) direction = pendingDirection;
          pendingDirection = null;
        }

        const head = snake[0];
        const newHead: Cell = {
          x: head.x + direction.x,
          y: head.y + direction.y,
        };

        if (
          newHead.x < 0 ||
          newHead.x >= COLS ||
          newHead.y < 0 ||
          newHead.y >= ROWS
        ) {
          state = "gameover";
          return;
        }

        const willEat = newHead.x === food.pos.x && newHead.y === food.pos.y;
        const bodyToCheck = willEat ? snake : snake.slice(0, -1);
        if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
          state = "gameover";
          return;
        }

        snake.unshift(newHead);
        if (willEat) {
          score += POINTS_PER_FRUIT;
          fruitsEaten++;
          level = Math.floor(fruitsEaten / FRUITS_PER_LEVEL) + 1;
          stepMs = Math.max(
            MIN_STEP_MS,
            START_STEP_MS - (level - 1) * STEP_DECREMENT_MS,
          );
          spawnFood();
        } else {
          snake.pop();
        }
      }

      function update(dt: number) {
        if (state === "gameover") return;
        moveAccumulatorMs += dt * 1000;
        while (moveAccumulatorMs >= stepMs && state === "playing") {
          moveAccumulatorMs -= stepMs;
          step();
        }
      }

      function draw() {
        if (!context) return;
        const p = resolvePalette(SNAKE_SKINS, skinRef.current);
        context.fillStyle = p.background;
        context.fillRect(0, 0, W, H);

        context.strokeStyle = p.grid;
        context.lineWidth = 1;
        for (let x = 1; x < COLS; x++) {
          context.beginPath();
          context.moveTo(x * CELL, 0);
          context.lineTo(x * CELL, H);
          context.stroke();
        }
        for (let y = 1; y < ROWS; y++) {
          context.beginPath();
          context.moveTo(0, y * CELL);
          context.lineTo(W, y * CELL);
          context.stroke();
        }

        if (sharedSpriteSheetLoaded) {
          const rect = FRUIT_SPRITES[food.sprite];
          const tinted = p.fruitTint
            ? getTintedSprite(spriteSheet, food.sprite, rect, p.fruitTint)
            : null;
          // Sin tinte (clasico) o si el offscreen falla, el PNG va tal cual.
          const source = tinted ?? spriteSheet;
          const sx = tinted ? 0 : rect.x;
          const sy = tinted ? 0 : rect.y;
          context.drawImage(
            source,
            sx,
            sy,
            rect.w,
            rect.h,
            food.pos.x * CELL + 1,
            food.pos.y * CELL + 1,
            CELL - 2,
            CELL - 2,
          );
        }

        snake.forEach((segment, i) => {
          context.fillStyle = i === 0 ? p.head : p.body;
          context.fillRect(
            segment.x * CELL + 1,
            segment.y * CELL + 1,
            CELL - 2,
            CELL - 2,
          );
        });
      }

      function reportChanges() {
        const cb = callbacksRef.current;
        if (score !== reportedScore) {
          reportedScore = score;
          cb.onScoreChange(score);
        }
        if (level !== reportedLevel) {
          reportedLevel = level;
          cb.onLevelChange(level);
        }
        if (state === "gameover" && !gameOverReported) {
          gameOverReported = true;
          cb.onGameOver(score);
        }
      }

      initGame();
      callbacksRef.current.onLivesChange(0);
      reportChanges();

      let lastTime: number | null = null;
      let frameId: number;

      function loop(ts: number) {
        if (pausedRef.current) {
          lastTime = ts;
        } else {
          const dt =
            lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
          lastTime = ts;
          update(dt);
        }
        draw();
        reportChanges();
        frameId = requestAnimationFrame(loop);
      }

      restartRef.current = () => {
        initGame();
        callbacksRef.current.onLivesChange(0);
        lastTime = null;
        reportChanges();
      };

      frameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", onKeyDown);
        unsubscribeInput();
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          display: "block",
          margin: "0 auto",
          width: "auto",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: ASPECT,
          border: `1px solid ${palette.border}`,
          boxShadow: palette.glow ? `0 0 16px ${palette.glow}` : "none",
        }}
      />
    );
  },
);

export default SnakeGame;
