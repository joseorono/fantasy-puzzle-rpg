import { describe, it, expect } from 'vitest';
import { findNodeAt, findFloorLootAt, findDialogueTriggerAt } from './map-content';
import type { InteractiveMapNode, FloorLootSpot } from '~/types/map-node';
import type { DialogueTrigger } from '~/types/map';

function makeNode(id: string, row: number, col: number): InteractiveMapNode {
  return { id, type: 'Battle', position: { row, col }, name: id, blocksMovement: false };
}

function makeLootSpot(id: string, row: number, col: number): FloorLootSpot {
  return {
    id,
    position: { row, col },
    maxValues: { coins: 10, gold: 0, copper: 0, silver: 0, iron: 0 },
  };
}

function makeTrigger(scene: string, row: number, col: number): DialogueTrigger {
  return { scene, row, col };
}

const nodes = [makeNode('a', 0, 0), makeNode('b', 1, 2), makeNode('c', 4, 3)];
const lootSpots = [makeLootSpot('loot-a', 0, 0), makeLootSpot('loot-b', 1, 2)];
const triggers = [makeTrigger('intro', 0, 0), makeTrigger('bridge', 1, 2)];

describe('findNodeAt', () => {
  it('finds the node on a tile', () => {
    expect(findNodeAt(nodes, 1, 2)?.id).toBe('b');
  });

  it('finds a node at the origin tile', () => {
    expect(findNodeAt(nodes, 0, 0)?.id).toBe('a');
  });

  it('returns undefined for an empty tile', () => {
    expect(findNodeAt(nodes, 2, 2)).toBeUndefined();
  });

  it('does not treat row and col as interchangeable', () => {
    expect(findNodeAt(nodes, 2, 1)).toBeUndefined();
  });

  it('requires both coordinates to match', () => {
    expect(findNodeAt(nodes, 1, 3)).toBeUndefined();
    expect(findNodeAt(nodes, 4, 2)).toBeUndefined();
  });

  it('returns undefined for a map with no nodes', () => {
    expect(findNodeAt([], 0, 0)).toBeUndefined();
    expect(findNodeAt(undefined, 0, 0)).toBeUndefined();
  });

  it('returns the first node when two share a tile', () => {
    const stacked = [makeNode('first', 3, 3), makeNode('second', 3, 3)];
    expect(findNodeAt(stacked, 3, 3)?.id).toBe('first');
  });

  it('returns the definition itself, not a copy', () => {
    expect(findNodeAt(nodes, 4, 3)).toBe(nodes[2]);
  });
});

describe('findFloorLootAt', () => {
  it('finds the loot spot on a tile', () => {
    expect(findFloorLootAt(lootSpots, 1, 2)?.id).toBe('loot-b');
  });

  it('returns undefined for a tile with no loot', () => {
    expect(findFloorLootAt(lootSpots, 5, 5)).toBeUndefined();
  });

  it('does not treat row and col as interchangeable', () => {
    expect(findFloorLootAt(lootSpots, 2, 1)).toBeUndefined();
  });

  it('returns undefined for a map with no floor loot', () => {
    expect(findFloorLootAt([], 0, 0)).toBeUndefined();
    expect(findFloorLootAt(undefined, 0, 0)).toBeUndefined();
  });

  it('finds a spot that is already collected, leaving collection state to the caller', () => {
    const collected = [{ ...makeLootSpot('taken', 2, 2), isCollected: true }];
    expect(findFloorLootAt(collected, 2, 2)?.id).toBe('taken');
  });
});

describe('findDialogueTriggerAt', () => {
  it('finds the trigger on a tile', () => {
    expect(findDialogueTriggerAt(triggers, 1, 2)?.scene).toBe('bridge');
  });

  it('returns undefined for a tile with no trigger', () => {
    expect(findDialogueTriggerAt(triggers, 3, 1)).toBeUndefined();
  });

  it('does not treat row and col as interchangeable', () => {
    expect(findDialogueTriggerAt(triggers, 2, 1)).toBeUndefined();
  });

  it('returns undefined for a map with no triggers', () => {
    expect(findDialogueTriggerAt([], 0, 0)).toBeUndefined();
    expect(findDialogueTriggerAt(undefined, 0, 0)).toBeUndefined();
  });

  it('returns the first trigger when two share a tile', () => {
    const stacked = [makeTrigger('first', 6, 6), makeTrigger('second', 6, 6)];
    expect(findDialogueTriggerAt(stacked, 6, 6)?.scene).toBe('first');
  });
});

describe('the three finders are independent', () => {
  it('a node, a loot spot and a trigger can share one tile', () => {
    expect(findNodeAt(nodes, 0, 0)?.id).toBe('a');
    expect(findFloorLootAt(lootSpots, 0, 0)?.id).toBe('loot-a');
    expect(findDialogueTriggerAt(triggers, 0, 0)?.scene).toBe('intro');
  });
});
