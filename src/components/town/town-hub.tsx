import { useState } from 'react';
import type { Resources } from '~/types/resources';
import type { ConsumableItemData } from '~/types';
import type { townLocations } from '~/types/map';
import Blacksmith from './blacksmith';
import Inn from './inn';
import ItemStore from './item-store';
import type { ItemStoreParams } from '~/types';
import { Button } from '../ui/8bit/button';

interface TownHubProps {
  innCost: Resources;
  itemsForSell: ItemStoreParams;
  onLeaveCallback: () => void;
}

export default function TownHub({ innCost, itemsForSell, onLeaveCallback }: TownHubProps) {
  const [currentLocation, setCurrentLocation] = useState<townLocations>('town-hub');
  const handleGoToPlace = (place: townLocations) => {
    setCurrentLocation(place);
  };

  const handleReturnToHub = () => {
    setCurrentLocation('town-hub');
  };

  switch (currentLocation) {
    case 'blacksmith':
      return <Blacksmith onLeaveCallback={handleReturnToHub} />;
    case 'inn':
      return <Inn price={innCost} onLeaveCallback={handleReturnToHub} />;
    case 'item-store':
      return <ItemStore itemsForSell={itemsForSell} onLeaveCallback={handleReturnToHub} />;
  }

  return (
    <div className="town">
      <div className="bg-town"></div>
      <div className="town-content flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="leave-btn" onClick={onLeaveCallback}></div>
        </div>
        <h1>Town Hub</h1>
        <div className="flex relative flex-col gap-4 items-end mx-4">
          <div className="bg-post"></div>
          <div className="plank-option mt-2" onClick={() => handleGoToPlace('blacksmith')}>
            Blacksmith
          </div>
          <div className="plank-option" onClick={() => handleGoToPlace('inn')}>
            Inn
          </div>
          <div className="plank-option" onClick={() => handleGoToPlace('item-store')}>
            Item Store
          </div>
        </div>
      </div>
    </div>
  );
}
