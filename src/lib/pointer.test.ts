import { describe, expect, it } from "vitest";
import { getPointerTilt, isPlainLeftClick, type ClickDetails } from "./pointer";

const card = { left: 100, top: 50, width: 400, height: 200 };

describe("getPointerTilt", () => {
  it("does not tilt at the center", () => {
    expect(getPointerTilt(card, 300, 150)).toEqual({
      x: 200,
      y: 100,
      tiltX: 0,
      tiltY: 0,
    });
  });

  it("raises the corner nearest to the pointer by the maximum angle", () => {
    expect(getPointerTilt(card, 100, 50)).toEqual({
      x: 0,
      y: 0,
      tiltX: -5,
      tiltY: 5,
    });
    expect(getPointerTilt(card, 500, 250)).toEqual({
      x: 400,
      y: 200,
      tiltX: 5,
      tiltY: -5,
    });
  });

  it("clamps a pointer outside the card to its edges", () => {
    expect(getPointerTilt(card, 900, -40)).toEqual({
      x: 400,
      y: 0,
      tiltX: -5,
      tiltY: -5,
    });
  });

  it("scales with the maximum angle", () => {
    expect(getPointerTilt(card, 400, 150, 8)).toEqual({
      x: 300,
      y: 100,
      tiltX: 0,
      tiltY: -4,
    });
  });

  it("does not tilt an empty rect", () => {
    expect(
      getPointerTilt({ left: 0, top: 0, width: 0, height: 0 }, 10, 10),
    ).toEqual({ x: 0, y: 0, tiltX: 0, tiltY: 0 });
  });
});

describe("isPlainLeftClick", () => {
  const plainClick: ClickDetails = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };

  it("accepts a primary click without modifier keys", () => {
    expect(isPlainLeftClick(plainClick)).toBe(true);
  });

  it.each<[string, Partial<ClickDetails>]>([
    ["middle-button", { button: 1 }],
    ["secondary-button", { button: 2 }],
    ["Meta", { metaKey: true }],
    ["Ctrl", { ctrlKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
    ["cancelled", { defaultPrevented: true }],
  ])("rejects a %s click", (_kind, change) => {
    expect(isPlainLeftClick({ ...plainClick, ...change })).toBe(false);
  });
});
