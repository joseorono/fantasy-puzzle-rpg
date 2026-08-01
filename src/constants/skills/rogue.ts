import type { SkillDefinition, PassiveSkillDefinition, SkillIconPosition } from '~/types/skills';
import { packIcon } from './icons';
import { ACTIVE_TIER_LEVELS, ACTIVE_TIER_COSTS, PASSIVE_TIER_LEVELS, PASSIVE_TIER_COSTS } from './tiers';
import {
  DEFAULT_SKILL_MAX_LEVEL,
  ACTIVE_LEVEL_GATES,
  PASSIVE_LEVEL_GATES,
  ACTIVE_UPGRADE_COSTS,
  PASSIVE_UPGRADE_COSTS,
} from './levels';

/**
 * 🏹 Rogue — archer-assassin sheet, spread from hunter green to shadow purple.
 * Identity: tempo. Shortest Ultimate cooldown in the party, lowest numbers.
 */

const ICON = {
  aimedShot: packIcon(1), // AC_01_AimedShot
  multishot: packIcon(2), // AC_02_Multishot
  shadowStrike: packIcon(52), // AC_52_ShadowStrike
  arrowStorm: packIcon(30), // AC_30_ArrowStorm
  hawkEye: packIcon(6), // AC_06_HawkEye
  wolfsHowl: packIcon(15), // AC_15_WolfsHowl
  backstab: packIcon(53), // AC_53_Backstab
  shadowDash: packIcon(50), // AC_50_ShadowDash
} satisfies Record<string, SkillIconPosition>;

