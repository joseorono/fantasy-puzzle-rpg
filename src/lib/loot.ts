import type { EnemyData } from '~/types/rpg-elements';
import type { LootTable } from '~/types/loot';
import type { ProbabilityNumber } from '~/types/number-types';
import type { FloorLootSpot } from '~/types/map-node';
import type { Resources } from '~/types/resources';
import { createEmptyLootTable } from '~/types/loot';
import { randIntInRange } from './math';
import { rollRarity } from './rarity';
import { addItemToInventory, type InventoryItem } from './inventory';
import { addResources } from './resources';
import { randomBool } from './utils';
import { CHEST_RARITY_BIAS } from '~/constants/rarity';

// ─── Enemy Loot ───────────────────────────────────────────────────────

/**
 * Combines loot tables and XP rewards from multiple defeated enemies
 * into a single loot table and total expReward.
 *
 * Equipment and consumable loot items are concatenated from all enemies.
 * Resource amounts (coins, gold, copper, silver, iron) are summed.
 * The combined resources probability is set to 1 (guaranteed drop).
 *
 * @param enemies - Array of defeated enemies whose loot should be merged
 * @returns Combined loot table and total experience reward, or an empty
 *   loot table with 0 exp if the array is empty
 */
export function combineLootFromEnemies(enemies: EnemyData[]): {
  lootTable: LootTable;
  expReward: number;
} {
  if (enemies.length === 0) {
    return { lootTable: createEmptyLootTable(), expReward: 0 };
  }

  const expReward = enemies.reduce((sum, enemy) => sum + enemy.expReward, 0);

  // Roll each equipment drop's rarity once, here, using the dropping enemy's bias.
  // The rolled tier rides along on the entry so the rewards UI and the inventory
  // grant agree on what was found.
  const equipableItems = enemies.flatMap((enemy) =>
    enemy.lootTable.equipableItems.map((entry) => ({ ...entry, rarity: rollRarity(enemy.rarityBias ?? 0) })),
  );
  const consumableItems = enemies.flatMap((enemy) => enemy.lootTable.consumableItems);

  const resources = enemies.reduce(
    (acc, enemy) => {
      const r = enemy.lootTable.resources.item;
      return {
        coins: acc.coins + r.coins,
        gold: acc.gold + r.gold,
        copper: acc.copper + r.copper,
        silver: acc.silver + r.silver,
        iron: acc.iron + r.iron,
      };
    },
    { coins: 0, gold: 0, copper: 0, silver: 0, iron: 0 },
  );

  return {
    lootTable: {
      equipableItems,
      consumableItems,
      resources: {
        item: resources,
        probability: 1 as ProbabilityNumber,
      },
    },
    expReward,
  };
}

/**
 * Returns a copy of a loot table with a freshly rolled rarity on every equipment
 * entry. Use this to materialize a static loot table (e.g. a treasure chest) once,
 * so the same rolled tiers are shown to the player and granted to the inventory.
 * @param lootTable - The static loot table to roll rarities for
 * @param bias - Rarity bias for the source (default 0); see `rollRarity`
 * @returns A new loot table whose equipment entries carry a rolled `rarity`
 */
export function rollLootTableRarities(lootTable: LootTable, bias: number = 0): LootTable {
  return {
    ...lootTable,
    equipableItems: lootTable.equipableItems.map((entry) => ({ ...entry, rarity: rollRarity(bias) })),
  };
}

/**
 * Result of granting a loot table: the new inventory/resources to commit to the
 * store, plus the rolled loot table to display in a notification.
 */
export interface ApplyLootResult {
  inventory: InventoryItem[];
  resources: Resources;
  /** The loot with equipment rarities rolled once — show this to the player. */
  rolledLoot: LootTable;
}

/**
 * Grant a static loot table against a snapshot of the player's inventory and
 * resources, returning the new values (a pure delta — no store mutation). Equipment
 * rarities are rolled once (so the granted tiers match what is shown), each entry is
 * probability-gated via `randomBool`, and stacks are capped at `MAX_AMOUNT_PER_ITEM`
 * by {@link addItemToInventory}. The caller commits the result with store actions
 * and shows `rolledLoot` in a popup.
 *
 * Mirrors the chest-granting flow inlined in the map's `tile-map.tsx`, extracted so
 * the dungeon can reuse it without passing store actions into lib code.
 * @param loot - The static loot table to grant
 * @param inventory - Current inventory snapshot
 * @param resources - Current resources snapshot
 * @param rarityBias - Rarity bias for equipment rolls (defaults to the chest bias)
 * @returns The updated inventory/resources and the rolled loot table
 */
