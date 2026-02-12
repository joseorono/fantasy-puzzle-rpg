import type { EnemyData } from './rpg-elements';

/**
 * Defines the enemy composition for a single encounter on a map node.
 */
export interface EncounterDefinition {
  enemies: EnemyData[];
}
