/**
 * Shared `KeyboardEvent.key` values, centralized so key strings aren't duplicated
 * across keydown handlers. Use a `const` map (not an enum, per project rules).
 */
export const KeyboardKeys = {
  Enter: 'Enter',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
} as const;

export type KeyboardKey = (typeof KeyboardKeys)[keyof typeof KeyboardKeys];
