"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { DEFAULT_SKIN, resolvePalette, type SkinId } from "@/lib/skins";
import {
  FROGGER_SKINS,
  type FroggerPalette,
} from "@/components/games/skins/frogger";
import { subscribeVirtualInput, type TouchControlsLayout } from "@/lib/input";

const COLS = 16;
const ROWS = 14;
const CELL = 40;
const W = COLS * CELL; // 640
const H = ROWS * CELL; // 560
/** Proporción del área jugable; la consume .crt-screen en GamePlayer. */
export const ASPECT = `${W} / ${H}`;

/* ===== zonas del mapa =====
   Índice de fila, 0 = arriba. El mapa es fijo: la rana sube desde ROW_START
   hasta las bocas de ROW_GOALS atravesando carretera, franja segura y río. */
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

/* ===== bocas destino =====
   5 bocas de 2 columnas sobre 16: 1 de hueco + 2 de boca, cinco veces, + 1 de
   hueco final = 16 exactas. La boca `i` arranca en la columna 1 + i * 3. */
const GOAL_COUNT = 5;
const GOAL_WIDTH = 2;
const GOAL_STRIDE = 3;
const GOAL_FIRST_COL = 1;

/** Controles táctiles: las cuatro direcciones, sin repetición. La rana consume
    una dirección por salto, así que mantener pulsado no aporta nada. */
export const TOUCH_CONTROLS: TouchControlsLayout = {
  dpad: [
    { key: "ArrowUp", glyph: "▲", label: "Arriba", repeat: false },
    { key: "ArrowLeft", glyph: "◀", label: "Izquierda", repeat: false },
    { key: "ArrowRight", glyph: "▶", label: "Derecha", repeat: false },
    { key: "ArrowDown", glyph: "▼", label: "Abajo", repeat: false },
  ],
  actions: [],
};

/* ===== tipos locales ===== */

type Direction = "up" | "down" | "left" | "right";

type GameState = "playing" | "gameover";

type EntityType = "car" | "truck" | "log" | "turtle";

interface Entity {
  /** Columna en coordenadas de rejilla, fraccionaria: la entidad se desliza. */
  col: number;
  /** Ancho en celdas. */
  width: number;
  type: EntityType;
  /** Solo tortugas: fase de inmersión en segundos, propia de cada grupo. */
  diveT?: number;
  /** Solo tortugas: bajo el agua no dan soporte. */
  submerged?: boolean;
}

interface Lane {
  row: number;
  /** Celdas por segundo. */
  speed: number;
  dir: 1 | -1;
  entities: Entity[];
  /**
   * Longitud del circuito en celdas, siempre múltiplo exacto del periodo del
   * carril y ≥ COLS + ancho. Envolver con `± trackLen` en vez de reinyectar en
   * el borde mantiene el patrón de huecos idéntico vuelta tras vuelta; si se
   * reinyectara "en cuanto sale", los huecos se irían deformando y un carril
   * podría acabar sin ninguno atravesable.
   */
  trackLen: number;
}

interface Frog {
  /** Fraccionaria: en el río la arrastra el tronco sobre el que descansa. */
  col: number;
  row: number;
  animating: boolean;
  /** Progreso de la animación de salto, en ms. */
  animT: number;
  fromCol: number;
  fromRow: number;
  targetCol: number;
  targetRow: number;
}

export interface FroggerGameHandle {
  restart: () => void;
}

