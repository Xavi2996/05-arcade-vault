"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const W = 800;
const H = 600;

const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;
const PADDLE_W = 81;
const PADDLE_H = 14;
const PADDLE_Y = 560;
const BALL_SIZE = 16;

const SPRITESHEET_SRC = "/games/arkanoid/spritesheet-breakout.png";
const BOUNCE_SOUND_SRC = "/games/arkanoid/sounds/ball-bounce.mp3";
const BREAK_SOUND_SRC = "/games/arkanoid/sounds/break-sound.mp3";

type BlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

interface Sprite {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const SPRITES: {
  paddle: Sprite;
  ball: Sprite;
  blocks: Record<BlockColor, Sprite>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

const EXPLOSION_FRAMES: Record<BlockColor, Sprite[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

const EXPLOSION_DURATION = 150;

interface LevelBlock {
  col: number;
  row: number;
  color: BlockColor;
}

interface Level {
  speed: number;
  blocks: LevelBlock[];
}

const LEVELS: Level[] = (() => {
  const rowColors1: BlockColor[] = [
    "red",
    "yellow",
    "cyan",
    "magenta",
    "hotpink",
    "green",
  ];
  const rowColors2: BlockColor[] = [
    "gray",
    "cyan",
    "hotpink",
    "yellow",
    "magenta",
    "green",
  ];
  const rowColors4: BlockColor[] = [
    "cyan",
    "magenta",
    "green",
    "yellow",
    "hotpink",
    "red",
  ];

  const l1: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2: LevelBlock[] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5: LevelBlock[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? "hotpink" : "cyan" });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number;
}

type GameState = "playing" | "gameover";

export interface ArkanoidGameHandle {
  restart: () => void;
}

interface ArkanoidGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

const ArkanoidGame = forwardRef<ArkanoidGameHandle, ArkanoidGameProps>(
  function ArkanoidGame(
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

      let ssImg: HTMLCanvasElement | null = null;
      let ssLoaded = false;

      function drawSprite(
        name: "paddle" | "ball",
        x: number,
        y: number,
        w: number,
        h: number,
      ) {
        if (!ssLoaded || !ssImg || !context) return;
        const sp = SPRITES[name];
        context.drawImage(ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
      }

      function drawBlockSprite(
        color: BlockColor,
        x: number,
        y: number,
        w: number,
        h: number,
      ) {
        if (!ssLoaded || !ssImg || !context) return;
        const sp = SPRITES.blocks[color];
        context.drawImage(ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
      }

      function drawFrame(
        frame: Sprite,
        x: number,
        y: number,
        w: number,
        h: number,
      ) {
        if (!ssLoaded || !ssImg || !context) return;
        context.drawImage(
          ssImg,
          frame.sx,
          frame.sy,
          frame.sw,
          frame.sh,
          x,
          y,
          w,
          h,
        );
      }

      const bounceSound = new Audio(BOUNCE_SOUND_SRC);
      const breakSound = new Audio(BREAK_SOUND_SRC);
      const playSound = (sound: HTMLAudioElement) => {
        const instance = sound.cloneNode() as HTMLAudioElement;
        instance.play().catch(() => {});
      };

      const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight"]);
      const keys: Record<string, boolean> = {
        ArrowLeft: false,
        ArrowRight: false,
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (GAME_KEYS.has(e.key)) e.preventDefault();
        if (e.key in keys) keys[e.key] = true;
      };
      const onKeyUp = (e: KeyboardEvent) => {
        if (GAME_KEYS.has(e.key)) e.preventDefault();
        if (e.key in keys) keys[e.key] = false;
      };
      window.addEventListener("keydown", onKeyDown, { passive: false });
      window.addEventListener("keyup", onKeyUp, { passive: false });

      const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
      };
      canvas.addEventListener("mousemove", onMouseMove);

      const paddle = { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
      const ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
      let blocks: Block[] = [];
      let explosions: Explosion[] = [];
      let lives = 3;
      let score = 0;
      let currentLevel = 1;
      let gameState: GameState = "playing";

      let reportedScore = -1;
      let reportedLives = -1;
      let reportedLevel = -1;
      let gameOverReported = false;

      function initPaddle() {
        paddle.x = (W - paddle.w) / 2;
      }

      function initBall() {
        const speed = LEVELS[currentLevel - 1].speed;
        ball.x = paddle.x + (paddle.w - ball.w) / 2;
        ball.y = paddle.y - ball.h;
        ball.vx = BASE_BALL_VX * speed;
        ball.vy = BASE_BALL_VY * speed;
      }

      function loadLevel(n: number) {
        currentLevel = n;
        const level = LEVELS[n - 1];
        blocks = level.blocks.map((b) => ({
          x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
          y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
          w: BLOCK_W,
          h: BLOCK_H,
          color: b.color,
          alive: true,
        }));
        explosions = [];
        initBall();
      }

      function collideAABB(block: Block) {
        return (
          ball.x < block.x + block.w &&
          ball.x + ball.w > block.x &&
          ball.y < block.y + block.h &&
          ball.y + ball.h > block.y
        );
      }

      function initGame() {
        initPaddle();
        lives = 3;
        score = 0;
        gameState = "playing";
        gameOverReported = false;
        loadLevel(1);
      }

      function update(dt: number) {
        if (gameState !== "playing") return;

        if (keys.ArrowLeft)
          paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
        if (keys.ArrowRight)
          paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x <= 0) {
          ball.x = 0;
          ball.vx = Math.abs(ball.vx);
          playSound(bounceSound);
        }
        if (ball.x + ball.w >= W) {
          ball.x = W - ball.w;
          ball.vx = -Math.abs(ball.vx);
          playSound(bounceSound);
        }
        if (ball.y <= 0) {
          ball.y = 0;
          ball.vy = Math.abs(ball.vy);
          playSound(bounceSound);
        }

        if (
          ball.vy > 0 &&
          ball.x + ball.w > paddle.x &&
          ball.x < paddle.x + paddle.w &&
          ball.y + ball.h >= paddle.y &&
          ball.y + ball.h <= paddle.y + paddle.h + 8
        ) {
          ball.y = paddle.y - ball.h;
          ball.vy = -Math.abs(ball.vy);
          playSound(bounceSound);
        }

        for (const block of blocks) {
          if (!block.alive) continue;
          if (collideAABB(block)) {
            block.alive = false;
            explosions.push({
              x: block.x,
              y: block.y,
              w: block.w,
              h: block.h,
              color: block.color,
              elapsed: 0,
            });
            score += 10;
            ball.vy = -ball.vy;
            playSound(breakSound);
            if (blocks.every((b) => !b.alive)) {
              if (currentLevel < 5) loadLevel(currentLevel + 1);
              else gameState = "gameover";
            }
            break;
          }
        }

        for (const exp of explosions) exp.elapsed += dt * 1000;
        explosions = explosions.filter(
          (exp) => exp.elapsed < EXPLOSION_DURATION,
        );

        if (ball.y > H) {
          lives--;
          if (lives <= 0) {
            lives = 0;
            gameState = "gameover";
          } else {
            initBall();
          }
        }
      }

      function draw() {
        if (!context) return;
        context.fillStyle = "#000";
        context.fillRect(0, 0, W, H);

        for (const block of blocks) {
          if (block.alive)
            drawBlockSprite(block.color, block.x, block.y, block.w, block.h);
        }

        for (const exp of explosions) {
          const frameIndex = Math.min(
            Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4),
            3,
          );
          drawFrame(
            EXPLOSION_FRAMES[exp.color][frameIndex],
            exp.x,
            exp.y,
            exp.w,
            exp.h,
          );
        }

        drawSprite("paddle", paddle.x, paddle.y, paddle.w, paddle.h);
        drawSprite("ball", ball.x, ball.y, ball.w, ball.h);
      }

      function reportChanges() {
        const cb = callbacksRef.current;
        if (score !== reportedScore) {
          reportedScore = score;
          cb.onScoreChange(score);
        }
        if (lives !== reportedLives) {
          reportedLives = lives;
          cb.onLivesChange(lives);
        }
        if (currentLevel !== reportedLevel) {
          reportedLevel = currentLevel;
          cb.onLevelChange(currentLevel);
        }
        if (gameState === "gameover" && !gameOverReported) {
          gameOverReported = true;
          cb.onGameOver(score);
        }
      }

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
        lastTime = null;
        reportChanges();
      };

      const rawImg = new Image();
      rawImg.onload = () => {
        const oc = document.createElement("canvas");
        oc.width = rawImg.width;
        oc.height = rawImg.height;
        const octx = oc.getContext("2d");
        octx?.drawImage(rawImg, 0, 0);
        ssImg = oc;
        ssLoaded = true;
        initGame();
        reportChanges();
        frameId = requestAnimationFrame(loop);
      };
      rawImg.onerror = () => console.error("Failed to load spritesheet");
      rawImg.src = SPRITESHEET_SRC;

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        canvas.removeEventListener("mousemove", onMouseMove);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
      />
    );
  },
);

export default ArkanoidGame;
