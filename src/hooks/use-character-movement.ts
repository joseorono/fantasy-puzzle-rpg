import { useRef, useState, useEffect, useCallback } from 'react';
import type { NavDirection } from '~/constants/keyboard';
import { useMultiKeyDirection } from '~/hooks/use-multi-key-direction';
import { useCharacterSprite } from '~/hooks/use-character-sprite';

// --- tunables ---

/** Tiles traversed per second at walk speed (feels natural, easy to tune). */
const MOVEMENT_TILES_PER_SECOND = 3.5;

/** Run speed multiplier over walk speed. */
const RUN_SPEED_MULTIPLIER = 1.6;

/** Maximum delta time (seconds) an rAF frame may account for to avoid spiral-of-death. */
const DT_MAX_SECONDS = 0.1;

/** Snap-to-center speed multiplier relative to walk speed (higher = faster snap). */
const SNAP_SPEED_MULTIPLIER = 3;

// --- public types ---

export interface UseCharacterMovementOptions {
  /** Starting tile row (grid Y). */
  initialRow: number;
  /** Starting tile column (grid X). */
  initialCol: number;
  /** Pixel size of a single map tile (before display scaling). */
  tileSize: number;
  /** CSS scale factor applied to the canvas. */
  displayScale: number;
  /** Predicate: can the character occupy tile (row, col)? */
  canMoveTo: (row: number, col: number) => boolean;
  /** Called when the character's logical tile changes (footsteps, loot checks, etc.). */
  onTileEnter?: (row: number, col: number) => void;
}

// --- helpers ---

/**
 * Moves `current` toward `target` by at most `step`, without overshooting.
 * Returns the snapped value.
 */
function snapAxis(current: number, target: number, step: number): number {
  const diff = target - current;
  if (Math.abs(diff) <= step) return target;
  return current + Math.sign(diff) * step;
}

// --- hook ---

/**
 * Combines multi-key direction tracking, sprite animation, and a
 * requestAnimationFrame loop to produce smooth continuous character movement.
 *
 * The rAF loop reads key state from a synchronous ref, advances pixel position
 * each frame, handles tile-boundary crossing / collision blocking / wall-sliding,
 * and snaps toward the tile centre when the player releases all direction keys.
 *
 * Exposes the internal `onKeyDown` so the map component's `useWindowKeyDown`
 * handler can forward directional key presses without duplicating key logic.
 */
