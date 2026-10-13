import { MAP_CAMERA_EASE_HALF_LIFE_SECONDS, MAP_CAMERA_SNAP_DISTANCE_PX, MAP_DEFAULT_ZOOM } from '~/constants/map';

/*
 * Camera math for the tile map. Four spaces are involved:
 *
 *   map px       tiles × tileSize — the simulation, the layer cache, markers
 *   view px      map px − camera — relative to the camera's top-left corner
 *   viewport px  view px × zoom — CSS pixels inside `.map-viewport`
 *   client px    viewport px + the viewport's client rect — pointer events, popups
 *
 * The camera is the map-pixel position of the view's top-left corner. Everything that
 * draws uses the rounded camera, so tiles and the sprite share one pixel grid.
 */

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}

/** How a map fits the space available to it. */
export interface ViewportLayout {
  /** Integer display scale. */
  zoom: number;
  /** Visible width in map pixels, never more than the map. */
  viewWidth: number;
  /** Visible height in map pixels, never more than the map. */
  viewHeight: number;
  /** Viewport width in CSS pixels: `viewWidth × zoom`. */
  cssWidth: number;
  /** Viewport height in CSS pixels: `viewHeight × zoom`. */
  cssHeight: number;
}

export interface CameraTunables {
  /** Time to close half the remaining gap. 0 or less locks the camera to its target. */
  halfLifeSeconds: number;
  /** Distance under which the camera jumps the rest of the way. */
  snapDistancePx: number;
}

export const DEFAULT_CAMERA_TUNABLES: CameraTunables = {
  halfLifeSeconds: MAP_CAMERA_EASE_HALF_LIFE_SECONDS,
  snapDistancePx: MAP_CAMERA_SNAP_DISTANCE_PX,
};

/**
 * Normalises a map's configured zoom to a usable integer.
 *
 * @param zoom The map config's `zoom`. Floored; below 1 clamps to 1; missing or not finite
 *   falls back to `MAP_DEFAULT_ZOOM`.
 */
export function resolveMapZoom(zoom: number | undefined): number {
  if (zoom === undefined || !Number.isFinite(zoom)) return MAP_DEFAULT_ZOOM;
  return Math.max(1, Math.floor(zoom));
}

/**
 * Sizes the viewport for a map: as much of the map as fits the available space at
 * `zoom`, and no more than the whole map.
 *
 * Flooring the available space by `zoom` before capping at the map keeps the CSS size a
 * whole multiple of `zoom` that never exceeds the box. A map smaller than the box on an
 * axis gets a viewport exactly its size on that axis, leaving the letterbox around it.
 *
 * @param available Space the viewport may occupy, in CSS pixels.
 * @param mapSize Map size in map pixels.
 * @param zoom Display scale; normalised through {@link resolveMapZoom}.
 * @returns The layout, or `null` when the space can't show a single map pixel.
 */
export function computeViewportLayout(available: MapSize, mapSize: MapSize, zoom: number): ViewportLayout | null {
  const resolvedZoom = resolveMapZoom(zoom);
  const viewWidth = Math.min(mapSize.width, Math.floor(available.width / resolvedZoom));
  const viewHeight = Math.min(mapSize.height, Math.floor(available.height / resolvedZoom));

  if (!(viewWidth >= 1) || !(viewHeight >= 1)) return null;

  return {
    zoom: resolvedZoom,
    viewWidth,
    viewHeight,
    cssWidth: viewWidth * resolvedZoom,
    cssHeight: viewHeight * resolvedZoom,
  };
}

/** Clamps `value` into `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Where the camera wants to be: centred on `focus`, but never showing past the map edge.
 * On an axis where the view spans the whole map the camera stays at 0.
 *
 * @param focus Point to centre on, in map pixels (the character).
 * @param layout The viewport's visible size.
 * @param mapSize Map size in map pixels.
 * @returns The camera's top-left corner in map pixels, unrounded.
 */