export const ROGUE_ACTIVES: SkillDefinition[] = [
  {
    id: 'rogue-aimed-shot',
    class: 'rogue',
    tier: 0,
    name: 'Aimed Shot',
    description: 'A precise shot targeting a vital point for a burst of damage.',
    icon: ICON.aimedShot,
    baseDamageMultiplier: 1,
    flatDamageBonus: 30,
    target: 'enemy',
    cooldownMultiplier: 1,
    unlockLevel: ACTIVE_TIER_LEVELS[0],
    cost: ACTIVE_TIER_COSTS[0],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 1, flatDamageBonus: 33, cooldownMultiplier: 1, cost: ACTIVE_UPGRADE_COSTS[0][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[0][0] },
      { baseDamageMultiplier: 1, flatDamageBonus: 36, cooldownMultiplier: 1, cost: ACTIVE_UPGRADE_COSTS[0][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[0][1] },
      { baseDamageMultiplier: 1, flatDamageBonus: 44, cooldownMultiplier: 1, cost: ACTIVE_UPGRADE_COSTS[0][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[0][2] },
    ],
  },
  {
    id: 'rogue-multishot',
    class: 'rogue',
    tier: 1,
    name: 'Multishot',
    description: 'A fan of arrows peppering every enemy for quick spread damage.',
    icon: ICON.multishot,
    baseDamageMultiplier: 1,
    flatDamageBonus: 10,
    target: 'allEnemy',
    cooldownMultiplier: 1.2,
    unlockLevel: ACTIVE_TIER_LEVELS[1],
    cost: ACTIVE_TIER_COSTS[1],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 1.1, flatDamageBonus: 11, cooldownMultiplier: 1.2, cost: ACTIVE_UPGRADE_COSTS[1][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[1][0] },
      { baseDamageMultiplier: 1.2, flatDamageBonus: 12, cooldownMultiplier: 1.2, cost: ACTIVE_UPGRADE_COSTS[1][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[1][1] },
      { baseDamageMultiplier: 1.4, flatDamageBonus: 15, cooldownMultiplier: 1.2, cost: ACTIVE_UPGRADE_COSTS[1][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[1][2] },
    ],
  },
  {
    id: 'rogue-shadow-strike',
    class: 'rogue',
    tier: 2,
    name: 'Shadow Strike',
    description: 'A blink-fast strike from the shadows that recharges quickly.',
    icon: ICON.shadowStrike,
    baseDamageMultiplier: 1.5,
    flatDamageBonus: 10,
    target: 'enemy',
    cooldownMultiplier: 0.7,
    unlockLevel: ACTIVE_TIER_LEVELS[2],
    cost: ACTIVE_TIER_COSTS[2],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 1.6, flatDamageBonus: 11, cooldownMultiplier: 0.7, cost: ACTIVE_UPGRADE_COSTS[2][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[2][0] },
      { baseDamageMultiplier: 1.7, flatDamageBonus: 12, cooldownMultiplier: 0.7, cost: ACTIVE_UPGRADE_COSTS[2][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[2][1] },
      { baseDamageMultiplier: 2, flatDamageBonus: 15, cooldownMultiplier: 0.7, cost: ACTIVE_UPGRADE_COSTS[2][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[2][2] },
    ],
  },
  {
    id: 'rogue-arrow-storm',
    class: 'rogue',
    tier: 3,
    name: 'Arrow Storm',
    description: 'A whirling storm of arrows that rakes the whole enemy line.',
    icon: ICON.arrowStorm,
    baseDamageMultiplier: 2,
    flatDamageBonus: 10,
    target: 'allEnemy',
    cooldownMultiplier: 1.5,
    unlockLevel: ACTIVE_TIER_LEVELS[3],
    cost: ACTIVE_TIER_COSTS[3],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 2.15, flatDamageBonus: 11, cooldownMultiplier: 1.5, cost: ACTIVE_UPGRADE_COSTS[3][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[3][0] },
      { baseDamageMultiplier: 2.3, flatDamageBonus: 12, cooldownMultiplier: 1.5, cost: ACTIVE_UPGRADE_COSTS[3][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[3][1] },
      { baseDamageMultiplier: 2.7, flatDamageBonus: 16, cooldownMultiplier: 1.4, cost: ACTIVE_UPGRADE_COSTS[3][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[3][2] },
    ],
  },
];

export const ROGUE_PASSIVES: PassiveSkillDefinition[] = [
  {
    id: 'rogue-hawk-eye',
    class: 'rogue',
    tier: 1,
    name: 'Hawk Eye',
    description: 'Her cascades ramp up damage faster.',
    icon: ICON.hawkEye,
    unlockLevel: PASSIVE_TIER_LEVELS[0],
    cost: PASSIVE_TIER_COSTS[0],
    modifiers: { cascadeBonus: 0.05 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { cascadeBonus: 0.06 }, cost: PASSIVE_UPGRADE_COSTS[0][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[0][0] },
      { modifiers: { cascadeBonus: 0.07 }, cost: PASSIVE_UPGRADE_COSTS[0][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[0][1] },
      { modifiers: { cascadeBonus: 0.09 }, cost: PASSIVE_UPGRADE_COSTS[0][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[0][2] },
    ],
  },
  {
    id: 'rogue-wolfs-howl',
    class: 'rogue',
    tier: 2,
    name: "Wolf's Howl",
    description: "Her hits push the enemy's attack timer back harder.",
    icon: ICON.wolfsHowl,
    unlockLevel: PASSIVE_TIER_LEVELS[1],
    cost: PASSIVE_TIER_COSTS[1],
    modifiers: { staggerPushMultiplier: 1.5 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { staggerPushMultiplier: 1.6 }, cost: PASSIVE_UPGRADE_COSTS[1][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[1][0] },
      { modifiers: { staggerPushMultiplier: 1.7 }, cost: PASSIVE_UPGRADE_COSTS[1][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[1][1] },
      { modifiers: { staggerPushMultiplier: 2 }, cost: PASSIVE_UPGRADE_COSTS[1][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[1][2] },
    ],
  },
  {
    id: 'rogue-backstab',
    class: 'rogue',
    tier: 3,
    name: 'Backstab',
    description: 'Her matches bite deeper.',
    icon: ICON.backstab,
    unlockLevel: PASSIVE_TIER_LEVELS[2],
    cost: PASSIVE_TIER_COSTS[2],
    modifiers: { matchDamageMultiplier: 1.12 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { matchDamageMultiplier: 1.15 }, cost: PASSIVE_UPGRADE_COSTS[2][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[2][0] },
      { modifiers: { matchDamageMultiplier: 1.18 }, cost: PASSIVE_UPGRADE_COSTS[2][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[2][1] },
      { modifiers: { matchDamageMultiplier: 1.25 }, cost: PASSIVE_UPGRADE_COSTS[2][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[2][2] },
    ],
  },
  {
    id: 'rogue-shadow-dash',
    class: 'rogue',
    tier: 4,
    name: 'Shadow Dash',
    description: 'Her Ultimate charges noticeably faster.',
    icon: ICON.shadowDash,
    unlockLevel: PASSIVE_TIER_LEVELS[3],
    cost: PASSIVE_TIER_COSTS[3],
    modifiers: { skillCooldownMultiplier: 0.85 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { skillCooldownMultiplier: 0.83 }, cost: PASSIVE_UPGRADE_COSTS[3][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[3][0] },
      { modifiers: { skillCooldownMultiplier: 0.8 }, cost: PASSIVE_UPGRADE_COSTS[3][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[3][1] },
      { modifiers: { skillCooldownMultiplier: 0.72 }, cost: PASSIVE_UPGRADE_COSTS[3][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[3][2] },
    ],
  },
];
