import { useEffect, useState } from 'react';
import type { Orb, OrbSwap } from '~/types/battle';
import { findPossibleMove } from '~/lib/match-3';
import { BOARD_HINT_DELAY_MS } from '~/constants/battle';

/**
 * Idle hint for the match-3 board: once the board has been idle for `BOARD_HINT_DELAY_MS`,
 * returns one legal swap to highlight. Any board change (or leaving the idle state) clears the
 * hint and restarts the wait; selecting an orb does not, so a player following the hint keeps it.
 *
 * @param board - The current, settled board
 * @param isBoardIdle - True when the board is at rest and accepting input (no cascade, not paused)
 * @returns The hinted swap, or null while waiting / when no move exists
 */
export function useBoardHint(board: Orb[][], isBoardIdle: boolean): OrbSwap | null {
  const [hint, setHint] = useState<OrbSwap | null>(null);

  useEffect(() => {
    setHint(null);
    if (!isBoardIdle) return;

    const timer = setTimeout(() => setHint(findPossibleMove(board)), BOARD_HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [board, isBoardIdle]);

  return hint;
}
