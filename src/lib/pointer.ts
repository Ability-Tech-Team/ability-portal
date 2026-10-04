/**
 * Pure helpers for the product cards' pointer and click effects. They take
 * plain values instead of DOM events so they can be tested without a browser.
 */

export type PointerRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PointerTilt = {
  /** Pointer position inside the rect in px, clamped to its bounds. */
  x: number;
  y: number;
  /** `rotateX` and `rotateY` angles in degrees. */
  tiltX: number;
  tiltY: number;
};

export type ClickDetails = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds to two decimals and turns -0 into 0, for short CSS values. */
function round(value: number): number {
  return Math.round(value * 100) / 100 + 0;
}

/**
 * Returns where the pointer is inside a card and how far to tilt the card so
 * that the edge nearest to the pointer rises toward the viewer: no tilt at
 * the center, `maxDegrees` at the edges.
 */
export function getPointerTilt(
  rect: PointerRect,
  clientX: number,
  clientY: number,
  maxDegrees = 5,
): PointerTilt {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0, tiltX: 0, tiltY: 0 };
  }

  const x = clamp(clientX - rect.left, 0, rect.width);
  const y = clamp(clientY - rect.top, 0, rect.height);
  // -1 at the left or top edge, 1 at the right or bottom edge.
  const offsetX = (x / rect.width) * 2 - 1;
  const offsetY = (y / rect.height) * 2 - 1;

  return {
    x: round(x),
    y: round(y),
    tiltX: round(offsetY * maxDegrees),
    tiltY: round(-offsetX * maxDegrees),
  };
}

/**
 * Whether a click follows a link in the current tab: the primary button (or
 * Enter) without modifier keys, and not cancelled. Modified clicks open a new
 * tab or window, so the current page stays as it is.
 */
export function isPlainLeftClick(click: ClickDetails): boolean {
  return (
    click.button === 0 &&
    !click.metaKey &&
    !click.ctrlKey &&
    !click.shiftKey &&
    !click.altKey &&
    !click.defaultPrevented
  );
}
