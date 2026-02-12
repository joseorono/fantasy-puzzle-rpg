// components/Tilemap.tsx
import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData, TilemapProps } from '../../types/tilemap';
import { DialogueTriggerModal } from './dialogue-trigger-modal';
import { DialogueScene } from '~/components/dialogue';
import { NodeInteractionMenu } from './node-interaction-menu';
import { LootNotification } from './loot-notification';
import { FloorLootNotification } from './floor-loot-notification';
import { MAP_00_DIALOGUE_SCENES } from '~/constants/maps/map-00/dialogue';
import { getEncounterForNode } from '~/constants/maps/map-00/encounters';
import { useSetAtom } from 'jotai';
import { setupBattleAtom } from '~/stores/battle-atoms';
import { DEMO_MAP_NODES, getNodeAtPosition } from '~/constants/maps/map-00/nodes';
import { DEMO_FLOOR_LOOT, getFloorLootAtPosition } from '~/constants/maps/map-00/floor-loot';
import {
  useMapProgressActions,
  useGameStore,
  useInventoryActions,
  useResourcesActions,
  useFloorLootProgressActions,
  useRouterActions,
  useParty,
} from '~/stores/game-store';
import { addResources } from '~/lib/resources';
import { additionWithMax } from '~/lib/math';
import { randomBool } from '~/lib/utils';
import { MAX_AMOUNT_PER_ITEM } from '~/constants/inventory';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { generateRandomResources } from '~/lib/loot';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { InteractiveMapNode } from '~/types/map-node';
import { demoMap } from '~/constants/maps/map-00/tiled-data';
import { footstepSystem, determineSurfaceTypeFromPosition } from '~/services/footstep-system';

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

