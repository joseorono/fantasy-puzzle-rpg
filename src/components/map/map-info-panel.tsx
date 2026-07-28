interface MapInfoPanelProps {
  displayMapName: string;
  debug?: boolean;
  charPosition: { row: number; col: number };
  status?: string;
  /** Leaves the map. Omit (or pass undefined) when there is nowhere to go back to. */
  onLeave?: () => void;
}

/**
 * Shared header/info panel for tilemaps. Always shows the map title, and a
 * back button when `onLeave` is supplied.
 *
 * When `debug` is true, also shows controls, character position, and status.
 */
export function MapInfoPanel({ displayMapName, debug = false, charPosition, status, onLeave }: MapInfoPanelProps) {
  return (
    <>
      {onLeave && <button className="leave-btn" onClick={onLeave} aria-label={`Leave ${displayMapName}`} />}
      <h2 className="map-title">{displayMapName}</h2>
      {debug && (
        <div className="character-info">
          <strong>Character Position:</strong> Row {charPosition.row}, Col {charPosition.col}
          <br />
          <strong>Controls:</strong> Arrow Keys or WASD, or click-and-hold on the map
          <br />
          <strong>Status:</strong> {status ?? '—'}
        </div>
      )}
    </>
  );
}
