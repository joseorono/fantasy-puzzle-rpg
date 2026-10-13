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
 * 📜 Healer — Paladin-flavoured icons (light, judgment, aura; no herbs or fairies).
 * Identity: sustain. Three of four actives heal; Light Judgment is the sole
 * damage option, a deliberate sacrifice of the party's healer for one charge.
 */

const ICON = {
  heal: packIcon(4), // PR_04_Heal
  salvation: packIcon(47), // PR_47_Salvation
  lightJudgment: packIcon(6), // PR_06_LightJudgment
  resurrection: packIcon(49), // PR_49_Resurrection
  blessingOfCourage: packIcon(1), // PR_01_BlessingOfCourage
  barrierOfLight: packIcon(12), // PR_12_BarrierOfLight
  auraOfGlory: packIcon(22), // PR_22_AuraOfGlory
  beaconOfLight: packIcon(42), // PR_42_BeaconOfLight
} satisfies Record<string, SkillIconPosition>;

export const HEALER_ACTIVES: SkillDefinition[] = [
  {
    id: 'healer-heal',
    class: 'healer',
    tier: 0,
    name: 'Heal',
    description: 'Bathes the whole party in restorative light.',
    icon: ICON.heal,
    baseDamageMultiplier: 4,
    flatDamageBonus: 0,
    target: 'allAlly',
    cooldownMultiplier: 1,
    unlockLevel: ACTIVE_TIER_LEVELS[0],
    cost: ACTIVE_TIER_COSTS[0],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 4.3, flatDamageBonus: 0, cooldownMultiplier: 1, cost: ACTIVE_UPGRADE_COSTS[0][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[0][0] },
      { baseDamageMultiplier: 4.6, flatDamageBonus: 0, cooldownMultiplier: 1, cost: ACTIVE_UPGRADE_COSTS[0][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[0][1] },
      { baseDamageMultiplier: 5.4, flatDamageBonus: 0, cooldownMultiplier: 1, cost: ACTIVE_UPGRADE_COSTS[0][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[0][2] },
    ],
  },
  {
    id: 'healer-salvation',
    class: 'healer',
    tier: 1,
    name: 'Salvation',
    description: 'A focused, fast rescue for the ally who needs it most.',
    icon: ICON.salvation,
    baseDamageMultiplier: 6,
    flatDamageBonus: 0,
    target: 'ally',
    cooldownMultiplier: 0.7,
    unlockLevel: ACTIVE_TIER_LEVELS[1],
    cost: ACTIVE_TIER_COSTS[1],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 6.4, flatDamageBonus: 0, cooldownMultiplier: 0.7, cost: ACTIVE_UPGRADE_COSTS[1][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[1][0] },
      { baseDamageMultiplier: 6.8, flatDamageBonus: 0, cooldownMultiplier: 0.7, cost: ACTIVE_UPGRADE_COSTS[1][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[1][1] },
      { baseDamageMultiplier: 8, flatDamageBonus: 0, cooldownMultiplier: 0.7, cost: ACTIVE_UPGRADE_COSTS[1][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[1][2] },
    ],
  },
  {
    id: 'healer-light-judgment',
    class: 'healer',
    tier: 2,
    name: 'Light Judgment',
    description: 'Scours every enemy with holy light — at the price of a heal.',
    icon: ICON.lightJudgment,
    baseDamageMultiplier: 2.5,
    flatDamageBonus: 10,
    target: 'allEnemy',
    cooldownMultiplier: 1.3,
    unlockLevel: ACTIVE_TIER_LEVELS[2],
    cost: ACTIVE_TIER_COSTS[2],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 2.7, flatDamageBonus: 11, cooldownMultiplier: 1.3, cost: ACTIVE_UPGRADE_COSTS[2][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[2][0] },
      { baseDamageMultiplier: 2.9, flatDamageBonus: 12, cooldownMultiplier: 1.3, cost: ACTIVE_UPGRADE_COSTS[2][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[2][1] },
      { baseDamageMultiplier: 3.4, flatDamageBonus: 16, cooldownMultiplier: 1.3, cost: ACTIVE_UPGRADE_COSTS[2][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[2][2] },
    ],
  },
  {
    id: 'healer-resurrection',
    class: 'healer',
    tier: 3,
    name: 'Resurrection',
    description: 'A great wave of light that mends the living and revives the fallen.',
    icon: ICON.resurrection,
    baseDamageMultiplier: 6,
    flatDamageBonus: 0,
    target: 'allAlly',
    cooldownMultiplier: 1.5,
    unlockLevel: ACTIVE_TIER_LEVELS[3],
    cost: ACTIVE_TIER_COSTS[3],
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { baseDamageMultiplier: 6.4, flatDamageBonus: 0, cooldownMultiplier: 1.5, cost: ACTIVE_UPGRADE_COSTS[3][0], requiredCharacterLevel: ACTIVE_LEVEL_GATES[3][0] },
      { baseDamageMultiplier: 6.8, flatDamageBonus: 0, cooldownMultiplier: 1.5, cost: ACTIVE_UPGRADE_COSTS[3][1], requiredCharacterLevel: ACTIVE_LEVEL_GATES[3][1] },
      { baseDamageMultiplier: 8, flatDamageBonus: 0, cooldownMultiplier: 1.4, cost: ACTIVE_UPGRADE_COSTS[3][2], requiredCharacterLevel: ACTIVE_LEVEL_GATES[3][2] },
    ],
  },
];

export const HEALER_PASSIVES: PassiveSkillDefinition[] = [
  {
    id: 'healer-blessing-of-courage',
    class: 'healer',
    tier: 1,
    name: 'Blessing of Courage',
    description: "The party's item cooldown comes back sooner.",
    icon: ICON.blessingOfCourage,
    unlockLevel: PASSIVE_TIER_LEVELS[0],
    cost: PASSIVE_TIER_COSTS[0],
    modifiers: { itemCooldownSpdBonus: 10 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { itemCooldownSpdBonus: 12 }, cost: PASSIVE_UPGRADE_COSTS[0][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[0][0] },
      { modifiers: { itemCooldownSpdBonus: 14 }, cost: PASSIVE_UPGRADE_COSTS[0][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[0][1] },
      { modifiers: { itemCooldownSpdBonus: 18 }, cost: PASSIVE_UPGRADE_COSTS[0][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[0][2] },
    ],
  },
  {
    id: 'healer-barrier-of-light',
    class: 'healer',
    tier: 2,
    name: 'Barrier of Light',
    description: 'Her Ultimate also restores the Guard meter.',
    icon: ICON.barrierOfLight,
    unlockLevel: PASSIVE_TIER_LEVELS[1],
    cost: PASSIVE_TIER_COSTS[1],
    modifiers: { skillGuardRestore: 20 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { skillGuardRestore: 23 }, cost: PASSIVE_UPGRADE_COSTS[1][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[1][0] },
      { modifiers: { skillGuardRestore: 26 }, cost: PASSIVE_UPGRADE_COSTS[1][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[1][1] },
      { modifiers: { skillGuardRestore: 32 }, cost: PASSIVE_UPGRADE_COSTS[1][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[1][2] },
    ],
  },
  {
    id: 'healer-aura-of-glory',
    class: 'healer',
    tier: 3,
    name: 'Aura of Glory',
    description: "The party's Guard bleeds away more slowly.",
    icon: ICON.auraOfGlory,
    unlockLevel: PASSIVE_TIER_LEVELS[2],
    cost: PASSIVE_TIER_COSTS[2],
    modifiers: { guardDecayResistanceMultiplier: 0.9 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { guardDecayResistanceMultiplier: 0.87 }, cost: PASSIVE_UPGRADE_COSTS[2][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[2][0] },
      { modifiers: { guardDecayResistanceMultiplier: 0.84 }, cost: PASSIVE_UPGRADE_COSTS[2][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[2][1] },
      { modifiers: { guardDecayResistanceMultiplier: 0.76 }, cost: PASSIVE_UPGRADE_COSTS[2][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[2][2] },
    ],
  },
  {
    id: 'healer-beacon-of-light',
    class: 'healer',
    tier: 4,
    name: 'Beacon of Light',
    description: 'Her heals come around much faster.',
    icon: ICON.beaconOfLight,
    unlockLevel: PASSIVE_TIER_LEVELS[3],
    cost: PASSIVE_TIER_COSTS[3],
    modifiers: { skillCooldownMultiplier: 0.8 },
    maxLevel: DEFAULT_SKILL_MAX_LEVEL,
    levelUpgrades: [
      { modifiers: { skillCooldownMultiplier: 0.78 }, cost: PASSIVE_UPGRADE_COSTS[3][0], requiredCharacterLevel: PASSIVE_LEVEL_GATES[3][0] },
      { modifiers: { skillCooldownMultiplier: 0.75 }, cost: PASSIVE_UPGRADE_COSTS[3][1], requiredCharacterLevel: PASSIVE_LEVEL_GATES[3][1] },
      { modifiers: { skillCooldownMultiplier: 0.68 }, cost: PASSIVE_UPGRADE_COSTS[3][2], requiredCharacterLevel: PASSIVE_LEVEL_GATES[3][2] },
    ],
  },
];
