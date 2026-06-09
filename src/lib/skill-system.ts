/**
 * Pure functions for the character skill system: looking up skills, resolving a
 * character's active skill, unlocking/selecting skills, and applying a skill's
 * charge-speed modifier to a character's cooldown.
 */

import type { CharacterData, CharacterClass } from '~/types/rpg-elements';
import type { SkillDefinition } from '~/types/skills';
import { SKILL_REGISTRY, DEFAULT_SKILL_BY_CLASS, SKILLS_BY_CLASS } from '~/constants/skills';
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
 * Calculate a character's effective skill cooldown, applying the active skill's
 * charge-speed multiplier on top of the SPD-based cooldown.
 * @param character - The character to calculate the cooldown for
 * @returns The effective cooldown in seconds
 */
export function resolveCharacterCooldown(character: CharacterData): number {
  return calculateCharacterCooldown(character) * getSelectedSkill(character).cooldownMultiplier;
}
