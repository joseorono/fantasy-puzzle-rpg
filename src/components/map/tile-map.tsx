// components/Tilemap.tsx
import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData, TilemapProps } from '../../types/tilemap';
import { DialogueTriggerModal } from './dialogue-trigger-modal';
import { DialogueScene } from '~/components/dialogue';
import {
  TEST_DIALOGUE_SCENE,
  SIMPLE_DIALOGUE_SCENE,
  CUTSCENE_WITH_NARRATOR,
} from '~/constants/dialogue/scenes/test-scene';

import tilemapData from '../map/demo-map';

// Character placeholder image path
const characterPlaceholder = '/assets/sprite/character-placeholder.png';

// Dialogue trigger coordinates
const DIALOGUE_TRIGGERS = [
  { row: 6, col: 36, scene: 'test' },
  { row: 22, col: 15, scene: 'simple' },
  { row: 27, col: 40, scene: 'narrator' },
  { row: 55, col: 19, scene: 'test' },
  { row: 31, col: 83, scene: 'simple' },
  { row: 13, col: 71, scene: 'narrator' },
] as const;

type DialogueSceneType = 'test' | 'simple' | 'narrator';

interface CharacterPosition {
  row: number;
  col: number;
}

const Tilemap: React.FC<TilemapProps> = ({
  tilesetImage,
  visibleLayers = ['snow', 'road', 'mountains', 'trees', 'signs'],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tileset, setTileset] = useState<HTMLImageElement | null>(null);
  const [mapData] = useState<TilemapData>(tilemapData);
  const [characterImage, setCharacterImage] = useState<HTMLImageElement | null>(null);
  const [charPosition, setCharPosition] = useState<CharacterPosition>({ row: 0, col: 0 });
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [visitedTriggers, setVisitedTriggers] = useState<Set<string>>(new Set());
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [pendingDialogue, setPendingDialogue] = useState<DialogueSceneType | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueSceneType | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Get tile size from map data
  const tileSize = mapData.tilewidth || 16;

  // Pulse animation for markers
  useEffect(() => {
    function animate() {
      setPulseAnimation((prev) => (prev + 0.05) % (Math.PI * 2));
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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

  // Check if a position is walkable (any non-zero tile in road layer)
  const isRoadTile = React.useCallback(
    (row: number, col: number): boolean => {
      const roadLayer = mapData.layers.find((layer) => layer.name === 'road');
      if (!roadLayer) return false;

      // Check bounds
      if (row < 0 || row >= roadLayer.height) return false;
      if (col < 0 || col >= roadLayer.width) return false;

      // Get tile ID at position
      const dataIndex = row * roadLayer.width + col;
      const tileId = roadLayer.data[dataIndex];

      // Any non-zero tile in the road layer is walkable
      return tileId !== 0;
    },
    [mapData],
  );

  // Find a valid starting position on initialization
  useEffect(() => {
    const roadLayer = mapData.layers.find((layer) => layer.name === 'road');
    if (!roadLayer) {
      console.error('❌ Road layer not found!');
      setDebugInfo('ERROR: Road layer not found!');
      return;
    }

    console.log(`🔍 Searching for road tiles in ${roadLayer.width}x${roadLayer.height} map...`);

    // Search for first non-zero road tile
    for (let row = 0; row < roadLayer.height; row++) {
      for (let col = 0; col < roadLayer.width; col++) {
        const dataIndex = row * roadLayer.width + col;
        const tileId = roadLayer.data[dataIndex];

        if (tileId !== 0) {
          console.log(`✅ Starting position found: Row ${row}, Col ${col}, TileID ${tileId}`);
          setCharPosition({ row, col });
          setDebugInfo(`On road at (${row}, ${col})`);
          return;
        }
      }
    }
    console.error('❌ No road tiles found in map!');
    setDebugInfo('ERROR: No road tiles found!');
  }, [mapData]);

  // Check if character reached a dialogue trigger
  const checkDialogueTrigger = React.useCallback(
    (row: number, col: number) => {
      const trigger = DIALOGUE_TRIGGERS.find((t) => t.row === row && t.col === col);

      if (trigger) {
        const triggerKey = `${row},${col}`;

        // Only trigger if not already visited
        if (!visitedTriggers.has(triggerKey)) {
          console.log('Dialogue trigger activated at:', { row, col });
          setPendingDialogue(trigger.scene);
          setShowTriggerModal(true);
        }
      }
    },
    [visitedTriggers],
  );

  // Handle keyboard input for character movement
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Prevent default scrolling behavior
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
        event.preventDefault();
      }

      setCharPosition((currentPos) => {
        let newRow = currentPos.row;
        let newCol = currentPos.col;

        switch (event.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            newRow -= 1;
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            newRow += 1;
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            newCol -= 1;
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            newCol += 1;
            break;
          default:
            return currentPos;
        }

        // Only move if the new position is a road tile
        const canMove = isRoadTile(newRow, newCol);
        
        if (canMove) {
          console.log(`✅ Moving to (${newRow}, ${newCol})`);
          setDebugInfo(`On road at (${newRow}, ${newCol})`);

          // Check for dialogue triggers
          checkDialogueTrigger(newRow, newCol);

          return { row: newRow, col: newCol };
        } else {
          console.log(`❌ Blocked at (${newRow}, ${newCol}) - not a road tile`);
          setDebugInfo(`Blocked! Still at (${currentPos.row}, ${currentPos.col})`);
          return currentPos;
        }
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRoadTile, checkDialogueTrigger]); // Add both dependencies

  function handleAcceptDialogue() {
    if (pendingDialogue) {
      const triggerKey = `${charPosition.row},${charPosition.col}`;
      setVisitedTriggers((prev) => new Set(prev).add(triggerKey));
      setDialogueKey((k) => k + 1);
      setActiveDialogue(pendingDialogue);
    }
    setShowTriggerModal(false);
    setPendingDialogue(null);
  }

  function handleDeclineDialogue() {
    const triggerKey = `${charPosition.row},${charPosition.col}`;
    setVisitedTriggers((prev) => new Set(prev).add(triggerKey));
    setShowTriggerModal(false);
    setPendingDialogue(null);
  }

  function handleDialogueComplete() {
    console.log('Dialogue scene completed!');
    setActiveDialogue(null);
  }

  // Draw the map and character
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !tileset) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate canvas size based on map dimensions
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

          // Skip empty tiles (0 typically means no tile)
          if (tileId === 0) continue;

          // Calculate tile position in tileset using tileset metadata
          const tilesetInfo = mapData.tilesets?.[0];
          if (!tilesetInfo) continue;

          const tilesetCols = tilesetInfo.columns;
          const tileWidth = tilesetInfo.tilewidth;
          const tileHeight = tilesetInfo.tileheight;
          const firstgid = tilesetInfo.firstgid;

          // Adjust tileId by firstgid to get the correct index in the tileset
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

    // Draw dialogue trigger markers
    DIALOGUE_TRIGGERS.forEach((trigger) => {
      const triggerKey = `${trigger.row},${trigger.col}`;
      const isVisited = visitedTriggers.has(triggerKey);

      const markerX = trigger.col * tileSize;
      const markerY = trigger.row * tileSize;
      const markerSize = tileSize;

      // Draw pulsing marker for unvisited triggers
      if (!isVisited) {
        // Calculate pulse effect (0.5 to 1.0)
        const pulse = 0.5 + Math.sin(pulseAnimation) * 0.5;

        // Outer glow with pulse
        const glowSize = markerSize * (1 + pulse * 0.5);
        const gradient = ctx.createRadialGradient(
          markerX + markerSize / 2,
          markerY + markerSize / 2,
          0,
          markerX + markerSize / 2,
          markerY + markerSize / 2,
          glowSize,
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * pulse})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.3 * pulse})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(markerX - glowSize / 2, markerY - glowSize / 2, glowSize * 2, glowSize * 2);

        // Star/exclamation marker with pulse
        ctx.fillStyle = `rgba(255, 215, 0, ${0.8 + pulse * 0.2})`;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', markerX + markerSize / 2, markerY + markerSize / 2);

        // Border with pulse
        ctx.strokeStyle = `rgba(255, 165, 0, ${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(markerX, markerY, markerSize, markerSize);
      } else {
        // Faded marker for visited triggers
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fillRect(markerX, markerY, markerSize, markerSize);

        ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(markerX, markerY, markerSize, markerSize);
      }
    });
  }, [tileset, characterImage, mapData, tileSize, visibleLayers, charPosition, visitedTriggers, pulseAnimation]);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            style={{
              border: '1px solid #ccc',
              background: '#87CEEB',
              imageRendering: 'pixelated',
              display: 'block',
              width: `${mapData.width * tileSize}px`,
              height: `${mapData.height * tileSize}px`,
            }}
          />

          {/* Character rendered as HTML element for smooth CSS transitions */}
          {characterImage && (
            <div
              style={{
                position: 'absolute',
                left: `${charPosition.col * tileSize}px`,
                top: `${charPosition.row * tileSize}px`,
                width: `${tileSize}px`,
                height: `${tileSize}px`,
                backgroundImage: `url('${characterPlaceholder}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                transition: 'left 0.2s ease-out, top 0.2s ease-out',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </div>

        <div style={{ fontSize: '14px', fontFamily: 'monospace', minWidth: '250px', padding: '10px' }}>
          <strong>Character Position:</strong> Row {charPosition.row}, Col {charPosition.col}
          <br />
          <strong>Controls:</strong> Arrow Keys or WASD
          <br />
          <strong>Status:</strong> {debugInfo}
        </div>
      </div>

      {/* Dialogue trigger confirmation modal */}
      <DialogueTriggerModal
        isOpen={showTriggerModal}
        onAccept={handleAcceptDialogue}
        onDecline={handleDeclineDialogue}
      />

      {/* Active dialogue scenes */}
      {activeDialogue === 'test' && (
        <DialogueScene key={dialogueKey} scene={TEST_DIALOGUE_SCENE} onComplete={handleDialogueComplete} />
      )}

      {activeDialogue === 'simple' && (
        <DialogueScene key={dialogueKey} scene={SIMPLE_DIALOGUE_SCENE} onComplete={handleDialogueComplete} />
      )}

      {activeDialogue === 'narrator' && (
        <DialogueScene key={dialogueKey} scene={CUTSCENE_WITH_NARRATOR} onComplete={handleDialogueComplete} />
      )}
    </>
  );
};

export default Tilemap;
