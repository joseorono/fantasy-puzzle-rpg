import { useRef, useLayoutEffect } from 'react';
import type { MapDefinition } from '~/types/map';
import type { WalkableMask } from '~/lib/tilemap-collision';
import type { MarkerStatus } from '~/lib/map-draw';
import type { MapPoint } from '~/lib/map-camera';
import {
  buildMinimapMarkers,
  buildMinimapPixels,
  getMinimapLegend,
  getMinimapScale,
  mapPointToMinimapPercent,
  tileToMinimapPercent,
} from '~/lib/minimap';
import { useElementSize } from '~/hooks/use-element-size';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { isCancelKey, isMinimapKey } from '~/constants/keyboard';
import {
  MINIMAP_CHROME_HEIGHT_PX,
  MINIMAP_CHROME_WIDTH_PX,
  MINIMAP_MAX_SCALE,
  MINIMAP_MIN_SCALE,
} from '~/constants/minimap';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';
import { IndigolayDivider } from '~/components/dividers/indigolay-divider';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { cn } from '~/lib/utils';

interface MapMinimapProps {
  map: MapDefinition;
  /** The map's walkable mask — the overview is drawn from it. */
  walkableMask: WalkableMask;
  /** Edge length of one tile in map pixels. */
  tileSize: number;
  /** Where the character stands, in map pixels. */
  characterPoint: MapPoint;
  /** Progress lookups — the same ones the map's own markers use. */
  markerStatus: MarkerStatus;
  onClose: () => void;
}

// One image per map, built on first open. Keyed by the mask, which lives as long as the map does.
const imageCache = new WeakMap<WalkableMask, ImageData>();

function getMinimapImage(mask: WalkableMask): ImageData {
  const cached = imageCache.get(mask);
  if (cached) return cached;
  const image = new ImageData(buildMinimapPixels(mask), mask.width, mask.height);
  imageCache.set(mask, image);
  return image;
}

/**
 * The map overview opened with Tab: the map drawn as ink paths on parchment, with its
 * nodes, loot and the player's position pinned on top.
 *
 * Nothing here runs per frame. The image is one pixel per tile, drawn once into a canvas
 * and enlarged by an integer CSS scale; the pins are plain positioned elements.
 */
export function MapMinimap({ map, walkableMask, tileSize, characterPoint, markerStatus, onClose }: MapMinimapProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windowSize = useElementSize(backdropRef);

  const { width: cols, height: rows } = walkableMask;
  const scale = windowSize
    ? getMinimapScale(
        {
          width: windowSize.width - MINIMAP_CHROME_WIDTH_PX,
          height: windowSize.height - MINIMAP_CHROME_HEIGHT_PX,
        },
        cols,
        rows,
        MINIMAP_MIN_SCALE,
        MINIMAP_MAX_SCALE,
      )
    : null;

  const markers = buildMinimapMarkers(map, markerStatus);
  const legend = getMinimapLegend(markers);
  const player = mapPointToMinimapPercent(characterPoint, cols, rows, tileSize);

  // The canvas holds the image at 1px per tile; CSS does the (integer) enlargement.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = walkableMask.width;
    canvas.height = walkableMask.height;
    ctx.putImageData(getMinimapImage(walkableMask), 0, 0);
  }, [walkableMask, scale]);

  // Claimed in the capture phase, so Esc closes the overview without also opening the
  // pause menu, and Tab never reaches the map's own handler (which would reopen it).
  useWindowKeyDown(
    (event) => {
      if (!isMinimapKey(event.key) && !isCancelKey(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      onClose();
    },
    true,
    { capture: true },
  );

  return (
    <div ref={backdropRef} className="confirm-panel-backdrop map-minimap-backdrop" onClick={onClose}>
      <div
        className="confirm-panel map-minimap"
        role="dialog"
        aria-modal="true"
        aria-label={`Map of ${map.displayMapName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <ToffecSquareButton variant="medieval1" hasBg size="sm" className="confirm-panel__close" onClick={onClose} />

        <div className="confirm-panel__header">
          <div className="confirm-panel__title">
            <NarikWoodBitFont text={map.displayMapName} size={1.1} />
          </div>
        </div>

        <IndigolayDivider />

        {scale !== null && (
          <div className="map-minimap__body">
            <div className="map-minimap__sheet" style={{ width: cols * scale, height: rows * scale }}>
              <canvas ref={canvasRef} className="map-minimap__image" />

              {markers.map((marker) => {
                const { left, top } = tileToMinimapPercent(marker.row, marker.col, cols, rows);
                return (
                  <span
                    key={marker.id}
                    className={cn(
                      'map-minimap__pin',
                      `map-minimap__pin--${marker.kind}`,
                      marker.isDone && 'map-minimap__pin--done',
                    )}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    {marker.kind === 'node' ? marker.icon : marker.kind === 'dialogueTrigger' ? '!' : null}
                  </span>
                );
              })}

              <span
                className="map-minimap__player"
                style={{ left: `${player.left}%`, top: `${player.top}%` }}
                role="img"
                aria-label="You are here"
              />
            </div>

            <ul className="map-minimap__legend pixel-font">
              <li>
                <span className="map-minimap__legend-player" aria-hidden="true" />
                You
              </li>
              {legend.map(({ type, icon }) => (
                <li key={type}>
                  <span aria-hidden="true">{icon}</span>
                  {type}
                </li>
              ))}
            </ul>
          </div>
        )}

        <KeyHintPill size="sm" className="confirm-panel__key-hint" items={[{ keys: ['Tab', 'Esc'], label: 'close' }]} />
      </div>
    </div>
  );
}
