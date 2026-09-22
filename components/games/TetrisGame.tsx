"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { DEFAULT_SKIN, resolvePalette, type SkinId } from "@/lib/skins";
import { TETRIS_SKINS } from "@/components/games/skins/tetris";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const W = COLS * BLOCK;
const H = ROWS * BLOCK;
const NEXT_SIZE = 120;
const GAP = 16;
/** Tablero + previsualización: la proporción real que ocupa el juego. */
export const ASPECT = `${W + GAP + NEXT_SIZE} / ${H}`;

const PIECES: number[][][] = [
  [],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ],
];

const LINE_SCORES = [0, 100, 300, 500, 800];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

export interface TetrisGameHandle {
  restart: () => void;
}

interface TetrisGameProps {
  paused: boolean;
  skin?: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

const TetrisGame = forwardRef<TetrisGameHandle, TetrisGameProps>(
  function TetrisGame(
    { paused, skin, onScoreChange, onLivesChange, onLevelChange, onGameOver },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    // La skin entra por ref, no por dependencia del efecto: el bucle de juego
    // se monta una sola vez y lee la paleta en cada frame, así cambiarla a
    // media partida repinta sin reiniciar el tablero.
    const skinRef = useRef<SkinId>(skin ?? DEFAULT_SKIN);
    skinRef.current = skin ?? DEFAULT_SKIN;
    const palette = resolvePalette(TETRIS_SKINS, skin);

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
      const nextCanvas = nextCanvasRef.current;
      if (!canvas || !nextCanvas) return;
      const context = canvas.getContext("2d");
      const nextContext = nextCanvas.getContext("2d");
      if (!context || !nextContext) return;

      const GAME_KEYS = new Set([
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp",
        "KeyX",
        "Space",
      ]);

      let board: number[][] = [];
      let current: Piece;
      let next: Piece;
      let score = 0;
      let lines = 0;
      let level = 1;
      let dropAccum = 0;
      let dropInterval = 1000;
      let lastTime: number | null = null;
      let gameOverState = false;

      let reportedScore = -1;
      let reportedLives = -1;
      let reportedLevel = -1;
      let gameOverReported = false;

      function createBoard(): number[][] {
        return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
      }

      function randomPiece(): Piece {
        const type = Math.floor(Math.random() * 8) + 1;
        const shape = PIECES[type].map((row) => [...row]);
        return {
          type,
          shape,
          x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
          y: 0,
        };
      }

      function collide(shape: number[][], ox: number, oy: number): boolean {
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (!shape[r][c]) continue;
            const nx = ox + c;
            const ny = oy + r;
            if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
            if (ny >= 0 && board[ny][nx]) return true;
          }
        }
        return false;
      }

      function rotateCW(shape: number[][]): number[][] {
        const rows = shape.length;
        const cols = shape[0].length;
        const result = Array.from({ length: cols }, () =>
          new Array(rows).fill(0),
        );
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
        return result;
      }

      function tryRotate() {
        const rotated = rotateCW(current.shape);
        const kicks = [0, -1, 1, -2, 2];
        for (const kick of kicks) {
          if (!collide(rotated, current.x + kick, current.y)) {
            current.shape = rotated;
            current.x += kick;
            return;
          }
        }
      }

