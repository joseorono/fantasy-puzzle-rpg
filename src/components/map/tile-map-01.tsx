import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData, TiledMapConfig } from '../../types/tilemap';
import { newMap } from '~/constants/maps/map-01/tiled-data';
import { useGameStore, useMapProgressActions } from '~/stores/game-store';
import { isRunModifier } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useCharacterMovement } from '~/hooks/use-character-movement';
import MapCharacterSprite from './map-character-sprite';
import { MapInfoPanel } from './map-info-panel';

interface CharacterPosition {
  row: number;
  col: number;
}

interface TilemapMap01Props {
  config: TiledMapConfig;
}

const TilemapMap01: React.FC<TilemapMap01Props> = ({ config }) => {
  const { tilesetImage, displayMapName, walkableLayers, visibleLayers, defaultPlayerPosition, debug } = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tileset, setTileset] = useState<HTMLImageElement | null>(null);
  const [mapData] = useState<TilemapData>(newMap);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [charPosition, setCharPosition] = useState<CharacterPosition>(() => {
    const saved = useGameStore.getState().mapProgress.characterPosition;
    return saved ?? { row: defaultPlayerPosition.y, col: defaultPlayerPosition.x };
  });

  const mapProgressActions = useMapProgressActions();

  const tileSize = mapData.tilewidth || 16;

  // Load tileset image
  useEffect(() => {
    const img = new Image();
    img.src = tilesetImage;
    img.onload = () => {
      console.log('Tileset loaded:', tilesetImage, 'Size:', img.width, 'x', img.height);
      setTileset(img);
    };
    img.onerror = () => {
      console.error('Failed to load tileset image:', tilesetImage);
    };
  }, [tilesetImage]);

  // Check if a position is walkable based on walkableLayers config
  const isWalkable = React.useCallback(
    (row: number, col: number): boolean => {
      // Check bounds
      if (row < 0 || row >= mapData.height) return false;
      if (col < 0 || col >= mapData.width) return false;

      const dataIndex = row * mapData.width + col;

      // Check if any walkable layer has a tile at this position
      for (const layerName of walkableLayers) {
        const layer = mapData.layers.find((l) => l.name === layerName);
        if (layer && layer.data[dataIndex] !== 0) {
          return true;
        }
      }

      return false;
    },
    [mapData, walkableLayers],
  );

  // Verify starting position is valid on initialization
  useEffect(() => {
    if (walkableLayers.length === 0) {
      console.error('❌ No walkable layers configured!');
      return;
    }

    // Check store for saved position first (used when returning from combat)
    const savedPosition = useGameStore.getState().mapProgress.characterPosition;
    const startRow = savedPosition?.row ?? defaultPlayerPosition.y;
    const startCol = savedPosition?.col ?? defaultPlayerPosition.x;

    // Update charPosition if store had a saved position
    if (savedPosition) {
      setCharPosition(savedPosition);
    }

    if (isWalkable(startRow, startCol)) {
      console.log(`✅ Starting position (${startRow}, ${startCol}) is valid`);
      return;
    }

    // Find nearest walkable tile
    console.log(`🔍 Searching for nearest walkable tile...`);
    for (let row = 0; row < mapData.height; row++) {
      for (let col = 0; col < mapData.width; col++) {
        if (isWalkable(row, col)) {
          console.log(`✅ Fallback position found: Row ${row}, Col ${col}`);
          setCharPosition({ row, col });
          return;
        }
      }
    }
    console.error('❌ No walkable tiles found in map!');
  }, [mapData, isWalkable, walkableLayers, defaultPlayerPosition]);

  // --- Smooth character movement (rAF-based) ---
  const movement = useCharacterMovement({
    initialRow: charPosition.row,
    initialCol: charPosition.col,
    tileSize,
    displayScale: 1,
    canMoveTo: (row, col) => isWalkable(row, col),
    onTileEnter: (row, col) => {
      setCharPosition({ row, col });
      setDebugInfo(`Walking at (${row}, ${col})`);
    },
  });

  useWindowKeyDown((event) => {
    const dir = movement.onKeyDown(event.key);
    if (!dir) return;
    event.preventDefault();
    movement.setRunning(isRunModifier(event));
  });

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !tileset) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = mapData.width * tileSize;
    const canvasHeight = mapData.height * tileSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw each visible layer
    mapData.layers.forEach((layer) => {
      if (!visibleLayers.includes(layer.name)) return;

      for (let y = 0; y < layer.height; y++) {
        for (let x = 0; x < layer.width; x++) {
          const dataIndex = y * layer.width + x;
          const tileId = layer.data[dataIndex];

          if (tileId === 0) continue;

          const tilesetInfo = mapData.tilesets?.[0];
          if (!tilesetInfo) continue;

          const tilesetCols = tilesetInfo.columns;
          const tileWidth = tilesetInfo.tilewidth;
          const tileHeight = tilesetInfo.tileheight;
          const firstgid = tilesetInfo.firstgid;

          const tileIndex = tileId - firstgid;

          const tilesetX = (tileIndex % tilesetCols) * tileWidth;
          const tilesetY = Math.floor(tileIndex / tilesetCols) * tileHeight;

          ctx.drawImage(
            tileset,
            tilesetX,
            tilesetY,
            tileWidth,
            tileHeight,
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize,
          );
        }
      }
    });

  }, [tileset, mapData, visibleLayers, tileSize]);

  // Auto-scroll to center character
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const charX = movement.tileCol * tileSize;
    const charY = movement.tileRow * tileSize;

    canvas.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });

    const parent = canvas.parentElement;
    if (parent) {
      const scrollX = charX - parent.clientWidth / 2;
      const scrollY = charY - parent.clientHeight / 2;
      parent.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' });
    }
  }, [movement.tileCol, movement.tileRow, tileSize]);

  // Persist character position to store on unmount so it survives view transitions
  const charPositionRef = useRef(charPosition);
  charPositionRef.current = charPosition;
  useEffect(() => {
    return () => {
      mapProgressActions.setCharacterPosition(charPositionRef.current);
    };
  }, [mapProgressActions]);

  return (
    <div className="tilemap-container">
      <MapInfoPanel
        displayMapName={displayMapName}
        debug={debug}
        charPosition={charPosition}
        status={debugInfo}
      />
      <div className="canvas-wrapper" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={{ imageRendering: 'pixelated' }} />
        <MapCharacterSprite
          pixelX={movement.pixelX}
          pixelY={movement.pixelY}
          tileSize={tileSize}
          displayScale={1}
          spriteState={movement.spriteState}
        />
      </div>
    </div>
  );
};

export default TilemapMap01;
