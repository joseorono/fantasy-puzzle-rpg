import { useRef } from 'react';
import type { MapDefinition } from '~/types/map';
import type { FoeDefinition, FoeRuntime, TilePathfinder, WalkablePredicate } from '~/types/foe';
import type { MovementFrame } from '~/hooks/use-character-movement';
import type { MapPoint, ViewportLayout } from '~/lib/map-camera';
import { isMaskWalkable, type WalkableMask } from '~/lib/tilemap-collision';
import { createTilePathfinder } from '~/lib/foe-pathfinding';
import { createFoeRuntime, stepFoe, tileCenter } from '~/lib/foe-system';
import { getCachedImage, isImageReady } from '~/lib/image-cache';
import { DEBUG_MODE } from '~/constants/dev';
import {
  FOE_ALERT_STYLE,
  FOE_BOB_AMPLITUDE_PX,
  FOE_BOB_RADIANS_PER_SECOND,
  FOE_CULL_MARGIN_PX,
  FOE_DEBUG_STYLE,
  FOE_FOOT_OFFSET_TILES,
  FOE_MARKER_STYLE,
  FOE_PATH_NODE_BUDGET,
  FOE_PLAYER_RUN_TILES_PER_SECOND,
  FOE_POST_BATTLE_GRACE_SECONDS,
  FOE_SPRITE_SCALE,
} from '~/constants/foe';

export interface UseFoeSimulationOptions {
  map: MapDefinition;
  /** Edge length of one tile in map pixels. */
  tileSize: number;
  /** Sizes the pathfinder; in dev, waypoints are checked against it. */
  walkableMask: WalkableMask;
  /** Walkability as the player experiences it: the mask plus blocking nodes. */
  isWalkable: WalkablePredicate;
  /** `mapProgress.foesDefeated`, read once when the FOEs are created. */
  defeatedIds: Record<string, boolean>;
  /** Freezes the FOEs under an overlay the player can't act beneath. */
  isHeld: boolean;
  /** Draws detection rings, leashes and paths. Honoured only while `DEBUG_MODE` is on. */
  showDebug: boolean;
  /** Called once, on the frame a FOE catches the player. */
  onContact: (foe: FoeDefinition) => void;
}

export interface FoeSimulation {
  /** Advances every FOE. Call from the movement loop's `onFrame`, before rendering. */
  step: (frame: MovementFrame) => void;
  /** Pass as `useMapRenderer`'s `drawOverlay`. */
  drawFoes: (ctx: CanvasRenderingContext2D, camera: MapPoint, layout: ViewportLayout, timestampMs: number) => void;
  /** The surviving FOEs and where they are right now. */
  getFoes: () => readonly FoeRuntime[];
}

