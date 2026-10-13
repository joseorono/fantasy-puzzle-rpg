import { useEffect, useState } from 'react';
import type { StatType } from '~/types/rpg-elements';
import type { StatAllocation } from '~/hooks/use-stat-allocation';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { getNavDirection, isConfirmKey, KeyboardKeys } from '~/constants/keyboard';

type AllocationZone = 'stats' | 'actions';

export interface AllocationKeyboardAction<A extends string> {
  id: A;
  /** Skipped while cycling and never activated. */
  disabled?: boolean;
}

interface StatAllocationKeyboardOptions<A extends string> {
  allocation: StatAllocation;
  /** The stat rows, top to bottom. */
  stats: readonly StatType[];
  /** The button row under the stats, left to right. */
  actions: readonly AllocationKeyboardAction<A>[];
  onActivate: (action: A) => void;
  /** Enter while a stat row is focused — the shortcut for the primary action. */
  onConfirmShortcut?: () => void;
  /** Bound only when given, so a host that shares Escape with something else can leave it out. */
  onEscape?: () => void;
  /** ↑ above the first stat row hands the keyboard to the host. Omitted, ↑ wraps to the last row. */
  onExitUp?: () => void;
  /** No keys are bound while false. Default true. */
  active?: boolean;
}

/**
 * Keyboard cursor for a `useStatAllocation` panel: ↑/↓ pick a stat row, ←/→ move points on
 * it, and walking off the last row enters the action buttons, where ←/→ pick and Enter fires.
 * Null indices until the keyboard is actually used, so mouse players never see a highlight,
 * and any pointer movement drops it again.
 */
export function useStatAllocationKeyboard<A extends string>({
  allocation,
  stats,
  actions,
  onActivate,
  onConfirmShortcut,
  onEscape,
  onExitUp,
  active = true,
}: StatAllocationKeyboardOptions<A>) {
  const [selectedStatIndex, setSelectedStatIndex] = useState<number | null>(null);
  const [zone, setZone] = useState<AllocationZone>('stats');
  const [selectedAction, setSelectedAction] = useState<A | null>(null);

  function focusStats() {
    setSelectedAction(null);
    setZone('stats');
  }

  // Returning to the mouse drops the keyboard highlight, so hover and selection can't both show.
  useEffect(() => {
    if (!active) return;
    function handlePointerMove() {
      setSelectedStatIndex(null);
      setSelectedAction(null);
      setZone('stats');
    }
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [active]);

  const enabledActions = actions.filter((action) => !action.disabled).map((action) => action.id);

  useWindowKeyDown((event) => {
    const direction = getNavDirection(event.key);

    if (zone === 'stats') {
      if (direction === 'down' && selectedStatIndex === stats.length - 1) {
        event.preventDefault();
        setZone('actions');
        setSelectedAction(enabledActions[0] ?? null);
        return;
      }

      if (direction === 'up' && onExitUp && (selectedStatIndex === null || selectedStatIndex === 0)) {
        event.preventDefault();
        setSelectedStatIndex(null);
        onExitUp();
        return;
      }

      if (direction === 'up' || direction === 'down') {
        event.preventDefault();
        const step = direction === 'down' ? 1 : -1;
        setSelectedStatIndex((prev) => {
          if (prev === null) return direction === 'down' ? 0 : stats.length - 1;
          return (prev + step + stats.length) % stats.length;
        });
        return;
      }

      if (direction === 'left' || direction === 'right') {
        event.preventDefault();
        const statIndex = selectedStatIndex ?? 0;
        if (selectedStatIndex === null) setSelectedStatIndex(statIndex);
        const stat = stats[statIndex];
        if (direction === 'right') allocation.increase(stat);
        else allocation.decrease(stat);
        return;
      }

      if (isConfirmKey(event.key) && onConfirmShortcut) {
        event.preventDefault();
        onConfirmShortcut();
        return;
      }
    } else {
      if (direction === 'up') {
        event.preventDefault();
        setZone('stats');
        setSelectedStatIndex(stats.length - 1);
        setSelectedAction(null);
        return;
      }

      if (direction === 'down') {
        event.preventDefault();
        return;
      }

      if (direction === 'left' || direction === 'right') {
        event.preventDefault();
        if (enabledActions.length === 0) {
          setSelectedAction(null);
          return;
        }
        const currentIndex = selectedAction ? enabledActions.indexOf(selectedAction) : -1;
        const step = direction === 'right' ? 1 : -1;
        setSelectedAction(enabledActions[(currentIndex + step + enabledActions.length) % enabledActions.length]);
        return;
      }

      if (isConfirmKey(event.key)) {
        event.preventDefault();
        if (event.repeat || selectedAction === null) return;
        onActivate(selectedAction);
        return;
      }
    }

    if (event.key === KeyboardKeys.Escape && onEscape) {
      event.preventDefault();
      onEscape();
    }
  }, active);

  return { selectedStatIndex, selectedAction, focusStats };
}
