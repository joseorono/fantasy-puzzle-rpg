/**
 * Types for the character skill system.
 *
 * Two kinds of skill exist (see docs/ideas-proposals/SKILL_SYSTEM.md §3):
 * - Active skills ("Ultimates"): charge over time, one selected per character.
 *   Modelled by {@link SkillDefinition} — the historical name is kept because it
 *   is referenced across the codebase and is precisely the active-skill shape.
 * - Passive skills: always-on modifiers, unlocked along a 4-node track per class.
 *   Modelled by {@link PassiveSkillDefinition}.
 */

import type { CharacterClass } from './rpg-elements';
import type { GridPosition } from './geometry';
import type { Resources } from './resources';

/** Grid position of a skill's icon on its class's Indigolay sheet. */
export type SkillIconPosition = GridPosition;

/**
 * Who a skill affects when activated.
 * - `enemy`: the currently selected enemy
 * - `allEnemy`: every living enemy
 * - `ally`: the single living ally with the lowest HP percentage
 * - `allAlly`: every party member (heals living, revives dead)
 */
export type SkillTarget = 'enemy' | 'allEnemy' | 'ally' | 'allAlly';

/**
 * An Active skill ("Ultimate") definition. Skills are stored in a registry keyed
 * by `id` (see `~/constants/skills`) and a character owns a subset of them.
 */
export interface SkillDefinition {
  /** Stable unique key, e.g. `warrior-smash`. */
  id: string;
  /** Class that can own this skill. */
  class: CharacterClass;
  /** Position on the class's active track. Tier 0 is the free starting skill. */
  tier: 0 | 1 | 2 | 3;
  name: string;
  description: string;
  /** Icon cell on the class's Indigolay sheet (see `packIcon`). */
  icon: SkillIconPosition;
  /** Multiplier applied to `BASE_SKILL_DAMAGE` before POW scaling. */
  baseDamageMultiplier: number;
  /** Flat amount added after POW scaling. */
  flatDamageBonus: number;
  target: SkillTarget;
  /** Charge-speed factor for the cooldown: 1 = base, > 1 slower, < 1 faster. */
  cooldownMultiplier: number;
  /** Character level at which this skill auto-unlocks (1 = starting skill). */
  unlockLevel: number;
}

/**
 * Modifiers that apply to the owning character's own actions.
 * All keys are total with neutral identity values (0 additive, 1 multiplicative)
 * so consumers never need `?? 1`. See `mergePassiveModifiers`.
 */
export interface CharacterPassiveModifiers {
  /** Additive into the cascade combo coefficient — steeper combo ramp. */
  cascadeBonus: number;
  /** Multiplies this character's match-3 damage. */
  matchDamageMultiplier: number;
  /** Multiplies this character's Ultimate damage/healing. */
  skillDamageMultiplier: number;
  /** Multiplies this character's Ultimate charge time. < 1 charges faster. */
  skillCooldownMultiplier: number;
  /** Flat Guard added when this character's Ultimate fires. */
  skillGuardRestore: number;
  /** Multiplies the stagger push from this character's hits. */
  staggerPushMultiplier: number;
}

/** Modifiers that apply to party-wide shared systems. */
export interface PartyPassiveModifiers {
  /** Additive onto the Guard charge multiplier. */
  guardChargeRateBonus: number;
  /** Multiplies Guard decay. < 1 bleeds slower. */
  guardDecayResistanceMultiplier: number;
  /** Flat effective SPD, for the shared item cooldown only. */
  itemCooldownSpdBonus: number;
}

/** A passive definition's effect payload: any subset of the closed key set. */
export type PassiveModifiers = Partial<CharacterPassiveModifiers & PartyPassiveModifiers>;

/**
 * A Passive skill definition. Unlocking one turns it on permanently — passives
 * are never "selected" and every unlocked passive applies at once.
 *
 * Stacking rule: additive keys sum, multiplicative keys multiply
 * (two ×1.15 sources yield ×1.3225, not ×1.30).
 */
export interface PassiveSkillDefinition {
  /** Stable unique key, e.g. `warrior-iron-skin`. */
  id: string;
  /** Class that can own this passive. */
  class: CharacterClass;
  /** Position on the class's 4-node track. Tier N requires tier N-1. */
  tier: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  /** Icon cell on the class's Indigolay sheet (see `packIcon`). */
  icon: SkillIconPosition;
  /** Character level required before this passive can be bought. */
  unlockLevel: number;
  /** Resource price at the pause-menu Skills tab. */
  cost: Resources;
  modifiers: PassiveModifiers;
}
