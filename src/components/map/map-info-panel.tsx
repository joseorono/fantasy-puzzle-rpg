interface MapInfoPanelProps {
  /** Only used to label the back button — the map name itself is announced by the title sign. */
  displayMapName: string;
  /** Leaves the map. Omit (or pass undefined) when there is nowhere to go back to. */
  onLeave?: () => void;
}

/**
 * Chrome overlaid on a tilemap. Currently just the back button, shown when
 * `onLeave` is supplied — the map name is announced by the title-sign ribbon
 * (see `map-view.tsx`) so it costs the canvas no layout height.
 */
export function MapInfoPanel({ displayMapName, onLeave }: MapInfoPanelProps) {
  if (!onLeave) return null;

  return <button className="leave-btn" onClick={onLeave} aria-label={`Leave ${displayMapName}`} />;
}
