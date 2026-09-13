import type { EnemyData } from '~/types/rpg-elements';
import { createEmptyLootTable } from '~/types/loot';

/**
 * The Training Grounds sparring target. Deliberately kept out of `world-00` so no map,
 * dungeon, or loot table can pull it into a real run — it is only ever launched in
 * `'training'` battle mode (see `BattleMode`).
 */

/** Unreachable on purpose — the dummy is a damage counter with a sprite, not a fight to win. */
export const TRAINING_DUMMY_HP = Number.MAX_SAFE_INTEGER;

/**
 * Never attacks (the timer hook skips training fights entirely), drops nothing, teaches nothing.
 * HP is left as a real number rather than special-casing the damage atoms: the hit path just
 * keeps chipping at a number that cannot reach zero, so every death/victory check stays as is.
 */
export const TRAINING_DUMMY: EnemyData = {
  id: 'training-dummy',
  name: 'Training Dummy',
  type: 'dummy',
  stats: { pow: 0, vit: 0, spd: 0 },
  vitHpMultiplier: 0,
  maxHp: TRAINING_DUMMY_HP,
  currentHp: TRAINING_DUMMY_HP,
  // Placeholder until dummy art exists.
  sprite: '/assets/enemy-sprites/gollux_idle.png',
  attackInterval: 0,
  attackDamage: 0,
  guardBreak: 0,
  lootTable: createEmptyLootTable(),
  expReward: 0,
};
