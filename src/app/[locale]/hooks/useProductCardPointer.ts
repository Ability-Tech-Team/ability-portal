import type { PointerEvent } from "react";
import { getPointerTilt } from "@/src/lib/pointer";

/**
 * Pointer effects for a linked product card: the spotlight position and a
 * gentle tilt toward a mouse pointer, written as CSS variables on the card.
 * There is no React state, so moving the pointer never re-renders, and
 * pointer events already arrive at most once per frame. Touch and pen input
 * are ignored.
 */
export function useProductCardPointer() {
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }

    const card = event.currentTarget;
    // Measure the untransformed parent: the tilted card's own box would feed
    // the tilt back into the measurement.
    const rect = (card.parentElement ?? card).getBoundingClientRect();
    const { x, y, tiltX, tiltY } = getPointerTilt(
      rect,
      event.clientX,
      event.clientY,
    );

    card.style.setProperty("--pointer-x", `${x}px`);
    card.style.setProperty("--pointer-y", `${y}px`);
    card.style.setProperty("--tilt-x", `${tiltX}deg`);
    card.style.setProperty("--tilt-y", `${tiltY}deg`);
  }

  function onPointerLeave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }

  return { onPointerMove, onPointerLeave };
}
