import TilemapMap01 from './tile-map-01';
import { MAP_01_CONFIG } from '~/constants/maps/map-01/config';
import '../../styles/game-map.css';

export default function DemoMap2() {
  return (
    <div className="game-view game-map" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <TilemapMap01 config={MAP_01_CONFIG} />
    </div>
  );
}
