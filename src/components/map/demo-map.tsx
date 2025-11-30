// components/GameMap.tsx
import { useState } from 'react';
import Tilemap from './tile-map';
import '../../styles/game-map.css';

export default function DemoMap() {
  const [visibleLayers, setVisibleLayers] = useState<string[]>([
    'Capa de patrones 1',
    'road',
    'mountains',
    'trees',
    'signs',
  ]);

  const toggleLayer = (layerName: string) => {
    setVisibleLayers((prev) => (prev.includes(layerName) ? prev.filter((l) => l !== layerName) : [...prev, layerName]));
  };

  const layersToShow = ['road', 'mountains', 'trees', 'signs'];

  return (
    <div className="game-view game-map">
      <div className="map-controls">
        <h3>Map Layers</h3>
        {layersToShow.map((layer) => (
          <label key={layer} style={{ display: 'block', margin: '5px 0' }}>
            <input type="checkbox" checked={visibleLayers.includes(layer)} onChange={() => toggleLayer(layer)} />
            {layer}
          </label>
        ))}
      </div>

      <Tilemap tilesetImage="/assets/tileset/demo-map.png" visibleLayers={visibleLayers} />
    </div>
  );
}
