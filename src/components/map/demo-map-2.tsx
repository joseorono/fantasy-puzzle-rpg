import { useState } from 'react';
import TilemapMap01 from './tile-map-01';
import '../../styles/game-map.css';

export default function DemoMap2() {
  const [visibleLayers, setVisibleLayers] = useState<string[]>([
    'not-walkable',
    'walkable',
    'walkable-2',
  ]);

  const toggleLayer = (layerName: string) => {
    setVisibleLayers((prev) => (prev.includes(layerName) ? prev.filter((l) => l !== layerName) : [...prev, layerName]));
  };

  const layersToShow = ['not-walkable', 'walkable', 'walkable-2'];

  return (
    <div className="game-view game-map">
      <div className="map-controls">
        <h3>Map 2 Layers</h3>
        {layersToShow.map((layer) => (
          <label key={layer} style={{ display: 'block', margin: '5px 0' }}>
            <input type="checkbox" checked={visibleLayers.includes(layer)} onChange={() => toggleLayer(layer)} />
            {layer}
          </label>
        ))}
      </div>

      <TilemapMap01 tilesetImage="/assets/tileset/demo-map-2.png" visibleLayers={visibleLayers} />
    </div>
  );
}
