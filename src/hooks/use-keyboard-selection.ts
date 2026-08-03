import { useEffect, useRef, useState } from 'react';
import type { NavDirection } from '~/constants/keyboard';
import { nextSelectableIndex } from '~/lib/keyboard-selection';

export interface KeyboardSelectableItem {
  /** Stable identity for the item — selection is keyed on it, never on an index. */
  id: string;
  /** Disabled items are skipped while cycling and never activated. */
  disabled?: boolean;
}

interface KeyboardSelectionOptions {
  /** Fired when a move lands on a *different* item — e.g. to play a tick sound. */
  onMove?: (id: string) => void;
  /** Drop the highlight on mouse move, so hover and keyboard never both show. Default true. */
  resetOnPointerMove?: boolean;
}

interface GridPosition {
  rowIndex: number;
  colIndex: number;
}

function findPosition(rows: readonly (readonly KeyboardSelectableItem[])[], id: string | null): GridPosition | null {
  if (id === null) return null;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const colIndex = rows[rowIndex].findIndex((item) => item.id === id);
    if (colIndex !== -1) return { rowIndex, colIndex };
  }
  return null;
}

/**
 * Keyboard-driven selection over a small grid of menu items (rows of buttons), the shared
 * form of the hand-rolled `selectedIndex | null` pattern from the start menu and level-up
 * screens. `null` means "keyboard not used yet", so mouse players never see a highlight,
 * and the first keypress only reveals a selection — it never activates anything.
 *
 * Selection is id-based: when the selected id leaves the grid (an action changes identity),
 * it resolves to `null` the same render, so a blind confirm can never hit a different item
 * than the one that was highlighted. An id that merely becomes disabled keeps the highlight;
 * callers are expected to no-op activation on `disabled`.
 *
 * The caller owns the key listener; this hook only holds state and movement rules:
 * left/right cycle within the current row (wrapping, skipping disabled), up/down move
 * between rows, restoring the row's remembered item when possible. Single-row grids get
 * inert up/down for free.
 */
export function useKeyboardSelection(
  rows: readonly (readonly KeyboardSelectableItem[])[],
  options: KeyboardSelectionOptions = {},
) {
  const { onMove, resetOnPointerMove = true } = options;
  const [storedId, setStoredId] = useState<string | null>(null);
  /** Last-selected id per row, so moving back up/down returns to the slot the player left. */
  const rememberedByRowRef = useRef(new Map<number, string>());

  // Derived during render (not reconciled in an effect): a stored id that left the grid
  // is simply not the selection anymore.
  const position = findPosition(rows, storedId);
  const selectedId = position ? storedId : null;

  useEffect(() => {
    if (!resetOnPointerMove) return;
    function handlePointerMove() {
      setStoredId((prev) => (prev === null ? prev : null));
    }
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [resetOnPointerMove]);

  // Plain functions, no useCallback: they close over the fresh `rows` each render, and the
  // window-keydown hook callers pair this with already reads the latest closure via a ref.
  function commit(rowIndex: number, colIndex: number) {
    const id = rows[rowIndex][colIndex].id;
    rememberedByRowRef.current.set(rowIndex, id);
    if (id !== selectedId) onMove?.(id);
    setStoredId(id);
  }

  /** First press only reveals: forward keys land on the first enabled item, backward on the last. */
  function reveal(direction: NavDirection) {
    const isForward = direction === 'down' || direction === 'right';
    const rowOrder = isForward ? rows.map((_, i) => i) : rows.map((_, i) => rows.length - 1 - i);
    for (const rowIndex of rowOrder) {
      const row = rows[rowIndex];
      const colIndex = nextSelectableIndex(row, isForward ? -1 : row.length, isForward ? 1 : -1);
      if (colIndex !== -1) {
        commit(rowIndex, colIndex);
        return;
      }
    }
  }

  function move(direction: NavDirection) {
    if (!position) {
      reveal(direction);
      return;
    }

    if (direction === 'left' || direction === 'right') {
      const row = rows[position.rowIndex];
      const colIndex = nextSelectableIndex(row, position.colIndex, direction === 'right' ? 1 : -1);
      if (colIndex !== -1) commit(position.rowIndex, colIndex);
      return;
    }

    // Up/down: walk to the next row that has anything selectable (wrapping), preferring
    // the slot the player last used there.
    const step = direction === 'down' ? 1 : -1;
    for (let hops = 1; hops < rows.length; hops++) {
      const rowIndex = (position.rowIndex + step * hops + rows.length * hops) % rows.length;
      const row = rows[rowIndex];
      const rememberedId = rememberedByRowRef.current.get(rowIndex);
      const rememberedCol = row.findIndex((item) => item.id === rememberedId && !item.disabled);
      const colIndex = rememberedCol !== -1 ? rememberedCol : nextSelectableIndex(row, -1, 1);
      if (colIndex !== -1) {
        commit(rowIndex, colIndex);
        return;
      }
    }
  }

  function isSelected(id: string): boolean {
    return selectedId === id;
  }

  return { selectedId, isSelected, move };
}