interface FroggerGameProps {
  paused: boolean;
  skin?: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

/** Columna inicial de la boca `i`. */
function goalCol(i: number): number {
  return GOAL_FIRST_COL + i * GOAL_STRIDE;
}

/* ===== carriles =====
   El spec da las velocidades en px/frame a 60 fps; el motor trabaja en celdas
   por segundo para no depender de la tasa de refresco. La conversión es
   px/frame × 60 / CELL = px/frame × 1,5. */
const PX_PER_FRAME_TO_CELLS_PER_SEC = 60 / CELL;

/** +15 % de velocidad por nivel, compuesto. */
const LEVEL_SPEED_FACTOR = 1.15;

/** Ciclo de inmersión de las tortugas, en segundos. */
const TURTLE_VISIBLE_S = 3;
const TURTLE_SUBMERGED_S = 1.5;
const TURTLE_CYCLE_S = TURTLE_VISIBLE_S + TURTLE_SUBMERGED_S;

/* ===== reglas de partida ===== */

/** Duración de la animación de salto, en ms. */
const JUMP_MS = 120;

/**
 * Margen por lado de la caja de colisión de la rana, en celdas. 0,15 la deja
 * en 0,7 celdas de ancho, que es exactamente la silueta que dibuja drawFrog:
 * el jugador muere cuando ve que le dan, no cuando roza la celda vecina.
 */
const FROG_HITBOX_INSET = 0.15;

/* ===== HUD interno =====
   Vive dentro de la fila 0, compartida con las bocas: los 16 px de arriba son
   HUD y los 24 restantes, boca. Así "score arriba-izquierda, nivel al centro,
   vidas arriba-derecha y barra de tiempo en la fila 0" (spec) cabe sin tapar
   la meta ni robarle una fila al mapa. */
const HUD_TIMER_H = 4;
const HUD_H = 16;

const START_LIVES = 3;

/** Temporizador de ronda. El spec fija los 15 s iniciales y que baje en
    niveles altos, pero no la fórmula: 1 s por nivel con suelo de 7 s deja diez
    niveles de margen antes de tocar fondo. */
const ROUND_TIME_S = 15;
const ROUND_TIME_DECREMENT_S = 1;
const MIN_ROUND_TIME_S = 7;

const POINTS_PER_ROW = 10;
const POINTS_PER_GOAL = 50;
const POINTS_PER_ROUND = 200;
const TIME_BONUS_PER_SECOND = 10;

function roundTime(level: number): number {
  return Math.max(
    MIN_ROUND_TIME_S,
    ROUND_TIME_S - (level - 1) * ROUND_TIME_DECREMENT_S,
  );
}

interface LaneSpec {
  row: number;
  type: EntityType;
  /** Ancho de cada entidad, en celdas. */
  width: number;
  /** Hueco entre entidades, en celdas. */
  gap: number;
  /** Velocidad base tal como la da el spec, en px/frame a 60 fps. */
  pxPerFrame: number;
  dir: 1 | -1;
  /** Desfase inicial del patrón, para que los carriles no vayan alineados. */
  offset: number;
  /** Solo tortugas: desfase del ciclo de inmersión, en segundos. */
  divePhase?: number;
}

/**
 * Carretera, filas 8–12. Sentidos alternos y velocidad creciente hacia arriba:
 * el carril más cercano a la base es el más lento, así el primer salto no es
 * el más difícil. Los huecos nunca bajan de 3 celdas, que es el espacio mínimo
 * donde la rana puede quedarse parada entre dos vehículos sin morir.
 */
const ROAD_LANES: LaneSpec[] = [
  {
    row: 12,
    type: "car",
    width: 1,
    gap: 4,
    pxPerFrame: 1.5,
    dir: -1,
    offset: 0,
  },
  {
    row: 11,
    type: "truck",
    width: 3,
    gap: 4,
    pxPerFrame: 2.0,
    dir: 1,
    offset: 1,
  },
  {
    row: 10,
    type: "car",
    width: 2,
    gap: 4,
    pxPerFrame: 2.5,
    dir: -1,
    offset: 2,
  },
  {
    row: 9,
    type: "truck",
    width: 3,
    gap: 5,
    pxPerFrame: 3.0,
    dir: 1,
    offset: 0,
  },
  {
    row: 8,
    type: "car",
    width: 1,
    gap: 4,
    pxPerFrame: 4.0,
    dir: -1,
    offset: 3,
  },
];

/**
 * Río, filas 1–6. Aquí el hueco es el peligro, no la entidad: se mantiene en
 * 2–3 celdas para que siempre haya plataforma alcanzable en la fila de arriba.
 * Las dos filas de tortugas (5 y 2) no son adyacentes a propósito — con dos
 * filas de tortugas seguidas, un ciclo de inmersión solapado dejaría a la rana
 * sin ninguna salida.
 */
const RIVER_LANES: LaneSpec[] = [
  { row: 6, type: "log", width: 3, gap: 2, pxPerFrame: 1.0, dir: 1, offset: 0 },
  {
    row: 5,
    type: "turtle",
    width: 2,
    gap: 3,
    pxPerFrame: 1.5,
    dir: -1,
    offset: 1,
    divePhase: 0,
  },
  { row: 4, type: "log", width: 4, gap: 3, pxPerFrame: 2.0, dir: 1, offset: 2 },
  {
    row: 3,
    type: "log",
    width: 2,
    gap: 2,
    pxPerFrame: 1.5,
    dir: -1,
    offset: 0,
  },
  {
    row: 2,
    type: "turtle",
    width: 3,
    gap: 3,
    pxPerFrame: 1.25,
    dir: 1,
    offset: 2,
    divePhase: TURTLE_CYCLE_S / 2,
  },
  { row: 1, type: "log", width: 4, gap: 4, pxPerFrame: 3.0, dir: 1, offset: 1 },
];

function buildLane(spec: LaneSpec, level: number): Lane {
  const period = spec.width + spec.gap;
  // +1 entidad de margen: el circuito tiene que sobrar por encima del ancho
  // visible para que nunca se vea el salto del envolvente.
  const count = Math.ceil(COLS / period) + 1;
  const trackLen = count * period;

  const entities: Entity[] = [];
  for (let k = 0; k < count; k++) {
    entities.push({
      col: (spec.offset + k * period) % trackLen,
      width: spec.width,
      type: spec.type,
      ...(spec.type === "turtle"
        ? { diveT: spec.divePhase ?? 0, submerged: false }
        : {}),
    });
  }

  return {
    row: spec.row,
    speed:
      spec.pxPerFrame *
      PX_PER_FRAME_TO_CELLS_PER_SEC *
      Math.pow(LEVEL_SPEED_FACTOR, level - 1),
    dir: spec.dir,
    entities,
    trackLen,
  };
}

function buildLanes(level: number): Lane[] {
  return [...RIVER_LANES, ...ROAD_LANES].map((spec) => buildLane(spec, level));
}

const FroggerGame = forwardRef<FroggerGameHandle, FroggerGameProps>(
  function FroggerGame(
    { paused, skin, onScoreChange, onLivesChange, onLevelChange, onGameOver },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    // La skin entra por ref, no por dependencia del efecto: el bucle se monta
    // una sola vez y cambiar de skin no debe reiniciar la partida.
    const skinRef = useRef<SkinId>(skin ?? DEFAULT_SKIN);
    skinRef.current = skin ?? DEFAULT_SKIN;
    // El borde y el glow sí son DOM, así que se resuelven en el render.
    const palette = resolvePalette(FROGGER_SKINS, skin);

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

      let frog: Frog = {
        col: Math.floor(COLS / 2),
        row: ROW_START,
        animating: false,
        animT: 0,
        fromCol: Math.floor(COLS / 2),
        fromRow: ROW_START,
        targetCol: Math.floor(COLS / 2),
        targetRow: ROW_START,
      };
      const goals: boolean[] = new Array(GOAL_COUNT).fill(false);
      let lanes: Lane[] = [];
      let level = 1;
      let score = 0;
      let lives = START_LIVES;
      let timeLeft = ROUND_TIME_S;
      let state: GameState = "playing";
      /**
       * Fila más alta alcanzada en el INTENTO actual, no en la ronda: el
       * contador se reinicia cada vez que la rana vuelve a la base, ya sea por
       * meter una boca o por morir. Así las cinco subidas de una ronda pagan
       * sus +10 por fila (decisión del usuario, 2026-09-23).
       */
      let furthestRow = ROW_START;

      let reportedScore = -1;
      let reportedLives = -1;
      let reportedLevel = -1;
      let gameOverReported = false;

      /* ===== entrada =====
         Un solo camino para teclado y controles táctiles: los dos escriben el
         mismo `pendingDir`, que el salto consume. Se lee `e.code` y no
         `e.key`, igual que Asteroids/Tetris/Snake, para que coincida con los
         identificadores de `VirtualKey`. */
      const GAME_KEYS = new Set<string>([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ]);

      let pendingDir: Direction | null = null;

      const applyDirection = (code: string) => {
        if (code === "ArrowUp") pendingDir = "up";
        else if (code === "ArrowDown") pendingDir = "down";
        else if (code === "ArrowLeft") pendingDir = "left";
        else if (code === "ArrowRight") pendingDir = "right";
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (!GAME_KEYS.has(e.code)) return;
        // Sin esto, las flechas hacen scroll de la página bajo el gabinete.
        e.preventDefault();
        applyDirection(e.code);
      };
      window.addEventListener("keydown", onKeyDown, { passive: false });

      // La rana consume una dirección por salto: mantener pulsado no aporta
      // nada, así que solo interesa el `down`.
      const unsubscribeInput = subscribeVirtualInput((event) => {
        if (event.type !== "down" || !GAME_KEYS.has(event.key)) return;
        applyDirection(event.key);
      });

      /** Vuelve la rana a la base y reinicia intento: temporizador, salto en
          curso y contador de filas cobradas. */
      function resetFrog() {
        const start = Math.floor(COLS / 2);
        frog = {
          col: start,
          row: ROW_START,
          animating: false,
          animT: 0,
          fromCol: start,
          fromRow: ROW_START,
          targetCol: start,
          targetRow: ROW_START,
        };
        pendingDir = null;
        furthestRow = ROW_START;
        timeLeft = roundTime(level);
      }

      function initGame() {
        goals.fill(false);
        level = 1;
        lanes = buildLanes(level);
        score = 0;
        lives = START_LIVES;
        state = "playing";
        gameOverReported = false;
        resetFrog();
      }

      /* ===== colisiones, soporte y transiciones =====
         Cuerpos definitivos en los pasos 6 y 7; update() ya queda cableado
         contra ellos para no tener que reescribirlo después. */

      /**
       * Recorre las tres copias del circuito (−1, 0, +1 vueltas) igual que
       * drawEntities: la entidad que está cruzando el borde ocupa dos sitios a
       * la vez en pantalla y tiene que atropellar/sostener en ambos.
       */
      function entitySpans(
        lane: Lane,
        e: Entity,
        test: (left: number, right: number) => boolean,
      ): boolean {
        for (const shift of [-lane.trackLen, 0, lane.trackLen]) {
          const left = e.col + shift;
          if (test(left, left + e.width)) return true;
        }
        return false;
      }

      /** Atropello: solape de cajas en espacio de columnas. La rana se mide por
          su silueta dibujada (elipse de 0,7 celdas), no por la celda entera, o
          moriría por rozar un coche que visiblemente no la toca. */
      function checkRoadCollision(): boolean {
        const frogLeft = frog.col + FROG_HITBOX_INSET;
        const frogRight = frog.col + 1 - FROG_HITBOX_INSET;
        for (const lane of lanes) {
          if (lane.row !== frog.row) continue;
          if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
          for (const e of lane.entities) {
            const hit = entitySpans(
              lane,
              e,
              (left, right) => frogLeft < right && frogRight > left,
            );
            if (hit) return true;
          }
        }
        return false;
      }

      /** Plataforma bajo la rana, o `null` si hay agua. Basta con que el CENTRO
          de la rana caiga sobre la entidad: es el criterio clásico y el que
          hace jugable saltar al extremo de un tronco. Una tortuga sumergida no
          sostiene, aunque siga dibujándose. */
      function getSupport(): Entity | null {
        const center = frog.col + 0.5;
        for (const lane of lanes) {
          if (lane.row !== frog.row) continue;
          if (lane.row < ROW_RIVER_TOP || lane.row > ROW_RIVER_BOT) continue;
          for (const e of lane.entities) {
            if (e.type === "turtle" && e.submerged) continue;
            const on = entitySpans(
              lane,
              e,
              (left, right) => center >= left && center < right,
            );
            if (on) return e;
          }
        }
        return null;
      }

      /** Boca destino cuyo hueco cubre el centro de la rana, o −1. */
      function goalIndexAt(col: number): number {
        const center = col + 0.5;
        for (let i = 0; i < GOAL_COUNT; i++) {
          const left = goalCol(i);
          if (center >= left && center < left + GOAL_WIDTH) return i;
        }
        return -1;
      }

      /** Llegada a la fila 0. Fuera de boca, o en una boca ya ocupada, es
          muerte: es la regla del Frogger original y la que impide rellenar la
          misma boca cinco veces. */
      function checkGoal(): void {
        const i = goalIndexAt(frog.col);
        if (i === -1 || goals[i]) {
          killFrog();
          return;
        }

        goals[i] = true;
        score += POINTS_PER_GOAL + Math.ceil(timeLeft) * TIME_BONUS_PER_SECOND;

        if (goals.every(Boolean)) completeRound();
        else resetFrog();
      }

      /**
       * Una muerte por frame: sin la guarda, dos peligros que coinciden (un
       * coche justo cuando se acaba el tiempo) descontarían dos vidas de golpe.
       * Las bocas ya llenas NO se vacían al morir — se conservan durante toda
       * la ronda, como en el original.
       */
      function killFrog(): void {
        if (state !== "playing") return;

        lives -= 1;
        if (lives <= 0) {
          lives = 0;
          state = "gameover";
          // reportChanges() emite onLivesChange(0) antes que onGameOver(score),
          // que es el orden que exige el spec.
          return;
        }
        resetFrog();
      }

      /** Las cinco bocas llenas: sube el nivel, reconstruye los carriles más
          rápidos y vuelve a empezar con el temporizador más corto. */
      function completeRound(): void {
        score += POINTS_PER_ROUND;
        level += 1;
        goals.fill(false);
        lanes = buildLanes(level);
        // Después de subir el nivel: resetFrog() toma de ahí el temporizador.
        resetFrog();
      }

      /** Empieza un salto si la casilla destino existe. Los bordes laterales
          no se recortan: el salto simplemente no ocurre, que es lo que pide el
          spec ("no puede moverse fuera de los bordes"). */
      function startJump(dir: Direction) {
        let targetCol = frog.col;
        let targetRow = frog.row;

        if (dir === "up") targetRow -= 1;
        else if (dir === "down") targetRow += 1;
        // En horizontal se parte de la celda redondeada: en el río la rana va
        // a la deriva sobre una columna fraccionaria y un salto lateral debe
        // dejarla alineada con la rejilla otra vez.
        else if (dir === "left") targetCol = Math.round(frog.col) - 1;
        else targetCol = Math.round(frog.col) + 1;

        if (targetRow < ROW_GOALS || targetRow > ROW_START) return;
        if (targetCol < 0 || targetCol > COLS - 1) return;

        frog.animating = true;
        frog.animT = 0;
        frog.fromCol = frog.col;
        frog.fromRow = frog.row;
        frog.targetCol = targetCol;
        frog.targetRow = targetRow;
      }

      /** Aterrizaje: fija la casilla y cobra las filas nuevas. Los peligros no
          se miran aquí — de eso se encarga resolveHazards() cada frame. */
      function land() {
        frog.col = frog.targetCol;
        frog.row = frog.targetRow;
        frog.animating = false;
        frog.animT = 0;

        if (frog.row < furthestRow) {
          score += (furthestRow - frog.row) * POINTS_PER_ROW;
          furthestRow = frog.row;
        }

        if (frog.row === ROW_GOALS) checkGoal();
      }

      /**
       * Peligros de la casilla donde la rana está posada, evaluados cada frame
       * y no solo al aterrizar: un coche puede alcanzarla estando quieta, y una
       * tortuga puede sumergirse bajo ella sin que se haya movido.
       */
      function resolveHazards(dt: number) {
        if (frog.animating || state !== "playing") return;

        if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
          if (checkRoadCollision()) killFrog();
          return;
        }

        if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
          const support = getSupport();
          // Sin plataforma es agua: cubre tanto caer al río como que la tortuga
          // de debajo se sumerja.
          if (!support) {
            killFrog();
            return;
          }
          const lane = lanes.find((l) => l.row === frog.row);
          if (lane) frog.col += lane.speed * lane.dir * dt;
          // Arrastrada fuera del cauce: muere cuando su centro abandona el
          // tablero, no antes, para que se vea salir montada en el tronco.
          const center = frog.col + 0.5;
          if (center < 0 || center > COLS) killFrog();
        }
      }

