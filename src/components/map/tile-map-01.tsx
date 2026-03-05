import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData, TilemapProps } from '../../types/tilemap';
import { newMap } from '~/constants/maps/map-01/tiled-data';

const characterPlaceholder = '/assets/sprite/character-placeholder.png';

interface CharacterPosition {
  row: number;
  col: number;
}

const TilemapMap01: React.FC<TilemapProps> = ({
  tilesetImage,
  visibleLayers = ['not-walkable', 'walkable', 'walkable-2'],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tileset, setTileset] = useState<HTMLImageElement | null>(null);
  const [mapData] = useState<TilemapData>(newMap);
  const [characterImage, setCharacterImage] = useState<HTMLImageElement | null>(null);
  const [charPosition, setCharPosition] = useState<CharacterPosition>({ row: 30, col: 45 });

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

  // Check if a position is walkable (walkable or walkable-2 layer has a tile)
  const isWalkable = React.useCallback(
    (row: number, col: number): boolean => {
      const walkableLayer = mapData.layers.find((layer) => layer.name === 'walkable');
      const walkable2Layer = mapData.layers.find((layer) => layer.name === 'walkable-2');

      // Check bounds
      const width = walkableLayer?.width || mapData.width;
      const height = walkableLayer?.height || mapData.height;
      if (row < 0 || row >= height) return false;
      if (col < 0 || col >= width) return false;

      const dataIndex = row * width + col;

      // Check if there's a walkable tile in either walkable layer
      const walkableTile = walkableLayer?.data[dataIndex] || 0;
      const walkable2Tile = walkable2Layer?.data[dataIndex] || 0;

      return walkableTile !== 0 || walkable2Tile !== 0;
    },
    [mapData],
  );

  // Verify starting position is valid on initialization
  useEffect(() => {
    const walkableLayer = mapData.layers.find((layer) => layer.name === 'walkable');
    if (!walkableLayer) {
      console.error('❌ Walkable layer not found!');
      return;
    }

    const startRow = 30;
    const startCol = 45;

    if (isWalkable(startRow, startCol)) {
      console.log(`✅ Starting position (${startRow}, ${startCol}) is valid`);
      return;
    }

    // Find nearest walkable tile
    console.log(`🔍 Searching for nearest walkable tile...`);
    for (let row = 0; row < walkableLayer.height; row++) {
      for (let col = 0; col < walkableLayer.width; col++) {
        if (isWalkable(row, col)) {
          console.log(`✅ Fallback position found: Row ${row}, Col ${col}`);
          setCharPosition({ row, col });
          return;
        }
      }
    }
    console.error('❌ No walkable tiles found in map!');
  }, [mapData, isWalkable]);

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

  return (
    <div className="tilemap-container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
};

export default TilemapMap01;
