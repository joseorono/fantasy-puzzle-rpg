/**
 * Pure functions for the character skill system — both kinds:
 * - Active skills ("Ultimates"): lookup, selection, unlocking, and the
 *   charge-speed modifier on a character's cooldown.
 * - Passive skills: lookup, tier-ordered unlocking, and aggregation of their
 *   modifiers into flat records battle code can read as plain numbers.
 */

import type { CharacterData, CharacterClass } from '~/types/rpg-elements';
import type {
  SkillDefinition,
  PassiveSkillDefinition,
  CharacterPassiveModifiers,
  PartyPassiveModifiers,
} from '~/types/skills';
import {
  SKILL_REGISTRY,
  DEFAULT_SKILL_BY_CLASS,
  SKILLS_BY_CLASS,
  PASSIVE_REGISTRY,
  PASSIVES_BY_CLASS,
} from '~/constants/skills';
import { calculateCharacterCooldown } from './rpg-calculations';

/**
 * Look up a skill definition by its id.
 * @param skillId - The skill's stable id
 * @returns The skill definition, or undefined if the id is unknown
 */
export function getSkillById(skillId: string): SkillDefinition | undefined {
  return SKILL_REGISTRY[skillId];
}

/**
 * Get every skill that belongs to a given class.
 * @param characterClass - The class to list skills for
 * @returns The class's skills in registry order
 */
export function getSkillsForClass(characterClass: CharacterClass): SkillDefinition[] {
  return SKILLS_BY_CLASS[characterClass] ?? [];
}

/**
 * Resolve the character's currently active skill.
 * Falls back to the class default when `selectedSkillId` is missing or invalid.
 * @param character - The character to resolve the skill for
 * @returns The active skill definition
 */
export function getSelectedSkill(character: CharacterData): SkillDefinition {
  const selected = character.selectedSkillId ? SKILL_REGISTRY[character.selectedSkillId] : undefined;
  if (selected) return selected;
  return SKILL_REGISTRY[DEFAULT_SKILL_BY_CLASS[character.class]];
}

/**
 * Get the skill definitions a character has unlocked (skips unknown ids).
 * @param character - The character whose unlocked skills to resolve
 * @returns The unlocked skill definitions
 */
export function getUnlockedSkills(character: CharacterData): SkillDefinition[] {
  return character.unlockedSkillIds
    .map((id) => SKILL_REGISTRY[id])
    .filter((skill): skill is SkillDefinition => Boolean(skill));
}

/**
 * Check whether a character has unlocked a specific skill.
 * @param character - The character to check
 * @param skillId - The skill id to look for
 * @returns True if the skill is in the character's unlocked list
 */
export function isSkillUnlocked(character: CharacterData, skillId: string): boolean {
  return character.unlockedSkillIds.includes(skillId);
}

/**
 * Unlock a skill for a character. Pure: returns a new character. Ignores unknown
 * skill ids, skills belonging to another class, and already-unlocked skills.
 * @param character - The character to unlock the skill for
 * @param skillId - The skill id to unlock
 * @returns A new character with the skill unlocked, or the original if no change
 */
export function unlockSkill(character: CharacterData, skillId: string): CharacterData {
  const skill = SKILL_REGISTRY[skillId];
  if (!skill || skill.class !== character.class) return character;
  if (character.unlockedSkillIds.includes(skillId)) return character;
  return {
    ...character,
    unlockedSkillIds: [...character.unlockedSkillIds, skillId],
  };
}

/**
 * Select a skill as a character's active skill. Pure: returns a new character.
 * Only switches when the skill is already unlocked.
 * @param character - The character to update
 * @param skillId - The skill id to select
 * @returns A new character with the skill selected, or the original if not unlocked
 */
export function selectSkill(character: CharacterData, skillId: string): CharacterData {
  if (!character.unlockedSkillIds.includes(skillId)) return character;
  if (character.selectedSkillId === skillId) return character;
  return {
    ...character,
    selectedSkillId: skillId,
  };
}

/**
 * Find skills a character qualifies for at a given level but has not yet unlocked.
 * Drives automatic level-up skill unlocks.
 * @param character - The character to check
 * @param level - The level to evaluate against (typically the new level)
 * @returns The class skills with `unlockLevel <= level` not already owned
 */
export function getNewlyUnlockableSkills(character: CharacterData, level: number): SkillDefinition[] {
  return getSkillsForClass(character.class).filter(
    (skill) => skill.unlockLevel <= level && !character.unlockedSkillIds.includes(skill.id),
  );
}

/**
 * Calculate a character's effective skill cooldown: the SPD-based cooldown, the
 * active skill's charge-speed multiplier, and any unlocked passive
 * `skillCooldownMultiplier`. Called at battle-state creation and after each
 * activation, so passives bake into the snapshot automatically.
 * @param character - The character to calculate the cooldown for
 * @returns The effective cooldown in seconds
 */
export function resolveCharacterCooldown(character: CharacterData): number {
  return (
    calculateCharacterCooldown(character) *
    getSelectedSkill(character).cooldownMultiplier *
    getCharacterPassiveModifiers(character).skillCooldownMultiplier
  );
}

// ─── Passive skills ──────────────────────────────────────────────────

/** Neutral per-character modifiers: 0 for additive keys, 1 for multiplicative. */
export const IDENTITY_CHARACTER_PASSIVES: CharacterPassiveModifiers = {
  cascadeBonus: 0,
  matchDamageMultiplier: 1,
  skillDamageMultiplier: 1,
  skillCooldownMultiplier: 1,
  skillGuardRestore: 0,
  staggerPushMultiplier: 1,
};

