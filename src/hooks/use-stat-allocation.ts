import { useRef, useState } from 'react';
import type { CoreRPGStats, StatType } from '~/types/rpg-elements';
import { usePressAndHold, type PressAndHoldHandlers } from '~/hooks/use-press-and-hold';

const NO_POINTS: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

function sumStats(stats: CoreRPGStats): number {
  return stats.pow + stats.vit + stats.spd;
}

function statsEqual(a: CoreRPGStats, b: CoreRPGStats): boolean {
  return a.pow === b.pow && a.vit === b.vit && a.spd === b.spd;
}

export interface StatAllocation {
  /** Points placed on each stat so far. */
  pending: CoreRPGStats;
  pointsSpent: number;
  pointsRemaining: number;
  /** True once `pending` differs from where it started. */
  hasPendingChanges: boolean;
  /** True when every available point is placed — the usual gate for a Confirm button. */
  allPointsAllocated: boolean;
  /** Place one point; returns whether one was actually placed (so a hold train can stop). */
  increase: (stat: StatType) => boolean;
  /** Take one point back; returns whether one was actually taken. */
  decrease: (stat: StatType) => boolean;
  /** Back to the starting allocation. */
  reset: () => void;
  /** Accelerating auto-repeat handlers for each stat's + button. Spread onto the button. */
  holdIncrease: Record<StatType, PressAndHoldHandlers>;
  /** Accelerating auto-repeat handlers for each stat's − button. Spread onto the button. */
  holdDecrease: Record<StatType, PressAndHoldHandlers>;
}

/**
 * Spends a fixed budget of stat points across POW/VIT/SPD, one at a time, with press-and-hold
 * auto-repeat for the +/− buttons. The host owns what "confirm" means; this only holds the
 * pending split and the rules for moving points.
 *
 * `initialPending` is where Reset returns to and what `hasPendingChanges` compares against —
 * zeros for a level-up, or a hero's current allocation when re-spending it.
 */
export function useStatAllocation(availablePoints: number, initialPending: CoreRPGStats = NO_POINTS): StatAllocation {
  const [pending, setPending] = useState<CoreRPGStats>(initialPending);

  const pointsSpent = sumStats(pending);
  const pointsRemaining = availablePoints - pointsSpent;

  // Mirror the latest allocation state into refs so the accelerating press-and-hold train (which
  // fires from setTimeout callbacks) can guard itself without stale closures. Optimistically
  // adjusted on each step and resynced to the committed state every render.
  const pointsRemainingRef = useRef(pointsRemaining);
  pointsRemainingRef.current = pointsRemaining;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  function increase(stat: StatType): boolean {
    if (pointsRemainingRef.current <= 0) return false;
    pointsRemainingRef.current -= 1; // optimistic; resynced on next render
    setPending((prev) => {
      if (sumStats(prev) >= availablePoints) return prev; // hard cap — never overspend
      return { ...prev, [stat]: prev[stat] + 1 };
    });
    return true;
  }

  function decrease(stat: StatType): boolean {
    if (pendingRef.current[stat] <= 0) return false;
    pendingRef.current = { ...pendingRef.current, [stat]: pendingRef.current[stat] - 1 }; // optimistic
    pointsRemainingRef.current += 1;
    setPending((prev) => {
      if (prev[stat] <= 0) return prev;
      return { ...prev, [stat]: prev[stat] - 1 };
    });
    return true;
  }

  function reset() {
    setPending(initialPending);
  }

  // onClick still handles the single step for a plain click / keyboard, so holds never double-count.
  const holdIncrease: Record<StatType, PressAndHoldHandlers> = {
    pow: usePressAndHold(() => increase('pow')),
    vit: usePressAndHold(() => increase('vit')),
    spd: usePressAndHold(() => increase('spd')),
  };
  const holdDecrease: Record<StatType, PressAndHoldHandlers> = {
    pow: usePressAndHold(() => decrease('pow')),
    vit: usePressAndHold(() => decrease('vit')),
    spd: usePressAndHold(() => decrease('spd')),
  };

  return {
    pending,
    pointsSpent,
    pointsRemaining,
    hasPendingChanges: !statsEqual(pending, initialPending),
    allPointsAllocated: pointsRemaining === 0,
    increase,
    decrease,
    reset,
    holdIncrease,
    holdDecrease,
  };
}
