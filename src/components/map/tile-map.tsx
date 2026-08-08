// components/Tilemap.tsx
import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData } from '../../types/tilemap';
import type { MapDefinition } from '~/types/map';
import type { Position } from '~/types/geometry';
import { DialogueTriggerModal } from './dialogue-trigger-modal';
import { MapInfoPanel } from './map-info-panel';
import { DialogueScene } from '~/components/dialogue';
import { NodeInteractionMenu } from './node-interaction-menu';
import { LootNotification } from './loot-notification';
import { FloorLootNotification } from './floor-loot-notification';
import { findNodeAt, findFloorLootAt, findDialogueTriggerAt } from '~/lib/map-content';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useSaveGame } from '~/hooks/use-save-game';
import { useCharacterMovement } from '~/hooks/use-character-movement';
import { useCanvasMetrics } from '~/hooks/use-canvas-metrics';
import { buildWalkableMask, findFirstWalkableTile, isMaskWalkable } from '~/lib/tilemap-collision';
import { clientToMapPoint } from '~/lib/pointer-movement';
import MapCharacterSprite from './map-character-sprite';
import { useAtomValue, useSetAtom } from 'jotai';
import { setupBattleAtom } from '~/stores/battle-atoms';
import { isPauseMenuOpenAtom } from '~/stores/pause-menu-atoms';
import {
  useMapProgressActions,
  useGameStore,
  useInventoryActions,
  useResourcesActions,
  useFloorLootProgressActions,
  useRouterActions,
  useParty,
  useDungeonProgressActions,
  useDungeonProgressState,
  useViewData,
} from '~/stores/game-store';
import { getDungeonById } from '~/lib/dungeon-system';
import { canGoBack } from '~/lib/routing';
import { randomizeDungeon } from '~/lib/dungeon-randomizer';
import type { DungeonDefinition } from '~/types/dungeon';
import { addResources } from '~/lib/resources';
import { additionWithMax } from '~/lib/math';
import { randomBool } from '~/lib/utils';
import { MAX_AMOUNT_PER_ITEM } from '~/constants/inventory';
import {
  MAP_NODE_MARKER_SIZE,
  MAP_NODE_ICON_RATIO,
  MAP_NODE_CHECK_RATIO,
  MAP_NODE_CHECK_INSET_RATIO,
} from '~/constants/map';
import { DEFAULT_TOWN_HUB_DATA } from '~/constants/routing';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { generateRandomResources, rollLootTableRarities } from '~/lib/loot';
import { CHEST_RARITY_BIAS } from '~/constants/rarity';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { InteractiveMapNode } from '~/types/map-node';
import type { MapNodeType } from '~/stores/slices/map-progress.types';
import { footstepSystem, determineSurfaceTypeFromPosition } from '~/services/footstep-system';

/** Resolve the dungeon a node points at — an inline definition wins, else the registry id. */
function resolveDungeon(node: InteractiveMapNode): DungeonDefinition | undefined {
  return node.dungeon ?? (node.dungeonId ? getDungeonById(node.dungeonId) : undefined);
}

/**
 * Whether a map node is cleared. Dungeon nodes are a pure view of dungeon progress: the run
 * itself records the clear in `dungeonProgress.completedDungeons`, so the node needs no second
 * write in `mapProgress`, and a remix clear correctly doesn't count because we always look up
 * the BASE dungeon. Every other node type reads map progress as before.
 */
function isMapNodeCompleted(
  node: InteractiveMapNode,
  completedDungeons: Record<string, boolean>,
  isNodeCompleted: (nodeType: MapNodeType, nodeId: string) => boolean,
): boolean {
  if (node.type !== 'Dungeon') return isNodeCompleted(node.type, node.id);
  const base = resolveDungeon(node);
  return base ? completedDungeons[base.id] === true : false;
}

type DialogueSceneKey = string;

interface CharacterPosition {
  row: number;
  col: number;
}

interface TilemapComponentProps {
  /** The map to render and run. All content is read from here — nothing map-specific is imported. */
  map: MapDefinition;
}

