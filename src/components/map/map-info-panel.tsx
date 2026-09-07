interface MapInfoPanelProps {
  displayMapName: string;
  /** Leaves the map. Omit (or pass undefined) when there is nowhere to go back to. */
  onLeave?: () => void;
}

/**
 * Shared header/info panel for tilemaps. Always shows the map title, and a
 * back button when `onLeave` is supplied.
 */
export function MapInfoPanel({ displayMapName, onLeave }: MapInfoPanelProps) {
  return (
    <>
      {onLeave && <button className="leave-btn" onClick={onLeave} aria-label={`Leave ${displayMapName}`} />}
      <h2 className="map-title">{displayMapName}</h2>
    </>
  );
}