type DialogueSceneKey = string;

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
  const [mapData] = useState<TilemapData>(demoMap);
  const [characterImage, setCharacterImage] = useState<HTMLImageElement | null>(null);
  const [charPosition, setCharPosition] = useState<CharacterPosition>({ row: 58, col: 70 });
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [visitedTriggers, setVisitedTriggers] = useState<Set<string>>(new Set());
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [pendingDialogue, setPendingDialogue] = useState<DialogueSceneKey | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueSceneKey | null>(null);
  const [pendingFightNodeId, setPendingFightNodeId] = useState<string | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [currentNode, setCurrentNode] = useState<InteractiveMapNode | null>(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [currentLoot, setCurrentLoot] = useState<LootTable | null>(null);
  const [collectedFloorLoot, setCollectedFloorLoot] = useState<Resources | null>(null);

  // Get tile size from map data
  const tileSize = mapData.tilewidth || 16;

  // Get stable reference to isNodeCompleted function
  const isNodeCompleted = useGameStore((state) => state.actions.mapProgress.isNodeCompleted);
  const mapProgressActions = useMapProgressActions();
  const inventoryActions = useInventoryActions();
  const resourcesActions = useResourcesActions();
  const floorLootProgressActions = useFloorLootProgressActions();
  const currentResources = useGameStore((state) => state.resources);
  const currentInventory = useGameStore((state) => state.inventory);

  const routerActions = useRouterActions();
  const partyMembers = useParty();
  const setupBattle = useSetAtom(setupBattleAtom);

  // Map ID for floor loot tracking (hardcoded for demo map)
  const currentMapId = 'map-00';

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

      // Check if there's a road tile
      if (tileId === 0) return false;

      // Check if there's an interactive node at this position
      const node = getNodeAtPosition(row, col);
      if (node && node.blocksMovement) {
        // Node blocks movement - check if it's completed
        const isCompleted = isNodeCompleted(node.type, node.id);
        return isCompleted; // Can only walk through if completed
      }

      // Any non-zero tile in the road layer is walkable
      return true;
    },
    [mapData, isNodeCompleted],
  );

  // Verify starting position is valid on initialization
  useEffect(() => {
    const roadLayer = mapData.layers.find((layer) => layer.name === 'road');
    if (!roadLayer) {
      console.error('❌ Road layer not found!');
      setDebugInfo('ERROR: Road layer not found!');
      return;
    }

    const startRow = 58;
    const startCol = 70;

    // Check if starting position is valid
    if (startRow >= 0 && startRow < roadLayer.height && startCol >= 0 && startCol < roadLayer.width) {
      const dataIndex = startRow * roadLayer.width + startCol;
      const tileId = roadLayer.data[dataIndex];

      if (tileId !== 0) {
        console.log(`✅ Starting position (${startRow}, ${startCol}) is valid - TileID ${tileId}`);
        setDebugInfo(`On road at (${startRow}, ${startCol})`);
        return;
      } else {
        console.warn(`⚠️ Starting position (${startRow}, ${startCol}) is not a road tile (TileID: ${tileId})`);
      }
    }

    // If starting position is invalid, find nearest road tile
    console.log(`🔍 Searching for nearest road tile...`);
    for (let row = 0; row < roadLayer.height; row++) {
      for (let col = 0; col < roadLayer.width; col++) {
        const dataIndex = row * roadLayer.width + col;
        const tileId = roadLayer.data[dataIndex];

        if (tileId !== 0) {
          console.log(`✅ Fallback position found: Row ${row}, Col ${col}, TileID ${tileId}`);
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

  // Check if character is standing on an interactive node
  const checkInteractiveNode = React.useCallback((row: number, col: number) => {
    const node = getNodeAtPosition(row, col);
    if (node) {
      console.log('Standing on interactive node:', node);
      setCurrentNode(node);
      setShowNodeMenu(true);
    }
  }, []);

  // Check and auto-collect floor loot
  const checkFloorLoot = React.useCallback(
    (row: number, col: number) => {
      const floorLoot = getFloorLootAtPosition(row, col);

      if (floorLoot) {
        // Check if already collected
        const isCollected = floorLootProgressActions.isFloorLootCollected(currentMapId, floorLoot.id);

        if (!isCollected) {
          console.log('Floor loot found:', floorLoot);

          // Generate random resources based on max values
          const generatedResources = generateRandomResources(floorLoot.maxValues);

          // Add resources to player's global state immediately
          const newResources = addResources(currentResources, generatedResources);
          resourcesActions.setResources(newResources);

          // Mark as collected in persistent state
          floorLootProgressActions.collectFloorLoot(currentMapId, floorLoot.id);

          // Play sound feedback
          soundService.playSound(SoundNames.clickCoin, 0.6, 0.1, 0.05);

          // Show floating notification
          setCollectedFloorLoot(generatedResources);

          console.log('Collected floor loot:', generatedResources);
        }
      }
    },
    [currentMapId, currentResources, floorLootProgressActions, resourcesActions],
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

          // Play footstep sound
          const surfaceType = determineSurfaceTypeFromPosition(newRow, newCol, mapData);
          footstepSystem.setSurface(surfaceType);
          footstepSystem.playFootstep();

          // Close node menu when moving
          if (showNodeMenu) {
            setShowNodeMenu(false);
            setCurrentNode(null);
          }

          // Check for dialogue triggers
          checkDialogueTrigger(newRow, newCol);

          // Check for interactive nodes
          checkInteractiveNode(newRow, newCol);

          // Check for floor loot (auto-collect)
          checkFloorLoot(newRow, newCol);

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
  }, [isRoadTile, checkDialogueTrigger, checkInteractiveNode, checkFloorLoot, showNodeMenu]);

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

    // If a fight was pending after dialogue, start it now
    if (pendingFightNodeId) {
      const nodeId = pendingFightNodeId;
      setPendingFightNodeId(null);
      startBattle(nodeId);
    }
  }

  /**
   * Start a battle for the given encounter, setting up atoms and navigating.
   */
  function startBattle(nodeId: string) {
    const encounter = getEncounterForNode(nodeId);
    if (!encounter) {
      console.warn('No encounter found for node:', nodeId);
      return;
    }

    setupBattle({ enemies: encounter.enemies, party: partyMembers });
    routerActions.goToBattleDemo({ enemyId: nodeId, location: 'map-00' });
  }

  // Node interaction handlers
  function handleNodeFight() {
    if (!currentNode) return;
    console.log('Starting fight with:', currentNode.name);

    // Mark node as completed (rewards screen can re-check if needed)
    mapProgressActions.completeNode(currentNode.type, currentNode.id);

    // Close menu
    setShowNodeMenu(false);
    setCurrentNode(null);

    // If the node has a pre-fight dialogue, play it first
    if (currentNode.dialogueScene && MAP_00_DIALOGUE_SCENES[currentNode.dialogueScene]) {
      setPendingFightNodeId(currentNode.id);
      setDialogueKey((k) => k + 1);
      setActiveDialogue(currentNode.dialogueScene);
      return;
    }

    // No dialogue — go straight to battle
    startBattle(currentNode.id);
  }

  function handleNodeEnter() {
    if (!currentNode) return;
    console.log('Entering:', currentNode.name);

    // Mark town as visited
    if (currentNode.type === 'Town') {
      mapProgressActions.completeNode(currentNode.type, currentNode.id);
    }

    // Close menu and clear current node
    setShowNodeMenu(false);
    setCurrentNode(null);

    // Show feedback
    alert(`Entered ${currentNode.name}!`);

    // TODO: Navigate to town/dungeon screen instead of alert
  }

  function handleNodeOpenChest() {
    if (!currentNode || currentNode.type !== 'Treasure' || !currentNode.lootPayload) return;
    console.log('Opening chest:', currentNode.name);

    // Play chest opening sound immediately for instant feedback
    soundService.playSound(SoundNames.bgNoiseMiner, 0.7, 0.1, 0.05);

    const loot = currentNode.lootPayload;

    // Apply loot to player inventory and resources using math utilities
    // Add equipment items with additionWithMax to respect MAX_AMOUNT_PER_ITEM
    loot.equipableItems.forEach((lootItem) => {
      // Check probability to determine if item should be included
      if (!randomBool(lootItem.probability)) return;

      const item = lootItem.item;
      const existingItem = currentInventory.items.find((invItem) => invItem.itemId === item.id);
      const currentQuantity = existingItem?.quantity ?? 0;
      const newQuantity = additionWithMax(currentQuantity, 1, MAX_AMOUNT_PER_ITEM);
      const quantityToAdd = newQuantity - currentQuantity;
      if (quantityToAdd > 0) {
        inventoryActions.addItem(item.id, quantityToAdd);
      }
    });

    // Add consumable items with additionWithMax to respect MAX_AMOUNT_PER_ITEM
    loot.consumableItems.forEach((lootItem) => {
      // Check probability to determine if item should be included
      if (!randomBool(lootItem.probability)) return;

      const item = lootItem.item;
      const existingItem = currentInventory.items.find((invItem) => invItem.itemId === item.id);
      const currentQuantity = existingItem?.quantity ?? 0;
      const newQuantity = additionWithMax(currentQuantity, 1, MAX_AMOUNT_PER_ITEM);
      const quantityToAdd = newQuantity - currentQuantity;
      if (quantityToAdd > 0) {
        inventoryActions.addItem(item.id, quantityToAdd);
      }
    });

    // Add resources using the addResources utility from lib/resources.ts
    // This ensures proper arithmetic operations for currency
    // Check probability to determine if resources should be included
    if (randomBool(loot.resources.probability)) {
      const newResources = addResources(currentResources, loot.resources.item);
      resourcesActions.setResources(newResources);
    }

    // Mark treasure as looted
    mapProgressActions.completeNode(currentNode.type, currentNode.id);

    // Show loot notification
    setCurrentLoot(loot);

    // Close menu and clear current node
    setShowNodeMenu(false);
    setCurrentNode(null);
  }

  function handleNodeViewDialogue() {
    if (!currentNode || !currentNode.dialogueScene) return;
    console.log('Viewing dialogue for:', currentNode.name);
    const scene = MAP_00_DIALOGUE_SCENES[currentNode.dialogueScene];
    if (scene) {
      setDialogueKey((k) => k + 1);
      setActiveDialogue(currentNode.dialogueScene);
    }
    // Don't close the menu - dialogue renders as overlay
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

    // Draw interactive node markers
    DEMO_MAP_NODES.forEach((node) => {
      const isCompleted = mapProgressActions.isNodeCompleted(node.type, node.id);
      const markerX = node.position.col * tileSize;
      const markerY = node.position.row * tileSize;
      const markerSize = tileSize;

      // Calculate pulse effect (0.5 to 1.0)
      const pulse = 0.5 + Math.sin(pulseAnimation) * 0.5;

      // Color based on node type
      let color: string;
      let icon: string;
      switch (node.type) {
        case 'Battle':
          color = isCompleted ? 'rgba(255, 100, 100, ' : 'rgba(220, 20, 60, ';
          icon = '⚔';
          break;
        case 'Boss':
          color = isCompleted ? 'rgba(200, 100, 255, ' : 'rgba(138, 43, 226, ';
          icon = '👑';
          break;
        case 'Town':
          color = isCompleted ? 'rgba(100, 150, 255, ' : 'rgba(30, 144, 255, ';
          icon = '🏠';
          break;
        case 'Dungeon':
          color = isCompleted ? 'rgba(150, 150, 150, ' : 'rgba(105, 105, 105, ';
          icon = '💀';
          break;
        case 'Treasure':
          color = isCompleted ? 'rgba(255, 255, 150, ' : 'rgba(255, 215, 0, ';
          icon = isCompleted ? '📦' : '🎁';
          break;
        case 'Mystery':
          color = isCompleted ? 'rgba(200, 150, 255, ' : 'rgba(148, 0, 211, ';
          icon = '❓';
          break;
      }

      // Draw marker background
      if (!isCompleted) {
        // Pulsing glow for incomplete nodes
        const glowSize = markerSize * (1 + pulse * 0.3);
        const gradient = ctx.createRadialGradient(
          markerX + markerSize / 2,
          markerY + markerSize / 2,
          0,
          markerX + markerSize / 2,
          markerY + markerSize / 2,
          glowSize,
        );
        gradient.addColorStop(0, color + `${0.6 * pulse})`);
        gradient.addColorStop(0.5, color + `${0.3 * pulse})`);
        gradient.addColorStop(1, color + '0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(markerX - glowSize / 2, markerY - glowSize / 2, glowSize * 2, glowSize * 2);
      }

      // Draw marker background square
      ctx.fillStyle = color + (isCompleted ? '0.4)' : '0.7)');
      ctx.fillRect(markerX, markerY, markerSize, markerSize);

      // Draw icon
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, markerX + markerSize / 2, markerY + markerSize / 2);

      // Draw border
      ctx.strokeStyle = color + (isCompleted ? '0.6)' : `${0.8 + pulse * 0.2})`);
      ctx.lineWidth = isCompleted ? 1 : 2;
      ctx.strokeRect(markerX, markerY, markerSize, markerSize);

      // Draw completion checkmark
      if (isCompleted) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('✓', markerX + markerSize - 4, markerY + 4);
      }
    });

    // Draw floor loot markers
    DEMO_FLOOR_LOOT.forEach((lootSpot) => {
      const isCollected = floorLootProgressActions.isFloorLootCollected(currentMapId, lootSpot.id);

      // Don't render if already collected
      if (isCollected) return;

      const markerX = lootSpot.position.col * tileSize;
      const markerY = lootSpot.position.row * tileSize;
      const markerSize = tileSize * 0.6; // Smaller than node markers
      const centerX = markerX + tileSize / 2;
      const centerY = markerY + tileSize / 2;

      // Calculate gentle pulse effect
      const pulse = 0.7 + Math.sin(pulseAnimation * 1.5) * 0.3;

      // Draw subtle glow
      const glowSize = markerSize * 1.2;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${0.4 * pulse})`);
      gradient.addColorStop(0.7, `rgba(255, 215, 0, ${0.2 * pulse})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(centerX - glowSize, centerY - glowSize, glowSize * 2, glowSize * 2);

      // Draw coin icon
      ctx.fillStyle = `rgba(255, 215, 0, ${0.9 + pulse * 0.1})`;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💰', centerX, centerY);
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
  }, [
    tileset,
    characterImage,
    mapData,
    tileSize,
    visibleLayers,
    charPosition,
    visitedTriggers,
    pulseAnimation,
    mapProgressActions,
    floorLootProgressActions,
    currentMapId,
  ]);

  // Calculate scale factor for character positioning
  const canvasElement = canvasRef.current;
  const scale = canvasElement ? canvasElement.offsetWidth / (mapData.width * tileSize) : 1;

  // Calculate character screen position for tooltip
  const getCharacterScreenPosition = () => {
    if (!canvasElement) return { x: 0, y: 0 };
    const canvasRect = canvasElement.getBoundingClientRect();
    const charX = charPosition.col * tileSize * scale;
    const charY = charPosition.row * tileSize * scale;
    return {
      x: canvasRect.left + charX,
      y: canvasRect.top + charY,
    };
  };

  return (
    <>
      <div className="tilemap-container">
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              border: '1px solid #ccc',
              background: '#87CEEB',
              imageRendering: 'pixelated',
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }}
          />

          {/* Character rendered as HTML element for smooth CSS transitions */}
          {characterImage && canvasElement && (
            <div
              style={{
                position: 'absolute',
                // Center the character on the tile with scale factor
                left: `${(charPosition.col * tileSize - tileSize * 0.25) * scale}px`,
                top: `${(charPosition.row * tileSize - tileSize * 0.5) * scale}px`,
                // Make character 2x wider and 2.5x taller than a tile, scaled
                width: `${tileSize * 2 * scale}px`,
                height: `${tileSize * 2.5 * scale}px`,
                borderRadius: '5px',
                backgroundImage: `url('${characterPlaceholder}')`,
                backgroundSize: 'contain',
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

        <div className="character-info">
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

      {/* Node interaction tooltip */}
      {showNodeMenu && currentNode && canvasElement && (
        <NodeInteractionMenu
          node={currentNode}
          isCompleted={isNodeCompleted(currentNode.type, currentNode.id)}
          onFight={currentNode.type === 'Battle' || currentNode.type === 'Boss' ? handleNodeFight : undefined}
          onEnter={currentNode.type === 'Town' || currentNode.type === 'Dungeon' ? handleNodeEnter : undefined}
          onOpenChest={currentNode.type === 'Treasure' ? handleNodeOpenChest : undefined}
          onViewDialogue={currentNode.dialogueScene ? handleNodeViewDialogue : undefined}
          characterPosition={getCharacterScreenPosition()}
        />
      )}

      {/* Loot notification */}
      {currentLoot && <LootNotification loot={currentLoot} onClose={() => setCurrentLoot(null)} />}

      {/* Floor loot notification */}
      {collectedFloorLoot && (
        <FloorLootNotification
          resources={collectedFloorLoot}
          onClose={() => setCollectedFloorLoot(null)}
          characterPosition={getCharacterScreenPosition()}
        />
      )}

      {/* Active dialogue scenes */}
      {activeDialogue && MAP_00_DIALOGUE_SCENES[activeDialogue] && (
        <DialogueScene
          key={dialogueKey}
          scene={MAP_00_DIALOGUE_SCENES[activeDialogue]}
          onComplete={handleDialogueComplete}
        />
      )}
    </>
  );
};

export default Tilemap;
