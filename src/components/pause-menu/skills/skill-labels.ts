import type { SkillTarget } from '~/types/skills';
import { resolveActiveSkillStats, resolvePassiveModifiers } from '~/lib/skill-system';
import { describePassiveModifiers } from './passive-descriptions';
import type { SkillSelection } from './skill-detail-panel';

/**
 * Shared player-facing wording for a skill. Every surface that describes a skill
 * — the detail panel's stat strip and the slot hover card — reads from here, so
 * the same skill can never be phrased two ways.
 */

// Short on purpose — the active stat strip must fit one line in Press Start 2P.
const TARGET_LABELS: Record<SkillTarget, string> = {
  enemy: 'One enemy',
  allEnemy: 'All enemies',
  ally: 'Weakest ally',
  allAlly: 'Whole party',
};

const ROMAN_TIERS = ['I', 'II', 'III', 'IV'] as const;

/** One effect of a skill, resolved at a level. */
export interface SkillEffectLine {
  text: string;
  /** Better than the baseline — the detail panel tints these gold. */
  highlight?: boolean;
}

/** `Ultimate` or `Passive`. */
function getKindLabel(selection: SkillSelection): string {
  return selection.kind === 'active' ? 'Ultimate' : 'Passive';
}

/** Roman tier numeral for either kind. Actives are 0-based, passives 1-based. */
function getTierNumeral(selection: SkillSelection): string {
  const tier = selection.kind === 'active' ? selection.skill.tier : selection.passive.tier;
  return ROMAN_TIERS[tier - 1];
}

/**
 * The detail panel's tier line: `Tier I Ultimate · from Lv 7`, or the fuller
 * sentence for the free tier-0 starter.
 * @param selection - The skill being described
 * @returns The tier line, without any level suffix
 */
export function getTierLabel(selection: SkillSelection): string {
  if (selection.kind === 'active' && selection.skill.tier === 0) {
    return 'Starting Ultimate — every hero begins with this';
  }
  const def = selection.kind === 'active' ? selection.skill : selection.passive;
  return `Tier ${getTierNumeral(selection)} ${getKindLabel(selection)} · from Lv ${def.unlockLevel}`;
}

/**
 * The hover card's tier line: `Tier I Ultimate`. Drops the level gate and the
 * tier-0 sentence, both of which are too long for a ~280px card.
 * @param selection - The skill being described
 * @returns A short tier label
 */
export function getShortTierLabel(selection: SkillSelection): string {
  if (selection.kind === 'active' && selection.skill.tier === 0) return 'Starting Ultimate';
  return `Tier ${getTierNumeral(selection)} ${getKindLabel(selection)}`;
}

/**
 * What the skill does at `level`, one line per effect. Actives report target,
 * damage and charge speed; passives delegate to their modifier formatters.
 * @param selection - The skill being described
 * @param level - The level to resolve the effects at
 * @returns One line per effect, in display order
 */
export function describeSkillEffects(selection: SkillSelection, level: number): SkillEffectLine[] {
  if (selection.kind === 'passive') {
    return describePassiveModifiers(resolvePassiveModifiers(selection.passive, level)).map((text) => ({ text }));
  }

  const skill = selection.skill;
  const stats = resolveActiveSkillStats(skill, level);
  const heals = skill.target === 'ally' || skill.target === 'allAlly';
  const flat = stats.flatDamageBonus > 0 ? ` +${stats.flatDamageBonus}` : '';
  return [
    { text: TARGET_LABELS[skill.target] },
    { text: `${heals ? 'Heal' : 'Dmg'} ×${stats.baseDamageMultiplier}${flat}` },
    // A charge multiplier under 1 means it fires sooner — that's the good case.
    { text: `Charge ×${stats.cooldownMultiplier}`, highlight: stats.cooldownMultiplier < 1 },
  ];
}
