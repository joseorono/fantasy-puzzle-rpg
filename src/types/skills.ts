/**
 * Types for the character skill system.
 */

import type { CharacterClass } from './rpg-elements';
import type { Resources } from './resources';

/**
 * Who a skill affects when activated.
 * - `enemy`: the currently selected enemy
 * - `allEnemy`: every living enemy
 * - `ally`: the single living ally with the lowest HP percentage
 * - `allAlly`: every party member (heals living, revives dead)
 */
export type SkillTarget = 'enemy' | 'allEnemy' | 'ally' | 'allAlly';

/**
 * A single skill definition. Skills are stored in a registry keyed by `id`
 * (see `~/constants/skills`) and a character owns a subset of them.
 */
export interface SkillDefinition {
  /** Stable unique key, e.g. `warrior-cleave`. */
  id: string;
  /** Class that can own this skill. */
  class: CharacterClass;
  name: string;
  description: string;
  /** Multiplier applied to `BASE_SKILL_DAMAGE` before POW scaling. */
  baseDamageMultiplier: number;
  /** Flat amount added after POW scaling. */
  flatDamageBonus: number;
  target: SkillTarget;
  /** Charge-speed factor for the cooldown: 1 = base, > 1 slower, < 1 faster. */
  cooldownMultiplier: number;
  /** Character level at which this skill auto-unlocks (1 = starting skill). */
  unlockLevel: number;
  /** Skills Trainer price. All-zero means it is a default / not purchasable. */
  cost: Resources;
}
