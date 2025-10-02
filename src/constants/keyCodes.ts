/**
 * Key code constants for keyboard input handling
 * Maps common keys to their KeyboardEvent.code values for layout-independent input
 */
export const KEY_CODES = {
  E: "KeyE",
  F: "KeyF",
  W: "KeyW",
  A: "KeyA",
  S: "KeyS",
  D: "KeyD",
  SPACE: "Space",
  ENTER: "Enter",
  ESCAPE: "Escape",
  SHIFT: "ShiftLeft",
  CTRL: "ControlLeft",
  ALT: "AltLeft",
} as const;

export type KeyCode = (typeof KEY_CODES)[keyof typeof KEY_CODES];
