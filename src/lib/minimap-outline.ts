import { isMaskWalkable, type WalkableMask } from '~/lib/tilemap-collision';
import { MINIMAP_CORNER_ROUNDING } from '~/constants/minimap';

/** A tile corner, in tile units. Integers straight out of the tracer. */
export interface OutlinePoint {
  x: number;
  y: number;
}

/** Edge directions, clockwise in screen coordinates (y down): right, down, left, up. */
const DIRECTION_STEPS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];

/**
 * Traces the outline of the walkable region as closed loops of tile corners.
 *
 * Every walkable tile contributes one directed unit edge per side that faces a blocked
 * or off-map tile, running clockwise around the tile. The edges are linked head to tail.
 * Where two walkable tiles touch only at a corner the walk takes the right turn, so each
 * loop keeps hugging its own tile and the two regions come out as two loops. Outer loops
 * run clockwise and holes anticlockwise, which lets SVG's nonzero fill rule cut the holes
 * out by itself. Collinear corners are dropped.
 *
 * @param mask The map's walkable mask.
 * @returns Loops of at least four corners each. Empty for a map with no walkable tiles.
 */
export function traceWalkableOutline(mask: WalkableMask): OutlinePoint[][] {
  const { width: cols, height: rows } = mask;
  const vertexCols = cols + 1;
  // One bit per outgoing direction, for every tile corner.
  const outgoing = new Uint8Array(vertexCols * (rows + 1));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!isMaskWalkable(mask, row, col)) continue;
      if (!isMaskWalkable(mask, row - 1, col)) outgoing[row * vertexCols + col] |= 1 << 0;
      if (!isMaskWalkable(mask, row, col + 1)) outgoing[row * vertexCols + col + 1] |= 1 << 1;
      if (!isMaskWalkable(mask, row + 1, col)) outgoing[(row + 1) * vertexCols + col + 1] |= 1 << 2;
      if (!isMaskWalkable(mask, row, col - 1)) outgoing[(row + 1) * vertexCols + col] |= 1 << 3;
    }
  }

  const loops: OutlinePoint[][] = [];

  for (let start = 0; start < outgoing.length; start++) {
    for (let startDirection = 0; startDirection < 4; startDirection++) {
      if (!(outgoing[start] & (1 << startDirection))) continue;

      const corners: OutlinePoint[] = [];
      const directions: number[] = [];
      let vertex = start;
      let direction = startDirection;

      for (;;) {
        outgoing[vertex] &= ~(1 << direction);
        corners.push({ x: vertex % vertexCols, y: Math.floor(vertex / vertexCols) });
        directions.push(direction);
        const [stepX, stepY] = DIRECTION_STEPS[direction];
        vertex += stepX + stepY * vertexCols;
        if (vertex === start) break;

        // Prefer the right turn, then straight on, then the left turn.
        const bits = outgoing[vertex];
        const next = [(direction + 1) % 4, direction, (direction + 3) % 4].find((candidate) => bits & (1 << candidate));
        if (next === undefined) break;
        direction = next;
      }

      const loop = corners.filter((_, index) => {
        const into = directions[(index + directions.length - 1) % directions.length];
        return into !== directions[index];
      });
      loops.push(loop);
    }
  }

  return loops;
}

/** Formats a coordinate for the path string, trimming float noise. */
function formatCoordinate(value: number): string {
  return String(Number(value.toFixed(3)));
}

/** A point `fraction` of the way from `from` to `to`. */
function lerp(from: OutlinePoint, to: OutlinePoint, fraction: number): OutlinePoint {
  return { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
}

/**
 * Turns one loop into an SVG path segment with rounded corners.
 *
 * With `rounding` 0 every corner is sharp. With 1 every corner becomes a quadratic curve
 * from the midpoint of the incoming edge to the midpoint of the outgoing edge, with the
 * corner as control point: a quadratic B-spline, so long runs stay straight, stair-steps
 * melt into smooth diagonals and the ends of one-tile corridors become semicircles.
 * Values in between pull the curve's ends toward the corner.
 *
 * @param loop Closed loop of corners, as traced by {@link traceWalkableOutline}.
 * @param rounding 0–1.
 * @returns `M … Z`, or an empty string for a degenerate loop.
 */
export function loopToSmoothPath(loop: OutlinePoint[], rounding: number): string {
  if (loop.length < 3) return '';
  const reach = Math.min(1, Math.max(0, rounding)) / 2;
  const parts: string[] = [];

  if (reach === 0) {
    loop.forEach((point, index) => {
      parts.push(`${index === 0 ? 'M' : 'L'}${formatCoordinate(point.x)} ${formatCoordinate(point.y)}`);
    });
    return `${parts.join('')}Z`;
  }

  loop.forEach((corner, index) => {
    const previous = loop[(index + loop.length - 1) % loop.length];
    const next = loop[(index + 1) % loop.length];
    const entry = lerp(corner, previous, reach);
    const exit = lerp(corner, next, reach);
    // At full rounding the entry point is the previous exit, so no line is needed.
    if (index === 0 || reach < 0.5) {
      parts.push(`${index === 0 ? 'M' : 'L'}${formatCoordinate(entry.x)} ${formatCoordinate(entry.y)}`);
    }
    parts.push(
      `Q${formatCoordinate(corner.x)} ${formatCoordinate(corner.y)} ${formatCoordinate(exit.x)} ${formatCoordinate(exit.y)}`,
    );
  });

  return `${parts.join('')}Z`;
}

/**
 * The whole walkable region as one SVG path in tile units, ready for a `viewBox` of
 * `0 0 cols rows`. Built once per map; Fairy Forest (124×76) takes well under a millisecond.
 *
 * @param mask The map's walkable mask.
 * @param rounding Corner rounding, 0–1. Defaults to the tunable.
 */
export function buildMinimapOutlinePath(mask: WalkableMask, rounding: number = MINIMAP_CORNER_ROUNDING): string {
  return traceWalkableOutline(mask)
    .map((loop) => loopToSmoothPath(loop, rounding))
    .join('');
}