      function updateEntities(dt: number) {
        for (const lane of lanes) {
          const step = lane.speed * lane.dir * dt;
          for (const e of lane.entities) {
            e.col += step;
            // Envolver por el circuito completo, no reinyectar en el borde:
            // así el patrón de huecos no se deforma vuelta tras vuelta.
            if (e.col >= lane.trackLen) e.col -= lane.trackLen;
            else if (e.col < 0) e.col += lane.trackLen;

            if (e.type === "turtle") {
              e.diveT = ((e.diveT ?? 0) + dt) % TURTLE_CYCLE_S;
              e.submerged = e.diveT >= TURTLE_VISIBLE_S;
            }
          }
        }
      }

      function update(dt: number) {
        if (state === "gameover") return;

        updateEntities(dt);

        if (frog.animating) {
          frog.animT += dt * 1000;
          if (frog.animT >= JUMP_MS) land();
        } else if (pendingDir) {
          const dir = pendingDir;
          pendingDir = null;
          startJump(dir);
        }

        resolveHazards(dt);

        if (state === "playing") {
          timeLeft -= dt;
          if (timeLeft <= 0) {
            timeLeft = 0;
            killFrog();
          }
        }
      }

      function drawBands(p: FroggerPalette) {
        if (!context) return;
        context.fillStyle = p.background;
        context.fillRect(0, 0, W, H);

        context.fillStyle = p.riverBand;
        context.fillRect(
          0,
          ROW_RIVER_TOP * CELL,
          W,
          (ROW_RIVER_BOT - ROW_RIVER_TOP + 1) * CELL,
        );

        context.fillStyle = p.safeBand;
        context.fillRect(0, ROW_SAFE_MID * CELL, W, CELL);
        context.fillRect(0, ROW_START * CELL, W, CELL);

        context.fillStyle = p.roadBand;
        context.fillRect(
          0,
          ROW_ROAD_TOP * CELL,
          W,
          (ROW_ROAD_BOT - ROW_ROAD_TOP + 1) * CELL,
        );
      }

