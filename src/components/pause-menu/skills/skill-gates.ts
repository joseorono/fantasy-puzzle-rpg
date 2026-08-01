import type { CharacterData } from '~/types/rpg-elements';
import type { Resources } from '~/types/resources';
import { canAfford } from '~/lib/resources';
import {
  isSkillUnlocked,
  isPassiveUnlocked,
  hasPreviousActiveTier,
  hasPreviousPassiveTier,
  getSkillsForClass,
  getPassivesForClass,
} from '~/lib/skill-system';
import type { SkillSelection } from './skill-detail-panel';

/**
 * Why a purchase is currently blocked, in player language. Shared by the detail
 * panel's disabled action buttons and the slot hover card, so the two can never
 * name different reasons for the same skill.
 */

/** The gates, in the order they're reported. A skipped lower tier outranks everything. */
function findLockedPreviousTier(character: CharacterData, selection: SkillSelection) {
  if (selection.kind === 'active') {
    if (hasPreviousActiveTier(character, selection.skill)) return undefined;
    return getSkillsForClass(selection.skill.class).find(
      (s) => s.tier < selection.skill.tier && !isSkillUnlocked(character, s.id),
    );
  }
  if (hasPreviousPassiveTier(character, selection.passive)) return undefined;
  return getPassivesForClass(selection.passive.class).find(
    (p) => p.tier < selection.passive.tier && !isPassiveUnlocked(character, p.id),
  );
}

/**
 * Why this skill cannot be unlocked yet.
 * @param character - The character buying it
 * @param selection - The skill being unlocked
 * @param resources - The party's current resources
 * @returns The failing gate in player language, or null when the unlock is allowed
 */
export function getUnlockGateReason(
  character: CharacterData,
  selection: SkillSelection,
  resources: Resources,
): string | null {
  const def = selection.kind === 'active' ? selection.skill : selection.passive;
  const previousLocked = findLockedPreviousTier(character, selection);
  if (previousLocked) return `Unlock ${previousLocked.name} first`;
  if (character.level < def.unlockLevel) return `Requires Lv ${def.unlockLevel}`;
  if (!canAfford(resources, def.cost)) return 'Not enough resources';
  return null;
}

/** The gates on a level purchase — both kinds' upgrade entries carry these two fields. */
interface UpgradeGate {
  cost: Resources;
  requiredCharacterLevel: number;
}

/**
 * Why the next level cannot be bought yet.
 * @param character - The character buying it
 * @param nextUpgrade - The upgrade entry being bought
 * @param resources - The party's current resources
 * @returns The failing gate in player language, or null when the upgrade is allowed
 */
export function getUpgradeGateReason(
  character: CharacterData,
  nextUpgrade: UpgradeGate,
  resources: Resources,
): string | null {
  if (character.level < nextUpgrade.requiredCharacterLevel) return `Requires Lv ${nextUpgrade.requiredCharacterLevel}`;
  if (!canAfford(resources, nextUpgrade.cost)) return 'Not enough resources';
  return null;
}
