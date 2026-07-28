import {
  COLLISION_EPSILON_PX,
  CORNER_ASSIST_MAX_OFFSET_TILES,
  CORNER_ASSIST_SPEED_RATIO,
  PATH_CENTERING_DEADZONE_TILES,
  PATH_CENTERING_SPEED_RATIO,
} from '~/constants/map-movement';

/** The character's collision point (its feet) in map-pixel space, plus the tile it occupies. */
export interface MovementPointState {
  /** Map-pixel X of the collision point. */
  x: number;
  /** Map-pixel Y of the collision point. */
  y: number;
  /** Tile row currently occupied — always `Math.floor(y / tileSize)`. */
  row: number;
  /** Tile column currently occupied — always `Math.floor(x / tileSize)`. */
  col: number;
}

export interface MovementInput {
  /** Normalised direction X in [-1, 1]. Diagonals must already be unit-length. */
  dirX: number;
  /** Normalised direction Y in [-1, 1]. */
  dirY: number;
  /** Map pixels per second at the current gait (walk or run). */
  speed: number;
  /** Map pixels per second at walk speed. Assists scale off this so they feel the same when running. */
  walkSpeed: number;
}

export interface MovementContext {
  /** Edge length of one tile in map pixels. */
  tileSize: number;
  /** Predicate: may the character occupy tile (row, col)? */
  isWalkable: (row: number, col: number) => boolean;
  /** Duration of this simulation substep in seconds. */
  stepSeconds: number;
}

export interface MovementStepResult extends MovementPointState {
  /** Euclidean map-pixel distance actually covered, including assist nudges. */
  movedDistance: number;
  /** True when the horizontal input was stopped by a wall this step. */
  blockedX: boolean;
  /** True when the vertical input was stopped by a wall this step. */
  blockedY: boolean;
}

interface AxisAdvanceResult {
  pos: number;
  tile: number;
  blocked: boolean;
}

/**
 * Advances one axis by `delta` map pixels, walking tile boundaries one at a
 * time so a large step can never skip past a blocking tile.
 *
 * On contact the position is clamped just inside the last walkable tile, which
 * is a stable fixed point: re-running the same input reproduces the identical
 * position instead of oscillating across the boundary.
 *
 * @param pos Current position along the axis, in map pixels.
 * @param tile Current tile index along the axis.
 * @param delta Signed displacement to apply, in map pixels.
 * @param tileSize Edge length of one tile in map pixels.
 * @param canEnter Predicate for entering a candidate tile index on this axis.
 */
function advanceAxis(
  pos: number,
  tile: number,
  delta: number,
  tileSize: number,
  canEnter: (tileIndex: number) => boolean,
): AxisAdvanceResult {
  if (delta === 0) return { pos, tile, blocked: false };

  const target = pos + delta;
  const direction = Math.sign(delta);
  let current = tile;

  while (Math.floor(target / tileSize) !== current) {
    const candidate = current + direction;
    if (!canEnter(candidate)) {
      return {
        pos:
          direction > 0 ? (current + 1) * tileSize - COLLISION_EPSILON_PX : current * tileSize + COLLISION_EPSILON_PX,
        tile: current,
        blocked: true,
      };
    }
    current = candidate;
  }

  return { pos: target, tile: current, blocked: false };
}

/**
 * Moves `current` toward `target` by at most `step`, never overshooting.
 */
function approach(current: number, target: number, step: number): number {
  const diff = target - current;
  if (Math.abs(diff) <= step) return target;
  return current + Math.sign(diff) * step;
}

/**
 * Picks the perpendicular tile offset (-1 or +1) the character should be nudged
 * toward to slip around a corner, or 0 when no assist applies.
 *
 * An assist only fires when the character is already close to that neighbour
 * (within `CORNER_ASSIST_MAX_OFFSET_TILES` of the shared edge), the neighbour
 * itself is walkable, and the tile diagonally past the wall is open — i.e. the
 * player is clearly aiming for a gap and is only slightly misaligned.
 *
 * @param perpendicularTile Tile index on the axis being nudged.
 * @param perpendicularOffset Position within that tile, as a fraction of a tile (0–1).
 * @param canReach Predicate: is the neighbouring tile on the nudge axis walkable?
 * @param isOpenPastWall Predicate: is the tile diagonally past the wall walkable?
 */
function pickCornerNudge(
  perpendicularTile: number,
  perpendicularOffset: number,
  canReach: (tileIndex: number) => boolean,
  isOpenPastWall: (tileIndex: number) => boolean,
): number {
  // Near the leading edge of the tile — try slipping toward the lower index.
  if (perpendicularOffset <= CORNER_ASSIST_MAX_OFFSET_TILES) {
    const candidate = perpendicularTile - 1;
    if (canReach(candidate) && isOpenPastWall(candidate)) return -1;
  }

  // Near the trailing edge — try slipping toward the higher index.
  if (perpendicularOffset >= 1 - CORNER_ASSIST_MAX_OFFSET_TILES) {
    const candidate = perpendicularTile + 1;
    if (canReach(candidate) && isOpenPastWall(candidate)) return 1;
  }

  return 0;
}