      /** Silueta de rana reutilizable: la usan la rana jugable, los iconos de
          vida del HUD y las bocas ya ocupadas. */
      function frogShape(
        cx: number,
        cy: number,
        scale: number,
        body: string,
        eye: string,
        legSpread: number,
      ) {
        if (!context) return;
        const r = CELL * 0.35 * scale;

        context.fillStyle = body;
        // Patas: se abren durante el salto, replegadas al posarse.
        const leg = r * (0.55 + legSpread * 0.5);
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            context.beginPath();
            context.ellipse(
              cx + sx * leg,
              cy + sy * leg * 0.8,
              r * 0.3,
              r * 0.22,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }

        context.beginPath();
        context.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = eye;
        context.beginPath();
        context.arc(cx - r * 0.35, cy - r * 0.4, r * 0.24, 0, Math.PI * 2);
        context.arc(cx + r * 0.35, cy - r * 0.4, r * 0.24, 0, Math.PI * 2);
        context.fill();
      }

      /** Las bocas ocupan solo la franja baja de la fila 0: los 16 px de arriba
          son el HUD interno (barra de tiempo + marcadores). */
      function drawGoals(p: FroggerPalette) {
        if (!context) return;
        const y = ROW_GOALS * CELL + HUD_H;
        const h = CELL - HUD_H;
        for (let i = 0; i < GOAL_COUNT; i++) {
          const x = goalCol(i) * CELL;
          const w = GOAL_WIDTH * CELL;

          context.fillStyle = p.goalEmpty;
          context.fillRect(x, y, w, h);
          context.strokeStyle = p.goalFilled;
          context.lineWidth = 2;
          context.strokeRect(x + 1, y + 1, w - 2, h - 2);

          if (goals[i]) {
            frogShape(x + w / 2, y + h / 2, 0.55, p.goalFilled, p.goalEmpty, 0);
          }
        }
      }

