import { useGlobalAnimation } from '~/components/global-animations-system';
import { BATTLE_TRANSITION_ANIMATIONS, TOWN_ENTRY_ANIMATION } from '~/constants/animation-system';

/**
 * Cover transitions played before a route change, JRPG style. Each resolves once the screen is
 * fully covered, so navigate in the continuation:
 *
 *   await enterBattle();
 *   goToBattleDemo(...);
 *
 * Callers lock their own input for the duration (the map pauses movement, the dungeon flips
 * its phase, the training grounds latch a ref). Under reduced motion both resolve at once.
 */
export function useViewTransitions() {
  const { trigger, triggerFromPool } = useGlobalAnimation();

  return {
    /** A random pick from `BATTLE_TRANSITION_ANIMATIONS`, never the same one twice in a row. */
    enterBattle: () => triggerFromPool(BATTLE_TRANSITION_ANIMATIONS),
    enterTown: () => trigger(TOWN_ENTRY_ANIMATION),
  };
}
