import React, { useRef, useEffect, useState } from 'react';
import type { TilemapData } from '../../types/tilemap';
import type { MapDefinition } from '~/types/map';
import type { FoeDefinition } from '~/types/foe';
import type { GridPosition, Position } from '~/types/geometry';
import { DEBUG_MODE } from '~/constants/dev';
import { DialogueTriggerModal } from './dialogue-trigger-modal';
import { MapDebugOverlay } from './map-debug-overlay';
import { MapInfoPanel } from './map-info-panel';
import { DialogueScene } from '~/components/dialogue';
import { NodeInteractionMenu } from './node-interaction-menu';
import { LootNotification } from './loot-notification';
import { FloorLootNotification } from './floor-loot-notification';
import { MapMinimap } from './map-minimap';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import {
  findNodeAt,
  findFloorLootAt,
  findDialogueTriggerAt,
  getDialogueTriggerSeenKey,
  isNodeCompletedInProgress,
} from '~/lib/map-content';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useSaveGameActions } from '~/hooks/use-save-game';
import { useCharacterMovement } from '~/hooks/use-character-movement';
import { useElementSize } from '~/hooks/use-element-size';
import { useMapRenderer } from '~/hooks/use-map-renderer';
import { useFoeSimulation } from '~/hooks/use-foe-simulation';
import { useViewTransitions } from '~/hooks/use-view-transitions';
import { buildWalkableMask, findFirstWalkableTile, isMaskWalkable } from '~/lib/tilemap-collision';
import { canPlayerOccupy, floodOpenTiles, getUnbeatenGateTiles } from '~/lib/map-gates';
import { clientToMapPoint } from '~/lib/pointer-movement';
import { computeViewportLayout, mapToClientPoint, resolveMapZoom } from '~/lib/map-camera';
import { buildMarkerList, type MarkerStatus } from '~/lib/map-draw';
import { getCharacterSpriteMetrics } from '~/lib/character-sprite';
import {
  CHARACTER_BODY_HEIGHT_TILES,
  CHARACTER_FOOT_OFFSET_TILES,
  CHARACTER_SPRITE_SHEET_PATH,
} from '~/constants/character-sprite';
import type { SpriteState } from '~/hooks/use-character-sprite';
import MapCharacterSprite from './map-character-sprite';
import { useSetAtom } from 'jotai';
import { setupBattleAtom } from '~/stores/battle-atoms';
import { usePauseMenu } from '~/hooks/use-pause-menu';
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
import { footstepSystem } from '~/services/footstep-system';
import { DEFAULT_FOOTSTEP_PITCH, DEFAULT_FOOTSTEP_VOLUME } from '~/constants/footsteps';
import { createFootstepProfile } from '~/lib/footsteps';
import { isMinimapKey } from '~/constants/keyboard';
import { MAP_EXIT_NODE_TYPES } from '~/constants/map';
import { useMapLoadingScreen } from '~/hooks/use-map-loading-screen';
import { MapLoadingScreen } from './map-loading-screen';

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

interface TilemapComponentProps {
  /** The map to render and run. All content is read from here — nothing map-specific is imported. */
  map: MapDefinition;
  /** Hold the loading screen over the map until it has drawn. Read once, on mount. */
  showLoadingScreen: boolean;
  /** Called once the map is on screen: on mount, or when the loading screen starts fading. */
  onReveal: () => void;
}