      function drawCar(p: FroggerPalette, x: number, y: number, w: number) {
        if (!context) return;
        context.fillStyle = p.car;
        context.fillRect(x + 3, y + 7, w - 6, CELL - 14);
        // Parabrisas: una muesca del color de la calzada marca el morro.
        context.fillStyle = p.roadBand;
        context.fillRect(x + w - 11, y + 11, 5, CELL - 22);
        // Ruedas.
        context.fillStyle = p.roadBand;
        for (const wx of [x + 7, x + w - 12]) {
          context.fillRect(wx, y + 4, 5, 4);
          context.fillRect(wx, y + CELL - 8, 5, 4);
        }
      }

      function drawTruck(p: FroggerPalette, x: number, y: number, w: number) {
        if (!context) return;
        // Caja.
        context.fillStyle = p.truck;
        context.fillRect(x + 3, y + 6, w - 6, CELL - 12);
        // Cabina diferenciada: franja del color de la calzada al final.
        context.fillStyle = p.roadBand;
        context.fillRect(x + w - 16, y + 6, 3, CELL - 12);
        context.fillStyle = p.truck;
        context.fillRect(x + w - 13, y + 9, 10, CELL - 18);
        context.fillStyle = p.roadBand;
        for (const wx of [x + 8, x + w / 2 - 3, x + w - 14]) {
          context.fillRect(wx, y + 3, 6, 4);
          context.fillRect(wx, y + CELL - 7, 6, 4);
        }
      }

