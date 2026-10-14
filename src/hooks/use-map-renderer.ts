import { useRef, useState, useEffect, useLayoutEffect, type RefObject } from 'react';
import type { TilemapData } from '~/types/tilemap';
import type { Position } from '~/types/geometry';
import type { MovementFrame } from '~/hooks/use-character-movement';
import {
  advanceCamera,
  getCameraTarget,
  getSpriteTranslation,
  mapToClientPoint,
  roundCamera,
  type MapPoint,
  type ViewportLayout,
} from '~/lib/map-camera';
import {
  buildOccluderLayerCanvas,
  buildStaticLayerCanvas,
  drawCameraView,
  drawMarkers,
  drawOccludedCharacterGhost,
  drawOcclusionPatch,
  getMarkerPulsePhase,
  type MapMarker,
} from '~/lib/map-draw';
import { getReadyMapMarkerAtlas } from '~/lib/map-marker-atlas';
import { getReadyChestSheet } from '~/lib/chest-sprite';
import {
  buildOcclusionGrid,
  collectOccludingCells,
  getCharacterFrameViewportRect,
  getCharacterOcclusionBox,
} from '~/lib/map-occlusion';
import { getSpriteFrameOrigin, type CharacterSpriteMetrics } from '~/lib/character-sprite';
import type { SpriteState } from '~/hooks/use-character-sprite';
import type { MapPixelBox, OcclusionGrid } from '~/types/map-occlusion';
import type { PixelRect } from '~/types/geometry';
import { OCCLUDED_CHARACTER_ALPHA, OCCLUDER_ALPHA } from '~/constants/map';
import { MEMAO_FRAME_SIZE_PX } from '~/constants/memao-sprite';

export interface UseMapRendererOptions {
  /** The viewport-sized canvas the map is drawn into. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** A viewport-sized canvas stacked above the sprite; occluders that cover her are redrawn here. */
  occlusionCanvasRef: RefObject<HTMLCanvasElement | null>;
  /** The character sprite's wrapper; its transform is written every frame. */
  spriteRef: RefObject<HTMLDivElement | null>;
  /** The `.map-viewport` element, for converting to window coordinates. */
  viewportRef: RefObject<HTMLDivElement | null>;
  mapData: TilemapData;
  /** The loaded tileset, or `null` while it loads. */
  tileset: HTMLImageElement | null;
  /** Tile layers to draw, by name. */
  visibleLayers: string[];
  /** Layers that cover the character when she is behind them; see `TiledMapConfig.occlusionLayers`. */
  occlusionLayers?: string[];
  /** Base GIDs that cover the character on any layer, e.g. arches. */
  overheadGids?: number[];
  /** Sprite sizes in map pixels (display scale 1), for the area occluders are redrawn over. */
  characterMetrics: CharacterSpriteMetrics;
  /** The character's sheet, for the see-through copy drawn where occluders cover her. */
  characterSheetPath: string;
  /**
   * The DOM sprite's current frame, mirrored by the caller during render — the same
   * commit that repaints the sprite — so the see-through copy always matches it.
   */
  spriteStateRef: RefObject<SpriteState | null>;
  /** Edge length of one tile in map pixels. */
  tileSize: number;
  /** From `computeViewportLayout`; `null` until the stage is measured. */
  layout: ViewportLayout | null;
  /** From `buildMarkerList`. */
  markers: MapMarker[];
  /** While true, the character's window position is reported through `onAnchorChange`. */
  watchAnchor: boolean;
  /** Receives the character's window position, rounded, whenever it changes. */
  onAnchorChange: (position: Position) => void;
  /** Drawn after the markers each frame, in map pixels under the camera transform. */
  drawOverlay?: (ctx: CanvasRenderingContext2D, camera: MapPoint, layout: ViewportLayout, timestampMs: number) => void;
}

export interface MapRenderer {
  /** Draws one frame. Pass as `useCharacterMovement`'s `onFrame`. */
  renderFrame: (frame: MovementFrame) => void;
  /** The rounded camera the last frame was drawn with, in map pixels. */
  getCamera: () => MapPoint;
  /** True once the viewport is sized and the tileset loaded — the sprite may mount. */
  isReady: boolean;
}

/**
 * Draws the tile map through a camera that follows the character.
 *
 * The static tile layers are rendered once into an offscreen cache; each frame copies
 * the visible slice into a viewport-sized canvas and draws the markers over it. The
 * camera, the sprite's transform and the canvas are all updated inside `renderFrame`,
 * which the movement loop calls once per animation frame, so the three can never be a
 * frame apart.
 *
 * Occluders standing in front of the character (see `buildOcclusionGrid`) are redrawn
 * from a second cache onto a canvas above the sprite — only the few cells under her.
 *
 * Camera state lives in refs and never in React state. The only React-facing output is
 * the popup anchor, reported only while `watchAnchor` is set and only when it moves.
 */
