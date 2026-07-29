import type { EnemyData } from '~/types/rpg-elements';
import { getTotalExpToReachLevel } from '~/lib/leveling-system';
import { SWAMP_FROG } from './world-00';

/**
 * Debug-only encounters, reachable from the Router Test screen. Deliberately kept out of
 * `world-00` so no map, dungeon, or loot table can pull them into a real run.
 */

/** Level a fresh level-1 party lands on after clearing the piñata encounter. */
export const EXP_PINATA_TARGET_LEVEL = 16;

/** Number of frogs the payload is split across. Stays under `MAX_ENEMIES_PER_BATTLE`. */
const EXP_PINATA_FROG_COUNT = 3;

/** Derived, never written down, so a progression retune keeps the target level honest. */
export const EXP_PINATA_TOTAL_EXP = getTotalExpToReachLevel(EXP_PINATA_TARGET_LEVEL);

const EXP_PINATA_SHARE = Math.floor(EXP_PINATA_TOTAL_EXP / EXP_PINATA_FROG_COUNT);

/** Dies to any hit at all, so the demo is over in a couple of matches. */
const EXP_PINATA_MAX_HP = 1;

/**
 * Gilded Frogs — a Swamp Frog with the danger stripped out and the EXP cranked up, for
 * testing level-gated content (skill tiers, stat allocation) without grinding to it.
 *
 * Clearing all three awards exactly {@link EXP_PINATA_TOTAL_EXP}, which takes a level-1
 * party to {@link EXP_PINATA_TARGET_LEVEL}. They cannot realistically fight back: 1 damage
 * on a 60s interval they never live long enough to reach.
 */
export const EXP_PINATA_FROGS: EnemyData[] = Array.from({ length: EXP_PINATA_FROG_COUNT }, (_, index) => ({
  ...SWAMP_FROG,
  id: `exp-pinata-frog-${index + 1}`,
  name: `Gilded Frog ${index + 1}`,
  stats: { ...SWAMP_FROG.stats, vit: 1 },
  vitHpMultiplier: 1,
  maxHp: EXP_PINATA_MAX_HP,
  currentHp: EXP_PINATA_MAX_HP,
  attackDamage: 1,
  attackInterval: 60_000,
  guardBreak: 0,
  // The first frog absorbs the rounding remainder so the three sum to the exact total.
  expReward: index === 0 ? EXP_PINATA_TOTAL_EXP - EXP_PINATA_SHARE * (EXP_PINATA_FROG_COUNT - 1) : EXP_PINATA_SHARE,
}));