      function drawLog(p: FroggerPalette, x: number, y: number, w: number) {
        if (!context) return;
        context.fillStyle = p.log;
        context.fillRect(x, y + 5, w, CELL - 10);
        // Vetas: líneas del color del agua, que es lo que hay debajo.
        context.fillStyle = p.riverBand;
        for (let vx = x + 8; vx < x + w - 6; vx += 14) {
          context.fillRect(vx, y + 12, 6, 2);
          context.fillRect(vx + 4, y + CELL - 16, 5, 2);
        }
      }

      function drawTurtles(
        p: FroggerPalette,
        x: number,
        y: number,
        width: number,
        submerged: boolean,
      ) {
        if (!context) return;
        // Una tortuga por celda del grupo, no un bloque: el jugador tiene que
        // leer cuántas hay.
        for (let k = 0; k < width; k++) {
          const cx = x + k * CELL + CELL / 2;
          const cy = y + CELL / 2;
          const r = CELL * 0.34;

          if (submerged) {
            // Sumergida: solo contorno. Se sigue viendo dónde está, pero se lee
            // de un vistazo que no sostiene.
            context.strokeStyle = p.turtleSubmerged;
            context.lineWidth = 2;
            context.beginPath();
            context.arc(cx, cy, r, 0, Math.PI * 2);
            context.stroke();
            continue;
          }

          context.fillStyle = p.turtle;
          context.beginPath();
          context.arc(cx, cy, r, 0, Math.PI * 2);
          context.fill();
          // Escamas del caparazón.
          context.fillStyle = p.riverBand;
          context.beginPath();
          context.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
          context.fill();
        }
      }

