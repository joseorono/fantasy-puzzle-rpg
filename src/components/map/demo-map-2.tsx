import TilemapMap01 from './tile-map-01';
import '../../styles/game-map.css';

export default function DemoMap2() {
  const visibleLayers = ['not-walkable', 'walkable', 'walkable-2'];

  return (
    <div className="game-view game-map" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <TilemapMap01 tilesetImage="/assets/tileset/demo-map-2.png" visibleLayers={visibleLayers} />
    </div>
  );
}