function drawFoeDebug(ctx: CanvasRenderingContext2D, foe: FoeRuntime, tileSize: number, labelY: number): void {
  const { tunables, definition } = foe;
  const home = tileCenter(definition.patrol[0], tileSize);

  ctx.lineWidth = 1;
  ctx.strokeStyle = `${FOE_MARKER_STYLE.color}0.8)`;
  ctx.beginPath();
  ctx.arc(foe.x, foe.y, tunables.detectionRadiusTiles * tileSize, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([...FOE_DEBUG_STYLE.leashDash]);
  ctx.beginPath();
  ctx.arc(home.x, home.y, tunables.leashRadiusTiles * tileSize, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (foe.path.length > 0) {
    ctx.beginPath();
    ctx.moveTo(foe.x, foe.y);
    for (const tile of foe.path) {
      const centre = tileCenter(tile, tileSize);
      ctx.lineTo(centre.x, centre.y);
    }
    ctx.stroke();
  }

  ctx.font = FOE_DEBUG_STYLE.labelFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = `${FOE_MARKER_STYLE.color}1)`;
  ctx.fillText(foe.mode, foe.x, labelY);
}

/**
 * Runs the roaming enemies (FOEs) of one map.
 *
 * All live state sits in refs: the simulation is stepped and drawn from the movement
 * loop's frame callback, and nothing here sets React state. The FOE list is built on
 * first use from the map's definitions minus the ones already defeated, each starting at
 * its home post with a grace period, so a player returning from a FOE fight can walk off.
 */
export function useFoeSimulation(options: UseFoeSimulationOptions): FoeSimulation {
  const { map, tileSize, walkableMask, isWalkable, defeatedIds, isHeld, showDebug, onContact } = options;

  const foesRef = useRef<FoeRuntime[] | null>(null);
  const pathfinderRef = useRef<TilePathfinder | null>(null);
  // After a contact the map is on its way out; nothing else may fire.
  const contactLatchedRef = useRef(false);
  // Read by the rAF loop, so mirrored during render: the next frame sees them.
  const isWalkableRef = useRef(isWalkable);
  isWalkableRef.current = isWalkable;
  const isHeldRef = useRef(isHeld);
  isHeldRef.current = isHeld;
  const onContactRef = useRef(onContact);
  onContactRef.current = onContact;
  const showDebugRef = useRef(showDebug && DEBUG_MODE);
  showDebugRef.current = showDebug && DEBUG_MODE;

  function getFoes(): FoeRuntime[] {
    if (foesRef.current === null) {
      const living = (map.foes ?? []).filter((foe) => !defeatedIds[foe.id]);
      if (import.meta.env.DEV) {
        for (const foe of living) {
          for (const tile of foe.patrol) {
            if (!isMaskWalkable(walkableMask, tile.row, tile.col)) {
              console.warn(`[${map.id}] FOE ${foe.id} waypoint (${tile.row}, ${tile.col}) is not walkable.`);
            }
          }
        }
      }
      foesRef.current = living.map((foe) => createFoeRuntime(foe, tileSize, FOE_POST_BATTLE_GRACE_SECONDS));
    }
    return foesRef.current;
  }

  function getPathfinder(): TilePathfinder {
    if (pathfinderRef.current === null) {
      pathfinderRef.current = createTilePathfinder(walkableMask.width, walkableMask.height);
    }
    return pathfinderRef.current;
  }

  function step(frame: MovementFrame): void {
    if (frame.isPaused || isHeldRef.current || contactLatchedRef.current) return;
    if (frame.dtSeconds <= 0) return;
    const foes = getFoes();
    if (foes.length === 0) return;

    const player = {
      x: frame.x,
      y: frame.y,
      row: Math.floor(frame.y / tileSize),
      col: Math.floor(frame.x / tileSize),
    };
    const world = {
      tileSize,
      playerRunSpeedPx: FOE_PLAYER_RUN_TILES_PER_SECOND * tileSize,
      isWalkable: isWalkableRef.current,
      pathfinder: getPathfinder(),
      pathNodeBudget: FOE_PATH_NODE_BUDGET,
    };

    for (let index = 0; index < foes.length; index++) {
      const result = stepFoe(foes[index], player, frame.dtSeconds, world);
      foes[index] = result.foe;
      if (result.contact) {
        contactLatchedRef.current = true;
        onContactRef.current(result.foe.definition);
        return;
      }
    }
  }

  function drawFoes(
    ctx: CanvasRenderingContext2D,
    camera: MapPoint,
    layout: ViewportLayout,
    timestampMs: number,
  ): void {
    const foes = getFoes();
    if (foes.length === 0) return;

    const { zoom } = layout;
    ctx.setTransform(zoom, 0, 0, zoom, -camera.x * zoom, -camera.y * zoom);
    ctx.imageSmoothingEnabled = false;

    const minX = camera.x - FOE_CULL_MARGIN_PX;
    const minY = camera.y - FOE_CULL_MARGIN_PX;
    const maxX = camera.x + layout.viewWidth + FOE_CULL_MARGIN_PX;
    const maxY = camera.y + layout.viewHeight + FOE_CULL_MARGIN_PX;
    const bob = Math.sin((timestampMs / 1000) * FOE_BOB_RADIANS_PER_SECOND) * FOE_BOB_AMPLITUDE_PX;

    for (const foe of foes) {
      if (foe.x < minX || foe.x > maxX || foe.y < minY || foe.y > maxY) continue;

      const image = getCachedImage(foe.definition.mapSprite);
      const feetY = foe.y + FOE_FOOT_OFFSET_TILES * tileSize;
      let top = feetY - tileSize;

      if (isImageReady(image)) {
        const width = image.naturalWidth * FOE_SPRITE_SCALE;
        const height = image.naturalHeight * FOE_SPRITE_SCALE;
        top = feetY - height + (foe.mode === 'patrol' ? bob : 0);
        const left = foe.x - width / 2;

        ctx.save();
        if (foe.facing === 'left') {
          ctx.translate(foe.x, 0);
          ctx.scale(-1, 1);
          ctx.translate(-foe.x, 0);
        }
        ctx.drawImage(image, Math.round(left), Math.round(top), width, height);
        ctx.restore();
      }

      if (foe.alertSeconds > 0) {
        const alertY = top - FOE_ALERT_STYLE.offsetPx;
        ctx.font = FOE_ALERT_STYLE.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = FOE_ALERT_STYLE.outlineWidth;
        ctx.strokeStyle = FOE_ALERT_STYLE.outline;
        ctx.strokeText('!', foe.x, alertY);
        ctx.fillStyle = FOE_ALERT_STYLE.fill;
        ctx.fillText('!', foe.x, alertY);
      }

      if (showDebugRef.current) drawFoeDebug(ctx, foe, tileSize, top - FOE_DEBUG_STYLE.labelOffsetPx);
    }
  }

  return { step, drawFoes, getFoes };
}
