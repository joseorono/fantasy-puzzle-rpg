import { useRef, useState, useEffect, useLayoutEffect } from 'react';
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
  /** CSS scale factor the canvas is displayed at. Render-only — never affects the simulation. */
  displayScale: number;
  /** Canvas's left edge relative to the sprite's positioning container, in CSS pixels. */
  offsetX?: number;
  /** Canvas's top edge relative to the sprite's positioning container, in CSS pixels. */
  offsetY?: number;
  /**
   * Converts viewport coordinates to map pixels. Supplying it enables
   * click-and-hold movement; spread the returned `pointerHandlers` onto the canvas.
   */
  toMapPoint?: ToMapPoint;
  /** Predicate: can the character occupy tile (row, col)? */
  canMoveTo: (row: number, col: number) => boolean;
  /**
   * Freezes the character while something else owns the screen (a blocking modal, a
   * dialogue scene). Input is dropped rather than buffered, so nothing latches across
   * the pause.
   */
  isPaused?: boolean;
  /** Called when the character's logical tile changes (footsteps, loot checks, etc.). */
  onTileEnter?: (row: number, col: number) => void;
}

/** Used when no `toMapPoint` was supplied, so pointer input is simply inert. */
const NO_MAP_POINT: ToMapPoint = () => null;

/**
 * Drives continuous, frame-rate-independent character movement on a tile map.
 *
 * Two things make this feel smooth, and both are load-bearing:
 *
 * - **One coordinate space.** The whole simulation runs in *map pixels*, the
 *   same space the canvas draws tiles in. `displayScale` is applied only when
 *   the sprite's transform is written, so resizing the window can never move,
 *   re-anchor, or re-speed the character.
 * - **The loop does not re-render React.** Position is written straight to the
 *   sprite element's `transform`. React state changes only on real events —
 *   entering a new tile, or the sprite frame actually changing.
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
    displayScale,
    offsetX = 0,
    offsetY = 0,
    toMapPoint = NO_MAP_POINT,
    canMoveTo,
    onTileEnter,
    isPaused = false,
  } = options;

  const multiKey = useMultiKeyDirection();
  const pointer = usePointerDirection(toMapPoint);
  const { spriteState, updateSprite } = useCharacterSprite();

  const characterRef = useRef<HTMLDivElement | null>(null);

  // Position lives in map pixels; the tile is always floor(position / tileSize).
  const pointRef = useRef<MovementPointState>({
    x: (initialCol + 0.5) * tileSize,
    y: (initialRow + 0.5) * tileSize,
    row: initialRow,
    col: initialCol,
  });

  const tileSizeRef = useRef(tileSize);
  const displayScaleRef = useRef(displayScale);
  const offsetRef = useRef({ x: offsetX, y: offsetY });
  const canMoveToRef = useRef(canMoveTo);
  const onTileEnterRef = useRef(onTileEnter);
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

  // Whatever was held when the pause began must not survive it: a key still down (or a
  // pointer still captured) would send the character walking the instant the modal closes.
  useEffect(() => {
    if (!isPaused) return;
    multiKey.releaseAll();
    pointer.release();
    // Both helpers close over refs only, so their identity is not a meaningful dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  /**
   * Writes the character's map-pixel position to the DOM: scaled to screen
   * pixels, shifted by the canvas's offset within the positioning container
   * (the canvas is centred and letterboxed), and rounded to whole pixels so the
   * pixel-art sprite never lands on a fractional device pixel and shimmers.
   */
  function writeTransform() {
    const element = characterRef.current;
    if (!element) return;

    const scale = displayScaleRef.current;
    const { x: originX, y: originY } = offsetRef.current;
    const transform = `translate3d(${Math.round(originX + pointRef.current.x * scale)}px, ${Math.round(
      originY + pointRef.current.y * scale,
    )}px, 0)`;

    // Compared against the element's own inline style rather than a cached
    // string, so a remounted sprite is always positioned.
    if (element.style.transform === transform) return;
    element.style.transform = transform;
  }

  // Position before first paint, and again whenever the canvas is relaid out.
  useLayoutEffect(() => {
    displayScaleRef.current = displayScale;
    offsetRef.current = { x: offsetX, y: offsetY };
    writeTransform();
  }, [displayScale, offsetX, offsetY]);

  /** Teleports the character to a tile centre — used for spawn placement. */
  function setPosition(row: number, col: number): void {
    const size = tileSizeRef.current;
    pointRef.current = { x: (col + 0.5) * size, y: (row + 0.5) * size, row, col };
    animationDistanceRef.current = 0;
    writeTransform();
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
      if (elapsed > 0 && elapsed <= MAX_FRAME_SECONDS) {
        accumulatorRef.current += elapsed;
      }

      // Paused: hold position and stand. Facing is kept so resuming looks continuous, and
      // banked time is dropped so the character can't lurch forward when play resumes.
      if (isPausedRef.current) {
        accumulatorRef.current = 0;
        if (isMovingRef.current) {
          isMovingRef.current = false;
          setIsMoving(false);
        }
        updateSprite('stand', facingRef.current, 0);
        return;
      }

      const size = tileSizeRef.current;

      // --- resolve this frame's movement intent ---
      // Keyboard and pointer both produce the same shape; the merge decides who
      // drives. Both go through the same octant table, so a held key and a held
      // pointer emit identical direction vectors.
      const keyboardIntent = keyboardToIntent(multiKey.stateRef.current);
      const pointerState = pointer.stateRef.current;
      const pointerIntent: MovementIntent = pointerState.active
        ? resolvePointerIntent(pointerState, pointRef.current, size, {
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
        };

        while (accumulatorRef.current >= MOVEMENT_STEP_SECONDS) {
          accumulatorRef.current -= MOVEMENT_STEP_SECONDS;
          const result = resolveMovementStep(pointRef.current, input, context);
          pointRef.current = result;
          frameDistance += result.movedDistance;
          stepsSimulated++;
        }
      }

      writeTransform();

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
    /** Attach to the sprite wrapper — the loop writes its transform directly. */
    characterRef,
    /** Current tile row (game-logic grid Y). */
    tileRow,
    /** Current tile column (game-logic grid X). */
    tileCol,
    /** Current sprite animation state. */
    spriteState,
    /** Whether the character is actually moving (input held *and* not walled in). */
    isMoving,
    /** Current map-pixel position, for positioning overlays against the canvas. */
    getMapPosition: () => ({ x: pointRef.current.x, y: pointRef.current.y }),
    /** Teleport to a tile centre (spawn placement / position restore). */
    setPosition,
    /** Call from `useWindowKeyDown` to forward a direction key press. Ignored while paused. */
    onKeyDown: (key: string): NavDirection | null =>
      isPausedRef.current ? null : multiKey.onDirectionKeyDown(key),
    /** Spread onto the canvas to enable click-and-hold (and touch-drag) movement. */
    pointerHandlers: pointer.pointerHandlers,
  };
}