export function useCharacterMovement(options: UseCharacterMovementOptions) {
  const {
    initialRow,
    initialCol,
    tileSize,
    displayScale,
    canMoveTo,
    onTileEnter,
  } = options;

  // --- internal subsystems ---
  const multiKey = useMultiKeyDirection();
  const { spriteState, reportStep } = useCharacterSprite();

  // --- pixel-space constants (guard against zero displayScale during canvas mount) ---
  const safeScale = displayScale > 0 ? displayScale : 1;
  const tilePixelSize = tileSize * safeScale;

  // --- refs (read every rAF frame — never stale) ---
  // Initialise once; after that the rAF loop is the sole source of truth.
  const pixelXRef = useRef((initialCol + 0.5) * tilePixelSize);
  const pixelYRef = useRef((initialRow + 0.5) * tilePixelSize);
  const tileRowRef = useRef(initialRow);
  const tileColRef = useRef(initialCol);

  // Re-anchor the pixel position when the tile-pixel size genuinely changes
  // (canvas mount or container resize).  The guard via `prevPixelSizeRef`
  // prevents the repeated snap-back that would happen if `displayScale`
  // fluctuated on every render.
  const prevPixelSizeRef = useRef(tilePixelSize);
  if (prevPixelSizeRef.current !== tilePixelSize) {
    pixelXRef.current = (tileColRef.current + 0.5) * tilePixelSize;
    pixelYRef.current = (tileRowRef.current + 0.5) * tilePixelSize;
    prevPixelSizeRef.current = tilePixelSize;
  }
  const canMoveToRef = useRef(canMoveTo);
  const onTileEnterRef = useRef(onTileEnter);
  const runningRef = useRef(false);
  const lastTimeRef = useRef(0);
  const rafHandleRef = useRef(0);
  const wasMovingRef = useRef(false);
  const lastSpriteResetRef = useRef(0);
  const blockedXRef = useRef<number>(0); // 0 = not blocked, sign = blocked direction
  const blockedYRef = useRef<number>(0);

  // Periodically reset the sprite idle-chain timer while moving so the
  // walk/run animation stays active.  Resetting at ~120 ms lets the underlying
  // 110 ms interval fire at least once between resets, avoiding animation
  // starvation from the idle-chain timeout (250 ms).
  const SPRITE_RESET_MS = 120;

  // Keep callbacks in sync so the rAF closure never sees a stale version.
  useEffect(() => {
    canMoveToRef.current = canMoveTo;
  }, [canMoveTo]);
  useEffect(() => {
    onTileEnterRef.current = onTileEnter;
  }, [onTileEnter]);

  // --- React state (drives re-renders) ---
  const [pixelX, setPixelX] = useState(pixelXRef.current);
  const [pixelY, setPixelY] = useState(pixelYRef.current);
  const [tileRow, setTileRow] = useState(initialRow);
  const [tileCol, setTileCol] = useState(initialCol);
  const [isMoving, setIsMoving] = useState(false);

  // --- running modifier ---

  /** Called by the map component from its keydown handler. */
  const setRunning = useCallback((running: boolean) => {
    runningRef.current = running;
  }, []);

  // Reset running when the player releases Shift (handled at window level
  // because Shift key events don't reach the map's useWindowKeyDown which only
  // delegates direction keys).
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') {
        runningRef.current = false;
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  // --- rAF movement loop ---

  useEffect(() => {
    // Re-derive speed each time tileSize or displayScale changes (uncommon).
    const pixelSize = Math.max(tileSize * displayScale, 1); // never zero

    function loop(timestamp: DOMHighResTimeStamp) {
      // --- delta time ---
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      if (dt <= 0 || dt > DT_MAX_SECONDS) dt = DT_MAX_SECONDS;

      // --- read current input state (synchronous via ref) ---
      const { dx, dy, facing } = multiKey.stateRef.current;
      const moving = dx !== 0 || dy !== 0;

      const walkSpeed = MOVEMENT_TILES_PER_SECOND * pixelSize;
      const speed = runningRef.current ? walkSpeed * RUN_SPEED_MULTIPLIER : walkSpeed;

      if (moving) {
        const oldCol = tileColRef.current;
        const oldRow = tileRowRef.current;

        // --- clear blocked-state when the player changes direction ---
        if (blockedXRef.current !== 0 && Math.sign(dx) !== blockedXRef.current) {
          blockedXRef.current = 0;
        }
        if (blockedYRef.current !== 0 && Math.sign(dy) !== blockedYRef.current) {
          blockedYRef.current = 0;
        }

        // Per-axis movement with soft wall-hugging.
        // When an axis is blocked we snap *just inside* the current tile and
        // remember the blocked direction so the next frame doesn't repeatedly
        // cross the boundary and snap back (the source of wall-vibration).
        let nextX = pixelXRef.current;
        let nextY = pixelYRef.current;

        // ---- X axis ----
        if (dx !== 0 && blockedXRef.current === 0) {
          nextX = pixelXRef.current + dx * speed * dt;
          const newCol = Math.floor(nextX / pixelSize);
          if (newCol !== oldCol) {
            const checkRow = Math.floor(pixelYRef.current / pixelSize);
            if (canMoveToRef.current(checkRow, newCol)) {
              tileColRef.current = newCol;
            } else {
              // Snap just inside the current tile so Math.floor stays oldCol
              nextX = dx > 0
                ? (oldCol + 1) * pixelSize - 0.5
                : oldCol * pixelSize + 0.5;
              blockedXRef.current = dx;
            }
          }
        } else if (dx === 0) {
          blockedXRef.current = 0;
        }

        // ---- Y axis (uses the possibly-updated X for the column check) ----
        if (dy !== 0 && blockedYRef.current === 0) {
          nextY = pixelYRef.current + dy * speed * dt;
          const newRow = Math.floor(nextY / pixelSize);
          if (newRow !== oldRow) {
            const checkCol = Math.floor(nextX / pixelSize);
            if (canMoveToRef.current(newRow, checkCol)) {
              tileRowRef.current = newRow;
            } else {
              nextY = dy > 0
                ? (oldRow + 1) * pixelSize - 0.5
                : oldRow * pixelSize + 0.5;
              blockedYRef.current = dy;
            }
          }
        } else if (dy === 0) {
          blockedYRef.current = 0;
        }

        // Commit
        pixelXRef.current = nextX;
        pixelYRef.current = nextY;

        // Fire onTileEnter if the logical tile changed
        if (tileColRef.current !== oldCol || tileRowRef.current !== oldRow) {
          onTileEnterRef.current?.(tileRowRef.current, tileColRef.current);
        }

        // --- sprite ---
        // Reset the idle chain periodically so the walk/run animation stays active.
        if (
          !wasMovingRef.current ||
          timestamp - lastSpriteResetRef.current >= SPRITE_RESET_MS
        ) {
          reportStep(facing, { moved: true, running: runningRef.current });
          lastSpriteResetRef.current = timestamp;
        }
        wasMovingRef.current = true;
      } else {
        // --- idle: snap toward tile centre ---
        if (wasMovingRef.current) {
          reportStep(facing, { moved: false, running: false });
          wasMovingRef.current = false;
        }

        const centerX = (tileColRef.current + 0.5) * pixelSize;
        const centerY = (tileRowRef.current + 0.5) * pixelSize;
        const snapStep = walkSpeed * SNAP_SPEED_MULTIPLIER * dt;

        pixelXRef.current = snapAxis(pixelXRef.current, centerX, snapStep);
        pixelYRef.current = snapAxis(pixelYRef.current, centerY, snapStep);
      }

      // --- update React state every frame ---
      setPixelX(pixelXRef.current);
      setPixelY(pixelYRef.current);
      setTileRow(tileRowRef.current);
      setTileCol(tileColRef.current);
      setIsMoving(moving);

      rafHandleRef.current = requestAnimationFrame(loop);
    }

    rafHandleRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafHandleRef.current);
    };
    // pixelSize is the only external value that feeds into the loop body
    // (via the speed calc). All other values are read from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileSize, displayScale]);

  // --- public API ---

  /**
   * Forward this from the map component's `useWindowKeyDown` handler so the
   * multi-key state stays in sync and the rAF loop can read dx/dy immediately.
   */
  const onKeyDown = useCallback(
    (key: string): NavDirection | null => multiKey.onDirectionKeyDown(key),
    [multiKey],
  );

  return {
    /** Continuous pixel X for rendering (feet anchor). */
    pixelX,
    /** Continuous pixel Y for rendering (feet anchor). */
    pixelY,
    /** Current tile row (game-logic grid Y). */
    tileRow,
    /** Current tile column (game-logic grid X). */
    tileCol,
    /** Current sprite animation state. */
    spriteState,
    /** Whether any direction key is held this frame. */
    isMoving,
    /** Call from `useWindowKeyDown` to forward a direction key press. */
    onKeyDown,
    /** Update the running (Shift-held) state for the rAF loop. */
    setRunning,
  };
}
