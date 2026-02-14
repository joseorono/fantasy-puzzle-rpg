/**
 * Pure functions for battle state construction and combat utilities.
 */

import type { BattleState } from '~/types/battle';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { calculateCharacterCooldown } from '~/lib/rpg-calculations';
import { getPartyWithEffectiveStats } from '~/lib/equipment-system';
import { createInitialBoard } from '~/lib/match-3';
import { MIN_MATCH_SOUND_VOLUME, MAX_MATCH_SOUND_VOLUME } from '~/constants/audio';

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

/**
 * Returns the ID of the next living enemy after the current one, wrapping around
 * the encounter order. Useful for auto-selecting a new target when the current
 * enemy dies.
 * @param enemies - Array of enemies in encounter order
 * @param currentId - ID of the currently selected enemy
 * @returns ID of the next living enemy, or null if all are dead
 * @example
 * ```ts
 * const next = getNextLivingEnemyId(enemies, 'frog-1');
 * if (next) selectEnemy(next);
 * ```
 */
export function getNextLivingEnemyId(enemies: EnemyData[], currentId: string): string | null {
  const living = enemies.filter((e) => e.currentHp > 0);
  if (living.length === 0) return null;

  const currentIndex = enemies.findIndex((e) => e.id === currentId);
  for (let i = 1; i <= enemies.length; i++) {
    const idx = (currentIndex + i) % enemies.length;
    if (enemies[idx].currentHp > 0) return enemies[idx].id;
  }

  return living[0].id;
}

/**
 * Returns a volume level scaled by combo size.
 * A 3-orb match returns MIN_MATCH_SOUND_VOLUME, a 5-orb match returns MAX_MATCH_SOUND_VOLUME,
 * and values in between are linearly interpolated.
 * @param comboSize The number of orbs matched (typically 3-5).
 * @returns A volume value between MIN_MATCH_SOUND_VOLUME and MAX_MATCH_SOUND_VOLUME.
 */
export function getMatchSoundVolume(comboSize: number): number {
  const MIN_COMBO = 3;
  const MAX_COMBO = 5;
  const clamped = Math.max(MIN_COMBO, Math.min(MAX_COMBO, comboSize));
  const t = (clamped - MIN_COMBO) / (MAX_COMBO - MIN_COMBO);
  return MIN_MATCH_SOUND_VOLUME + t * (MAX_MATCH_SOUND_VOLUME - MIN_MATCH_SOUND_VOLUME);
}