export function getCameraTarget(
  focus: MapPoint,
  layout: Pick<ViewportLayout, 'viewWidth' | 'viewHeight'>,
  mapSize: MapSize,
): MapPoint {
  return {
    x: clamp(focus.x - layout.viewWidth / 2, 0, Math.max(0, mapSize.width - layout.viewWidth)),
    y: clamp(focus.y - layout.viewHeight / 2, 0, Math.max(0, mapSize.height - layout.viewHeight)),
  };
}

/** One axis of {@link advanceCamera}. */
function advanceAxis(current: number, target: number, blend: number, snapDistancePx: number): number {
  const next = current + (target - current) * blend;
  return Math.abs(target - next) <= snapDistancePx ? target : next;
}

/**
 * Eases the camera toward its target.
 *
 * Exponential decay written as a half-life, so it is exactly frame-rate independent: two
 * steps of `dt / 2` land where one step of `dt` does. Each axis snaps on its own once it
 * is within `snapDistancePx`, so a long horizontal ease never holds the vertical one open.
 *
 * @param current Camera position, unrounded. Feed the result back in next frame.
 * @param target From {@link getCameraTarget}.
 * @param dtSeconds Time since the last step.
 * @param tunables Ease half-life and snap distance.
 */
export function advanceCamera(
  current: MapPoint,
  target: MapPoint,
  dtSeconds: number,
  tunables: CameraTunables = DEFAULT_CAMERA_TUNABLES,
): MapPoint {
  if (tunables.halfLifeSeconds <= 0) return { x: target.x, y: target.y };
  if (!(dtSeconds > 0)) return current;

  const blend = 1 - 2 ** (-dtSeconds / tunables.halfLifeSeconds);
  return {
    x: advanceAxis(current.x, target.x, blend, tunables.snapDistancePx),
    y: advanceAxis(current.y, target.y, blend, tunables.snapDistancePx),
  };
}

/**
 * Rounds the camera to whole map pixels — the position everything is drawn at.
 *
 * @param camera Unrounded camera.
 */
export function roundCamera(camera: MapPoint): MapPoint {
  return { x: Math.round(camera.x), y: Math.round(camera.y) };
}

/**
 * Map pixels → CSS pixels inside the viewport.
 *
 * @param point Point in map pixels.
 * @param camera Rounded camera.
 * @param zoom Display scale.
 */
export function mapToViewportPoint(point: MapPoint, camera: MapPoint, zoom: number): MapPoint {
  return { x: (point.x - camera.x) * zoom, y: (point.y - camera.y) * zoom };
}

/**
 * CSS pixels inside the viewport → map pixels. Inverse of {@link mapToViewportPoint}.
 *
 * @param point Point relative to the viewport's top-left corner.
 * @param camera Rounded camera.
 * @param zoom Display scale.
 */
export function viewportToMapPoint(point: MapPoint, camera: MapPoint, zoom: number): MapPoint {
  return { x: point.x / zoom + camera.x, y: point.y / zoom + camera.y };
}

/**
 * Map pixels → window (client) coordinates, for `position: fixed` overlays.
 *
 * @param point Point in map pixels.
 * @param camera Rounded camera.
 * @param zoom Display scale.
 * @param origin The viewport's client rect.
 */
export function mapToClientPoint(
  point: MapPoint,
  camera: MapPoint,
  zoom: number,
  origin: { left: number; top: number },
): MapPoint {
  const viewportPoint = mapToViewportPoint(point, camera, zoom);
  return { x: origin.left + viewportPoint.x, y: origin.top + viewportPoint.y };
}

/**
 * Where to translate the sprite inside the viewport, in CSS pixels.
 *
 * Rounds in map pixels before scaling, so at any zoom the sprite steps on the same grid
 * as the tiles. With an integer camera this equals rounding the map position directly.
 *
 * @param point Character position in map pixels.
 * @param camera Rounded camera.
 * @param zoom Display scale.
 */
export function getSpriteTranslation(point: MapPoint, camera: MapPoint, zoom: number): MapPoint {
  return { x: Math.round(point.x - camera.x) * zoom, y: Math.round(point.y - camera.y) * zoom };
}
