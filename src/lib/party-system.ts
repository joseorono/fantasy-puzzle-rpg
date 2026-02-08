/**
 * Pure functions for party management and character operations
 */

import type { CharacterData } from '~/types/rpg-elements';
import { subtractionWithMin, additionWithMax } from './math';
import { calculatePartyCurrentHp } from './rpg-calculations';

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

/**
 * Returns party members that are still alive (currentHp > 0).
 * @param party - Array of party members
 * @returns Filtered array of living members
 */
export function getLivingMembers(party: CharacterData[]): CharacterData[] {
  return party.filter((char) => char.currentHp > 0);
}

/**
 * Returns living party members not at full HP, sorted by HP% ascending (most damaged first).
 * @param party - Array of party members
 * @returns Filtered and sorted array of healable members
 */
export function getHealableMembers(party: CharacterData[]): CharacterData[] {
  return party
    .filter((char) => char.currentHp > 0 && char.currentHp < char.maxHp)
    .sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp);
}

/**
 * Applies damage to a specific party member by ID, clamped to 0.
 * @param party - Array of party members
 * @param characterId - ID of the member to damage
 * @param damage - Amount of damage to apply
 * @returns New party array with the targeted member damaged
 */
export function damagePartyMember(party: CharacterData[], characterId: string, damage: number): CharacterData[] {
  return party.map((char) =>
    char.id === characterId ? { ...char, currentHp: subtractionWithMin(char.currentHp, damage, 0) } : char,
  );
}

/**
 * Heals a specific party member by ID, clamped to their maxHp.
 * @param party - Array of party members
 * @param characterId - ID of the member to heal
 * @param amount - Amount of HP to restore
 * @returns New party array with the targeted member healed
 */
export function healPartyMember(party: CharacterData[], characterId: string, amount: number): CharacterData[] {
  return party.map((char) =>
    char.id === characterId ? { ...char, currentHp: additionWithMax(char.currentHp, amount, char.maxHp) } : char,
  );
}

/**
 * Checks if the entire party is defeated (total HP <= 0).
 * @param party - Array of party members
 * @returns True if the party's collective HP is zero or less
 */
export function isPartyDefeated(party: CharacterData[]): boolean {
  return calculatePartyCurrentHp(party) <= 0;
}
