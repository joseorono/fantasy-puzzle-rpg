/**
 * Turns an authored dungeon into a remixed, combat-focused run for replayability.
 *
 * A remix strips all dialogue and original chests, shuffles the enemy roster and floor
 * order, sprinkles in a few extra weak enemies, and — on a coin flip — hides one bonus
 * chest whose reward scales with the dungeon's own economy. The dungeon's boss (the enemies
 * on its `isBoss` floor) is preserved untouched as the finale and is never reshuffled.
 *
 * All randomness is `Math.random`-based (via the shared utils), matching the rest of the
 * codebase; there is no seeding.
 */

import type { DungeonDefinition, DungeonFloor, DungeonEvent } from '~/types/dungeon';
import type { EnemyData } from '~/types/rpg-elements';
import type { Resources } from '~/types/resources';
import { createLootTable, type LootTable } from '~/types/loot';
import { ConsumableItems } from '~/constants/inventory';
import { MAX_ENEMIES_PER_BATTLE } from '~/constants/party';
import { REMIX_CHEST_MIN_RESOURCE_PERCENT, REMIX_CHEST_MAX_RESOURCE_PERCENT } from '~/constants/dungeon';
import { getDungeonEstimatedResources } from './dungeon-system';
import { getPercentageOfResources } from './resources';
import { shuffleArray, getRandomElement, randomBool } from './utils';
import { randIntInRange, randFloatInRange } from './math';

/** Number of extra copies of the weakest enemy sprinkled into a remix (inclusive range). */
const REMIX_EXTRA_ENEMY_MIN = 1;
const REMIX_EXTRA_ENEMY_MAX = 3;
/** Probability a remix hides one bonus chest ("nothing crazy"). */
const REMIX_BONUS_CHEST_CHANCE = 0.5;

/** Pull every combat enemy out of a floor, ignoring dialogue/chest events. */
function collectCombatEnemies(floor: DungeonFloor): EnemyData[] {
  return floor.events.flatMap((event) => (event.type === 'combat' ? event.encounter.enemies : []));
}

/**
 * Build a bonus-chest loot table: a random slice of the dungeon's total estimated
 * resources plus one random consumable.
 * @param dungeonResources - The dungeon's total estimated resource yield
 * @returns A loot table with scaled resources and a single random consumable
 */
function createRemixBonusChest(dungeonResources: Resources): LootTable {
  const percent = randFloatInRange(REMIX_CHEST_MIN_RESOURCE_PERCENT, REMIX_CHEST_MAX_RESOURCE_PERCENT);
  const resources = getPercentageOfResources(dungeonResources, percent);
  const consumable = getRandomElement(ConsumableItems);
  return createLootTable([], [{ item: consumable }], { item: resources });
}

/**
 * Produce a remixed copy of a dungeon (see module docs). The source dungeon is never
 * mutated; a fresh `DungeonDefinition` is returned.
 * @param dungeon - The authored dungeon to remix
 * @returns A new, combat-focused, shuffled dungeon with the original boss as the finale
 */
export function randomizeDungeon(dungeon: DungeonDefinition): DungeonDefinition {
  // Snapshot the economy BEFORE stripping, so the bonus chest reflects the full dungeon.
  const estimatedResources = getDungeonEstimatedResources(dungeon);

  // 1. Separate the boss floor (kept last, combat-only). Fallback: the last floor.
  const flaggedBoss = dungeon.floors.findIndex((floor) => floor.isBoss);
  const bossIndex = flaggedBoss >= 0 ? flaggedBoss : dungeon.floors.length - 1;
  const bossSource = dungeon.floors[bossIndex];
  const normalSource = dungeon.floors.filter((_, index) => index !== bossIndex);

  // 2. Build the shuffle pool from every non-boss combat enemy.
  const pool = normalSource.flatMap(collectCombatEnemies);

  // 3. Sprinkle in 1-3 copies of the weakest template (by maxHp), then shuffle.
  if (pool.length > 0) {
    const weakest = pool.reduce((a, b) => (b.maxHp < a.maxHp ? b : a));
    const extras = randIntInRange(REMIX_EXTRA_ENEMY_MIN, REMIX_EXTRA_ENEMY_MAX);
    for (let i = 0; i < extras; i++) pool.push(weakest);
  }
  const shuffledPool = shuffleArray(pool);

  // 4. Deal the pool into one encounter per normal floor, evenly and capped at the max.
  const encounterCount = Math.min(normalSource.length, shuffledPool.length);
  const buckets: EnemyData[][] = Array.from({ length: encounterCount }, () => []);
  for (const enemy of shuffledPool) {
    // Fill the least-loaded encounter that is still under the cap; drop the surplus.
    let target: EnemyData[] | null = null;
    for (const bucket of buckets) {
      if (bucket.length >= MAX_ENEMIES_PER_BATTLE) continue;
      if (target === null || bucket.length < target.length) target = bucket;
    }
    if (target === null) break; // every encounter is full — surplus extras are dropped
    target.push(enemy);
  }

  // 5. Shuffle floor order and give each of the first N floors one rebuilt encounter.
  let enemySeq = 0;
  const makeEncounterEvent = (enemies: EnemyData[]): DungeonEvent => ({
    type: 'combat',
    encounter: {
      enemies: enemies.map((enemy) => ({ ...enemy, id: `remix-enemy-${enemySeq++}`, currentHp: enemy.maxHp })),
    },
  });

  const shuffledFloors = shuffleArray(normalSource);
  const normalFloors: DungeonFloor[] = buckets.map((bucket, index) => ({
    id: shuffledFloors[index].id,
    name: shuffledFloors[index].name,
    backgroundImage: shuffledFloors[index].backgroundImage,
    events: [makeEncounterEvent(bucket)],
  }));

  // 6. On a coin flip, hide one bonus chest on a random normal floor.
  if (normalFloors.length > 0 && randomBool(REMIX_BONUS_CHEST_CHANCE)) {
    getRandomElement(normalFloors).events.push({
      type: 'chest',
      loot: createRemixBonusChest(estimatedResources),
    });
  }

  // 7. Boss floor: combat-only (dialogue + chest stripped), enemies preserved as the finale.
  const bossFloor: DungeonFloor = {
    id: bossSource.id,
    name: bossSource.name,
    isBoss: true,
    backgroundImage: bossSource.backgroundImage,
    events: bossSource.events.filter((event) => event.type === 'combat'),
  };

  return {
    id: `${dungeon.id}-remix`,
    name: `${dungeon.name} (Remix)`,
    backgroundImage: dungeon.backgroundImage,
    floors: [...normalFloors, bossFloor],
  };
}
