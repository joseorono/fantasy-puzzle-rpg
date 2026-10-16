import { useEffect } from 'react';
import Tilemap from '~/components/map/tile-map';
import { getMapById } from '~/constants/maps';
import { useTitleSign } from '~/hooks/use-title-sign';
import { useRouterActions, useViewData } from '~/stores/game-store';
import '~/styles/game-map.css';

/**
 * Renders whichever map the router points at. Every map shares this view — the
 * definition comes from MAP_REGISTRY, so a new map needs no new screen.
 */
export default function MapView() {
  const mapData = useViewData('map');
  const map = getMapById(mapData?.mapId);
  const { showTitleSign } = useTitleSign();
  const routerActions = useRouterActions();

  // Tilemap reads the loading-screen flag as it mounts; clearing it here keeps a later
  // return to this map (from battle, town…) from showing the screen again.
  useEffect(() => {
    if (!mapData?.showLoadingScreen) return;
    routerActions.setViewData('map', { ...mapData, showLoadingScreen: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.id]);

  // Announces the location once the map is on screen, replacing the old in-layout <h2>
  // header so the canvas gets the full frame interior.
  function announceLocation() {
    showTitleSign({ text: map.displayMapName, variant: 'tan', size: 'sm', position: 'top' });
  }

  // Keyed so switching maps remounts: Tilemap seeds state (tiled data, spawn tile) from
  // its definition, which a plain re-render would not revisit.
  return (
    <div className="game-view game-map">
      <Tilemap
        key={map.id}
        map={map}
        showLoadingScreen={mapData?.showLoadingScreen === true}
        onReveal={announceLocation}
      />
    </div>
  );
}
