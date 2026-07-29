import type { SkillDefinition, PassiveSkillDefinition, SkillIconPosition } from '~/types/skills';
import { packIcon } from './icons';
import { ACTIVE_TIER_LEVELS, PASSIVE_TIER_LEVELS, PASSIVE_TIER_COSTS } from './tiers';

/**
 * 🛡️ Warrior — Berserker-flavoured icons (blood, fire, raw force).
 * Identity: the wall. Passives feed the Guard meter and stagger.
 */

const ICON = {
  smash: packIcon(7), // WR_07_Smash
  whirlwind: packIcon(33), // WR_33_Whirlwind
  sharpBlow: packIcon(10), // WR_10_SharpBlow
  overwhelm: packIcon(54), // WR_54_Overwhelm
  ironSkin: packIcon(18), // WR_18_IronSkin
  bloodRoar: packIcon(15), // WR_15_BloodRoar
  indomitableWill: packIcon(50), // WR_50_IndomitableWill
  releasePower: packIcon(52), // WR_52_ReleasePower
} satisfies Record<string, SkillIconPosition>;

export const WARRIOR_ACTIVES: SkillDefinition[] = [
  {
    id: 'warrior-smash',
    class: 'warrior',
    tier: 0,
    name: 'Smash',
    description: 'A crushing hammer blow dealing heavy POW-scaled damage to one enemy.',
    icon: ICON.smash,
    baseDamageMultiplier: 3,
    flatDamageBonus: 10,
    target: 'enemy',
    cooldownMultiplier: 1,
    unlockLevel: ACTIVE_TIER_LEVELS[0],
  },
  {
    id: 'warrior-whirlwind',
    class: 'warrior',
    tier: 1,
    name: 'Whirlwind',
    description: 'A spinning slash that strikes every enemy, at a slower charge.',
    icon: ICON.whirlwind,
    baseDamageMultiplier: 2,
    flatDamageBonus: 0,
    target: 'allEnemy',
    cooldownMultiplier: 1.4,
    unlockLevel: ACTIVE_TIER_LEVELS[1],
  },
  {
    id: 'warrior-sharp-blow',
    class: 'warrior',
    tier: 2,
    name: 'Sharp Blow',
    description: 'A quick, precise strike that comes back around fast.',
    icon: ICON.sharpBlow,
    baseDamageMultiplier: 1.5,
    flatDamageBonus: 5,
    target: 'enemy',
    cooldownMultiplier: 0.7,
    unlockLevel: ACTIVE_TIER_LEVELS[2],
  },
  {
    id: 'warrior-overwhelm',
    class: 'warrior',
    tier: 3,
    name: 'Overwhelm',
    description: 'An unstoppable, devastating blow with a long wind-up.',
    icon: ICON.overwhelm,
    baseDamageMultiplier: 4,
    flatDamageBonus: 20,
    target: 'enemy',
    cooldownMultiplier: 1.6,
    unlockLevel: ACTIVE_TIER_LEVELS[3],
  },
];

export const WARRIOR_PASSIVES: PassiveSkillDefinition[] = [
  {
    id: 'warrior-iron-skin',
    class: 'warrior',
    tier: 1,
    name: 'Iron Skin',
    description: "The party's Guard bleeds away more slowly.",
    icon: ICON.ironSkin,
    unlockLevel: PASSIVE_TIER_LEVELS[0],
    cost: PASSIVE_TIER_COSTS[0],
    modifiers: { guardDecayResistanceMultiplier: 0.88 },
  },
  {
    id: 'warrior-blood-roar',
    class: 'warrior',
    tier: 2,
    name: 'Blood Roar',
    description: "His hits push the enemy's attack timer back harder.",
    icon: ICON.bloodRoar,
    unlockLevel: PASSIVE_TIER_LEVELS[1],
    cost: PASSIVE_TIER_COSTS[1],
    modifiers: { staggerPushMultiplier: 1.5 },
  },
  {
    id: 'warrior-indomitable-will',
    class: 'warrior',
    tier: 3,
    name: 'Indomitable Will',
    description: 'Gray matches build the Guard meter faster.',
    icon: ICON.indomitableWill,
    unlockLevel: PASSIVE_TIER_LEVELS[2],
    cost: PASSIVE_TIER_COSTS[2],
    modifiers: { guardChargeRateBonus: 0.15 },
  },
  {
    id: 'warrior-unleash-power',
    class: 'warrior',
    tier: 4,
    name: 'Unleash Power',
    description: 'His Ultimate hits harder and slams Guard back up.',
    icon: ICON.releasePower,
    unlockLevel: PASSIVE_TIER_LEVELS[3],
    cost: PASSIVE_TIER_COSTS[3],
    modifiers: { skillDamageMultiplier: 1.2, skillGuardRestore: 15 },
  },
];
