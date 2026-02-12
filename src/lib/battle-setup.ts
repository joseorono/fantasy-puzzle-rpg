/**
 * Pure functions for constructing battle state.
 */

import type { BattleState } from '~/types/battle';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { calculateCharacterCooldown } from '~/lib/rpg-calculations';
import { getPartyWithEffectiveStats } from '~/lib/equipment-system';
import { createInitialBoard } from '~/lib/match-3';

/**
 * Creates a fresh BattleState for a given party and set of enemies.
 * Bakes equipment bonuses into party stats, sets skills on cooldown,
 * and resets all combat state to initial values.
 * @param party - The party members (raw, without equipment bonuses applied)
 * @param enemies - The enemies for this encounter
 * @returns A ready-to-use BattleState
 * @example
 * ```ts
 * const state = createBattleState(partyMembers, [MOSS_GOLEM, SWAMP_FROG]);
 * set(battleStateAtom, state);
 * ```
 */
export function createBattleState(party: CharacterData[], enemies: EnemyData[]): BattleState {
  const effectiveParty = getPartyWithEffectiveStats(party);

  return {
    party: effectiveParty.map((char) => ({
      ...char,
      currentHp: char.maxHp,
      skillCooldown: calculateCharacterCooldown(char),
    })),
    enemies: enemies.map((e) => ({ ...e, currentHp: e.maxHp })),
    selectedEnemyId: enemies[0].id,
    board: createInitialBoard(),
    selectedOrb: null,
    currentMatches: [],
    score: 0,
    turn: 1,
    gameStatus: 'playing',
    lastDamage: null,
    lastMatchedType: null,
    lastSkillActivation: null,
  };
}
