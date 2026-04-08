import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData, TiledMapConfig } from '../../types/tilemap';
import { newMap } from '~/constants/maps/map-01/tiled-data';
import { useGameStore, useMapProgressActions } from '~/stores/game-store';
import { MapInfoPanel } from './map-info-panel';

const characterPlaceholder = '/assets/sprite/character-placeholder.png';

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
  const [characterImage, setCharacterImage] = useState<HTMLImageElement | null>(null);
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

  // Load character image
  useEffect(() => {
    const img = new Image();
    img.src = characterPlaceholder;
    img.onload = () => {
      console.log('Character loaded');
      setCharacterImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load character image');
    };
  }, []);

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

  // Handle keyboard input for character movement
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault();
      }

      let newRow = charPosition.row;
      let newCol = charPosition.col;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
          newRow -= 1;
          break;
        case 'ArrowDown':
        case 's':
          newRow += 1;
          break;
        case 'ArrowLeft':
        case 'a':
          newCol -= 1;
          break;
        case 'ArrowRight':
        case 'd':
          newCol += 1;
          break;
        default:
          return;
      }

      if (isWalkable(newRow, newCol)) {
        setCharPosition({ row: newRow, col: newCol });
        setDebugInfo(`Walking at (${newRow}, ${newCol})`);
      } else {
        setDebugInfo(`Blocked at (${newRow}, ${newCol})`);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [charPosition, isWalkable]);

  // Draw the map and character
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

    // Draw character
    if (characterImage) {
      const charX = charPosition.col * tileSize;
      const charY = charPosition.row * tileSize;

      ctx.drawImage(characterImage, charX, charY, tileSize, tileSize);
    } else {
      // Fallback: draw a simple circle
      const charX = charPosition.col * tileSize + tileSize / 2;
      const charY = charPosition.row * tileSize + tileSize / 2;

      ctx.beginPath();
      ctx.arc(charX, charY, tileSize / 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [tileset, mapData, visibleLayers, charPosition, characterImage, tileSize]);

  // Auto-scroll to center character
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const charX = charPosition.col * tileSize;
    const charY = charPosition.row * tileSize;

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
  }, [charPosition, tileSize]);

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
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
};

export default TilemapMap01;