      function drawEntities(p: FroggerPalette) {
        if (!context) return;
        for (const lane of lanes) {
          const y = lane.row * CELL;
          for (const e of lane.entities) {
            // Cada entidad se dibuja también una vuelta a cada lado: sin esto,
            // la que está cruzando el borde desaparecería a medias.
            for (const shift of [-lane.trackLen, 0, lane.trackLen]) {
              const x = (e.col + shift) * CELL;
              const w = e.width * CELL;
              if (x > W || x + w < 0) continue;

              switch (e.type) {
                case "car":
                  drawCar(p, x, y, w);
                  break;
                case "truck":
                  drawTruck(p, x, y, w);
                  break;
                case "log":
                  drawLog(p, x, y, w);
                  break;
                case "turtle":
                  drawTurtles(p, x, y, e.width, e.submerged === true);
                  break;
              }
            }
          }
        }
      }

      /** HUD interno, confinado a los 16 px altos de la fila 0 para no tapar
          las bocas: barra de tiempo arriba del todo, y debajo score a la
          izquierda, nivel al centro y vidas a la derecha. */
      function drawHud(p: FroggerPalette) {
        if (!context) return;

        const total = roundTime(level);
        const frac = total > 0 ? Math.max(0, Math.min(timeLeft / total, 1)) : 0;
        // Un solo color medido para la barra (la paleta define un `timerBar`,
        // no tres): la urgencia se transmite por longitud y, bajo el 25 %, por
        // parpadeo. Así no entra ningún hex sin medir.
        const critical = frac < 0.25;
        const blink = critical && Math.floor(timeLeft * 6) % 2 === 0;
        context.globalAlpha = blink ? 0.35 : 1;
        context.fillStyle = p.timerBar;
        context.fillRect(0, 0, W * frac, HUD_TIMER_H);
        context.globalAlpha = 1;

        const textY = HUD_TIMER_H + 10;
        context.fillStyle = p.hud;
        context.font = "bold 12px monospace";
        context.textBaseline = "alphabetic";

        context.textAlign = "left";
        context.fillText(`${score}`, 4, textY);

        context.textAlign = "center";
        context.fillText(`NIVEL ${level}`, W / 2, textY);

        // Vidas como iconos de rana, a la derecha. Se dibujan las restantes
        // sin contar la que está en juego, igual que un arcade de créditos.
        context.textAlign = "right";
        for (let i = 0; i < lives; i++) {
          frogShape(W - 10 - i * 14, HUD_TIMER_H + 6, 0.28, p.frog, p.hud, 0);
        }
      }

