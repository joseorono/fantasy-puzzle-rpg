import type { TiledMapConfig } from '~/types/tilemap';

export const MAP_01_CONFIG: TiledMapConfig = {
  tilesetImage: '/assets/tileset/demo-map-2.png',
  displayMapName: 'The Forgotten Halls',
  walkableLayers: ['walkable', 'walkable-2'],
  visibleLayers: ['not-walkable', 'walkable', 'walkable-2'],
  defaultPlayerPosition: { x: 10, y: 10 },
  debug: true,
};
