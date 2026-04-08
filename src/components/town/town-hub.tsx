import { useState, useEffect } from 'react';
import type { Resources } from '~/types/resources';
import type { townLocations } from '~/types/map-node';
import Blacksmith from './blacksmith';
import Inn from './inn';
import ItemStore from './item-store';
import type { ItemStoreParams } from '~/types';
import { soundService } from '~/services/sound-service';
import { SoundNames, TOWN_HUB_BG_SOUNDS } from '~/constants/audio';
import { getRandomElement } from '~/lib/utils';
import { TOWN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { TopBarResources } from './top-bar-resources';
import { useResources } from '~/stores/game-store';
import { DialogueBox } from '~/components/dialogue/dialogue-box';
import { NarikWoodBitFont } from '../bitmap-fonts/narik-wood';

interface TownHubProps {
  townName: string;
  innCost: Resources;
  itemsForSell: ItemStoreParams;
  onLeaveCallback: () => void;
}

export default function TownHub({ townName, innCost, itemsForSell, onLeaveCallback }: TownHubProps) {
  // townName is currently passed through for the upcoming TownNameDisplay component
  void townName;
  const [currentLocation, setCurrentLocation] = useState<townLocations>('town-hub');
  const dialogueText = useState(() => getRandomElement(TOWN_WELCOME_TEXT))[0];
  const isTyping = useState(false)[0];
  const resources = useResources();

  // Play random background noise when entering town hub
  useEffect(() => {
    if (currentLocation === 'town-hub') {
      const randomSound = getRandomElement(TOWN_HUB_BG_SOUNDS);
      soundService.playSound(randomSound, 0.2, 0.1);
    }
  }, [currentLocation]);

  const handleGoToPlace = (place: townLocations) => {
    soundService.playSound(SoundNames.mechanicalClick, 0.4, 0.1);
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
    <div className="game-view town">
      <div className="bg-town"></div>

      {/* Top Bar Resources */}
      <div className="town-resources-bar">
        <TopBarResources resources={resources} />
      </div>

      <div className="town-content flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex gap-4">
            <div className="leave-btn" onClick={onLeaveCallback}></div>
          </div>
          <div className="relative mx-[200px] flex flex-col items-end gap-4">
            <div className="bg-post"></div>
            <div className="plank-option mt-2 cursor-pointer" onClick={() => handleGoToPlace('blacksmith')}>
              <NarikWoodBitFont text="BLACKSMITH" size={1} />
            </div>
            <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('inn')}>
              <NarikWoodBitFont text="INN" size={1} />
            </div>
            <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('item-store')}>
              <NarikWoodBitFont text="ITEM SHOP" size={1} />
            </div>
          </div>
        </div>
      </div>

      {/* Portrait and Dialogue Section */}
      <div className="dialogue-container">
        <div className="dialogue-portraits">
          <img src="/assets/portraits/Innkeeper_02.png" alt="Innkeeper" className="dialogue-portrait__image" />
        </div>
        <DialogueBox speakerName="Innkeeper" text={dialogueText} isTyping={isTyping} showIndicator={true} />
      </div>
    </div>
  );
}
