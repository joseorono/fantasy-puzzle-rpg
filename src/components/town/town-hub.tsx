import { useState, useEffect } from 'react';
import type { Resources } from '~/types/resources';
import type { townLocations } from '~/types/map';
import Blacksmith from './blacksmith';
import Inn from './inn';
import ItemStore from './item-store';
import type { ItemStoreParams } from '~/types';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getRandomElement } from '~/lib/utils';
import { TopBarResources } from '~/components/ui/top-bar-resources';
import { useResources } from '~/stores/game-store';
import { DialogueBox } from '~/components/dialogue/dialogue-box';

interface TownHubProps {
  innCost: Resources;
  itemsForSell: ItemStoreParams;
  onLeaveCallback: () => void;
}

const townHubBgSounds = [SoundNames.bgNoiseForum, SoundNames.bgNoiseFarmer];

export default function TownHub({ innCost, itemsForSell, onLeaveCallback }: TownHubProps) {
  const [currentLocation, setCurrentLocation] = useState<townLocations>('town-hub');
  const [dialogueText, setDialogueText] = useState('Welcome to the town! How can I help you today?');
  const [isTyping, setIsTyping] = useState(false);
  const resources = useResources();

  // Play random background noise when entering town hub
  useEffect(() => {
    if (currentLocation === 'town-hub') {
      const randomSound = getRandomElement(townHubBgSounds);
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
              Blacksmith
            </div>
            <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('inn')}>
              Inn
            </div>
            <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('item-store')}>
              Item Shop
            </div>
          </div>
        </div>
        <h1>Town Hub</h1>
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
