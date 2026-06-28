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
} from './dungeon-system';

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
