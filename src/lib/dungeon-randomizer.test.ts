import { describe, it, expect, vi, afterEach } from 'vitest';
import type { DungeonDefinition, DungeonEvent } from '~/types/dungeon';
import type { EnemyData } from '~/types/rpg-elements';
import { SAMPLE_DUNGEON } from '~/constants/dungeons';
import { ConsumableItems } from '~/constants/inventory';
import { MAX_ENEMIES_PER_BATTLE } from '~/constants/party';
import { randomizeDungeon } from './dungeon-randomizer';

/** All events across every floor of a dungeon. */
function allEvents(dungeon: DungeonDefinition): DungeonEvent[] {
  return dungeon.floors.flatMap((floor) => floor.events);
}

/** Every enemy across every combat event of a dungeon. */
function allEnemies(dungeon: DungeonDefinition): EnemyData[] {
  return allEvents(dungeon).flatMap((event) => (event.type === 'combat' ? event.encounter.enemies : []));
}

/** Enemies that live on non-boss floors. */
function nonBossEnemies(dungeon: DungeonDefinition): EnemyData[] {
  return dungeon.floors
    .filter((floor) => !floor.isBoss)
    .flatMap((floor) => floor.events)
    .flatMap((event) => (event.type === 'combat' ? event.encounter.enemies : []));
}

const CONSUMABLE_IDS = new Set(ConsumableItems.map((c) => c.id));

describe('randomizeDungeon', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns a fresh dungeon with a derived id and name, leaving the source untouched', () => {
    const before = JSON.stringify(SAMPLE_DUNGEON);
    const remix = randomizeDungeon(SAMPLE_DUNGEON);
    expect(remix.id).toBe('sample-cave-remix');
    expect(remix.id).not.toBe(SAMPLE_DUNGEON.id);
    expect(remix.name).toContain('Remix');
    expect(remix.floors.length).toBeGreaterThan(0);
    expect(JSON.stringify(SAMPLE_DUNGEON)).toBe(before); // source not mutated
  });

  it('strips all dialogue events', () => {
    const remix = randomizeDungeon(SAMPLE_DUNGEON);
    expect(allEvents(remix).some((event) => event.type === 'dialogue')).toBe(false);
  });

  it('keeps the boss as the unmodified final floor', () => {
    const remix = randomizeDungeon(SAMPLE_DUNGEON);
    const last = remix.floors[remix.floors.length - 1];
    expect(last.isBoss).toBe(true);
    const bossEnemies = last.events.flatMap((e) => (e.type === 'combat' ? e.encounter.enemies : []));
    expect(bossEnemies.map((e) => e.id).sort()).toEqual(['moss-golem-1', 'moss-golem-2']);
    expect(bossEnemies.every((e) => e.type === 'golem')).toBe(true);
  });

  it('shuffles only non-boss enemies and sprinkles in 1-3 extra weak ones', () => {
    const remix = randomizeDungeon(SAMPLE_DUNGEON);
    const nonBoss = nonBossEnemies(remix);
    // Boss enemies (golems) never leak into the shuffled pool.
    expect(nonBoss.every((e) => e.type !== 'golem')).toBe(true);
    // Sample starts with 2 non-boss frogs; +1..3 extras => 3..5 total (never dropped: cap is 4/enc).
    expect(nonBoss.length).toBeGreaterThanOrEqual(3);
    expect(nonBoss.length).toBeLessThanOrEqual(5);
  });

  it('never exceeds the per-battle cap and gives every enemy a unique id', () => {
    for (let run = 0; run < 200; run++) {
      const remix = randomizeDungeon(SAMPLE_DUNGEON);
      for (const event of allEvents(remix)) {
        if (event.type === 'combat') {
          expect(event.encounter.enemies.length).toBeGreaterThanOrEqual(1);
          expect(event.encounter.enemies.length).toBeLessThanOrEqual(MAX_ENEMIES_PER_BATTLE);
        }
      }
      const ids = allEnemies(remix).map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('adds a valid bonus chest on a non-boss floor when the roll succeeds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // randomBool(0.5) => true
    const remix = randomizeDungeon(SAMPLE_DUNGEON);
    const chests = remix.floors
      .filter((floor) => !floor.isBoss)
      .flatMap((floor) => floor.events)
      .filter((event) => event.type === 'chest');
    expect(chests.length).toBe(1);
    const chest = chests[0];
    if (chest.type !== 'chest') throw new Error('expected chest');
    expect(chest.loot.consumableItems).toHaveLength(1);
    expect(CONSUMABLE_IDS.has(chest.loot.consumableItems[0].item.id)).toBe(true);
  });

  it('adds no chest when the roll fails', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // randomBool(0.5) => false
    const remix = randomizeDungeon(SAMPLE_DUNGEON);
    expect(allEvents(remix).some((event) => event.type === 'chest')).toBe(false);
  });
});
