import { useRef, useState, useEffect } from 'react';
import type { NavDirection } from '~/constants/keyboard';
import { useMultiKeyDirection } from '~/hooks/use-multi-key-direction';
import { useCharacterSprite, type DrivenSpriteMode } from '~/hooks/use-character-sprite';
import { usePointerDirection, type ToMapPoint } from '~/hooks/use-pointer-direction';
import { resolveMovementStep, type MovementPointState } from '~/lib/map-movement';
import {
  isMovingIntent,
  keyboardToIntent,
  mergeMovementIntents,
  resolvePointerIntent,
  type MovementIntent,
} from '~/lib/pointer-movement';
import {
  MAX_FRAME_SECONDS,
  MOVEMENT_STEP_SECONDS,
  RUN_SPEED_MULTIPLIER,
  WALK_TILES_PER_SECOND,
} from '~/constants/map-movement';
import {
  RUN_FRAME_COUNT,
  RUN_TILES_PER_ANIM_FRAME,
  WALK_FRAME_COUNT,
  WALK_TILES_PER_ANIM_FRAME,
} from '~/constants/character-sprite';

export interface UseCharacterMovementOptions {
  /** Starting tile row (grid Y). */
  initialRow: number;
  /** Starting tile column (grid X). */
  initialCol: number;
  /** Pixel size of a single map tile, before display scaling. */
  tileSize: number;
  /**
   * Converts window coordinates to map pixels. Supplying it enables click-and-hold
   * movement; spread the returned `pointerHandlers` onto the map viewport. Called every
   * frame while a pointer is held, so it must reflect the current camera.
   */
  toMapPoint?: ToMapPoint;
  /** Predicate: can the character occupy tile (row, col)? */
  canMoveTo: (row: number, col: number) => boolean;
  /**
   * Half-width of the character's collision footprint in map pixels, so the sprite's
   * silhouette stops at a wall instead of its centre point. Map-pixel space, never
   * scaled by `displayScale`. Omit for the historical dimensionless-point behaviour.
   */
  collisionInsetPx?: number;
  /**
   * Freezes the character while something else owns the screen (a blocking modal, a
   * dialogue scene). Input is dropped rather than buffered, so nothing latches across
   * the pause.
   */
  isPaused?: boolean;
  /**
   * Holds the reading pose (turned to the camera, book open). Pair it with `isPaused`;
   * reading doesn't stop movement by itself.
   */
  isReading?: boolean;
  /** Called when the character's logical tile changes (footsteps, loot checks, etc.). */
  onTileEnter?: (row: number, col: number) => void;
  /**
   * Called once per animation frame with the character's position — the renderer's cue
   * to move the camera, the sprite and the canvas in the same tick. Also called while
   * paused, and immediately after a teleport.
   */
  onFrame?: (frame: MovementFrame) => void;
}

/** What the movement loop reports to the renderer each frame. */
export interface MovementFrame {
  /** Character position in map pixels. */
  x: number;
  y: number;
  /** Real time covered by this frame, in seconds. 0 for a discarded stall or a teleport. */
  dtSeconds: number;
  /** The frame's timestamp, comparable with `performance.now()`. */
  timestampMs: number;
  /** True while movement is frozen by a modal, dialogue or transition. */
  isPaused: boolean;
  /** True when the position jumped rather than moved, so the camera should snap. */
  teleported: boolean;
}

/** Used when no `toMapPoint` was supplied, so pointer input is simply inert. */
const NO_MAP_POINT: ToMapPoint = () => null;

/**
 * Drives continuous, frame-rate-independent character movement on a tile map.
 *
 * Two things make this feel smooth, and both are load-bearing:
 *
 * - **One coordinate space.** The whole simulation runs in *map pixels*, the
 *   same space the map is authored in. The camera and zoom are applied only by
 *   the renderer, so resizing the window can never move, re-anchor, or re-speed
 *   the character.
 * - **The loop does not re-render React.** Each frame's position goes to
 *   `onFrame`, which draws straight to the DOM and canvas. React state changes
 *   only on real events — entering a new tile, or the sprite frame changing.
 *
 * Time is consumed in fixed `MOVEMENT_STEP_SECONDS` substeps with carry-over,
 * so behaviour is identical at 30 or 144 fps and fast movement cannot tunnel
 * through walls. Collision, wall-sliding and the road assists live in
 * `resolveMovementStep`.
 *
 * Input comes from two producers that both emit a `MovementIntent`:
 * held keys (`useMultiKeyDirection`) and a held pointer (`usePointerDirection`,
 * enabled by passing `toMapPoint`). `mergeMovementIntents` picks the winner —
 * the keyboard whenever a direction key is down — so the rAF loop only ever
 * reads one direction and one gait. Every rule in that path is a pure function
 * in `~/lib/pointer-movement`.
 */
