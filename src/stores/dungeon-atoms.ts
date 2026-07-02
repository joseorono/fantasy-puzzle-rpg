/**
 * Transient run state for an active dungeon, held in module-level Jotai atoms.
 *
 * CLAUDE.md scopes Jotai to battle/combat state. This is a deliberate, documented
 * exception: dungeon-run state is transient and battle-like — it must survive
 * `DungeonView` unmounting while the `battle` / `battle-rewards` views are shown,
 * so module-level atoms (mirroring `battle-atoms.ts`) are the right tool. None of
 * it is persisted: reloading the page restarts the run at Floor 1 (in-memory v1).
 * The Zustand store is written exactly once per run, on completion
 * (`markDungeonCompleted`), never per floor/event.
 */

import { atom } from 'jotai';

/** Coarse lifecycle phase of the active run. */
export type DungeonPhase = 'browsing' | 'awaiting-battle' | 'complete';

export const activeDungeonIdAtom = atom<string | null>(null);
export const currentFloorIndexAtom = atom(0);
/** Resume point within the current floor's `events[]` (survives a combat round-trip). */
export const currentEventIndexAtom = atom(0);
export const dungeonPhaseAtom = atom<DungeonPhase>('browsing');
/** Seeded from `DungeonViewData.isReplay` on mount; on replays only combats run. */
export const isReplayAtom = atom(false);
/** One free Rest per floor; reset on floor advance. */
export const hasRestedOnFloorAtom = atom(false);
/** Rests spent so far this run; capped by getDungeonRestPool(). Persists across floors. */
export const restsUsedAtom = atom(0);

/**
 * Start (or restart) a dungeon run. Authoritative: resets every run atom before
 * seeding, so a stale run left over from a prior wipe/exit can never leak in.
 */
export const startDungeonRunAtom = atom(
  null,
  (_get, set, params: { dungeonId: string; isReplay: boolean }) => {
    set(activeDungeonIdAtom, params.dungeonId);
    set(currentFloorIndexAtom, 0);
    set(currentEventIndexAtom, 0);
    set(dungeonPhaseAtom, 'browsing');
    set(isReplayAtom, params.isReplay);
    set(hasRestedOnFloorAtom, false);
    set(restsUsedAtom, 0);
  },
);

/** Advance to the next event within the current floor. */
export const advanceEventAtom = atom(null, (get, set) => {
  set(currentEventIndexAtom, get(currentEventIndexAtom) + 1);
});

/**
 * Resolve a won combat on return to the dungeon view: leave the `awaiting-battle`
 * phase and step past the combat event. Idempotent — guarded on the phase so a
 * double invocation (e.g. React StrictMode's double-fired mount effect) advances
 * the event exactly once. Defeat never reaches here (it resets the router).
 */
export const resolveBattleWinAtom = atom(null, (get, set) => {
  if (get(dungeonPhaseAtom) !== 'awaiting-battle') return;
  set(dungeonPhaseAtom, 'browsing');
  set(currentEventIndexAtom, get(currentEventIndexAtom) + 1);
});

/** Advance to the next floor: reset the event index and the per-floor Rest flag. */
export const advanceFloorAtom = atom(null, (get, set) => {
  set(currentFloorIndexAtom, get(currentFloorIndexAtom) + 1);
  set(currentEventIndexAtom, 0);
  set(hasRestedOnFloorAtom, false);
});

/** Tear the run back down to defaults (leave / wipe). */
export const resetDungeonRunAtom = atom(null, (_get, set) => {
  set(activeDungeonIdAtom, null);
  set(currentFloorIndexAtom, 0);
  set(currentEventIndexAtom, 0);
  set(dungeonPhaseAtom, 'browsing');
  set(isReplayAtom, false);
  set(hasRestedOnFloorAtom, false);
  set(restsUsedAtom, 0);
});
