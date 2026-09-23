"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  pressVirtualKey,
  releaseVirtualKey,
  type TouchButton,
  type TouchControlsLayout,
  type VirtualKey,
} from "@/lib/input";

/** Retención inicial y cadencia de la repetición, en ms. Es el rango del
    auto-repeat del teclado del sistema, que es lo que ya siente un jugador
    de escritorio en Tetris. */
const REPEAT_DELAY_MS = 250;
const REPEAT_INTERVAL_MS = 90;

/** Cada dirección ocupa siempre la misma celda de la rejilla 3×3, así la cruz
    conserva su forma aunque el juego solo use tres direcciones. */
const DPAD_AREAS: Record<string, string> = {
  ArrowUp: "up",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
};

const DPAD_ORDER: VirtualKey[] = [
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
];

interface TouchButtonProps {
  button: TouchButton;
  className: string;
}

/**
 * Un botón, un puntero. El primer dedo que lo toca lo captura y ningún otro
 * lo toca hasta que se suelta, así dos dedos sobre dos botones distintos
 * funcionan a la vez (girar y disparar) sin pisarse.
 */
function TouchControlButton({ button, className }: TouchButtonProps) {
  const { key, glyph, label, repeat } = button;

  // Todo el estado del gesto vive en refs: pulsar no debe provocar un render.
  const pointerRef = useRef<number | null>(null);
  const delayRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const release = useCallback(() => {
    if (delayRef.current !== null) {
      window.clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pointerRef.current === null) return;
    pointerRef.current = null;
    releaseVirtualKey(key);
  }, [key]);

  // Desmontar con el dedo encima (game over, cambio de juego) dejaría la tecla
  // enganchada en `down` y la nave girando sola.
  useEffect(() => release, [release]);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Un segundo dedo sobre el mismo botón no reinicia la pulsación en curso.
    if (pointerRef.current !== null) return;
    event.preventDefault();
    pointerRef.current = event.pointerId;
    // La captura garantiza que el `pointerup` vuelva a este botón aunque el
    // dedo termine fuera de él.
    event.currentTarget.setPointerCapture(event.pointerId);
    pressVirtualKey(key);
    if (!repeat) return;
    delayRef.current = window.setTimeout(() => {
      delayRef.current = null;
      intervalRef.current = window.setInterval(() => {
        pressVirtualKey(key);
      }, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerRef.current !== event.pointerId) return;
    release();
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

export default function TouchControls({
  layout,
}: {
  layout: TouchControlsLayout;
}) {
  return (
    <div
      className="touch-controls"
      role="group"
      aria-label="Controles táctiles"
    >
      <div className="touch-dpad">
        {DPAD_ORDER.map((key) => {
          const button = layout.dpad.find((item) => item.key === key);
          if (!button) return null;
          return (
            <TouchControlButton
              key={key}
              button={button}
              className={`touch-btn touch-dpad-${DPAD_AREAS[key]}`}
            />
          );
        })}
      </div>
      {layout.actions.length > 0 && (
        <div className="touch-actions">
          {layout.actions.map((button) => (
            <TouchControlButton
              key={button.key}
              button={button}
              className="touch-btn touch-action"
            />
          ))}
        </div>
      )}
    </div>
  );
}
