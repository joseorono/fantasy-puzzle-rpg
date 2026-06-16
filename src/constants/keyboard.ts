/**
 * Shared `KeyboardEvent.key` values, centralized so key strings aren't duplicated
 * across keydown handlers. Use a `const` map (not an enum, per project rules).
 */
export const KeyboardKeys = {
  Enter: 'Enter',
  Escape: 'Escape',
  Space: ' ',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
} as const;

export type KeyboardKey = (typeof KeyboardKeys)[keyof typeof KeyboardKeys];

/** A directional intent shared by the arrow keys and their WASD equivalents. */
export type NavDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Maps a `KeyboardEvent.key` to a navigation direction. Arrow keys and WASD are
 * treated as equivalents so callers get consistent navigation for free. Single
 * letters are lowercased first so `Shift`-held WASD still resolves.
 */
const NAV_KEY_TO_DIRECTION: Record<string, NavDirection> = {
  [KeyboardKeys.ArrowUp]: 'up',
  [KeyboardKeys.ArrowDown]: 'down',
  [KeyboardKeys.ArrowLeft]: 'left',
  [KeyboardKeys.ArrowRight]: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/**
 * Resolves a `KeyboardEvent.key` to a {@link NavDirection}, or `null` when the
 * key isn't a navigation key. Use this instead of comparing key strings directly
 * so WASD and the arrow keys always behave the same.
 */
export function getNavDirection(key: string): NavDirection | null {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  return NAV_KEY_TO_DIRECTION[normalized] ?? null;
}

/** Whether a key confirms/activates the current selection (Enter or Space). */
export function isConfirmKey(key: string): boolean {
  return key === KeyboardKeys.Enter || key === KeyboardKeys.Space;
}
