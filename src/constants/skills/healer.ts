import type { SkillDefinition, PassiveSkillDefinition, SkillIconPosition } from '~/types/skills';
import { packIcon } from './icons';
import { ACTIVE_TIER_LEVELS, ACTIVE_TIER_COSTS, PASSIVE_TIER_LEVELS, PASSIVE_TIER_COSTS } from './tiers';

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
  },
];