/**
 * Advances the character by a single fixed simulation substep.
 *
 * Resolution order per step:
 * 1. **X axis** against the current row, then **Y axis** against the
 *    X-updated column. Validating both intermediate tiles means a diagonal can
 *    slide along a wall but cannot cut through a pinhole corner.
 * 2. **Corner assist** — when an axis is blocked head-on and the perpendicular
 *    axis has no input, nudge sideways to slip around a nearly-aligned gap.
 * 3. **Path centering** — when moving along a single axis and no assist fired,
 *    ease toward the centre line of the current tile. This keeps the collision
 *    point off tile borders on narrow roads.
 *
 * Collisions are never latched: each step re-tests the wall, so a tile that
 * becomes walkable (a completed node unblocking) frees the character immediately.
 *
 * @param state Current position and occupied tile.
 * @param input Normalised direction and speeds for this step.
 * @param ctx Tile size, walkability predicate, and substep duration.
 * @returns The new position, occupied tile, distance covered, and per-axis blocked flags.
 */
export function resolveMovementStep(
  state: MovementPointState,
  input: MovementInput,
  ctx: MovementContext,
): MovementStepResult {
  const { tileSize, isWalkable, stepSeconds } = ctx;
  const { dirX, dirY, speed, walkSpeed } = input;

  const startX = state.x;
  const startY = state.y;

  let x = state.x;
  let y = state.y;
  let row = state.row;
  let col = state.col;
  let blockedX = false;
  let blockedY = false;

  // --- 1. axis-separated movement + collision ---

  if (dirX !== 0) {
    const advanced = advanceAxis(x, col, dirX * speed * stepSeconds, tileSize, (candidateCol) =>
      isWalkable(row, candidateCol),
    );
    x = advanced.pos;
    col = advanced.tile;
    blockedX = advanced.blocked;
  }

  if (dirY !== 0) {
    const advanced = advanceAxis(y, row, dirY * speed * stepSeconds, tileSize, (candidateRow) =>
      isWalkable(candidateRow, col),
    );
    y = advanced.pos;
    row = advanced.tile;
    blockedY = advanced.blocked;
  }

  // --- 2. corner assist ---

  const cornerStep = walkSpeed * CORNER_ASSIST_SPEED_RATIO * stepSeconds;
  let cornerAssisted = false;

  if (blockedX && dirY === 0) {
    const wallCol = col + Math.sign(dirX);
    const offset = y / tileSize - row;
    const nudge = pickCornerNudge(
      row,
      offset,
      (candidateRow) => isWalkable(candidateRow, col),
      (candidateRow) => isWalkable(candidateRow, wallCol),
    );
    if (nudge !== 0) {
      const advanced = advanceAxis(y, row, nudge * cornerStep, tileSize, (candidateRow) =>
        isWalkable(candidateRow, col),
      );
      y = advanced.pos;
      row = advanced.tile;
      cornerAssisted = true;
    }
  }

  if (blockedY && dirX === 0) {
    const wallRow = row + Math.sign(dirY);
    const offset = x / tileSize - col;
    const nudge = pickCornerNudge(
      col,
      offset,
      (candidateCol) => isWalkable(row, candidateCol),
      (candidateCol) => isWalkable(wallRow, candidateCol),
    );
    if (nudge !== 0) {
      const advanced = advanceAxis(x, col, nudge * cornerStep, tileSize, (candidateCol) =>
        isWalkable(row, candidateCol),
      );
      x = advanced.pos;
      col = advanced.tile;
      cornerAssisted = true;
    }
  }

  // --- 3. path centering (single-axis movement only) ---
  //
  // Skipped when the tile straight ahead is blocked: centring would drag the
  // character toward the middle of its tile exactly as it approaches a wall,
  // destroying the alignment corner assist needs to slip around the gap.

  if (!cornerAssisted) {
    const centeringStep = walkSpeed * PATH_CENTERING_SPEED_RATIO * stepSeconds;
    const deadzone = PATH_CENTERING_DEADZONE_TILES * tileSize;

    if (dirX !== 0 && dirY === 0 && isWalkable(row, col + Math.sign(dirX))) {
      const centerY = (row + 0.5) * tileSize;
      if (Math.abs(centerY - y) > deadzone) {
        y = approach(y, centerY, centeringStep);
      }
    } else if (dirY !== 0 && dirX === 0 && isWalkable(row + Math.sign(dirY), col)) {
      const centerX = (col + 0.5) * tileSize;
      if (Math.abs(centerX - x) > deadzone) {
        x = approach(x, centerX, centeringStep);
      }
    }
  }

  return {
    x,
    y,
    row,
    col,
    movedDistance: Math.hypot(x - startX, y - startY),
    blockedX,
    blockedY,
  };
}
