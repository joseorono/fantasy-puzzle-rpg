// components/Tilemap.tsx
import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData } from '../../types/tilemap';
import type { MapDefinition } from '~/types/map';
import type { Position } from '~/types/geometry';
import { DialogueTriggerModal } from './dialogue-trigger-modal';
import { MapDebugOverlay } from './map-debug-overlay';
import { MapInfoPanel } from './map-info-panel';
import { DialogueScene } from '~/components/dialogue';
import { NodeInteractionMenu } from './node-interaction-menu';
import { LootNotification } from './loot-notification';
import { FloorLootNotification } from './floor-loot-notification';
import { findNodeAt, findFloorLootAt, findDialogueTriggerAt, isNodeCompletedInProgress } from '~/lib/map-content';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useSaveGameActions } from '~/hooks/use-save-game';
import { useCharacterMovement } from '~/hooks/use-character-movement';
import { useElementSize } from '~/hooks/use-element-size';
import { useMapRenderer } from '~/hooks/use-map-renderer';
import { useViewTransitions } from '~/hooks/use-view-transitions';
import { buildWalkableMask, findFirstWalkableTile, isMaskWalkable } from '~/lib/tilemap-collision';
import { clientToMapPoint } from '~/lib/pointer-movement';
import { computeViewportLayout, mapToClientPoint, resolveMapZoom } from '~/lib/map-camera';
import { buildMarkerList } from '~/lib/map-draw';
import { getCharacterSpriteMetrics } from '~/lib/character-sprite';
import { CHARACTER_BODY_HEIGHT_TILES, CHARACTER_FOOT_OFFSET_TILES } from '~/constants/character-sprite';
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
  useMapProgressState,
  useFloorLootProgressState,
} from '~/stores/game-store';
import { getDungeonById } from '~/lib/dungeon-system';
import { canGoBack } from '~/lib/routing';
import { randomizeDungeon } from '~/lib/dungeon-randomizer';
import type { DungeonDefinition } from '~/types/dungeon';
import { addResources } from '~/lib/resources';
import { additionWithMax } from '~/lib/math';
import { randomBool } from '~/lib/utils';
import { MAX_AMOUNT_PER_ITEM } from '~/constants/inventory';
import { DEFAULT_TOWN_HUB_DATA } from '~/constants/routing';
import type { LootTable } from '~/types/loot';
import type { Resources } from '~/types/resources';
import { generateRandomResources, rollLootTableRarities } from '~/lib/loot';
import { CHEST_RARITY_BIAS } from '~/constants/rarity';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { InteractiveMapNode } from '~/types/map-node';
import type { MapProgressState } from '~/stores/slices/map-progress.types';
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
 *
 * Takes subscribed state rather than store getters: the map no longer re-renders every
 * frame, so a render-time read must change whenever the progress it depends on changes.
 */
