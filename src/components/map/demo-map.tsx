// components/GameMap.tsx
import Tilemap from './tile-map';
import { MAP_00_CONFIG } from '~/constants/maps/map-00/config';
import '../../styles/game-map.css';

export default function DemoMap() {
  return (
    <div className="game-view game-map">
      <Tilemap config={MAP_00_CONFIG} />
    </div>
  );
}
