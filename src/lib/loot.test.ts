import { describe, it, expect } from 'vitest';
import { combineLootFromEnemies } from './loot';
import { createEmptyLootTable, createLootTable } from '~/types/loot';
import type { EnemyData } from '~/types/rpg-elements';
import type { ProbabilityNumber } from '~/types/number-types';
import type { EquipmentItemData, ConsumableItemData } from '~/types/inventory';

function createEnemy(overrides: Partial<EnemyData> = {}): EnemyData {
  return {
    id: 'enemy-1',
    name: 'Slime',
    maxHp: 50,
    currentHp: 0,
    stats: { pow: 5, vit: 5, spd: 5 },
    vitHpMultiplier: 5,
    type: 'slime',
    sprite: 'slime.png',
    attackInterval: 3000,
    attackDamage: 10,
    lootTable: createEmptyLootTable(),
    expReward: 10,
    ...overrides,
  };
}

const mockSword = {
  id: 'sword-1',
  name: 'Iron Sword',
  type: 'weapon',
  slot: 'weapon',
  stats: { pow: 3, vit: 0, spd: 0 },
  price: { coins: 50, gold: 0, copper: 0, silver: 0, bronze: 0 },
  description: 'A basic iron sword',
  flavorText: '',
} as unknown as EquipmentItemData;

const mockShield = {
  id: 'shield-1',
  name: 'Wooden Shield',
  type: 'armor',
  slot: 'armor',
  stats: { pow: 0, vit: 2, spd: 0 },
  price: { coins: 30, gold: 0, copper: 0, silver: 0, bronze: 0 },
  description: 'A basic wooden shield',
  flavorText: '',
} as unknown as EquipmentItemData;

const mockPotion = {
  id: 'potion-1',
  name: 'Health Potion',
  type: 'consumable',
  description: 'Restores HP',
  flavorText: '',
} as unknown as ConsumableItemData;

describe('combineLootFromEnemies', () => {
  it('should return empty loot table and 0 exp for empty array', () => {
    const result = combineLootFromEnemies([]);
    expect(result.expReward).toBe(0);
    expect(result.lootTable.equipableItems).toEqual([]);
    expect(result.lootTable.consumableItems).toEqual([]);
    expect(result.lootTable.resources.item).toEqual({
      coins: 0,
      gold: 0,
      copper: 0,
      silver: 0,
      bronze: 0,
    });
  });

  it('should return the loot table and exp from a single enemy', () => {
    const enemy = createEnemy({
      expReward: 25,
      lootTable: createLootTable([], [], { item: { coins: 10, gold: 5 } }),
    });

    const result = combineLootFromEnemies([enemy]);
    expect(result.expReward).toBe(25);
    expect(result.lootTable.resources.item).toEqual({
      coins: 10,
      gold: 5,
      copper: 0,
      silver: 0,
      bronze: 0,
    });
  });

  it('should sum exp rewards from multiple enemies', () => {
    const enemies = [
      createEnemy({ expReward: 10 }),
      createEnemy({ expReward: 20 }),
      createEnemy({ expReward: 35 }),
    ];

    const result = combineLootFromEnemies(enemies);
    expect(result.expReward).toBe(65);
  });

  it('should sum resources from multiple enemies', () => {
    const enemies = [
      createEnemy({
        lootTable: createLootTable([], [], {
          item: { coins: 10, gold: 5, copper: 3, silver: 1, bronze: 2 },
        }),
      }),
      createEnemy({
        lootTable: createLootTable([], [], {
          item: { coins: 20, gold: 10, copper: 7, silver: 4, bronze: 8 },
        }),
      }),
    ];

    const result = combineLootFromEnemies(enemies);
    expect(result.lootTable.resources.item).toEqual({
      coins: 30,
      gold: 15,
      copper: 10,
      silver: 5,
      bronze: 10,
    });
  });

  it('should set combined resources probability to 1', () => {
    const enemies = [createEnemy(), createEnemy()];
    const result = combineLootFromEnemies(enemies);
    expect(result.lootTable.resources.probability).toBe(1);
  });

  it('should concatenate equipable items from all enemies', () => {
    const enemies = [
      createEnemy({
        lootTable: createLootTable([{ item: mockSword }]),
      }),
      createEnemy({
        lootTable: createLootTable([{ item: mockShield }]),
      }),
    ];

    const result = combineLootFromEnemies(enemies);
    expect(result.lootTable.equipableItems).toHaveLength(2);
    expect(result.lootTable.equipableItems[0].item).toBe(mockSword);
    expect(result.lootTable.equipableItems[1].item).toBe(mockShield);
  });

  it('should concatenate consumable items from all enemies', () => {
    const enemies = [
      createEnemy({
        lootTable: createLootTable([], [{ item: mockPotion }]),
      }),
      createEnemy({
        lootTable: createLootTable([], [{ item: mockPotion, probability: 0.5 as ProbabilityNumber }]),
      }),
    ];

    const result = combineLootFromEnemies(enemies);
    expect(result.lootTable.consumableItems).toHaveLength(2);
    expect(result.lootTable.consumableItems[0].probability).toBe(1);
    expect(result.lootTable.consumableItems[1].probability).toBe(0.5);
  });

  it('should preserve item drop probabilities', () => {
    const enemy = createEnemy({
      lootTable: createLootTable([
        { item: mockSword, probability: 0.3 as ProbabilityNumber },
      ]),
    });

    const result = combineLootFromEnemies([enemy]);
    expect(result.lootTable.equipableItems[0].probability).toBe(0.3);
  });

  it('should handle enemies with no loot items but some resources', () => {
    const enemies = [
      createEnemy({
        expReward: 5,
        lootTable: createLootTable([], [], { item: { coins: 100 } }),
      }),
      createEnemy({
        expReward: 5,
        lootTable: createLootTable([], [], { item: { gold: 50 } }),
      }),
    ];

    const result = combineLootFromEnemies(enemies);
    expect(result.expReward).toBe(10);
    expect(result.lootTable.equipableItems).toEqual([]);
    expect(result.lootTable.consumableItems).toEqual([]);
    expect(result.lootTable.resources.item.coins).toBe(100);
    expect(result.lootTable.resources.item.gold).toBe(50);
  });
});
