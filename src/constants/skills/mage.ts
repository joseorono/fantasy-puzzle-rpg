import type { SkillDefinition, PassiveSkillDefinition, SkillIconPosition } from '~/types/skills';
import { packIcon } from './icons';
import { ACTIVE_TIER_LEVELS, PASSIVE_TIER_LEVELS, PASSIVE_TIER_COSTS } from './tiers';

/**
 * 🔮 Mage — one spell per element for maximum visual variety.
 * Identity: burst. Longest damage cooldown, so the fast-charge Ice Bolt is the
 * most consequential unlock on this track.
 */

const ICON = {
  fireball: packIcon(1), // MG_01_Fireball
  chainLightning: packIcon(22), // MG_22_ChainLightning
  iceBolt: packIcon(31), // MG_31_IceBolt
  meteor: packIcon(4), // MG_04_Meteor
  focusBoost: packIcon(62), // MG_62_FocusBoost
  manaBurst: packIcon(67), // MG_67_ManaBurst
  haste: packIcon(45), // MG_45_Haste
  overload: packIcon(23), // MG_23_Overload
} satisfies Record<string, SkillIconPosition>;

export const MAGE_ACTIVES: SkillDefinition[] = [
  {
    id: 'mage-fireball',
    class: 'mage',
    tier: 0,
    name: 'Fireball',
    description: 'Hurls a blazing comet of fire at one enemy.',
    icon: ICON.fireball,
    baseDamageMultiplier: 5,
    flatDamageBonus: 0,
    target: 'enemy',
    cooldownMultiplier: 1,
    unlockLevel: ACTIVE_TIER_LEVELS[0],
  },
  {
    id: 'mage-chain-lightning',
    class: 'mage',
    tier: 1,
    name: 'Chain Lightning',
    description: 'Arcs lightning across all enemies, at a slower charge.',
    icon: ICON.chainLightning,
    baseDamageMultiplier: 3,
    flatDamageBonus: 0,
    target: 'allEnemy',
    cooldownMultiplier: 1.3,
    unlockLevel: ACTIVE_TIER_LEVELS[1],
  },
  {
    id: 'mage-ice-bolt',
    class: 'mage',
    tier: 2,
    name: 'Ice Bolt',
    description: 'A swift shard of ice — smaller, but ready again fast.',
    icon: ICON.iceBolt,
    baseDamageMultiplier: 2.5,
    flatDamageBonus: 0,
    target: 'enemy',
    cooldownMultiplier: 0.7,
    unlockLevel: ACTIVE_TIER_LEVELS[2],
  },
  {
    id: 'mage-meteor',
    class: 'mage',
    tier: 3,
    name: 'Meteor',
    description: 'Calls a meteor down on the whole battlefield. Worth the wait.',
    icon: ICON.meteor,
    baseDamageMultiplier: 4,
    flatDamageBonus: 0,
    target: 'allEnemy',
    cooldownMultiplier: 1.6,
    unlockLevel: ACTIVE_TIER_LEVELS[3],
  },
];

export const MAGE_PASSIVES: PassiveSkillDefinition[] = [
  {
    id: 'mage-focus-boost',
    class: 'mage',
    tier: 1,
    name: 'Focus Boost',
    description: 'His Ultimates strike sharper.',
    icon: ICON.focusBoost,
    unlockLevel: PASSIVE_TIER_LEVELS[0],
    cost: PASSIVE_TIER_COSTS[0],
    modifiers: { skillDamageMultiplier: 1.15 },
  },
  {
    id: 'mage-mana-burst',
    class: 'mage',
    tier: 2,
    name: 'Mana Burst',
    description: 'His matches bite deeper.',
    icon: ICON.manaBurst,
    unlockLevel: PASSIVE_TIER_LEVELS[1],
    cost: PASSIVE_TIER_COSTS[1],
    modifiers: { matchDamageMultiplier: 1.15 },
  },
  {
    id: 'mage-haste',
    class: 'mage',
    tier: 3,
    name: 'Haste',
    description: 'His Ultimate charges noticeably faster.',
    icon: ICON.haste,
    unlockLevel: PASSIVE_TIER_LEVELS[2],
    cost: PASSIVE_TIER_COSTS[2],
    modifiers: { skillCooldownMultiplier: 0.85 },
  },
  {
    id: 'mage-overload',
    class: 'mage',
    tier: 4,
    name: 'Overload',
    description: 'A far bigger nuke — with a longer wind-up. The trade-off is real.',
    icon: ICON.overload,
    unlockLevel: PASSIVE_TIER_LEVELS[3],
    cost: PASSIVE_TIER_COSTS[3],
    modifiers: { skillDamageMultiplier: 1.25, skillCooldownMultiplier: 1.15 },
  },
];
