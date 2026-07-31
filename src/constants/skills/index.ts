import type { CharacterClass } from '~/types/rpg-elements';
import type { SkillDefinition, PassiveSkillDefinition } from '~/types/skills';
import { WARRIOR_ACTIVES, WARRIOR_PASSIVES } from './warrior';
import { ROGUE_ACTIVES, ROGUE_PASSIVES } from './rogue';
import { MAGE_ACTIVES, MAGE_PASSIVES } from './mage';
import { HEALER_ACTIVES, HEALER_PASSIVES } from './healer';

/**
 * Skill data assembly. One file per character in this folder; this index builds
 * the registries and per-class groupings the rest of the game consumes.
 * Roster reference: docs/ideas-proposals/SKILL_ROSTER.md.
 */

export { packIcon, CLASS_SKILL_SHEET, classSheetIconCount } from './icons';
export { ACTIVE_TIER_LEVELS, ACTIVE_TIER_COSTS, PASSIVE_TIER_LEVELS, PASSIVE_TIER_COSTS } from './tiers';
export {
  DEFAULT_SKILL_MAX_LEVEL,
  SKILL_LEVEL_GATE_OFFSETS,
  ACTIVE_LEVEL_GATES,
  PASSIVE_LEVEL_GATES,
  ACTIVE_UPGRADE_COSTS,
  PASSIVE_UPGRADE_COSTS,
} from './levels';

/** Base damage value used for all skill damage calculations. */
export const BASE_SKILL_DAMAGE = 15;

/** All Active skills grouped by owning class, in tier order. */
export const SKILLS_BY_CLASS: Record<CharacterClass, SkillDefinition[]> = {
  warrior: WARRIOR_ACTIVES,
  rogue: ROGUE_ACTIVES,
  mage: MAGE_ACTIVES,
  healer: HEALER_ACTIVES,
};

/** All Passive skills grouped by owning class, in tier order. */
export const PASSIVES_BY_CLASS: Record<CharacterClass, PassiveSkillDefinition[]> = {
  warrior: WARRIOR_PASSIVES,
  rogue: ROGUE_PASSIVES,
  mage: MAGE_PASSIVES,
  healer: HEALER_PASSIVES,
};

/** Every Active skill in the game, keyed by its stable `id`. */
export const SKILL_REGISTRY: Record<string, SkillDefinition> = Object.fromEntries(
  Object.values(SKILLS_BY_CLASS)
    .flat()
    .map((skill) => [skill.id, skill]),
);

/** Every Passive skill in the game, keyed by its stable `id`. */
export const PASSIVE_REGISTRY: Record<string, PassiveSkillDefinition> = Object.fromEntries(
  Object.values(PASSIVES_BY_CLASS)
    .flat()
    .map((passive) => [passive.id, passive]),
);

/**
 * The starting skill each class owns and has selected by default — derived from
 * the tier-0 entry of each class's active list, never hand-maintained.
 */
export const DEFAULT_SKILL_BY_CLASS: Record<CharacterClass, string> = Object.fromEntries(
  Object.entries(SKILLS_BY_CLASS).map(([characterClass, skills]) => {
    const starter = skills.find((skill) => skill.tier === 0);
    if (!starter) throw new Error(`No tier-0 active skill defined for class "${characterClass}"`);
    return [characterClass, starter.id];
  }),
) as Record<CharacterClass, string>;
