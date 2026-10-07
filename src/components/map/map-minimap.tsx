import { useRef } from 'react';
import type { MapDefinition } from '~/types/map';
import type { WalkableMask } from '~/lib/tilemap-collision';
import type { MarkerStatus } from '~/lib/map-draw';
import type { MapPoint } from '~/lib/map-camera';
import {
  buildMinimapMarkers,
  getMinimapDockSide,
  getMinimapLayout,
  getMinimapLegend,
  mapPointToMinimapPercent,
  tileToMinimapPercent,
} from '~/lib/minimap';
import { buildMinimapOutlinePath } from '~/lib/minimap-outline';
import { useElementSize } from '~/hooks/use-element-size';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { isCancelKey, isMinimapKey } from '~/constants/keyboard';
import { MINIMAP_INK_WOBBLE_TILES } from '~/constants/minimap';
import { FOE_MARKER_STYLE } from '~/constants/foe';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';
import { cn } from '~/lib/utils';

/** A roaming enemy's live position, in map pixels. */
export interface FoeMinimapPoint {
  id: string;
  x: number;
  y: number;
}

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
  /** Where the surviving roaming enemies stand, read as the overview opens. */
  foePoints?: FoeMinimapPoint[];
  onClose: () => void;
}

// One outline per map, traced on first open. Keyed by the mask, which lives as long as the map does.
const outlineCache = new WeakMap<WalkableMask, string>();

function getMinimapOutline(mask: WalkableMask): string {
  const cached = outlineCache.get(mask);
  if (cached !== undefined) return cached;
  const outline = buildMinimapOutlinePath(mask);
  outlineCache.set(mask, outline);
  return outline;
}

const WOBBLE_FILTER_ID = 'map-minimap-wobble';

const COMPASS_SRC = '/assets/decorations/jirby-compass.png';

/**
 * The map overview opened with Tab: the walkable region traced as smooth ink contours on
 * a parchment sheet, with its nodes, loot and the player's position pinned on top. The
 * sheet docks on the side of the window away from the character, so she stays in view.
 *
 * Nothing here runs per frame. The outline is one static SVG path, built once per map;
 * the pins are plain positioned elements, and the only animation is the player ripple.
 */
export function MapMinimap({
  map,
  walkableMask,
  tileSize,
  characterPoint,
  markerStatus,
  foePoints = [],
  onClose,
}: MapMinimapProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const windowSize = useElementSize(backdropRef);

  const { width: cols, height: rows } = walkableMask;
  const dockSide = getMinimapDockSide(characterPoint, cols, tileSize);
  const layout = windowSize ? getMinimapLayout(windowSize, cols, rows, dockSide) : null;

  const outline = getMinimapOutline(walkableMask);
  const markers = buildMinimapMarkers(map, markerStatus);
  const legend = getMinimapLegend(markers);
  const player = mapPointToMinimapPercent(characterPoint, cols, rows, tileSize);
  const hasWobble = MINIMAP_INK_WOBBLE_TILES > 0;

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
    <div
      ref={backdropRef}
      className={cn('map-minimap-backdrop', `map-minimap-backdrop--${layout?.side ?? 'center'}`)}
      onClick={onClose}
    >
      {layout && (
        <div className="map-minimap-stack">
          <div
            className="map-minimap"
            role="dialog"
            aria-modal="true"
            aria-label={`Map of ${map.displayMapName}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="map-minimap__banner">
              <span className="map-minimap__title pixel-font">{map.displayMapName}</span>
            </div>

            <ToffecSquareButton variant="medieval1" hasBg size="sm" className="map-minimap__close" onClick={onClose} />

            <div className="map-minimap__chart" style={{ width: layout.sheet.width, height: layout.sheet.height }}>
              <svg
                className="map-minimap__ink"
                viewBox={`0 0 ${cols} ${rows}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {hasWobble && (
                  <defs>
                    <filter id={WOBBLE_FILTER_ID} x="-5%" y="-5%" width="110%" height="110%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="7" result="noise" />
                      <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale={MINIMAP_INK_WOBBLE_TILES}
                        xChannelSelector="R"
                        yChannelSelector="G"
                      />
                    </filter>
                  </defs>
                )}
                <g filter={hasWobble ? `url(#${WOBBLE_FILTER_ID})` : undefined}>
                  <path d={outline} className="map-minimap__ink-bleed" vectorEffect="non-scaling-stroke" />
                  <path d={outline} className="map-minimap__path" vectorEffect="non-scaling-stroke" />
                </g>
              </svg>

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

              {foePoints.map((foe) => {
                const { left, top } = mapPointToMinimapPercent(foe, cols, rows, tileSize);
                return (
                  <span
                    key={foe.id}
                    className="map-minimap__pin map-minimap__pin--foe"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    role="img"
                    aria-label="Roaming enemy"
                  >
                    {FOE_MARKER_STYLE.icon}
                  </span>
                );
              })}

              <span
                className="map-minimap__player"
                style={{ left: `${player.left}%`, top: `${player.top}%` }}
                role="img"
                aria-label="You are here"
              />

              <img className="map-minimap__compass" src={COMPASS_SRC} alt="" draggable={false} />
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
              {foePoints.length > 0 && (
                <li>
                  <span aria-hidden="true">{FOE_MARKER_STYLE.icon}</span>
                  FOE
                </li>
              )}
            </ul>
          </div>

          <KeyHintPill size="sm" className="map-minimap__key-hint" items={[{ keys: ['Tab', 'Esc'], label: 'close' }]} />
        </div>
      )}
    </div>
  );
}