const Tilemap: React.FC<TilemapComponentProps> = ({ map, showLoadingScreen, onReveal }) => {
  const { tilesetImage, displayMapName, walkableLayers, surfaceLayers, visibleLayers, defaultPlayerPosition, debug } =
    map;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const occlusionCanvasRef = useRef<HTMLCanvasElement>(null);
  const spriteStateRef = useRef<SpriteState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const [tileset, setTileset] = useState<HTMLImageElement | null>(null);
  // The sheet URL that failed to load, if any; compared against the current one so a map change clears it.
  const [failedTileset, setFailedTileset] = useState<string | null>(null);
  const [mapData] = useState<TilemapData>(map.tiledData);
  const [footstepProfile] = useState(() =>
    createFootstepProfile(map.footstepVolume ?? DEFAULT_FOOTSTEP_VOLUME, map.footstepPitch ?? DEFAULT_FOOTSTEP_PITCH),
  );
  const [charPosition, setCharPosition] = useState<GridPosition>(() => {
    const saved = useGameStore.getState().mapProgress.characterPositions[map.id];
    return saved ?? { row: defaultPlayerPosition.y, col: defaultPlayerPosition.x };
  });
  // Where this visit began. Ground reachable from here (or the map's spawn) stays open past gates,
  // so arriving from the far side of one never strands the player.
  const [visitStartTile] = useState(charPosition);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [pendingDialogue, setPendingDialogue] = useState<DialogueSceneKey | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueSceneKey | null>(null);
  const [pendingFightNode, setPendingFightNode] = useState<InteractiveMapNode | null>(null);
  const [dialogueKey, setDialogueKey] = useState(0);
  const [currentNode, setCurrentNode] = useState<InteractiveMapNode | null>(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [closingNode, setClosingNode] = useState<{ node: InteractiveMapNode; position: Position } | null>(null);
  const [currentLoot, setCurrentLoot] = useState<LootTable | null>(null);
  const [collectedFloorLoot, setCollectedFloorLoot] = useState<Resources | null>(null);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  // Where the character is on screen, kept current only while a popup points at it.
  const [popupAnchor, setPopupAnchor] = useState<Position | null>(null);
  // True while a cover transition plays before leaving the map: movement stays frozen underneath it.
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { enterBattle, enterTown, travelBetweenMaps } = useViewTransitions();

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
  const { isOpen: isPauseMenuOpen, open: openPauseMenu, openTab: openPauseMenuTab } = usePauseMenu();
  const { autosave } = useSaveGameActions();

  // Load tileset image
  useEffect(() => {
    const img = new Image();
    img.src = tilesetImage;
    img.onload = () => setTileset(img);
    img.onerror = () => {
      console.error('Failed to load tileset image:', tilesetImage);
      setFailedTileset(tilesetImage);
    };
  }, [tilesetImage]);

  // Ground walkability, flattened once so the movement loop's per-substep
  // queries are a single array read instead of a scan over the layer list.
  const walkableMask = React.useMemo(() => {
    const tileset = mapData.tilesets?.[0];
    const ignoredGids = new Set([...(tileset?.blankGids ?? []), ...(tileset?.overheadGids ?? [])]);
    return buildWalkableMask(mapData, walkableLayers, { surfaceLayers, ignoredGids });
  }, [mapData, walkableLayers, surfaceLayers]);

  // Gates: an unbeaten blocking node can be stepped onto, but the ground past it is sealed.
  const isUnbeatenGateAt = (row: number, col: number): boolean => {
    const node = findNodeAt(map.nodes, row, col);
    return node !== undefined && node.blocksMovement && !isMapNodeCompleted(node, completedDungeons, mapProgressState);
  };
  const gateTiles = getUnbeatenGateTiles(map.nodes, (node) =>
    isMapNodeCompleted(node, completedDungeons, mapProgressState),
  );
  const openTiles =
    gateTiles.length > 0
      ? floodOpenTiles(walkableMask, gateTiles, [
          { row: defaultPlayerPosition.y, col: defaultPlayerPosition.x },
          visitStartTile,
        ])
      : null;

  const isRoadTile = (row: number, col: number): boolean =>
    canPlayerOccupy(walkableMask, openTiles, isUnbeatenGateAt(row, col), row, col);

  // FOEs never cross an unbeaten gate, but roam freely on either side of it.
  const isFoeWalkable = (row: number, col: number): boolean =>
    isMaskWalkable(walkableMask, row, col) && !isUnbeatenGateAt(row, col);

  // Roaming enemies step inside the movement loop (see `onFrame`) and draw on the canvas.
  // The chest loot panel holds them: the player can't act under it, so nothing may creep up.
  const foes = useFoeSimulation({
    map,
    tileSize,
    walkableMask,
    isWalkable: isFoeWalkable,
    defeatedIds: mapProgressState.foesDefeated,
    isHeld: currentLoot !== null,
    showDebug: Boolean(debug) && DEBUG_MODE,
    onContact: (foe) => startFoeBattle(foe),
  });

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
      if (!trigger) return;

      // Read fresh: the tiles of one event sit side by side, and a stale render must not replay it.
      const seenKey = getDialogueTriggerSeenKey(map.id, trigger.scene);
      if (useGameStore.getState().mapProgress.dialogueTriggersSeen[seenKey]) return;

      if (trigger.autoPlay) {
        mapProgressActions.markDialogueTriggerSeen(seenKey);
        setDialogueKey((k) => k + 1);
        setActiveDialogue(trigger.scene);
        return;
      }

      setPendingDialogue(trigger.scene);
      setShowTriggerModal(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map.id, map.dialogueTriggers],
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

  // Shared by the camera's markers and the overview's pins.
  const markerStatus: MarkerStatus = {
    isNodeCompleted: (node) => isMapNodeCompleted(node, completedDungeons, mapProgressState),
    isFloorLootCollected: (lootId) => floorLootProgressState[map.id]?.[lootId] === true,
    isTriggerVisited: (row, col) => {
      const trigger = findDialogueTriggerAt(map.dialogueTriggers, row, col);
      if (!trigger) return false;
      return mapProgressState.dialogueTriggersSeen[getDialogueTriggerSeenKey(map.id, trigger.scene)] === true;
    },
  };
  const markers = buildMarkerList(map, tileSize, markerStatus, charPosition);

  const isPopupOpen = showNodeMenu || collectedFloorLoot !== null;
  // Drop the anchor once nothing points at it, so the next popup can't open at a stale spot.
  if (!isPopupOpen && popupAnchor !== null) setPopupAnchor(null);

  // Sizes derive from the sprite's visible body, not its partly-empty 48px frame.
  // `displayScale` is passed as 1 here: the simulation and the occlusion pass work in
  // map pixels and must never see the display scale.
  const characterMetrics = getCharacterSpriteMetrics(
    tileSize,
    map.characterBodyHeightTiles ?? CHARACTER_BODY_HEIGHT_TILES,
    1,
    map.characterFootOffsetTiles ?? CHARACTER_FOOT_OFFSET_TILES,
  );

  const renderer = useMapRenderer({
    canvasRef,
    occlusionCanvasRef,
    spriteRef,
    viewportRef,
    mapData,
    tileset,
    visibleLayers,
    occlusionLayers: map.occlusionLayers,
    overheadGids: mapData.tilesets?.[0]?.overheadGids,
    characterMetrics,
    characterSheetPath: CHARACTER_SPRITE_SHEET_PATH,
    spriteStateRef,
    tileSize,
    layout: viewportLayout,
    markers,
    watchAnchor: isPopupOpen,
    onAnchorChange: setPopupAnchor,
    drawOverlay: foes.drawFoes,
  });

  const [hasLoadingScreen] = useState(showLoadingScreen);
  const { isVisible: isLoadingScreenVisible } = useMapLoadingScreen({
    isEnabled: hasLoadingScreen,
    isReady: renderer.isReady,
  });
  const isMapRevealed = renderer.isReady && !isLoadingScreenVisible;

  useEffect(() => {
    if (!isLoadingScreenVisible) onReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingScreenVisible]);

  // --- Smooth character movement (rAF-based) ---
  const movement = useCharacterMovement({
    initialRow: charPosition.row,
    initialCol: charPosition.col,
    tileSize,
    toMapPoint: (clientX, clientY) => {
      const viewportElement = viewportRef.current;
      if (!viewportElement) return null;
      return clientToMapPoint(clientX, clientY, viewportElement.getBoundingClientRect(), zoom, renderer.getCamera());
    },
    // FOEs step before the frame draws, so the canvas shows this frame's positions.
    onFrame: (frame) => {
      foes.step(frame);
      renderer.renderFrame(frame);
    },
    canMoveTo: (row, col) => isRoadTile(row, col),
    // Map pixels, deliberately independent of `zoom`: the simulation runs in map space.
    collisionInsetPx: characterMetrics.collisionInsetPx,
    // An event prompt is a decision, not scenery — walking away from one is how you miss it.
    // The node menu is deliberately excluded: stepping off a node is how you dismiss it.
    // The pause menu owns the keyboard while open — WASD must not walk the character under it.
    // The overview is read in place: frozen, turned to the camera, book open.
    // The loading screen freezes everything under it, FOEs included.
    isPaused:
      isLoadingScreenVisible ||
      showTriggerModal ||
      activeDialogue !== null ||
      isPauseMenuOpen ||
      isTransitioning ||
      isMinimapOpen,
    isReading: isMinimapOpen,
    onFootstep: ({ running }) => {
      footstepSystem.playFootstep(running ? footstepProfile.run : footstepProfile.walk);
    },
    onTileEnter: (row, col) => {
      setCharPosition({ row, col });
      setDebugInfo(`On road at (${row}, ${col})`);

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
  // The renderer is created before the movement hook, so it reads the sprite frame through this.
  spriteStateRef.current = movement.spriteState;

  // Direction keys still flow through useWindowKeyDown, but movement is now
  // continuous — the handler only forwards the key. Key release, the run
  // modifier and focus loss are owned by useMultiKeyDirection.
  // The overview only opens when nothing else owns the screen.
  const canOpenMinimap =
    !isLoadingScreenVisible &&
    !isMinimapOpen &&
    !isPauseMenuOpen &&
    !showTriggerModal &&
    activeDialogue === null &&
    !isTransitioning;

  function openMinimap() {
    soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
    setIsMinimapOpen(true);
  }

  function closeMinimap() {
    soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
    setIsMinimapOpen(false);
  }

  useWindowKeyDown((event) => {
    // Claimed only when it opens the overview, so Tab still moves focus between the
    // buttons of a prompt or menu on top of the map. Closing is the overview's own job.
    if (isMinimapKey(event.key) && canOpenMinimap) {
      event.preventDefault();
      if (event.repeat) return;
      openMinimap();
      return;
    }

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

  // A battle still pending when the map mounts was never won (a save loaded mid-fight): forget
  // it so the FOE stays alive and the node stays open. Victories are resolved by the rewards screen.
  useEffect(() => {
    mapProgressActions.setPendingFoeBattle(null);
    mapProgressActions.setPendingNodeBattle(null);
    // Once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAcceptDialogue() {
    if (pendingDialogue) {
      mapProgressActions.markDialogueTriggerSeen(getDialogueTriggerSeenKey(map.id, pendingDialogue));
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
    if (pendingFightNode) {
      const node = pendingFightNode;
      setPendingFightNode(null);
      void startBattle(node.id, node);
    }
  }

  /**
   * Start a battle for the given encounter: set up the atoms, play a cover transition with the
   * map frozen, then navigate under it. A fought node is only marked pending here; the rewards
   * screen completes it on victory.
   */
  async function startBattle(nodeId: string, foughtNode?: InteractiveMapNode) {
    const encounter = map.encounters?.[nodeId];
    if (!encounter) {
      console.warn('No encounter found for node:', nodeId);
      return;
    }

    if (foughtNode) mapProgressActions.setPendingNodeBattle({ nodeType: foughtNode.type, nodeId: foughtNode.id });
    setupBattle({ enemies: encounter.enemies, party: partyMembers });
    setIsTransitioning(true);
    await enterBattle();
    routerActions.goToBattleDemo({ enemyId: nodeId, location: displayMapName });
  }

  /** A FOE caught the player: note which one so the rewards screen can retire it, then fight. */
  function startFoeBattle(foe: FoeDefinition) {
    setShowNodeMenu(false);
    setCurrentNode(null);
    mapProgressActions.setPendingFoeBattle(foe.id);
    void startBattle(foe.encounterId ?? foe.id);
  }

  /** Walk into a town: checkpoint, cover transition with the map frozen, then the hub. */
  async function walkIntoTown(node: InteractiveMapNode) {
    setIsTransitioning(true);
    await enterTown();
    mapProgressActions.completeNode(node.type, node.id);
    // Reaching a town is a checkpoint — snapshot before the player starts spending.
    autosave();
    routerActions.goToTownHub({
      ...DEFAULT_TOWN_HUB_DATA,
      townName: node.name,
      onLeaveCallback: () => routerActions.goBack(),
    });
  }

  /** Take a map exit: climb under the stairs cover, then land beside the far end's paired exit. */
  async function travelToMap(node: InteractiveMapNode) {
    const { destination } = node;
    if (!destination) {
      console.warn(`Exit node "${node.id}" has no destination.`);
      return;
    }

    setIsTransitioning(true);
    await travelBetweenMaps();
    mapProgressActions.completeNode(node.type, node.id);
    mapProgressActions.setCharacterPosition(destination.mapId, destination.arrival);
    routerActions.goToMap({ mapId: destination.mapId, showLoadingScreen: true }, { history: 'replace' });
  }

  function handleNodeTravel() {
    if (!currentNode) return;
    const exitNode = currentNode;
    setShowNodeMenu(false);
    setCurrentNode(null);
    void travelToMap(exitNode);
  }

  // Node interaction handlers
  function handleNodeFight() {
    if (!currentNode) return;
    console.log('Starting fight with:', currentNode.name);

    // Close menu
    setShowNodeMenu(false);
    setCurrentNode(null);

    // If the node has a pre-fight dialogue, play it first
    if (currentNode.dialogueScene && map.dialogueScenes?.[currentNode.dialogueScene]) {
      setPendingFightNode(currentNode);
      setDialogueKey((k) => k + 1);
      setActiveDialogue(currentNode.dialogueScene);
      return;
    }

    // No dialogue — go straight to battle
    void startBattle(currentNode.id, currentNode);
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

            {/* Above the sprite: bushes, canopies and arches she stands behind are redrawn here. */}
            <canvas ref={occlusionCanvasRef} className="map-occlusion-canvas" />
          </div>

          {!isMinimapOpen && (
            <KeyHintPill
              size="sm"
              variant="map"
              className="map-key-hint"
              items={[
                { keys: ['Tab'], label: 'map', onClick: canOpenMinimap ? openMinimap : undefined },
                { keys: ['Esc'], label: 'menu', onClick: openPauseMenu },
                { keys: ['H', '?'], label: 'tutorial', onClick: () => openPauseMenuTab('tutorial') },
              ]}
            />
          )}

          {failedTileset === tilesetImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-xs leading-relaxed text-red-300">
              Tileset failed to load: {tilesetImage}
            </div>
          )}

          {debug && DEBUG_MODE && <MapDebugOverlay charPosition={charPosition} status={debugInfo} />}
        </div>

        {hasLoadingScreen && <MapLoadingScreen isVisible={isLoadingScreenVisible} />}
      </div>

      {/* Dialogue trigger confirmation modal */}
      <DialogueTriggerModal
        isOpen={showTriggerModal}
        onAccept={handleAcceptDialogue}
        onDecline={handleDeclineDialogue}
      />

      {/* Node interaction tooltip */}
      {showNodeMenu && currentNode && isMapRevealed ? (
        <NodeInteractionMenu
          key={currentNode.id}
          node={currentNode}
          isCompleted={isMapNodeCompleted(currentNode, completedDungeons, mapProgressState)}
          onFight={currentNode.type === 'Battle' || currentNode.type === 'Boss' ? handleNodeFight : undefined}
          onEnter={currentNode.type === 'Town' || currentNode.type === 'Dungeon' ? handleNodeEnter : undefined}
          onRandomize={currentNode.type === 'Dungeon' ? handleNodeRandomize : undefined}
          onOpenChest={currentNode.type === 'Treasure' ? handleNodeOpenChest : undefined}
          onTravel={MAP_EXIT_NODE_TYPES.includes(currentNode.type) ? handleNodeTravel : undefined}
          onViewDialogue={currentNode.dialogueScene ? handleNodeViewDialogue : undefined}
          characterPosition={popupAnchor ?? getCharacterScreenPosition()}
        />
      ) : closingNode && isMapRevealed ? (
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

      {/* Map overview (Tab) */}
      {isMinimapOpen && (
        <MapMinimap
          map={map}
          walkableMask={walkableMask}
          tileSize={tileSize}
          characterPoint={movement.getMapPosition()}
          markerStatus={markerStatus}
          foePoints={foes.getFoes().map((foe) => ({ id: foe.definition.id, x: foe.x, y: foe.y }))}
          onClose={closeMinimap}
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
