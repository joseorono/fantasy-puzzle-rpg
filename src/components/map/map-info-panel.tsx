interface MapInfoPanelProps {
  displayMapName: string;
  debug?: boolean;
  charPosition: { row: number; col: number };
  status?: string;
}

/**
 * Shared header/info panel for tilemaps. Always shows the map title.
 * When `debug` is true, also shows controls, character position, and status.
 */
export function MapInfoPanel({ displayMapName, debug = false, charPosition, status }: MapInfoPanelProps) {
  return (
    <>
      <h2 className="map-title">{displayMapName}</h2>
      {debug && (
        <div className="character-info">
          <strong>Character Position:</strong> Row {charPosition.row}, Col {charPosition.col}
          <br />
          <strong>Controls:</strong> Arrow Keys or WASD
          <br />
          <strong>Status:</strong> {status ?? '—'}
        </div>
      )}
    </>
  );
}
