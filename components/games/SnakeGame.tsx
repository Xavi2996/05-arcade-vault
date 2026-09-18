"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  FRUIT_SPRITES,
  FRUIT_SPRITE_KEYS,
  FRUIT_SPRITE_SHEET_SRC,
} from "@/components/games/snake-sprites";

const COLS = 20;
const ROWS = 20;
const CELL = 24;
const W = COLS * CELL;
const H = ROWS * CELL;

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
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

const SnakeGame = forwardRef<SnakeGameHandle, SnakeGameProps>(
  function SnakeGame(
    { paused, onScoreChange, onLivesChange, onLevelChange, onGameOver },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

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

      const onKeyDown = (e: KeyboardEvent) => {
        if (!GAME_KEYS.has(e.code)) return;
        e.preventDefault();
        if (e.code === "ArrowUp") pendingDirection = { x: 0, y: -1 };
        else if (e.code === "ArrowDown") pendingDirection = { x: 0, y: 1 };
        else if (e.code === "ArrowLeft") pendingDirection = { x: -1, y: 0 };
        else if (e.code === "ArrowRight") pendingDirection = { x: 1, y: 0 };
      };
      window.addEventListener("keydown", onKeyDown, { passive: false });

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
        context.fillStyle = "#04120a";
        context.fillRect(0, 0, W, H);

        context.strokeStyle = "rgba(0, 255, 140, 0.06)";
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
          context.drawImage(
            spriteSheet,
            rect.x,
            rect.y,
            rect.w,
            rect.h,
            food.pos.x * CELL + 1,
            food.pos.y * CELL + 1,
            CELL - 2,
            CELL - 2,
          );
        }

        snake.forEach((segment, i) => {
          context.fillStyle = i === 0 ? "#7dffb0" : "#22c55e";
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
          maxWidth: "100%",
          maxHeight: "100%",
          border: "1px solid rgba(0, 255, 140, 0.35)",
          boxShadow: "0 0 16px rgba(0, 255, 140, 0.15)",
        }}
      />
    );
  },
);

export default SnakeGame;
