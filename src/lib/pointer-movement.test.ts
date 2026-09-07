import { describe, expect, it } from 'vitest';
import {
  clientToMapPoint,
  directionToFacing,
  isMovingIntent,
  keyboardToIntent,
  mergeMovementIntents,
  resolvePointerIntent,
  shouldRunAtDistance,
  snapToOctant,
} from './pointer-movement';
import type { MovementIntent } from './pointer-movement';
import { resolveMovementStep } from './map-movement';
import {
  MOVEMENT_STEP_SECONDS,
  PATH_CENTERING_DEADZONE_TILES,
  POINTER_DEAD_ZONE_TILES,
  POINTER_RUN_DISTANCE_TILES,
  POINTER_RUN_HYSTERESIS_TILES,
} from '~/constants/map-movement';
import type { NavDirection } from '~/constants/keyboard';

const TILE = 16;

/** Builds a point `distanceTiles` away from the origin, pointing east. */
function eastOf(origin: { x: number; y: number }, distanceTiles: number) {
  return { x: origin.x + distanceTiles * TILE, y: origin.y };
}

// ---------------------------------------------------------------------------
// clientToMapPoint
// ---------------------------------------------------------------------------

describe('clientToMapPoint', () => {
  it('subtracts the canvas origin and divides by the scale', () => {
    expect(clientToMapPoint(140, 90, { left: 100, top: 50 }, 2)).toEqual({ x: 20, y: 20 });
  });

  it('is the exact inverse of the forward map→client transform', () => {
    const origin = { left: 37.5, top: 12.25 };
    const scale = 0.6875;
    const mapPoint = { x: 704, y: 928 };

    // Forward transform, as used to position the sprite and the node tooltip.
    const clientX = origin.left + mapPoint.x * scale;
    const clientY = origin.top + mapPoint.y * scale;

    const roundTripped = clientToMapPoint(clientX, clientY, origin, scale);
    expect(roundTripped?.x).toBeCloseTo(mapPoint.x, 9);
    expect(roundTripped?.y).toBeCloseTo(mapPoint.y, 9);
  });

  it('returns null before the canvas has a usable scale', () => {
    expect(clientToMapPoint(10, 10, { left: 0, top: 0 }, 0)).toBeNull();
    expect(clientToMapPoint(10, 10, { left: 0, top: 0 }, -1)).toBeNull();
    expect(clientToMapPoint(10, 10, { left: 0, top: 0 }, Number.NaN)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// snapToOctant
// ---------------------------------------------------------------------------

describe('snapToOctant', () => {
  it('maps each cardinal and diagonal onto itself', () => {
    expect(snapToOctant(10, 0)).toEqual({ dirX: 1, dirY: 0 });
    expect(snapToOctant(-10, 0)).toEqual({ dirX: -1, dirY: 0 });
    expect(snapToOctant(0, 10)).toEqual({ dirX: 0, dirY: 1 });
    expect(snapToOctant(0, -10)).toEqual({ dirX: 0, dirY: -1 });
    expect(snapToOctant(7, 7)).toEqual({ dirX: Math.SQRT1_2, dirY: Math.SQRT1_2 });
    expect(snapToOctant(-7, -7)).toEqual({ dirX: -Math.SQRT1_2, dirY: -Math.SQRT1_2 });
  });

  it('always returns a unit vector', () => {
    for (let degrees = 0; degrees < 360; degrees += 7) {
      const radians = (degrees * Math.PI) / 180;
      const { dirX, dirY } = snapToOctant(Math.cos(radians) * 40, Math.sin(radians) * 40);
      expect(Math.hypot(dirX, dirY)).toBeCloseTo(1, 12);
    }
  });

  it('snaps at the 22.5° octant boundary', () => {
    const at = (degrees: number) => {
      const radians = (degrees * Math.PI) / 180;
      return snapToOctant(Math.cos(radians) * 100, Math.sin(radians) * 100);
    };

    expect(at(22.4)).toEqual({ dirX: 1, dirY: 0 });
    expect(at(22.6)).toEqual({ dirX: Math.SQRT1_2, dirY: Math.SQRT1_2 });
  });

  it('produces vectors identical to the keyboard path (the shared-behaviour contract)', () => {
    // A snapped diagonal and a normalised two-key diagonal must be the exact
    // same numbers, otherwise mouse and keyboard would drift apart.
    const keyboard = keyboardToIntent({ dx: 1, dy: 1, facing: 'right', running: false });
    const pointer = snapToOctant(5, 5);

    expect(pointer.dirX).toBe(keyboard.dirX);
    expect(pointer.dirY).toBe(keyboard.dirY);
  });

  it('returns the zero vector for a zero input', () => {
    expect(snapToOctant(0, 0)).toEqual({ dirX: 0, dirY: 0 });
  });
});

// ---------------------------------------------------------------------------
// directionToFacing
// ---------------------------------------------------------------------------

describe('directionToFacing', () => {
  it('picks the dominant axis', () => {
    expect(directionToFacing(1, 0, 'down')).toBe('right');
    expect(directionToFacing(-1, 0, 'down')).toBe('left');
    expect(directionToFacing(0, 1, 'right')).toBe('down');
    expect(directionToFacing(0, -1, 'right')).toBe('up');
    expect(directionToFacing(0.9, 0.1, 'down')).toBe('right');
    expect(directionToFacing(0.1, 0.9, 'right')).toBe('down');
  });

  it('keeps the previous facing when a zero vector gives no information', () => {
    expect(directionToFacing(0, 0, 'up')).toBe('up');
  });

  it('holds the previous facing through an exact diagonal it still describes', () => {
    const diagonal = Math.SQRT1_2;
    // east → south-east should not spin the sprite.
    expect(directionToFacing(diagonal, diagonal, 'right')).toBe('right');
    // south → south-east likewise.
    expect(directionToFacing(diagonal, diagonal, 'down')).toBe('down');
  });

  it('falls back to the horizontal component on an unrelated diagonal', () => {
    const diagonal = Math.SQRT1_2;
    expect(directionToFacing(diagonal, diagonal, 'up')).toBe('right');
    expect(directionToFacing(-diagonal, -diagonal, 'down')).toBe('left');
  });
});

// ---------------------------------------------------------------------------
// shouldRunAtDistance
// ---------------------------------------------------------------------------

describe('shouldRunAtDistance', () => {
  it('walks below the threshold and runs at or beyond it', () => {
    expect(shouldRunAtDistance(POINTER_RUN_DISTANCE_TILES - 0.01, false)).toBe(false);
    expect(shouldRunAtDistance(POINTER_RUN_DISTANCE_TILES, false)).toBe(true);
  });

  it('keeps running inside the hysteresis band', () => {
    const insideBand = POINTER_RUN_DISTANCE_TILES - POINTER_RUN_HYSTERESIS_TILES / 2;

    expect(shouldRunAtDistance(insideBand, true)).toBe(true); // already running → keep going
    expect(shouldRunAtDistance(insideBand, false)).toBe(false); // walking → don't start
  });

  it('drops back to a walk once past the lowered threshold', () => {
    const belowBand = POINTER_RUN_DISTANCE_TILES - POINTER_RUN_HYSTERESIS_TILES - 0.01;
    expect(shouldRunAtDistance(belowBand, true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// resolvePointerIntent
// ---------------------------------------------------------------------------

describe('resolvePointerIntent', () => {
  const character = { x: 10 * TILE, y: 10 * TILE };
  const walking = { facing: 'down' as NavDirection, running: false };

  it('travels toward the pointer, snapped to an octant', () => {
    const intent = resolvePointerIntent(eastOf(character, 2), character, TILE, walking);

    expect(intent.dirX).toBe(1);
    expect(intent.dirY).toBe(0);
    expect(intent.facing).toBe('right');
  });

  it('stands still inside the dead zone and keeps facing', () => {
    const nearby = eastOf(character, POINTER_DEAD_ZONE_TILES / 2);
    const intent = resolvePointerIntent(nearby, character, TILE, { facing: 'up', running: true });

    expect(intent.dirX).toBe(0);
    expect(intent.dirY).toBe(0);
    expect(intent.facing).toBe('up');
    expect(intent.running).toBe(false);
  });

  it('starts moving just past the dead zone', () => {
    const justOutside = eastOf(character, POINTER_DEAD_ZONE_TILES + 0.01);
    expect(isMovingIntent(resolvePointerIntent(justOutside, character, TILE, walking))).toBe(true);
  });

  it('walks when near and runs when far', () => {
    const near = eastOf(character, POINTER_RUN_DISTANCE_TILES - 1);
    const far = eastOf(character, POINTER_RUN_DISTANCE_TILES + 1);

    expect(resolvePointerIntent(near, character, TILE, walking).running).toBe(false);
    expect(resolvePointerIntent(far, character, TILE, walking).running).toBe(true);
  });

  it('threads the previous gait through so hysteresis applies', () => {
    const insideBand = eastOf(character, POINTER_RUN_DISTANCE_TILES - POINTER_RUN_HYSTERESIS_TILES / 2);

    expect(resolvePointerIntent(insideBand, character, TILE, { facing: 'right', running: true }).running).toBe(true);
    expect(resolvePointerIntent(insideBand, character, TILE, { facing: 'right', running: false }).running).toBe(false);
  });

  it('expresses distance in tiles, not raw pixels', () => {
    // Same pixel gap, bigger tiles → fewer tiles away → should stop running.
    const pointer = eastOf(character, POINTER_RUN_DISTANCE_TILES + 0.5);

    expect(resolvePointerIntent(pointer, character, TILE, walking).running).toBe(true);
    expect(resolvePointerIntent(pointer, character, TILE * 4, walking).running).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// merging
// ---------------------------------------------------------------------------

describe('mergeMovementIntents', () => {
  const idle: MovementIntent = { dirX: 0, dirY: 0, facing: 'down', running: false };
  const keyboardWest: MovementIntent = { dirX: -1, dirY: 0, facing: 'left', running: false };
  const pointerEast: MovementIntent = { dirX: 1, dirY: 0, facing: 'right', running: true };

  it('lets the keyboard win while a direction key is held', () => {
    expect(mergeMovementIntents(keyboardWest, pointerEast, 'down')).toEqual(keyboardWest);
  });

  it('uses the pointer when no key is held', () => {
    const merged = mergeMovementIntents(idle, pointerEast, 'down');
    expect(merged.dirX).toBe(1);
    expect(merged.facing).toBe('right');
  });

  it('lets Shift force a run while the pointer drives', () => {
    const pointerNear: MovementIntent = { dirX: 1, dirY: 0, facing: 'right', running: false };
    const shiftOnly: MovementIntent = { dirX: 0, dirY: 0, facing: 'down', running: true };

    expect(mergeMovementIntents(shiftOnly, pointerNear, 'down').running).toBe(true);
  });

  it('reports idle with the remembered facing when neither source is moving', () => {
    expect(mergeMovementIntents(idle, idle, 'up')).toEqual({
      dirX: 0,
      dirY: 0,
      facing: 'up',
      running: false,
    });
  });
});

describe('keyboardToIntent', () => {
  it('normalises a diagonal to unit length', () => {
    const intent = keyboardToIntent({ dx: 1, dy: -1, facing: 'up', running: false });
    expect(Math.hypot(intent.dirX, intent.dirY)).toBeCloseTo(1, 12);
  });

  it('passes a resting state straight through', () => {
    const intent = keyboardToIntent({ dx: 0, dy: 0, facing: 'left', running: true });
    expect(intent).toEqual({ dirX: 0, dirY: 0, facing: 'left', running: true });
  });
});

// ---------------------------------------------------------------------------
// integration with the movement simulation
// ---------------------------------------------------------------------------

describe('pointer input driving resolveMovementStep', () => {
  it('travels a 1-tile corridor dead straight, with centering engaged', () => {
    // A one-tile-high corridor: snapping is what keeps the character on its
    // centre line, which is the whole reason pointer input is 8-way.
    const corridor = ['#####', '.....', '#####'];
    const isWalkable = (row: number, col: number) =>
      row >= 0 && row < corridor.length && col >= 0 && col < corridor[row].length && corridor[row][col] === '.';

    // Start off the centre line, with the pointer held far down the corridor.
    // A shallow angle like this is exactly where free-angle movement would
    // crab into the walls; snapping resolves it to due east instead.
    let state = { x: 0.5 * TILE, y: 1.2 * TILE, row: 1, col: 0 };
    const character = () => ({ x: state.x, y: state.y });
    const pointer = { x: 4.5 * TILE, y: 1.5 * TILE };

    for (let step = 0; step < 200; step++) {
      const intent = resolvePointerIntent(pointer, character(), TILE, {
        facing: 'right',
        running: false,
      });
      if (!isMovingIntent(intent)) break;

      state = resolveMovementStep(
        state,
        { dirX: intent.dirX, dirY: intent.dirY, speed: 5 * TILE, walkSpeed: 5 * TILE },
        { tileSize: TILE, isWalkable, stepSeconds: MOVEMENT_STEP_SECONDS },
      );
    }

    // Never left the corridor, and settled onto its centre line (to within the
    // centering deadzone, which is where the assist deliberately stops).
    expect(state.row).toBe(1);
    expect(state.col).toBeGreaterThan(0);
    expect(Math.abs(state.y - 1.5 * TILE)).toBeLessThanOrEqual(PATH_CENTERING_DEADZONE_TILES * TILE);
  });
});
