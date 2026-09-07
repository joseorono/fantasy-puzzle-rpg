interface MapDebugOverlayProps {
  charPosition: { row: number; col: number };
  status?: string;
}

/**
 * Debug readout pinned to the corner of the play area. Shows the character's
 * tile coordinates and the current movement status.
 */
export function MapDebugOverlay({ charPosition, status }: MapDebugOverlayProps) {
  return (
    <div className="map-debug-overlay">
      <span>
        Row {charPosition.row}, Col {charPosition.col}
      </span>
      <span>{status ?? '—'}</span>
    </div>
  );
}
