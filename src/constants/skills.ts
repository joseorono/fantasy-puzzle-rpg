import type { CharacterClass } from '~/types/rpg-elements';
import type { SkillDefinition } from '~/types/skills';
import { createResources } from '~/lib/resources';

/** Base damage value used for all skill damage calculations. */
export const BASE_SKILL_DAMAGE = 15;

/**
 * Every skill in the game, keyed by its stable `id`.
 *
 * Damage skills target a single enemy (`enemy`) or all enemies (`allEnemy`).
 * Heal skills target the whole party (`allAlly`) or the single lowest-HP%% ally
 * (`ally`). `cooldownMultiplier` trades power for charge speed, and `cost`
 * (non-zero) makes a skill purchasable at the town Skills Trainer.
 */
export const SKILL_REGISTRY: Record<string, SkillDefinition> = {
  // ─── Warrior ───────────────────────────────────────────────────────
  'warrior-power-strike': {
    id: 'warrior-power-strike',
    class: 'warrior',
    name: 'Power Strike',
    description: 'A heavy blow dealing massive POW-scaled damage to one enemy.',
    baseDamageMultiplier: 3,
    flatDamageBonus: 10,
    target: 'enemy',
    cooldownMultiplier: 1,
    unlockLevel: 1,
    cost: createResources(),
  },
  'warrior-cleave': {
    id: 'warrior-cleave',
    class: 'warrior',
    name: 'Cleave',
    description: 'A sweeping strike that hits every enemy, at a slower charge.',
    baseDamageMultiplier: 2,
    flatDamageBonus: 0,
    target: 'allEnemy',
    cooldownMultiplier: 1.4,
    unlockLevel: 3,
    cost: createResources({ gold: 200 }),
  },
  'warrior-execute': {
    id: 'warrior-execute',
    class: 'warrior',
    name: 'Execute',
    description: 'A devastating single-target blow with a long wind-up.',
    baseDamageMultiplier: 4,
    flatDamageBonus: 20,
    target: 'enemy',
    cooldownMultiplier: 1.6,
    unlockLevel: 6,
    cost: createResources({ gold: 350 }),
  },

  // ─── Rogue ─────────────────────────────────────────────────────────
  'rogue-assassinate': {
    id: 'rogue-assassinate',
    class: 'rogue',
    name: 'Assassinate',
    description: 'A precise shot targeting a vital point for a burst of damage.',
    baseDamageMultiplier: 1,
    flatDamageBonus: 30,
    target: 'enemy',
    cooldownMultiplier: 1,
    unlockLevel: 1,
    cost: createResources(),
  },
  'rogue-fan-of-knives': {
    id: 'rogue-fan-of-knives',
    class: 'rogue',
    name: 'Fan of Knives',
    description: 'Hurls blades at every enemy for quick spread damage.',
    baseDamageMultiplier: 1,
    flatDamageBonus: 10,
    target: 'allEnemy',
    cooldownMultiplier: 1.2,
    unlockLevel: 3,
    cost: createResources({ gold: 200 }),
  },

  // ─── Mage ──────────────────────────────────────────────────────────
  'mage-arcane-blast': {
    id: 'mage-arcane-blast',
    class: 'mage',
    name: 'Arcane Blast',
    description: 'Unleashes a devastating blast of arcane energy at one enemy.',
    baseDamageMultiplier: 5,
    flatDamageBonus: 0,
    target: 'enemy',
    cooldownMultiplier: 1,
    unlockLevel: 1,
    cost: createResources(),
  },
  'mage-chain-lightning': {
    id: 'mage-chain-lightning',
    class: 'mage',
    name: 'Chain Lightning',
    description: 'Arcs lightning across all enemies, at a slower charge.',
    baseDamageMultiplier: 3,
    flatDamageBonus: 0,
    target: 'allEnemy',
    cooldownMultiplier: 1.3,
    unlockLevel: 3,
    cost: createResources({ gold: 250 }),
  },

  // ─── Healer ────────────────────────────────────────────────────────
  'healer-divine-heal': {
    id: 'healer-divine-heal',
    class: 'healer',
    name: 'Divine Heal',
    description: 'Heals all party members with a powerful restorative spell.',
    baseDamageMultiplier: 4,
    flatDamageBonus: 0,
    target: 'allAlly',
    cooldownMultiplier: 1,
    unlockLevel: 1,
    cost: createResources(),
  },
  'healer-mending-touch': {
    id: 'healer-mending-touch',
    class: 'healer',
    name: 'Mending Touch',
    description: 'A focused, fast heal on the ally with the lowest HP.',
    baseDamageMultiplier: 6,
    flatDamageBonus: 0,
    target: 'ally',
    cooldownMultiplier: 0.7,
    unlockLevel: 3,
    cost: createResources({ gold: 220 }),
  },
};

/** The starting skill each class owns and has selected by default. */
export const DEFAULT_SKILL_BY_CLASS: Record<CharacterClass, string> = {
  warrior: 'warrior-power-strike',
  rogue: 'rogue-assassinate',
  mage: 'mage-arcane-blast',
  healer: 'healer-divine-heal',
};

/** All skills grouped by owning class (registry insertion order). */
export const SKILLS_BY_CLASS: Record<CharacterClass, SkillDefinition[]> = Object.values(
  SKILL_REGISTRY,
).reduce(
  (acc, skill) => {
    acc[skill.class].push(skill);
    return acc;
  },
  { warrior: [], rogue: [], mage: [], healer: [] } as Record<CharacterClass, SkillDefinition[]>,
);