      function merge() {
        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++)
            if (current.shape[r][c])
              board[current.y + r][current.x + c] = current.shape[r][c];
      }

      function clearLines() {
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].every((v) => v !== 0)) {
            board.splice(r, 1);
            board.unshift(new Array(COLS).fill(0));
            cleared++;
            r++;
          }
        }
        if (cleared) {
          lines += cleared;
          score += (LINE_SCORES[cleared] || 0) * level;
          level = Math.floor(lines / 10) + 1;
          dropInterval = Math.max(100, 1000 - (level - 1) * 90);
        }
      }

      function ghostY(): number {
        let gy = current.y;
        while (!collide(current.shape, current.x, gy + 1)) gy++;
        return gy;
      }

      function spawn() {
        current = next;
        next = randomPiece();
        if (collide(current.shape, current.x, current.y)) {
          gameOverState = true;
        }
      }

      function lockPiece() {
        merge();
        clearLines();
        spawn();
      }

      function hardDrop() {
        const gy = ghostY();
        score += (gy - current.y) * 2;
        current.y = gy;
        lockPiece();
      }

      function softDrop() {
        if (!collide(current.shape, current.x, current.y + 1)) {
          current.y++;
          score += 1;
        } else {
          lockPiece();
        }
      }

      /** Paleta activa, releída en cada frame desde el ref. */
      function skin() {
        return resolvePalette(TETRIS_SKINS, skinRef.current);
      }

      function drawBlock(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        colorIndex: number,
        size: number,
        ghost = false,
      ) {
        if (!colorIndex) return;
        const p = skin();
        const i = colorIndex - 1;
        // El fantasma siempre va sólido: un anillo al 30% sería invisible.
        const color = ghost ? (p.ghost.color ?? p.pieces[i]) : p.pieces[i];
        const fill = ghost ? "solid" : p.fills[i];
        const px = x * size + 1;
        const py = y * size + 1;
        const inner = size - 2;

        ctx.globalAlpha = ghost ? p.ghost.alpha : 1;
        ctx.fillStyle = color;
        ctx.fillRect(px, py, inner, inner);
        if (fill === "hollow") {
          // Vacía el centro dejando un anillo: misma celda, misma hitbox.
          const border = Math.max(2, Math.round(size * 0.14));
          ctx.fillStyle = p.background;
          ctx.fillRect(
            px + border,
            py + border,
            inner - border * 2,
            inner - border * 2,
          );
        }
        ctx.fillStyle = p.gloss;
        ctx.fillRect(px, py, inner, 4);
        ctx.globalAlpha = 1;
      }

      function drawGrid() {
        if (!context) return;
        context.strokeStyle = skin().grid;
        context.lineWidth = 0.5;
        for (let c = 1; c < COLS; c++) {
          context.beginPath();
          context.moveTo(c * BLOCK, 0);
          context.lineTo(c * BLOCK, ROWS * BLOCK);
          context.stroke();
        }
        for (let r = 1; r < ROWS; r++) {
          context.beginPath();
          context.moveTo(0, r * BLOCK);
          context.lineTo(COLS * BLOCK, r * BLOCK);
          context.stroke();
        }
      }

      function drawNext() {
        if (!nextContext) return;
        nextContext.clearRect(0, 0, NEXT_SIZE, NEXT_SIZE);
        const shape = next.shape;
        const offX = Math.floor((4 - shape[0].length) / 2);
        const offY = Math.floor((4 - shape.length) / 2);
        for (let r = 0; r < shape.length; r++)
          for (let c = 0; c < shape[r].length; c++)
            drawBlock(nextContext, offX + c, offY + r, shape[r][c], 30);
      }

      function draw() {
        if (!context) return;
        context.fillStyle = skin().background;
        context.fillRect(0, 0, W, H);
        drawGrid();

        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++)
            drawBlock(context, c, r, board[r][c], BLOCK);

        const gy = ghostY();
        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++)
            if (current.shape[r][c])
              drawBlock(
                context,
                current.x + c,
                gy + r,
                current.shape[r][c],
                BLOCK,
                true,
              );

        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++)
            drawBlock(
              context,
              current.x + c,
              current.y + r,
              current.shape[r][c],
              BLOCK,
            );

        drawNext();
      }

      function reportChanges() {
        const cb = callbacksRef.current;
        if (score !== reportedScore) {
          reportedScore = score;
          cb.onScoreChange(score);
        }
        if (reportedLives !== 0) {
          reportedLives = 0;
          cb.onLivesChange(0);
        }
        if (level !== reportedLevel) {
          reportedLevel = level;
          cb.onLevelChange(level);
        }
        if (gameOverState && !gameOverReported) {
          gameOverReported = true;
          cb.onGameOver(score);
        }
      }

      function initGame() {
        board = createBoard();
        score = 0;
        lines = 0;
        level = 1;
        dropInterval = 1000;
        dropAccum = 0;
        lastTime = null;
        gameOverState = false;
        gameOverReported = false;
        // GamePlayer.restart() blindly resets its lives state to 3 before
        // calling this; force reportChanges() to re-emit onLivesChange(0)
        // even though the value itself never changes, or that 3 sticks.
        reportedLives = -1;
        next = randomPiece();
        spawn();
      }

      const onKeyDown = (e: KeyboardEvent) => {
        if (GAME_KEYS.has(e.code)) e.preventDefault();
        if (pausedRef.current || gameOverState) return;
        switch (e.code) {
          case "ArrowLeft":
            if (!collide(current.shape, current.x - 1, current.y)) current.x--;
            break;
          case "ArrowRight":
            if (!collide(current.shape, current.x + 1, current.y)) current.x++;
            break;
          case "ArrowDown":
            softDrop();
            break;
          case "ArrowUp":
          case "KeyX":
            tryRotate();
            break;
          case "Space":
            hardDrop();
            break;
        }
      };
      window.addEventListener("keydown", onKeyDown, { passive: false });

      initGame();
      reportChanges();

      let frameId: number;

      function loop(ts: number) {
        if (!pausedRef.current && !gameOverState) {
          const dt = lastTime === null ? 0 : ts - lastTime;
          lastTime = ts;
          dropAccum += dt;
          if (dropAccum >= dropInterval) {
            dropAccum = 0;
            if (!collide(current.shape, current.x, current.y + 1)) {
              current.y++;
            } else {
              lockPiece();
            }
          }
        } else {
          lastTime = ts;
        }
        draw();
        reportChanges();
        frameId = requestAnimationFrame(loop);
      }

      restartRef.current = () => {
        initGame();
        reportChanges();
      };

      frameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", onKeyDown);
      };
    }, []);

    const gap = GAP;
    const totalW = W + gap + NEXT_SIZE;
    const mainWidthPct = (W / totalW) * 100;
    const gapPct = (gap / totalW) * 100;
    const nextWidthPct = (NEXT_SIZE / totalW) * 100;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Proporción fija (tablero + previsualización): toma todo el alto
            de .crt-screen —que ya viene con esta misma proporción— y deriva
            el ancho del ratio, porque el tamaño en píxeles de un canvas no
            escala solo como haría un bloque normal. */}
        <div
          style={{
            aspectRatio: `${totalW} / ${H}`,
            height: "100%",
            width: "auto",
            maxWidth: "100%",
            display: "flex",
            gap: `${gapPct}%`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{
              display: "block",
              width: `${mainWidthPct}%`,
              height: "100%",
            }}
          />
          <div style={{ width: `${nextWidthPct}%` }}>
            <div
              className="pixel"
              style={{
                fontSize: 10,
                color: palette.nextLabel,
                letterSpacing: "0.1em",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              SIGUIENTE
            </div>
            <canvas
              ref={nextCanvasRef}
              width={NEXT_SIZE}
              height={NEXT_SIZE}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                aspectRatio: "1 / 1",
                background: palette.background,
              }}
            />
          </div>
        </div>
      </div>
    );
  },
);

export default TetrisGame;