export function useMapRenderer(options: UseMapRendererOptions): MapRenderer {
  const {
    canvasRef,
    occlusionCanvasRef,
    spriteRef,
    viewportRef,
    mapData,
    tileset,
    visibleLayers,
    occlusionLayers,
    overheadGids,
    characterSheetPath,
    spriteStateRef,
    tileSize,
    layout,
    markers,
    watchAnchor,
    onAnchorChange,
    drawOverlay,
  } = options;

  const cacheRef = useRef<HTMLCanvasElement | null>(null);
  const occluderCacheRef = useRef<HTMLCanvasElement | null>(null);
  const occlusionGridRef = useRef<OcclusionGrid | null>(null);
  // Reused every frame so the occlusion pass allocates nothing.
  const occludingCellsRef = useRef<number[]>([]);
  const occlusionBoxRef = useRef<MapPixelBox>({ left: 0, top: 0, right: 0, bottom: 0 });
  const hasOcclusionPatchRef = useRef(false);
  const ghostRectRef = useRef<PixelRect>({ x: 0, y: 0, width: 0, height: 0 });
  const characterSheetRef = useRef<HTMLImageElement | null>(null);
  // `null` means "no camera yet": the next frame snaps instead of easing in from (0, 0).
  const cameraRef = useRef<MapPoint | null>(null);
  const roundedCameraRef = useRef<MapPoint>({ x: 0, y: 0 });
  const lastFrameRef = useRef<MovementFrame | null>(null);
  const lastAnchorRef = useRef<Position | null>(null);
  const [isTilesetDrawn, setIsTilesetDrawn] = useState(false);

  // Read by the rAF loop, so mirrored during render: the next frame sees them.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const mapSizeRef = useRef({ width: 0, height: 0 });
  mapSizeRef.current = { width: mapData.width * tileSize, height: mapData.height * tileSize };
  const watchAnchorRef = useRef(watchAnchor);
  watchAnchorRef.current = watchAnchor;
  const onAnchorChangeRef = useRef(onAnchorChange);
  onAnchorChangeRef.current = onAnchorChange;
  const drawOverlayRef = useRef(drawOverlay);
  drawOverlayRef.current = drawOverlay;
  const characterMetricsRef = useRef(options.characterMetrics);
  characterMetricsRef.current = options.characterMetrics;
  const tileSizeRef = useRef(tileSize);
  tileSizeRef.current = tileSize;

  /** Redraws the occluders that stand in front of the character onto the canvas above her. */
  function drawOcclusion(frame: MovementFrame, camera: MapPoint, currentLayout: ViewportLayout): void {
    const ctx = occlusionCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (hasOcclusionPatchRef.current) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, currentLayout.cssWidth, currentLayout.cssHeight);
      hasOcclusionPatchRef.current = false;
    }

    const grid = occlusionGridRef.current;
    const cache = occluderCacheRef.current;
    if (!grid || !cache || !spriteRef.current) return;

    const size = tileSizeRef.current;
    const box = getCharacterOcclusionBox(frame.x, frame.y, characterMetricsRef.current, occlusionBoxRef.current);
    const cells = occludingCellsRef.current;
    const count = collectOccludingCells(grid, size, box, Math.floor(frame.y / size), cells);
    if (count === 0) return;

    drawOcclusionPatch(ctx, cache, cells, count, grid.width, size, camera, currentLayout, OCCLUDER_ALPHA);
    hasOcclusionPatchRef.current = true;

    const sheet = characterSheetRef.current;
    const spriteState = spriteStateRef.current;
    if (!sheet || !spriteState) return;
    const { mode, facing, frameIndex } = spriteState;
    const rect = getCharacterFrameViewportRect(
      getSpriteTranslation(frame, camera, currentLayout.zoom),
      characterMetricsRef.current,
      currentLayout.zoom,
      ghostRectRef.current,
    );
    drawOccludedCharacterGhost(
      ctx,
      sheet,
      getSpriteFrameOrigin(mode, facing, frameIndex),
      MEMAO_FRAME_SIZE_PX,
      rect,
      OCCLUDED_CHARACTER_ALPHA,
    );
  }

  function renderFrame(frame: MovementFrame): void {
    lastFrameRef.current = frame;

    const currentLayout = layoutRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!currentLayout || !ctx) return;

    // Layout is read before anything below writes to the DOM, so it never forces a reflow.
    const viewportRect = watchAnchorRef.current ? viewportRef.current?.getBoundingClientRect() : undefined;

    const target = getCameraTarget(frame, currentLayout, mapSizeRef.current);
    if (cameraRef.current === null || frame.teleported) {
      cameraRef.current = target;
    } else if (!frame.isPaused) {
      cameraRef.current = advanceCamera(cameraRef.current, target, frame.dtSeconds);
    }
    const camera = roundCamera(cameraRef.current);
    roundedCameraRef.current = camera;

    const sprite = spriteRef.current;
    if (sprite) {
      const { x, y } = getSpriteTranslation(frame, camera, currentLayout.zoom);
      const transform = `translate3d(${x}px, ${y}px, 0)`;
      // Compared against the element's own inline style rather than a cached
      // string, so a remounted sprite is always positioned.
      if (sprite.style.transform !== transform) sprite.style.transform = transform;
    }

    drawCameraView(ctx, cacheRef.current, camera, currentLayout);
    drawMarkers(
      ctx,
      markersRef.current,
      camera,
      currentLayout,
      getMarkerPulsePhase(frame.timestampMs),
      getReadyMapMarkerAtlas(),
      getReadyChestSheet(),
      frame.timestampMs,
    );
    drawOverlayRef.current?.(ctx, camera, currentLayout, frame.timestampMs);
    drawOcclusion(frame, camera, currentLayout);

    if (viewportRect) {
      const anchor = mapToClientPoint(frame, camera, currentLayout.zoom, viewportRect);
      const rounded = { x: Math.round(anchor.x), y: Math.round(anchor.y) };
      const previous = lastAnchorRef.current;
      if (!previous || previous.x !== rounded.x || previous.y !== rounded.y) {
        lastAnchorRef.current = rounded;
        onAnchorChangeRef.current(rounded);
      }
    }
  }

  /** Redraws the last reported frame at once, rather than waiting for the next tick. */
  function redrawLastFrame(snapCamera: boolean): void {
    const frame = lastFrameRef.current;
    if (!frame) return;
    renderFrame({ ...frame, dtSeconds: 0, teleported: snapCamera || frame.teleported });
  }

  // The layer cache is rebuilt only when the tiles themselves change — never on resize.
  useEffect(() => {
    if (!tileset) {
      cacheRef.current = null;
      occluderCacheRef.current = null;
      occlusionGridRef.current = null;
      setIsTilesetDrawn(false);
      return;
    }
    cacheRef.current = buildStaticLayerCanvas(mapData, tileset, visibleLayers, tileSize);
    const grid = buildOcclusionGrid(mapData, visibleLayers, occlusionLayers ?? [], overheadGids ?? []);
    occlusionGridRef.current = grid;
    occluderCacheRef.current = buildOccluderLayerCanvas(mapData, tileset, visibleLayers, grid, tileSize);
    setIsTilesetDrawn(true);
    redrawLastFrame(false);
    // `redrawLastFrame` reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData, tileset, visibleLayers, occlusionLayers, overheadGids, tileSize]);

  // Until the sheet loads, occluders still draw; only the see-through copy waits.
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      characterSheetRef.current = image;
    };
    image.src = characterSheetPath;
    return () => {
      image.onload = null;
      characterSheetRef.current = null;
    };
  }, [characterSheetPath]);

  // Resizing a canvas clears it, so redraw before paint. A resize snaps the camera to its
  // re-clamped target rather than letting it drift there.
  const cssWidth = layout?.cssWidth;
  const cssHeight = layout?.cssHeight;
  const viewWidth = layout?.viewWidth;
  const viewHeight = layout?.viewHeight;
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cssWidth === undefined || cssHeight === undefined) return;
    if (canvas.width !== cssWidth) canvas.width = cssWidth;
    if (canvas.height !== cssHeight) canvas.height = cssHeight;
    const occlusionCanvas = occlusionCanvasRef.current;
    if (occlusionCanvas) {
      if (occlusionCanvas.width !== cssWidth) occlusionCanvas.width = cssWidth;
      if (occlusionCanvas.height !== cssHeight) occlusionCanvas.height = cssHeight;
    }
    redrawLastFrame(true);
    // `redrawLastFrame` reads refs only; the view size is listed so a zoom change snaps too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssWidth, cssHeight, viewWidth, viewHeight]);

  const isReady = isTilesetDrawn && layout !== null;

  // The sprite mounts with `isReady`: position it in the same commit, before it paints.
  useLayoutEffect(() => {
    if (isReady) redrawLastFrame(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // A newly opened popup always gets a first report, even if the character hasn't moved
  // since the last popup closed.
  useEffect(() => {
    if (watchAnchor) lastAnchorRef.current = null;
  }, [watchAnchor]);

  return {
    renderFrame,
    getCamera: () => roundedCameraRef.current,
    isReady,
  };
}
