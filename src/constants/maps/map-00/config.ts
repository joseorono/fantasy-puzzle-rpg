import type { TiledMapConfig } from '~/types/tilemap';

export const MAP_00_CONFIG: TiledMapConfig = {
  tilesetImage: '/assets/tileset/demo-map.png',
  displayMapName: 'Overworld',
  walkableLayers: ['road'],
  visibleLayers: ['Capa de patrones 1', 'road', 'mountains', 'trees', 'signs'],
  defaultPlayerPosition: { x: 70, y: 58 },
  debug: true,
};
