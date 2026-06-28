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

/**
 * Fully heal a single party member to their max HP, leaving other members untouched.
 * @param party - Array of party members
 * @param characterId - ID of the member to fully heal
 * @returns New party array with the targeted member at full HP
 */
export function fullyHealMember(party: CharacterData[], characterId: string): CharacterData[] {
  return party.map((member) => (member.id === characterId ? { ...member, currentHp: member.maxHp } : member));
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
 * Copies post-battle HP back onto the persistent (store) party, matched by id.
 * Battle members carry an equipment-adjusted maxHp, so each member's currentHp is clamped to
 * the store member's base maxHp. Members with no matching battle member are left untouched.
 * @param storeParty - The persistent party from the store
 * @param battleParty - The party from the finished battle (post-combat HP)
 * @returns New party array with currentHp synced from the battle
 */
export function applyHpFromBattle(storeParty: CharacterData[], battleParty: CharacterData[]): CharacterData[] {
  return storeParty.map((member) => {
    const battleMember = battleParty.find((b) => b.id === member.id);
    if (!battleMember) return member;
    return { ...member, currentHp: Math.min(battleMember.currentHp, member.maxHp) };
  });
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
 * Returns party members that are dead (currentHp <= 0).
 * @param party - Array of party members
 * @returns Filtered array of dead members
 */
export function getDeadMembers(party: CharacterData[]): CharacterData[] {
  return party.filter((char) => char.currentHp <= 0);
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
 * Heals all living party members by a given amount, clamped to each member's maxHp.
 * More efficient than calling healPartyMember for each member individually.
 * @param party - Array of party members
 * @param amount - Amount of HP to restore to each living member
 * @returns New party array with all living members healed
 */
export function healAllLivingPartyMembers(party: CharacterData[], amount: number): CharacterData[] {
  return party.map((char) =>
    char.currentHp > 0 ? { ...char, currentHp: additionWithMax(char.currentHp, amount, char.maxHp) } : char,
  );
}

/**
 * Heals all living party members and revives dead members.
 * Living members receive the full heal amount; dead members are revived with reviveAmount HP.
 * @param party - Array of party members
 * @param healAmount - Amount of HP to restore to each living member
 * @param reviveAmount - Amount of HP dead members are revived with
 * @returns New party array with living members healed and dead members revived
 */
export function healAndReviveAllPartyMembers(
  party: CharacterData[],
  healAmount: number,
  reviveAmount: number,
): CharacterData[] {
  return party.map((char) => {
    if (char.currentHp > 0) {
      return { ...char, currentHp: additionWithMax(char.currentHp, healAmount, char.maxHp) };
    }
    if (reviveAmount > 0) {
      return { ...char, currentHp: Math.min(reviveAmount, char.maxHp) };
    }
    return char;
  });
}

/**
 * Heals every party member by a percentage of their own max HP, clamped to max HP.
 * Living members gain `ceil(maxHp * healPercent)`. Dead members are revived: to
 * `ceil(maxHp * revivePercent)` when `revivePercent` is provided, otherwise to 1 HP.
 *
 * Percentage-based counterpart to {@link healAndReviveAllPartyMembers} (which takes
 * flat amounts). Used by the dungeon between-floor Rest.
 * @param party - Array of party members
 * @param healPercent - Fraction of max HP to restore to each living member (0–1)
 * @param revivePercent - Optional fraction of max HP to revive dead members with; omit for 1 HP
 * @returns New party array with living members healed and dead members revived
 */
export function healAllByMaxHpPercent(
  party: CharacterData[],
  healPercent: number,
  revivePercent?: number,
): CharacterData[] {
  return party.map((member) => {
    if (member.currentHp > 0) {
      const amount = Math.ceil(member.maxHp * healPercent);
      return { ...member, currentHp: additionWithMax(member.currentHp, amount, member.maxHp) };
    }
    if (revivePercent !== undefined && revivePercent > 0) {
      const amount = Math.ceil(member.maxHp * revivePercent);
      return { ...member, currentHp: Math.min(amount, member.maxHp) };
    }
    return { ...member, currentHp: 1 };
  });
}

/**
 * Checks if the entire party is defeated (total HP <= 0).
 * @param party - Array of party members
 * @returns True if the party's collective HP is zero or less
 */
export function isPartyDefeated(party: CharacterData[]): boolean {
  return calculatePartyCurrentHp(party) <= 0;
}
