import type { MapDefinition } from '~/types/map';
import { newMap } from './tiled-data';

/** No content yet — walkable space only. */
export const MAP_01: MapDefinition = {
  id: 'map-01',
  tilesetImage: '/assets/tileset/demo-map-2.png',
  displayMapName: 'The Forgotten Halls',
  walkableLayers: ['walkable', 'walkable-2'],
  visibleLayers: ['not-walkable', 'walkable', 'walkable-2'],
  defaultPlayerPosition: { x: 10, y: 10 },
  debug: true,
  tiledData: newMap,
};