      function drawFrog(p: FroggerPalette) {
        if (!context) return;
        // Durante el salto la posición lógica sigue en el origen: lo que se
        // interpola es solo el dibujo, entre origen y destino. Posada, manda
        // `frog.col`, que es la que arrastra la deriva del río.
        const t = frog.animating ? Math.min(frog.animT / JUMP_MS, 1) : 0;
        const x = frog.animating
          ? (frog.fromCol + (frog.targetCol - frog.fromCol) * t) * CELL
          : frog.col * CELL;
        const y = frog.animating
          ? (frog.fromRow + (frog.targetRow - frog.fromRow) * t) * CELL
          : frog.row * CELL;
        // Las patas se abren en mitad del salto y se repliegan al aterrizar.
        const legSpread = frog.animating ? Math.sin(t * Math.PI) : 0;
        frogShape(x + CELL / 2, y + CELL / 2, 1, p.frog, p.frogEye, legSpread);
      }

      function draw() {
        if (!context) return;
        const p = resolvePalette(FROGGER_SKINS, skinRef.current);
        drawBands(p);
        drawGoals(p);
        drawEntities(p);
        drawFrog(p);
        drawHud(p);
      }

      /** Los callbacks solo se llaman cuando el valor cambia, nunca cada frame:
          cada uno provoca un setState en GamePlayer. */
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
        // Los trackers también se reinician: si no, volver a 3 vidas o a 0
        // puntos coincidiría con el último valor reportado y GamePlayer nunca
        // se enteraría del reinicio.
        reportedScore = -1;
        reportedLives = -1;
        reportedLevel = -1;
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

export default FroggerGame;
