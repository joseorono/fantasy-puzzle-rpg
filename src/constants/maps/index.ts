import type { MapDefinition, MapId } from '~/types/map';
import { MAP_00 } from './map-00/config';
import { MAP_01 } from './map-01/config';

/**
 * Every playable map, keyed by id. This is the only place maps are enumerated:
 * navigation, the debug menu and saved character positions all resolve through it,
 * so adding a map is an entry here plus a `MapId` member.
 */
export const MAP_REGISTRY: Record<MapId, MapDefinition> = {
  'map-00': MAP_00,
  'map-01': MAP_01,
};

/** Map used when a navigation arrives without one. */
export const DEFAULT_MAP_ID: MapId = 'map-00';

/** All maps in registry order — for menus that list them. */
export const ALL_MAPS: MapDefinition[] = Object.values(MAP_REGISTRY);

/**
 * Resolves a map definition, falling back to the default map for an unknown id.
 */
export function getMapById(id: MapId | undefined): MapDefinition {
  return (id && MAP_REGISTRY[id]) || MAP_REGISTRY[DEFAULT_MAP_ID];
}