export function applyLootTable(
  loot: LootTable,
  inventory: InventoryItem[],
  resources: Resources,
  rarityBias: number = CHEST_RARITY_BIAS,
): ApplyLootResult {
  const rolledLoot = rollLootTableRarities(loot, rarityBias);

  let nextInventory = inventory;
  for (const lootItem of rolledLoot.equipableItems) {
    if (!randomBool(lootItem.probability)) continue;
    nextInventory = addItemToInventory(nextInventory, lootItem.item.id, 1, lootItem.rarity);
  }
  for (const lootItem of rolledLoot.consumableItems) {
    if (!randomBool(lootItem.probability)) continue;
    nextInventory = addItemToInventory(nextInventory, lootItem.item.id, 1);
  }

  const nextResources = randomBool(loot.resources.probability)
    ? addResources(resources, loot.resources.item)
    : resources;

  return { inventory: nextInventory, resources: nextResources, rolledLoot };
}

// ─── Floor Loot ───────────────────────────────────────────────────────

/**
 * Creates a floor loot spot with default resource values.
 * @param id - Unique identifier for the loot spot
 * @param row - Row position on the map grid
 * @param col - Column position on the map grid
 * @param maxValues - Maximum resource values for random generation (defaults to 0 for each)
 * @returns A FloorLootSpot definition
 */
export function createFloorLootSpot(
  id: string,
  row: number,
  col: number,
  maxValues: Partial<Resources> = {},
): FloorLootSpot {
  return {
    id,
    position: { row, col },
    maxValues: {
      coins: maxValues.coins ?? 0,
      gold: maxValues.gold ?? 0,
      copper: maxValues.copper ?? 0,
      silver: maxValues.silver ?? 0,
      iron: maxValues.iron ?? 0,
    },
  };
}

/**
 * Generate random resources based on max values using randIntInRange.
 * @param maxValues - Maximum values for each resource type
 * @returns Randomly generated resources (0 to maxValue for each type)
 */
export function generateRandomResources(maxValues: Resources): Resources {
  return {
    coins: maxValues.coins > 0 ? randIntInRange(0, maxValues.coins) : 0,
    gold: maxValues.gold > 0 ? randIntInRange(0, maxValues.gold) : 0,
    copper: maxValues.copper > 0 ? randIntInRange(0, maxValues.copper) : 0,
    silver: maxValues.silver > 0 ? randIntInRange(0, maxValues.silver) : 0,
    iron: maxValues.iron > 0 ? randIntInRange(0, maxValues.iron) : 0,
  };
}

/**
 * Get floor loot spot at a specific position.
 * @param lootSpots - Array of floor loot spots
 * @param row - Row position
 * @param col - Column position
 * @returns Floor loot spot if found, undefined otherwise
 */
export function getFloorLootAtPosition(
  lootSpots: FloorLootSpot[],
  row: number,
  col: number,
): FloorLootSpot | undefined {
  return lootSpots.find((spot) => spot.position.row === row && spot.position.col === col);
}

// ─── Resource Utilities ───────────────────────────────────────────────

/**
 * Check if resources have any non-zero values.
 * @param resources - Resources to check
 * @returns True if any resource value is greater than 0
 */
export function hasNonZeroResources(resources: Resources): boolean {
  return (
    resources.coins > 0 || resources.gold > 0 || resources.copper > 0 || resources.silver > 0 || resources.iron > 0
  );
}

/**
 * Filter resources to only include non-zero values.
 * @param resources - Resources to filter
 * @returns Object with only non-zero resource values
 */
export function filterNonZeroResources(resources: Resources): Partial<Resources> {
  const filtered: Partial<Resources> = {};
  if (resources.coins > 0) filtered.coins = resources.coins;
  if (resources.gold > 0) filtered.gold = resources.gold;
  if (resources.copper > 0) filtered.copper = resources.copper;
  if (resources.silver > 0) filtered.silver = resources.silver;
  if (resources.iron > 0) filtered.iron = resources.iron;
  return filtered;
}
