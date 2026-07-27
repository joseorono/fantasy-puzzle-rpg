import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData, TiledMapConfig } from '../../types/tilemap';
import { newMap } from '~/constants/maps/map-01/tiled-data';
import { useGameStore, useMapProgressActions } from '~/stores/game-store';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useCharacterMovement } from '~/hooks/use-character-movement';
import { useCanvasMetrics } from '~/hooks/use-canvas-metrics';
import { buildWalkableMask, findFirstWalkableTile, isMaskWalkable } from '~/lib/tilemap-collision';
import { clientToMapPoint } from '~/lib/pointer-movement';
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
  const canvasContainerRef = useRef<HTMLDivElement>(null);
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

  // Ground walkability, flattened once so the movement loop's per-substep
  // queries are a single array read instead of a scan over the layer list.
  const walkableMask = React.useMemo(() => buildWalkableMask(mapData, walkableLayers), [mapData, walkableLayers]);

  const isWalkable = React.useCallback(
    (row: number, col: number): boolean => isMaskWalkable(walkableMask, row, col),
    [walkableMask],
  );

  // The canvas is shrink-to-fit inside its container, so it is both scaled and
  // possibly letterboxed. Render-only — the simulation stays in map pixels.
  const { scale, offsetX, offsetY } = useCanvasMetrics(canvasRef, canvasContainerRef, mapData.width * tileSize);

  // --- Smooth character movement (rAF-based) ---
  const movement = useCharacterMovement({
    initialRow: charPosition.row,
    initialCol: charPosition.col,
    tileSize,
    displayScale: scale,
    offsetX,
    offsetY,
    toMapPoint: (clientX, clientY) => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return null;
      return clientToMapPoint(clientX, clientY, canvasElement.getBoundingClientRect(), scale);
    },
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
  });

  // Place the character on spawn: prefer the saved position (returning from
  // combat), else the configured default, else the first walkable tile.
  const setCharacterPosition = movement.setPosition;
  useEffect(() => {
    const savedPosition = useGameStore.getState().mapProgress.characterPosition;
    const start = savedPosition ?? { row: defaultPlayerPosition.y, col: defaultPlayerPosition.x };

    const spawn = isMaskWalkable(walkableMask, start.row, start.col) ? start : findFirstWalkableTile(walkableMask);

    if (!spawn) {
      console.error('❌ No walkable tiles found in map!');
      return;
    }

    setCharPosition(spawn);
    setCharacterPosition(spawn.row, spawn.col);
    // Spawn placement runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <MapInfoPanel displayMapName={displayMapName} debug={debug} charPosition={charPosition} status={debugInfo} />
      <div ref={canvasContainerRef} className="canvas-wrapper" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          {...movement.pointerHandlers}
          style={{ imageRendering: 'pixelated', display: 'block' }}
        />
        <MapCharacterSprite
          positionRef={movement.characterRef}
          tileSize={tileSize}
          displayScale={scale}
          spriteState={movement.spriteState}
        />
      </div>
    </div>
  );
};

export default TilemapMap01;
