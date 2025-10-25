import type { MapData } from '~/types/map';
import { TILE_COLORS, TILE_SPRITES } from '~/constants/maps';

interface MapBackgroundProps {
  mapData: MapData;
}

export function MapBackground({ mapData }: MapBackgroundProps) {
  return (
    <div className="inline-grid gap-0 border-4 border-gray-800 bg-gray-900 p-2">
      {mapData.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((tile, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                flex h-12 w-12 items-center justify-center
                border border-gray-700 text-2xl
                ${TILE_COLORS[tile]}
                transition-colors duration-200
              `}
              title={tile}
            >
              <span className="drop-shadow-md">{TILE_SPRITES[tile]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
