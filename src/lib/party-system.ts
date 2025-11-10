/**
 * Pure functions for party management and character operations
 */

import type { CharacterData } from '~/types/rpg-elements';

/**
 * Fully heal all party members to their max HP
 * @param party - Array of party members
 * @returns New party array with all members at full HP
 */
export function fullyHealParty(party: CharacterData[]): CharacterData[] {
  return party.map((member) => ({
    ...member,
    currentHp: member.maxHp,
  }));
}

export function isPartyFullyHealed(party: CharacterData[]): boolean {
  return party.every((member) => member.currentHp === member.maxHp);
}

export function damageAllPartyMembers(
  party: CharacterData[],
  damage: number,
  canDie: boolean = false,
): CharacterData[] {
  // Damage all party members by a given amount
  // Useful for overworld & dungeon traps
  const minHp = canDie ? 0 : 1;
  return party.map((member) => ({
    ...member,
    currentHp: Math.max(minHp, member.currentHp - damage),
  }));
}