const Tilemap: React.FC<TilemapComponentProps> = ({ map }) => {
  const { tilesetImage, displayMapName, walkableLayers, visibleLayers, defaultPlayerPosition, debug } = map;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [tileset, setTileset] = useState<HTMLImageElement | null>(null);
  const [mapData] = useState<TilemapData>(map.tiledData);
  const [charPosition, setCharPosition] = useState<CharacterPosition>(() => {
    const saved = useGameStore.getState().mapProgress.characterPositions[map.id];
    return saved ?? { row: defaultPlayerPosition.y, col: defaultPlayerPosition.x };
  });
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [visitedTriggers, setVisitedTriggers] = useState<Set<string>>(new Set());
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [pendingDialogue, setPendingDialogue] = useState<DialogueSceneKey | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueSceneKey | null>(null);
  const [pendingFightNodeId, setPendingFightNodeId] = useState<string | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [canvasReady, setCanvasReady] = useState(false);
  const [currentNode, setCurrentNode] = useState<InteractiveMapNode | null>(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [closingNode, setClosingNode] = useState<{ node: InteractiveMapNode; position: Position } | null>(null);
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
  // Where this map was entered from, captured by `goToMap`. Preferred over `goBack()`
  // because a battle round-trip (map → battle → rewards → goBack) leaves the router's
  // previousView null, which would strand the player on the map.
  const returnView = useViewData('map')?.returnView;
  // Hide the back button rather than render a dead control: with no return view, `goBack()`
  // only warns when there's no previous view either (e.g. the map opened as the entry view).
  const canLeaveMap = useGameStore((state) => canGoBack(state.router));

  function handleLeaveMap() {
    if (returnView) {
      routerActions.goBackTo(returnView);
      return;
    }
    routerActions.goBack();
  }
  const { isDungeonCompleted } = useDungeonProgressActions();
  // Subscribed rather than read through the action: the action form is a get() call that
  // renders can cache, so completion changes wouldn't repaint the marker or the menu.
  const { completedDungeons } = useDungeonProgressState();
  const partyMembers = useParty();
  const setupBattle = useSetAtom(setupBattleAtom);
  const isPauseMenuOpen = useAtomValue(isPauseMenuOpenAtom);
  const { autosave } = useSaveGame();

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

  // Ground walkability, flattened once so the movement loop's per-substep
  // queries are a single array read instead of a scan over the layer list.
  const walkableMask = React.useMemo(() => buildWalkableMask(mapData, walkableLayers), [mapData, walkableLayers]);

  // Check if a position is walkable (walkable ground, and no blocking node)
  const isRoadTile = React.useCallback(
    (row: number, col: number): boolean => {
      if (!isMaskWalkable(walkableMask, row, col)) return false;

      // Check if there's an interactive node at this position
      const node = findNodeAt(map.nodes, row, col);
      if (node && node.blocksMovement) {
        // Node blocks movement - check if it's completed
        const isCompleted = isMapNodeCompleted(node, completedDungeons, isNodeCompleted);
        return isCompleted; // Can only walk through if completed
      }

      return true;
    },
    [walkableMask, isNodeCompleted, completedDungeons, map.nodes],
  );

  // Mirror the live position into the store as it changes, so a save taken while the
  // map is still mounted records where the player actually stands. One write per tile
  // step is cheap: both readers use `getState()`, so nothing re-renders on it.
  useEffect(() => {
    mapProgressActions.setCharacterPosition(map.id, charPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charPosition, map.id]);

  // Persist character position to store on unmount so it survives view transitions
  const charPositionRef = useRef(charPosition);
  charPositionRef.current = charPosition;
  useEffect(() => {
    // Persist character position to store on unmount
    // so it survives view transitions
    return () => {
      mapProgressActions.setCharacterPosition(map.id, charPositionRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if character reached a dialogue trigger
  const checkDialogueTrigger = React.useCallback(
    (row: number, col: number) => {
      const trigger = findDialogueTriggerAt(map.dialogueTriggers, row, col);

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
    [visitedTriggers, map.dialogueTriggers],
  );

  // Check if character is standing on an interactive node
  const checkInteractiveNode = React.useCallback(
    (row: number, col: number) => {
      const node = findNodeAt(map.nodes, row, col);
      if (node) {
        console.log('Standing on interactive node:', node);
        setCurrentNode(node);
        setShowNodeMenu(true);
      }
    },
    [map.nodes],
  );

  // Returning from a battle or dungeon restores the player onto the node they entered from, but
  // the menu only opens on movement — reopen it so the node is immediately interactive again.
  useEffect(() => {
    const saved = useGameStore.getState().mapProgress.characterPositions[map.id];
    if (saved) checkInteractiveNode(saved.row, saved.col);
  }, [checkInteractiveNode, map.id]);

  // Check and auto-collect floor loot
  const checkFloorLoot = React.useCallback(
    (row: number, col: number) => {
      const floorLoot = findFloorLootAt(map.floorLoot, row, col);

      if (floorLoot) {
        // Check if already collected
        const isCollected = floorLootProgressActions.isFloorLootCollected(map.id, floorLoot.id);

        if (!isCollected) {
          console.log('Floor loot found:', floorLoot);

          // Generate random resources based on max values
          const generatedResources = generateRandomResources(floorLoot.maxValues);

          // Add resources to player's global state immediately
          const newResources = addResources(currentResources, generatedResources);
          resourcesActions.setResources(newResources);

          // Mark as collected in persistent state
          floorLootProgressActions.collectFloorLoot(map.id, floorLoot.id);

          // Play sound feedback
          soundService.playSound(SoundNames.clickCoin, 0.6, 0.1, 0.05);

          // Show floating notification
          setCollectedFloorLoot(generatedResources);

          console.log('Collected floor loot:', generatedResources);
        }
      }
    },
    [map.id, map.floorLoot, currentResources, floorLootProgressActions, resourcesActions],
  );

  // The canvas is shrink-to-fit and centred inside its container, so it is both
  // scaled and letterboxed. Render-only — the simulation stays in map pixels.
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
    canMoveTo: (row, col) => isRoadTile(row, col),
    // An event prompt is a decision, not scenery — walking away from one is how you miss it.
    // The node menu is deliberately excluded: stepping off a node is how you dismiss it.
    // The pause menu owns the keyboard while open — WASD must not walk the character under it.
    isPaused: showTriggerModal || activeDialogue !== null || isPauseMenuOpen,
    onTileEnter: (row, col) => {
      setCharPosition({ row, col });
      setDebugInfo(`On road at (${row}, ${col})`);

      // Footstep sound
      const surfaceType = determineSurfaceTypeFromPosition(row, col, mapData);
      footstepSystem.setSurface(surfaceType);
      footstepSystem.playFootstep();

      // Close node menu with exit transition when moving
      if (showNodeMenu && currentNode) {
        setClosingNode({ node: currentNode, position: getCharacterScreenPosition() });
        setShowNodeMenu(false);
        setCurrentNode(null);
        setTimeout(() => setClosingNode(null), 180);
      }

      // Check for dialogue triggers
      checkDialogueTrigger(row, col);

      // Check for interactive nodes
      checkInteractiveNode(row, col);

      // Check for floor loot (auto-collect)
      checkFloorLoot(row, col);
    },
  });

  // Direction keys still flow through useWindowKeyDown, but movement is now
  // continuous — the handler only forwards the key. Key release, the run
  // modifier and focus loss are owned by useMultiKeyDirection.
  useWindowKeyDown((event) => {
    const dir = movement.onKeyDown(event.key);
    if (!dir) return;
    event.preventDefault();
  });

  // Place the character on spawn: prefer the saved position (returning from
  // combat), else the configured default, else the first walkable tile.
  const setCharacterPosition = movement.setPosition;
  useEffect(() => {
    const savedPosition = useGameStore.getState().mapProgress.characterPositions[map.id];
    const start = savedPosition ?? { row: defaultPlayerPosition.y, col: defaultPlayerPosition.x };

    const spawn = isMaskWalkable(walkableMask, start.row, start.col) ? start : findFirstWalkableTile(walkableMask);

    if (!spawn) {
      console.error('❌ No walkable tiles found in map!');
      setDebugInfo('ERROR: No walkable tiles found!');
      return;
    }

    setCharPosition(spawn);
    setCharacterPosition(spawn.row, spawn.col);
    setDebugInfo(`On road at (${spawn.row}, ${spawn.col})`);
    // Spawn placement runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const encounter = map.encounters?.[nodeId];
    if (!encounter) {
      console.warn('No encounter found for node:', nodeId);
      return;
    }

    setupBattle({ enemies: encounter.enemies, party: partyMembers });
    routerActions.goToBattleDemo({ enemyId: nodeId, location: displayMapName });
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
    if (currentNode.dialogueScene && map.dialogueScenes?.[currentNode.dialogueScene]) {
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

    const enteredNode = currentNode;

    // Close menu and clear current node
    setShowNodeMenu(false);
    setCurrentNode(null);

    if (enteredNode.type === 'Town') {
      mapProgressActions.completeNode(enteredNode.type, enteredNode.id);
      // Reaching a town is a checkpoint — snapshot before the player starts spending.
      autosave();
      routerActions.goToTownHub({
        ...DEFAULT_TOWN_HUB_DATA,
        townName: enteredNode.name,
        onLeaveCallback: () => routerActions.goBack(),
      });
      return;
    }

    if (enteredNode.type === 'Dungeon') {
      enterDungeon(enteredNode, { randomized: false });
    }
  }

  /** Enter the randomized "remix" of a Dungeon node — shuffled floors & enemies, bonus loot, no story. */
  function handleNodeRandomize() {
    if (!currentNode || currentNode.type !== 'Dungeon') return;
    console.log('Randomizing dungeon:', currentNode.name);

    const enteredNode = currentNode;

    setShowNodeMenu(false);
    setCurrentNode(null);

    enterDungeon(enteredNode, { randomized: true });
  }

  /**
   * Launch a Dungeon node's dungeon. A randomized run is always a fresh, non-replay run;
   * an authored run respects prior completion.
   */
  function enterDungeon(node: InteractiveMapNode, { randomized }: { randomized: boolean }) {
    const base = resolveDungeon(node);
    if (!base) {
      console.warn(`Dungeon node "${node.id}" has no resolvable dungeon (dungeon/dungeonId).`);
      return;
    }

    const dungeon = randomized ? randomizeDungeon(base) : base;
    const isReplay = randomized ? false : isDungeonCompleted(base.id);

    routerActions.goToDungeon({ dungeon, isReplay });
  }

  function handleNodeOpenChest() {
    if (!currentNode || currentNode.type !== 'Treasure' || !currentNode.lootPayload) return;
    console.log('Opening chest:', currentNode.name);

    // Play chest opening sound immediately for instant feedback
    soundService.playSound(SoundNames.rhodesmasChime, 0.7, 0.1, 0.05);

    // Roll a rarity for each equipment entry once, so the inventory grant and the
    // loot notification below show the same tiers.
    const loot = rollLootTableRarities(currentNode.lootPayload, CHEST_RARITY_BIAS);

    // Apply loot to player inventory and resources using math utilities
    // Add equipment items with additionWithMax to respect MAX_AMOUNT_PER_ITEM
    loot.equipableItems.forEach((lootItem) => {
      // Check probability to determine if item should be included
      if (!randomBool(lootItem.probability)) return;

      const item = lootItem.item;
      const existingItem = currentInventory.items.find(
        (invItem) => invItem.itemId === item.id && invItem.rarity === lootItem.rarity,
      );
      const currentQuantity = existingItem?.quantity ?? 0;
      const newQuantity = additionWithMax(currentQuantity, 1, MAX_AMOUNT_PER_ITEM);
      const quantityToAdd = newQuantity - currentQuantity;
      if (quantityToAdd > 0) {
        inventoryActions.addItem(item.id, quantityToAdd, lootItem.rarity);
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
    const scene = map.dialogueScenes?.[currentNode.dialogueScene];
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

    // Mark canvas as ready after first successful draw
    if (!canvasReady) {
      setCanvasReady(true);
    }

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
    (map.nodes ?? []).forEach((node) => {
      const isCompleted = isMapNodeCompleted(node, completedDungeons, isNodeCompleted);
      const markerSize = MAP_NODE_MARKER_SIZE;
      // Markers are bigger than a tile, so center them on the node's tile instead of
      // top-left aligning to it.
      const markerInset = (markerSize - tileSize) / 2;
      const markerX = node.position.col * tileSize - markerInset;
      const markerY = node.position.row * tileSize - markerInset;

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
          color = isCompleted ? 'rgba(128, 208, 198, ' : 'rgba(0, 176, 158, ';
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
      ctx.font = `bold ${markerSize * MAP_NODE_ICON_RATIO}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, markerX + markerSize / 2, markerY + markerSize / 2);

      // Draw border
      ctx.strokeStyle = color + (isCompleted ? '0.6)' : `${0.8 + pulse * 0.2})`);
      ctx.lineWidth = isCompleted ? 1 : 2;
      ctx.strokeRect(markerX, markerY, markerSize, markerSize);

      // Draw completion checkmark
      if (isCompleted) {
        const checkInset = markerSize * MAP_NODE_CHECK_INSET_RATIO;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = `bold ${markerSize * MAP_NODE_CHECK_RATIO}px monospace`;
        ctx.fillText('✓', markerX + markerSize - checkInset, markerY + checkInset);
      }
    });

    // Draw floor loot markers
    (map.floorLoot ?? []).forEach((lootSpot) => {
      const isCollected = floorLootProgressActions.isFloorLootCollected(map.id, lootSpot.id);

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
    (map.dialogueTriggers ?? []).forEach((trigger) => {
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
    mapData,
    tileSize,
    visibleLayers,
    visitedTriggers,
    pulseAnimation,
    isNodeCompleted,
    completedDungeons,
    floorLootProgressActions,
    map,
    canvasReady,
  ]);

  // Calculate character screen position for tooltip (uses continuous pixel position)
  const getCharacterScreenPosition = () => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return { x: 0, y: 0 };
    const canvasRect = canvasElement.getBoundingClientRect();
    const { x, y } = movement.getMapPosition();
    return {
      x: canvasRect.left + x * scale,
      y: canvasRect.top + y * scale,
    };
  };

  return (
    <>
      <div className="tilemap-container">
        <MapInfoPanel
          displayMapName={displayMapName}
          debug={debug}
          charPosition={charPosition}
          status={debugInfo}
          onLeave={returnView || canLeaveMap ? handleLeaveMap : undefined}
        />
        <div
          ref={canvasContainerRef}
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
            className="cursor-hold-glow"
            {...movement.pointerHandlers}
            style={{
              // `outline` rather than `border`: it takes no layout space, so the
              // measured scale and the sprite's origin stay exactly the canvas.
              outline: '1px solid #ccc',
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

          {/* Animated LPC character sprite — offset by the canvas's position
              inside this centring container, which letterboxes it. */}
          {canvasReady && (
            <MapCharacterSprite
              positionRef={movement.characterRef}
              tileSize={tileSize}
              displayScale={scale}
              spriteState={movement.spriteState}
            />
          )}
        </div>
      </div>

      {/* Dialogue trigger confirmation modal */}
      <DialogueTriggerModal
        isOpen={showTriggerModal}
        onAccept={handleAcceptDialogue}
        onDecline={handleDeclineDialogue}
      />

      {/* Node interaction tooltip */}
      {showNodeMenu && currentNode && canvasReady ? (
        <NodeInteractionMenu
          key={currentNode.id}
          node={currentNode}
          isCompleted={isMapNodeCompleted(currentNode, completedDungeons, isNodeCompleted)}
          onFight={currentNode.type === 'Battle' || currentNode.type === 'Boss' ? handleNodeFight : undefined}
          onEnter={currentNode.type === 'Town' || currentNode.type === 'Dungeon' ? handleNodeEnter : undefined}
          onRandomize={currentNode.type === 'Dungeon' ? handleNodeRandomize : undefined}
          onOpenChest={currentNode.type === 'Treasure' ? handleNodeOpenChest : undefined}
          onViewDialogue={currentNode.dialogueScene ? handleNodeViewDialogue : undefined}
          characterPosition={getCharacterScreenPosition()}
        />
      ) : closingNode && canvasReady ? (
        <NodeInteractionMenu
          key={`closing-${closingNode.node.id}`}
          node={closingNode.node}
          isCompleted={isMapNodeCompleted(closingNode.node, completedDungeons, isNodeCompleted)}
          characterPosition={closingNode.position}
          isClosing
        />
      ) : null}

      {/* Loot notification */}
      {currentLoot && <LootNotification loot={currentLoot} onClose={() => setCurrentLoot(null)} />}

      {/* Floor loot notification */}
      {collectedFloorLoot && (
        <FloorLootNotification
          resources={collectedFloorLoot}
          onClose={() => setCollectedFloorLoot(null)}
          characterPosition={getCharacterScreenPosition()}
          tileSize={tileSize}
          displayScale={scale}
        />
      )}

      {/* Active dialogue scenes */}
      {activeDialogue && map.dialogueScenes?.[activeDialogue] && (
        <DialogueScene
          key={dialogueKey}
          scene={map.dialogueScenes[activeDialogue]}
          onComplete={handleDialogueComplete}
        />
      )}
    </>
  );
};

export default Tilemap;
