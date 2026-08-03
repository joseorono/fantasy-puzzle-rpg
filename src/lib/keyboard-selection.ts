/**
 * Pure index math for keyboard-driven menu selection (see `useKeyboardSelection`).
 * Kept in lib so the wraparound/skip-disabled rules are unit-testable without a DOM.
 */

export interface SelectableLike {
  disabled?: boolean;
}

/**
 * Index of the next selectable (non-disabled) item walking `step` from `fromIndex`,
 * wrapping around the ends; `-1` when the list holds no selectable item.
 *
 * Pass `fromIndex: -1` to start "before" the list (a `null` selection revealed by a
 * forward key lands on the first enabled item) and `fromIndex: items.length` to start
 * "after" it (a backward reveal lands on the last enabled item) — reproducing the
 * house rule that the first keypress only reveals a selection.
 */
export function nextSelectableIndex(items: readonly SelectableLike[], fromIndex: number, step: 1 | -1): number {
  if (items.length === 0) return -1;
  let index = fromIndex;
  for (let hops = 0; hops < items.length; hops++) {
    index = (index + step + items.length) % items.length;
    if (!items[index].disabled) return index;
  }
  return -1;
}
