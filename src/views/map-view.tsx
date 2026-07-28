import Tilemap from '~/components/map/tile-map';
import { getMapById } from '~/constants/maps';
import { useViewData } from '~/stores/game-store';
import '~/styles/game-map.css';

/**
 * Renders whichever map the router points at. Every map shares this view — the
 * definition comes from MAP_REGISTRY, so a new map needs no new screen.
 */
export default function MapView() {
  const map = getMapById(useViewData('map')?.mapId);

  // Keyed so switching maps remounts: Tilemap seeds state (tiled data, spawn tile) from
  // its definition, which a plain re-render would not revisit.
  return (
    <div className="game-view game-map">
      <Tilemap key={map.id} map={map} />
    </div>
  );
}
