import { describe, expect, it } from 'vitest';
import { ALL_MAPS, MAP_REGISTRY } from '~/constants/maps';
import { MAP_EXIT_NODE_TYPES } from '~/constants/map';
import { buildWalkableMask, isMaskWalkable } from './tilemap-collision';
import { createTilePathfinder } from './foe-pathfinding';
import { findFloorLootAt, findNodeAt } from './map-content';
import type { MapDefinition } from '~/types/map';

/** The same mask the map builds at runtime (`tile-map.tsx`). */
function maskFor(map: MapDefinition) {
  const tileset = map.tiledData.tilesets?.[0];
  const ignoredGids = new Set([...(tileset?.blankGids ?? []), ...(tileset?.overheadGids ?? [])]);
  return buildWalkableMask(map.tiledData, map.walkableLayers, { surfaceLayers: map.surfaceLayers, ignoredGids });
}

const mapsWithFoes = ALL_MAPS.filter((map) => (map.foes?.length ?? 0) > 0);
const mapsWithBattleNodes = ALL_MAPS.filter((map) => (map.nodes ?? []).some((node) => node.type === 'Battle'));

describe('authored battle nodes', () => {
  it.each(mapsWithBattleNodes.map((map) => [map.id, map] as const))(
    '%s: every one is walkable and has an encounter',
    (_id, map) => {
      const mask = maskFor(map);
      for (const node of map.nodes!.filter((entry) => entry.type === 'Battle')) {
        const { row, col } = node.position;
        expect(isMaskWalkable(mask, row, col), `${node.id} at (${row}, ${col}) walkable`).toBe(true);
        expect(map.encounters?.[node.id], `${node.id} encounter exists`).toBeDefined();
      }
    },
  );
});

describe('authored map exits', () => {
  const exits = ALL_MAPS.flatMap((map) =>
    (map.nodes ?? []).filter((node) => MAP_EXIT_NODE_TYPES.includes(node.type)).map((node) => [node.id, node] as const),
  );

  it('at least one map has an exit (otherwise the per-exit checks below are vacuous)', () => {
    expect(exits.length).toBeGreaterThan(0);
  });

  it.each(exits)('%s lands on a walkable tile beside, not on, a node', (_id, node) => {
    expect(node.destination, 'destination set').toBeDefined();
    const { mapId, arrival } = node.destination!;
    const target = MAP_REGISTRY[mapId];
    expect(target, `${mapId} registered`).toBeDefined();
    expect(isMaskWalkable(maskFor(target), arrival.row, arrival.col), 'arrival walkable').toBe(true);
    expect(findNodeAt(target.nodes, arrival.row, arrival.col), 'arrival off nodes').toBeUndefined();
  });
});

describe('authored FOEs', () => {
  it('at least one map has FOEs (otherwise the per-map checks below are vacuous)', () => {
    expect(mapsWithFoes.length).toBeGreaterThan(0);
  });

  it('have globally unique ids', () => {
    const ids = ALL_MAPS.flatMap((map) => (map.foes ?? []).map((foe) => foe.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(mapsWithFoes.map((map) => [map.id, map] as const))('%s', (_id, map) => {
    const mask = maskFor(map);
    const isWalkable = (row: number, col: number) => isMaskWalkable(mask, row, col);
    const pathfinder = createTilePathfinder(mask.width, mask.height);

    it.each(map.foes!.map((foe) => [foe.id, foe] as const))('%s is fully authored', (_foeId, foe) => {
      expect(foe.patrol.length).toBeGreaterThan(0);
      expect(map.encounters?.[foe.encounterId ?? foe.id], 'encounter exists').toBeDefined();

      for (const tile of foe.patrol) {
        expect(isWalkable(tile.row, tile.col), `waypoint (${tile.row}, ${tile.col}) walkable`).toBe(true);
        expect(
          findNodeAt(map.nodes, tile.row, tile.col),
          `waypoint (${tile.row}, ${tile.col}) off nodes`,
        ).toBeUndefined();
        expect(
          findFloorLootAt(map.floorLoot, tile.row, tile.col),
          `waypoint (${tile.row}, ${tile.col}) off loot`,
        ).toBeUndefined();
      }

      for (let index = 0; index < foe.patrol.length; index++) {
        const from = foe.patrol[index];
        const to = foe.patrol[(index + 1) % foe.patrol.length];
        expect(pathfinder.findPath(from, to, isWalkable), `leg ${index} reachable`).not.toBeNull();
      }
    });
  });
});