export function useCharacterMovement(options: UseCharacterMovementOptions) {
  const {
    initialRow,
    initialCol,
    tileSize,
    toMapPoint = NO_MAP_POINT,
    canMoveTo,
    collisionInsetPx = 0,
    onTileEnter,
    isPaused = false,
    isReading = false,
  } = options;

  const multiKey = useMultiKeyDirection();
  const pointer = usePointerDirection();
  const { spriteState, updateSprite, setReading } = useCharacterSprite();

  // Position lives in map pixels; the tile is always floor(position / tileSize).
  const pointRef = useRef<MovementPointState>({
    x: (initialCol + 0.5) * tileSize,
    y: (initialRow + 0.5) * tileSize,
    row: initialRow,
    col: initialCol,
  });

  const tileSizeRef = useRef(tileSize);
  const collisionInsetRef = useRef(collisionInsetPx);
  const canMoveToRef = useRef(canMoveTo);
  const onTileEnterRef = useRef(onTileEnter);
  // Read during render: both close over the current camera, which the loop must see
  // on the very next frame.
  const onFrameRef = useRef(options.onFrame);
  onFrameRef.current = options.onFrame;
  const toMapPointRef = useRef(toMapPoint);
  toMapPointRef.current = toMapPoint;
  // Read during render so the loop and `onKeyDown` see the pause on the very next frame,
  // not one commit later.
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const lastTimeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const rafHandleRef = useRef(0);
  const animationDistanceRef = useRef(0);
  const isMovingRef = useRef(false);
  // Carried between frames so facing survives idle frames and the pointer's
  // walk↔run hysteresis has a previous value to compare against.
  const facingRef = useRef<NavDirection>('down');
  const isRunningRef = useRef(false);

  const [tileRow, setTileRow] = useState(initialRow);
  const [tileCol, setTileCol] = useState(initialCol);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    canMoveToRef.current = canMoveTo;
  }, [canMoveTo]);
  useEffect(() => {
    onTileEnterRef.current = onTileEnter;
  }, [onTileEnter]);
  useEffect(() => {
    tileSizeRef.current = tileSize;
  }, [tileSize]);
  useEffect(() => {
    collisionInsetRef.current = collisionInsetPx;
  }, [collisionInsetPx]);

  // Whatever was held when the pause began must not survive it: a key still down (or a
  // pointer still captured) would send the character walking the instant the modal closes.
  useEffect(() => {
    if (!isPaused) return;
    multiKey.releaseAll();
    pointer.release();
    // Both helpers close over refs only, so their identity is not a meaningful dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  useEffect(() => {
    setReading(isReading);
    // `setReading` reads refs only, so its identity is not a meaningful dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReading]);

  /** Reports the current position to `onFrame`. */
  function emitFrame(dtSeconds: number, timestampMs: number, isPausedFrame: boolean, teleported: boolean): void {
    onFrameRef.current?.({
      x: pointRef.current.x,
      y: pointRef.current.y,
      dtSeconds,
      timestampMs,
      isPaused: isPausedFrame,
      teleported,
    });
  }

  /** Teleports the character to a tile centre — used for spawn placement. */
  function setPosition(row: number, col: number): void {
    const size = tileSizeRef.current;
    pointRef.current = { x: (col + 0.5) * size, y: (row + 0.5) * size, row, col };
    animationDistanceRef.current = 0;
    emitFrame(0, performance.now(), isPausedRef.current, true);
    setTileRow(row);
    setTileCol(col);
  }

  useEffect(() => {
    function loop(timestamp: DOMHighResTimeStamp) {
      rafHandleRef.current = requestAnimationFrame(loop);

      const previousTimestamp = lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const elapsed = previousTimestamp === 0 ? 0 : (timestamp - previousTimestamp) / 1000;
      // Discard non-positive deltas and long stalls outright rather than
      // replaying them — a hitch must never teleport the character.
      const acceptedSeconds = elapsed > 0 && elapsed <= MAX_FRAME_SECONDS ? elapsed : 0;
      accumulatorRef.current += acceptedSeconds;

      // Paused: hold position and stand. Facing is kept so resuming looks continuous, and
      // banked time is dropped so the character can't lurch forward when play resumes.
      if (isPausedRef.current) {
        accumulatorRef.current = 0;
        if (isMovingRef.current) {
          isMovingRef.current = false;
          setIsMoving(false);
        }
        updateSprite('stand', facingRef.current, 0);
        // The map keeps drawing under a modal: marker pulses and resizes still show.
        emitFrame(acceptedSeconds, timestamp, true, false);
        return;
      }

      const size = tileSizeRef.current;

      // --- resolve this frame's movement intent ---
      // Keyboard and pointer both produce the same shape; the merge decides who
      // drives. Both go through the same octant table, so a held key and a held
      // pointer emit identical direction vectors.
      const keyboardIntent = keyboardToIntent(multiKey.stateRef.current);
      // Converted every frame, not per event: the camera scrolls the map under a
      // stationary pointer, and the held spot must keep meaning the same screen spot.
      const pointerState = pointer.stateRef.current;
      const pointerPoint = pointerState.active
        ? toMapPointRef.current(pointerState.clientX, pointerState.clientY)
        : null;
      const pointerIntent: MovementIntent = pointerPoint
        ? resolvePointerIntent(pointerPoint, pointRef.current, size, {
            facing: facingRef.current,
            running: isRunningRef.current,
          })
        : { dirX: 0, dirY: 0, facing: facingRef.current, running: false };

      const intent = mergeMovementIntents(keyboardIntent, pointerIntent, facingRef.current);
      const hasInput = isMovingIntent(intent);
      const { facing, running } = intent;

      facingRef.current = facing;
      isRunningRef.current = hasInput && running;

      const walkSpeed = WALK_TILES_PER_SECOND * size;
      const speed = running ? walkSpeed * RUN_SPEED_MULTIPLIER : walkSpeed;

      const previousRow = pointRef.current.row;
      const previousCol = pointRef.current.col;

      let frameDistance = 0;
      let stepsSimulated = 0;

      if (!hasInput) {
        accumulatorRef.current = 0;
      } else {
        const input = { dirX: intent.dirX, dirY: intent.dirY, speed, walkSpeed };
        const context = {
          tileSize: size,
          stepSeconds: MOVEMENT_STEP_SECONDS,
          isWalkable: (row: number, col: number) => canMoveToRef.current(row, col),
          collisionInsetPx: collisionInsetRef.current,
        };

        while (accumulatorRef.current >= MOVEMENT_STEP_SECONDS) {
          accumulatorRef.current -= MOVEMENT_STEP_SECONDS;
          const result = resolveMovementStep(pointRef.current, input, context);
          pointRef.current = result;
          frameDistance += result.movedDistance;
          stepsSimulated++;
        }
      }

      emitFrame(acceptedSeconds, timestamp, false, false);

      if (pointRef.current.row !== previousRow || pointRef.current.col !== previousCol) {
        setTileRow(pointRef.current.row);
        setTileCol(pointRef.current.col);
        onTileEnterRef.current?.(pointRef.current.row, pointRef.current.col);
      }

      // --- sprite ---
      // On a frame too short to advance a substep, hold the previous verdict so
      // the animation can't flicker between walking and standing.
      const movingNow = hasInput && (stepsSimulated === 0 ? isMovingRef.current : frameDistance > 0);

      let mode: DrivenSpriteMode = 'stand';
      let frameIndex = 0;

      if (movingNow) {
        mode = running ? 'run' : 'walk';
        const frameCount = running ? RUN_FRAME_COUNT : WALK_FRAME_COUNT;
        const distancePerFrame = (running ? RUN_TILES_PER_ANIM_FRAME : WALK_TILES_PER_ANIM_FRAME) * size;
        const cycleDistance = distancePerFrame * frameCount;

        // Restart the cycle on step-off so every departure plants the same foot.
        if (!isMovingRef.current) animationDistanceRef.current = 0;
        animationDistanceRef.current = (animationDistanceRef.current + frameDistance) % cycleDistance;
        frameIndex = Math.floor(animationDistanceRef.current / distancePerFrame) % frameCount;
      }

      if (movingNow !== isMovingRef.current) {
        isMovingRef.current = movingNow;
        setIsMoving(movingNow);
      }

      updateSprite(mode, facing, frameIndex);
    }

    rafHandleRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafHandleRef.current);
    // Every value the loop needs is read through a ref, so it is started once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    /** Current tile row (game-logic grid Y). */
    tileRow,
    /** Current tile column (game-logic grid X). */
    tileCol,
    /** Current sprite animation state. */
    spriteState,
    /** Whether the character is actually moving (input held *and* not walled in). */
    isMoving,
    /** Current map-pixel position, for positioning overlays against the map. */
    getMapPosition: () => ({ x: pointRef.current.x, y: pointRef.current.y }),
    /** Teleport to a tile centre (spawn placement / position restore). */
    setPosition,
    /** Call from `useWindowKeyDown` to forward a direction key press. Ignored while paused. */
    onKeyDown: (key: string): NavDirection | null =>
      isPausedRef.current ? null : multiKey.onDirectionKeyDown(key),
    /** Spread onto the map viewport to enable click-and-hold (and touch-drag) movement. */
    pointerHandlers: pointer.pointerHandlers,
  };
}