/** Neutral party-wide modifiers: 0 for additive keys, 1 for multiplicative. */
export const IDENTITY_PARTY_PASSIVES: PartyPassiveModifiers = {
  guardChargeRateBonus: 0,
  guardDecayResistanceMultiplier: 1,
  itemCooldownSpdBonus: 0,
};

/**
 * Look up a passive definition by its id.
 * @param passiveId - The passive's stable id
 * @returns The passive definition, or undefined if the id is unknown
 */
export function getPassiveById(passiveId: string): PassiveSkillDefinition | undefined {
  return PASSIVE_REGISTRY[passiveId];
}

/**
 * Get every passive that belongs to a given class, in tier order.
 * @param characterClass - The class to list passives for
 * @returns The class's passives (tier 1 → 4)
 */
export function getPassivesForClass(characterClass: CharacterClass): PassiveSkillDefinition[] {
  return PASSIVES_BY_CLASS[characterClass] ?? [];
}

/**
 * Check whether a character has unlocked a specific passive.
 * @param character - The character to check
 * @param passiveId - The passive id to look for
 * @returns True if the passive is in the character's unlocked list
 */
export function isPassiveUnlocked(character: CharacterData, passiveId: string): boolean {
  return (character.unlockedPassiveIds ?? []).includes(passiveId);
}

/**
 * Get the passive definitions a character has unlocked (skips unknown ids).
 * @param character - The character whose unlocked passives to resolve
 * @returns The unlocked passive definitions
 */
export function getUnlockedPassives(character: CharacterData): PassiveSkillDefinition[] {
  return (character.unlockedPassiveIds ?? [])
    .map((id) => PASSIVE_REGISTRY[id])
    .filter((passive): passive is PassiveSkillDefinition => Boolean(passive));
}

/**
 * Check the tier-order prerequisite: every lower tier of the class track must
 * already be unlocked before this passive can be.
 * @param character - The character to check
 * @param passive - The passive being considered
 * @returns True when all lower-tier passives of the class are unlocked
 */
export function hasPreviousPassiveTier(character: CharacterData, passive: PassiveSkillDefinition): boolean {
  return getPassivesForClass(passive.class)
    .filter((p) => p.tier < passive.tier)
    .every((p) => isPassiveUnlocked(character, p.id));
}

/**
 * Unlock a passive for a character. Pure: returns a new character. Ignores
 * unknown ids, passives of another class, already-unlocked passives, and
 * passives whose lower tiers are not yet unlocked. Resource costs are the
 * caller's concern (see `useUnlockPassive`).
 * @param character - The character to unlock the passive for
 * @param passiveId - The passive id to unlock
 * @returns A new character with the passive unlocked, or the original if no change
 */
export function unlockPassive(character: CharacterData, passiveId: string): CharacterData {
  const passive = PASSIVE_REGISTRY[passiveId];
  if (!passive || passive.class !== character.class) return character;
  if (isPassiveUnlocked(character, passiveId)) return character;
  if (!hasPreviousPassiveTier(character, passive)) return character;
  return {
    ...character,
    unlockedPassiveIds: [...(character.unlockedPassiveIds ?? []), passiveId],
  };
}

/**
 * Aggregate a character's unlocked passives into one flat per-character record.
 * Additive keys sum; multiplicative keys multiply. Party-wide keys are ignored
 * here — see `getPartyPassiveModifiers`.
 * @param character - The character whose passives to aggregate
 * @returns Total modifiers, identity-valued where nothing applies
 */
export function getCharacterPassiveModifiers(character: CharacterData): CharacterPassiveModifiers {
  const total = { ...IDENTITY_CHARACTER_PASSIVES };
  for (const passive of getUnlockedPassives(character)) {
    const m = passive.modifiers;
    total.cascadeBonus += m.cascadeBonus ?? 0;
    total.matchDamageMultiplier *= m.matchDamageMultiplier ?? 1;
    total.skillDamageMultiplier *= m.skillDamageMultiplier ?? 1;
    total.skillCooldownMultiplier *= m.skillCooldownMultiplier ?? 1;
    total.skillGuardRestore += m.skillGuardRestore ?? 0;
    total.staggerPushMultiplier *= m.staggerPushMultiplier ?? 1;
  }
  return total;
}

/**
 * Aggregate the whole party's unlocked passives into one flat party-wide record.
 * Deliberately counts every member, living or KO'd: the set is resolved once at
 * battle start and a build should not evaporate mid-fight (see
 * docs/ideas-proposals/SKILL_SYSTEM.md §6).
 * @param party - The party whose passives to aggregate
 * @returns Total party-wide modifiers, identity-valued where nothing applies
 */
export function getPartyPassiveModifiers(party: CharacterData[]): PartyPassiveModifiers {
  const total = { ...IDENTITY_PARTY_PASSIVES };
  for (const character of party) {
    for (const passive of getUnlockedPassives(character)) {
      const m = passive.modifiers;
      total.guardChargeRateBonus += m.guardChargeRateBonus ?? 0;
      total.guardDecayResistanceMultiplier *= m.guardDecayResistanceMultiplier ?? 1;
      total.itemCooldownSpdBonus += m.itemCooldownSpdBonus ?? 0;
    }
  }
  return total;
}
