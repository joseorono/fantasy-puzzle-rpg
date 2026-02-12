import { bench, describe } from 'vitest';
import { combineLootFromEnemies } from './loot';
import { createEmptyLootTable, createLootTable } from '~/types/loot';
import type { EnemyData } from '~/types/rpg-elements';

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

const noEnemies: EnemyData[] = [];

const oneEnemy: EnemyData[] = [
  createEnemy({
    expReward: 25,
    lootTable: createLootTable([], [], { item: { coins: 10, gold: 5 } }),
  }),
];

const threeEnemies: EnemyData[] = [
  createEnemy({
    id: 'e1',
    expReward: 10,
    lootTable: createLootTable([], [], { item: { coins: 10, gold: 5, copper: 3 } }),
  }),
  createEnemy({
    id: 'e2',
    expReward: 20,
    lootTable: createLootTable([], [], { item: { coins: 20, gold: 10, copper: 7 } }),
  }),
  createEnemy({
    id: 'e3',
    expReward: 35,
    lootTable: createLootTable([], [], { item: { coins: 30, gold: 15, silver: 5 } }),
  }),
];

describe('combineLootFromEnemies', () => {
  bench('0 enemies (empty)', () => {
    combineLootFromEnemies(noEnemies);
  });

  bench('1 enemy', () => {
    combineLootFromEnemies(oneEnemy);
  });

  bench('3 enemies', () => {
    combineLootFromEnemies(threeEnemies);
  });
});
