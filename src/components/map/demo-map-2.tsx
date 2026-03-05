import TilemapMap01 from './tile-map-01';
import type { TiledMapConfig } from '../../types/tilemap';
import '../../styles/game-map.css';

const MAP_CONFIG: TiledMapConfig = {
  tilesetImage: '/assets/tileset/demo-map-2.png',
  displayMapName: 'The Forgotten Halls',
  walkableLayers: ['walkable', 'walkable-2'],
  visibleLayers: ['not-walkable', 'walkable', 'walkable-2'],
};

export default function DemoMap2() {
  return (
    <div className="game-view game-map" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <TilemapMap01 config={MAP_CONFIG} />
    </div>
  );
}