function isMapNodeCompleted(
  node: InteractiveMapNode,
  completedDungeons: Record<string, boolean>,
  mapProgress: MapProgressState,
): boolean {
  if (node.type !== 'Dungeon') return isNodeCompletedInProgress(mapProgress, node.type, node.id);
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
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
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
  const [currentNode, setCurrentNode] = useState<InteractiveMapNode | null>(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [closingNode, setClosingNode] = useState<{ node: InteractiveMapNode; position: Position } | null>(null);
  const [currentLoot, setCurrentLoot] = useState<LootTable | null>(null);
  const [collectedFloorLoot, setCollectedFloorLoot] = useState<Resources | null>(null);
  // Where the character is on screen, kept current only while a popup points at it.
  const [popupAnchor, setPopupAnchor] = useState<Position | null>(null);
  // True while a cover transition plays before leaving the map: movement stays frozen underneath it.
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { enterBattle, enterTown } = useViewTransitions();

  // Get tile size from map data
  const tileSize = mapData.tilewidth || 16;

  const mapProgressState = useMapProgressState();
  const floorLootProgressState = useFloorLootProgressState();
  const mapProgressActions = useMapProgressActions();
  const inventoryActions = useInventoryActions();
  const resourcesActions = useResourcesActions();
  const floorLootProgressActions = useFloorLootProgressActions();
  const currentResources = useGameStore((state) => state.resources);
  const currentInventory = useGameStore((state) => state.inventory);

  const routerActions = useRouterActions();
  // Hide the back button rather than render a dead control: `goBack()` only warns when there is
  // no history (e.g. the map opened as the entry view, or right after loading a save).
  const canLeaveMap = useGameStore((state) => canGoBack(state.router));
  const { isDungeonCompleted } = useDungeonProgressActions();
  // Subscribed rather than read through the action: the action form is a get() call that
  // renders can cache, so completion changes wouldn't repaint the marker or the menu.
  const { completedDungeons } = useDungeonProgressState();
  const partyMembers = useParty();
  const setupBattle = useSetAtom(setupBattleAtom);
  const isPauseMenuOpen = useAtomValue(isPauseMenuOpenAtom);
  const { autosave } = useSaveGameActions();

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
        const isCompleted = isMapNodeCompleted(node, completedDungeons, mapProgressState);
        return isCompleted; // Can only walk through if completed
      }

      return true;
    },
    [walkableMask, mapProgressState, completedDungeons, map.nodes],
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

  // --- Camera ---
  // The map draws at an integer zoom (native size by default) through a viewport that
  // fills the stage, or shrinks to the map when the map is smaller. Render-only — the
  // simulation stays in map pixels.
  const zoom = resolveMapZoom(map.zoom);
  const stageSize = useElementSize(stageRef);
  const mapPixelSize = { width: mapData.width * tileSize, height: mapData.height * tileSize };
  const viewportLayout = stageSize ? computeViewportLayout(stageSize, mapPixelSize, zoom) : null;

  const markers = buildMarkerList(map, tileSize, {
    isNodeCompleted: (node) => isMapNodeCompleted(node, completedDungeons, mapProgressState),
    isFloorLootCollected: (lootId) => floorLootProgressState[map.id]?.[lootId] === true,
    isTriggerVisited: (row, col) => visitedTriggers.has(`${row},${col}`),
  });

  const isPopupOpen = showNodeMenu || collectedFloorLoot !== null;
  // Drop the anchor once nothing points at it, so the next popup can't open at a stale spot.
  if (!isPopupOpen && popupAnchor !== null) setPopupAnchor(null);

  const renderer = useMapRenderer({
    canvasRef,
    spriteRef,
    viewportRef,
    mapData,
    tileset,
    visibleLayers,
    tileSize,
    layout: viewportLayout,
    markers,
    watchAnchor: isPopupOpen,
    onAnchorChange: setPopupAnchor,
  });

  // --- Smooth character movement (rAF-based) ---
  // Sizes derive from the sprite's visible body, not its partly-empty 48px frame.
  // `displayScale` is passed as 1 here: only `collisionInsetPx` is read, and the
  // simulation must never see the display scale.
  const characterMetrics = getCharacterSpriteMetrics(
    tileSize,
    map.characterBodyHeightTiles ?? CHARACTER_BODY_HEIGHT_TILES,
    1,
    map.characterFootOffsetTiles ?? CHARACTER_FOOT_OFFSET_TILES,
  );

  const movement = useCharacterMovement({
    initialRow: charPosition.row,
    initialCol: charPosition.col,
    tileSize,
    toMapPoint: (clientX, clientY) => {
      const viewportElement = viewportRef.current;
      if (!viewportElement) return null;
      return clientToMapPoint(clientX, clientY, viewportElement.getBoundingClientRect(), zoom, renderer.getCamera());
    },
    onFrame: renderer.renderFrame,
    canMoveTo: (row, col) => isRoadTile(row, col),
    // Map pixels, deliberately independent of `zoom`: the simulation runs in map space.
    collisionInsetPx: characterMetrics.collisionInsetPx,
    // An event prompt is a decision, not scenery — walking away from one is how you miss it.
    // The node menu is deliberately excluded: stepping off a node is how you dismiss it.
    // The pause menu owns the keyboard while open — WASD must not walk the character under it.
    isPaused: showTriggerModal || activeDialogue !== null || isPauseMenuOpen || isTransitioning,
    onTileEnter: (row, col) => {
      setCharPosition({ row, col });
      setDebugInfo(`On road at (${row}, ${col})`);

      // Footstep sound
      const surfaceType = determineSurfaceTypeFromPosition(row, col, mapData);
      footstepSystem.setSurface(surfaceType);
      footstepSystem.playFootstep();

      // Close node menu with exit transition when moving
      if (showNodeMenu && currentNode) {
        setClosingNode({ node: currentNode, position: popupAnchor ?? getCharacterScreenPosition() });
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

    const isStartWalkable = isMaskWalkable(walkableMask, start.row, start.col);
    const spawn = isStartWalkable ? start : findFirstWalkableTile(walkableMask);

    if (import.meta.env.DEV && !isStartWalkable && spawn) {
      // Without this a misconfigured `defaultPlayerPosition` is invisible: the player is
      // silently relocated across the map. A stale *saved* tile is expected after a map edit.
      const source = savedPosition ? 'saved position' : 'configured defaultPlayerPosition';
      console.warn(
        `[${map.id}] ${source} (${start.row}, ${start.col}) is not walkable; spawning at (${spawn.row}, ${spawn.col}) instead.`,
      );
    }

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
      void startBattle(nodeId);
    }
  }

  /**
   * Start a battle for the given encounter: set up the atoms, play a cover transition with the
   * map frozen, then navigate under it.
   */
  async function startBattle(nodeId: string) {
    const encounter = map.encounters?.[nodeId];
    if (!encounter) {
      console.warn('No encounter found for node:', nodeId);
      return;
    }

    setupBattle({ enemies: encounter.enemies, party: partyMembers });
    setIsTransitioning(true);
    await enterBattle();
    routerActions.goToBattleDemo({ enemyId: nodeId, location: displayMapName });
  }

  /** Walk into a town: checkpoint, cover transition with the map frozen, then the hub. */
  async function walkIntoTown(node: InteractiveMapNode) {
    mapProgressActions.completeNode(node.type, node.id);
    // Reaching a town is a checkpoint — snapshot before the player starts spending.
    autosave();
    setIsTransitioning(true);
    await enterTown();
    routerActions.goToTownHub({
      ...DEFAULT_TOWN_HUB_DATA,
      townName: node.name,
      onLeaveCallback: () => routerActions.goBack(),
    });
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
    void startBattle(currentNode.id);
  }

  function handleNodeEnter() {
    if (!currentNode) return;
    console.log('Entering:', currentNode.name);

    const enteredNode = currentNode;

    // Close menu and clear current node
    setShowNodeMenu(false);
    setCurrentNode(null);

    if (enteredNode.type === 'Town') {
      void walkIntoTown(enteredNode);
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

  /** The character's window position, for popups that point at it. */
  const getCharacterScreenPosition = (): Position => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) return { x: 0, y: 0 };
    return mapToClientPoint(
      movement.getMapPosition(),
      renderer.getCamera(),
      zoom,
      viewportElement.getBoundingClientRect(),
    );
  };

  return (
    <>
      <div className="tilemap-container">
        <MapInfoPanel displayMapName={displayMapName} onLeave={canLeaveMap ? routerActions.goBack : undefined} />
        <div ref={stageRef} className="map-stage">
          {/* Stays mounted before the stage is measured, so the canvas is never re-created
              at its default size. */}
          <div
            ref={viewportRef}
            className="map-viewport"
            {...movement.pointerHandlers}
            style={{
              left: stageSize && viewportLayout ? Math.floor((stageSize.width - viewportLayout.cssWidth) / 2) : 0,
              top: stageSize && viewportLayout ? Math.floor((stageSize.height - viewportLayout.cssHeight) / 2) : 0,
              width: viewportLayout?.cssWidth ?? 0,
              height: viewportLayout?.cssHeight ?? 0,
              visibility: viewportLayout ? 'visible' : 'hidden',
            }}
          >
            <canvas ref={canvasRef} />

            {renderer.isReady && (
              <MapCharacterSprite
                positionRef={spriteRef}
                tileSize={tileSize}
                displayScale={zoom}
                characterBodyHeightTiles={map.characterBodyHeightTiles}
                characterFootOffsetTiles={map.characterFootOffsetTiles}
                spriteState={movement.spriteState}
              />
            )}
          </div>

          {debug && <MapDebugOverlay charPosition={charPosition} status={debugInfo} />}
        </div>
      </div>

      {/* Dialogue trigger confirmation modal */}
      <DialogueTriggerModal
        isOpen={showTriggerModal}
        onAccept={handleAcceptDialogue}
        onDecline={handleDeclineDialogue}
      />

      {/* Node interaction tooltip */}
      {showNodeMenu && currentNode && renderer.isReady ? (
        <NodeInteractionMenu
          key={currentNode.id}
          node={currentNode}
          isCompleted={isMapNodeCompleted(currentNode, completedDungeons, mapProgressState)}
          onFight={currentNode.type === 'Battle' || currentNode.type === 'Boss' ? handleNodeFight : undefined}
          onEnter={currentNode.type === 'Town' || currentNode.type === 'Dungeon' ? handleNodeEnter : undefined}
          onRandomize={currentNode.type === 'Dungeon' ? handleNodeRandomize : undefined}
          onOpenChest={currentNode.type === 'Treasure' ? handleNodeOpenChest : undefined}
          onViewDialogue={currentNode.dialogueScene ? handleNodeViewDialogue : undefined}
          characterPosition={popupAnchor ?? getCharacterScreenPosition()}
        />
      ) : closingNode && renderer.isReady ? (
        <NodeInteractionMenu
          key={`closing-${closingNode.node.id}`}
          node={closingNode.node}
          isCompleted={isMapNodeCompleted(closingNode.node, completedDungeons, mapProgressState)}
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
          characterPosition={popupAnchor ?? getCharacterScreenPosition()}
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
