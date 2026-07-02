import { describe, it, expect } from 'vitest';
import type { DungeonDefinition, DungeonEvent } from '~/types/dungeon';
import { createEmptyLootTable } from '~/types/loot';
import {
  getEvent,
  getFloor,
  isLastEventOfFloor,
  isLastFloor,
  shouldRunEvent,
  getFloorBackground,
  getDungeonRestPool,
  getDungeonEstimatedResources,
} from './dungeon-system';
import { SAMPLE_DUNGEON } from '~/constants/dungeons';
import { createResources } from './resources';

const DIALOGUE_EVENT: DungeonEvent = {
  type: 'dialogue',
  scene: { id: 's', characters: [], lines: [] },
};
const COMBAT_EVENT: DungeonEvent = { type: 'combat', encounter: { enemies: [] } };
const CHEST_EVENT: DungeonEvent = { type: 'chest', loot: createEmptyLootTable() };

const DUNGEON: DungeonDefinition = {
  id: 'test-dungeon',
  name: 'Test Dungeon',
  backgroundImage: '/default.jpg',
  floors: [
    { id: 'f1', name: 'Floor 1', events: [DIALOGUE_EVENT, COMBAT_EVENT] },
    { id: 'f2', name: 'Floor 2', backgroundImage: '/floor2.jpg', events: [CHEST_EVENT] },
  ],
};

describe('getFloor / getEvent', () => {
  it('returns the floor at an index, undefined out of range', () => {
    expect(getFloor(DUNGEON, 0)?.id).toBe('f1');
    expect(getFloor(DUNGEON, 2)).toBeUndefined();
  });

  it('returns the event at an index, undefined out of range', () => {
    const floor = getFloor(DUNGEON, 0)!;
    expect(getEvent(floor, 0)).toBe(DIALOGUE_EVENT);
    expect(getEvent(floor, 1)).toBe(COMBAT_EVENT);
    expect(getEvent(floor, 2)).toBeUndefined();
  });
});

describe('isLastEventOfFloor', () => {
  it('is true only on the final event', () => {
    const floor = getFloor(DUNGEON, 0)!;
    expect(isLastEventOfFloor(floor, 0)).toBe(false);
    expect(isLastEventOfFloor(floor, 1)).toBe(true);
  });

  it('treats an empty floor as already finished', () => {
    expect(isLastEventOfFloor({ id: 'e', name: 'Empty', events: [] }, 0)).toBe(true);
  });
});

describe('isLastFloor', () => {
  it('is true only on the final floor', () => {
    expect(isLastFloor(DUNGEON, 0)).toBe(false);
    expect(isLastFloor(DUNGEON, 1)).toBe(true);
  });
});

describe('shouldRunEvent', () => {
  it('runs every event on a first clear', () => {
    expect(shouldRunEvent(DIALOGUE_EVENT, false)).toBe(true);
    expect(shouldRunEvent(COMBAT_EVENT, false)).toBe(true);
    expect(shouldRunEvent(CHEST_EVENT, false)).toBe(true);
  });

  it('runs only combat on a replay', () => {
    expect(shouldRunEvent(DIALOGUE_EVENT, true)).toBe(false);
    expect(shouldRunEvent(CHEST_EVENT, true)).toBe(false);
    expect(shouldRunEvent(COMBAT_EVENT, true)).toBe(true);
  });
});

describe('getFloorBackground', () => {
  it('uses the floor override when present', () => {
    expect(getFloorBackground(DUNGEON, DUNGEON.floors[1])).toBe('/floor2.jpg');
  });

  it('falls back to the dungeon default', () => {
    expect(getFloorBackground(DUNGEON, DUNGEON.floors[0])).toBe('/default.jpg');
  });
});

/** Build a dungeon fixture whose only relevant property is its floor count. */
function dungeonWithFloors(floorCount: number): DungeonDefinition {
  return {
    id: 'n',
    name: 'N',
    backgroundImage: '/default.jpg',
    floors: Array.from({ length: floorCount }, (_, i) => ({
      id: `f${i}`,
      name: `Floor ${i}`,
      events: [],
    })),
  };
}

describe('getDungeonRestPool', () => {
  it('scales the pool as floor(floors / 2.5)', () => {
    expect(getDungeonRestPool(dungeonWithFloors(3))).toBe(1);
    expect(getDungeonRestPool(dungeonWithFloors(5))).toBe(2);
    expect(getDungeonRestPool(dungeonWithFloors(6))).toBe(2);
    expect(getDungeonRestPool(dungeonWithFloors(8))).toBe(3);
    expect(getDungeonRestPool(dungeonWithFloors(10))).toBe(4);
  });

  it('floors the pool to a minimum of 1 for short dungeons', () => {
    expect(getDungeonRestPool(dungeonWithFloors(2))).toBe(1);
    expect(getDungeonRestPool(dungeonWithFloors(1))).toBe(1);
  });
});

describe('getDungeonEstimatedResources', () => {
  it('sums enemy drops + chests across the sample dungeon (probability 1)', () => {
    // 2× Swamp Frog {15c,1cu} + 2× Moss Golem {50c,2cu,1fe} + 2× ANCIENT_CHEST {100c,5cu,3fe}
    expect(getDungeonEstimatedResources(SAMPLE_DUNGEON)).toEqual(
      createResources({ coins: 330, copper: 16, iron: 8 }),
    );
  });
});
