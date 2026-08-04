import { useState, useEffect } from 'react';
import type { Resources } from '~/types/resources';
import type { townLocations } from '~/types/map-node';
import Blacksmith from './blacksmith';
import Inn from './inn';
import ItemStore from './item-store';
import type { ItemStoreParams } from '~/types';
import { soundService } from '~/services/sound-service';
import { SoundNames, TOWN_HUB_BG_SOUNDS, TOWN_SFX_VOLUME } from '~/constants/audio';
import { getRandomElement } from '~/lib/utils';
import { pickAllSubLocationBackgrounds, pickTownHubBackground } from '~/constants/town-backgrounds';
import { TOWN_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { TopBarResources } from './top-bar-resources';
import { useResources } from '~/stores/game-store';
import { DialogueBox } from '~/components/dialogue/dialogue-box';
import { NarikWoodBitFont } from '../bitmap-fonts/narik-wood';
import { getNavDirection, isCancelKey, isConfirmKey, isHelpKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection } from '~/hooks/use-keyboard-selection';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { WoodDiscButton } from '~/components/ui-custom/wood-disc-button';
import { TownHelpPanel } from './town-help-panel';

/** The signpost planks, top to bottom — the keyboard ring and the click handlers share these ids. */
const PLANK_IDS = ['blacksmith', 'inn', 'item-store'] as const;

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [townHubBackground] = useState(pickTownHubBackground);
  // Pick a background per sub-location once per hub visit so each stays consistent
  // while navigating in and out; re-rolled only when the hub is re-entered (remounts).
  const [subLocationBackgrounds] = useState(pickAllSubLocationBackgrounds);
  const dialogueText = useState(() => getRandomElement(TOWN_WELCOME_TEXT))[0];
  const isTyping = useState(false)[0];
  const resources = useResources();

  // Play random background noise when entering town hub
  useEffect(() => {
    if (currentLocation === 'town-hub') {
      const randomSound = getRandomElement(TOWN_HUB_BG_SOUNDS);
      soundService.playSound(randomSound, TOWN_SFX_VOLUME.hubAmbience, 0.1);
    }
  }, [currentLocation]);

  // Pre-decode sub-location background images so section switching is instantaneous
  useEffect(() => {
    Object.values(subLocationBackgrounds).forEach((bgUrl) => {
      const img = new Image();
      img.src = bgUrl;
      if ('decode' in img) {
        img.decode().catch(() => {});
      }
    });
  }, [subLocationBackgrounds]);

  const handleGoToPlace = (place: Exclude<townLocations, 'town-hub'>) => {
    soundService.playSound(SoundNames.mechanicalClick, TOWN_SFX_VOLUME.locationSelect, 0.1);
    setCurrentLocation(place);
  };

  const handleReturnToHub = () => {
    setCurrentLocation('town-hub');
  };

  // Two columns, so two cursors: the side buttons and the signpost have different lengths and a
  // single rows-grid can't express that. ←/→ hand the keyboard between them, ↑/↓ move within one.
  const [zone, setZone] = useState<'side' | 'planks'>('planks');
  const playNavTick = () => soundService.playSound(SoundNames.clickChangeTab, TOWN_SFX_VOLUME.navTick, 0.1, 0.05);
  const sideSelection = useKeyboardSelection([[{ id: 'back' }], [{ id: 'help' }]], { onMove: playNavTick });
  const plankSelection = useKeyboardSelection(
    PLANK_IDS.map((id) => [{ id }]),
    { onMove: playNavTick },
  );

  const isHubActive = currentLocation === 'town-hub' && !isHelpOpen;

  function switchZone(next: 'side' | 'planks') {
    if (next === zone) return;
    // Clear the column being left and reveal the one being entered, so exactly one cursor shows.
    if (next === 'side') {
      plankSelection.clear();
      sideSelection.select('back');
    } else {
      sideSelection.clear();
      plankSelection.select(PLANK_IDS[0]);
    }
    setZone(next);
  }

  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;
    if (isHelpKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      setIsHelpOpen(true);
      return;
    }

    const selection = zone === 'side' ? sideSelection : plankSelection;

    const direction = getNavDirection(event.key);
    if (direction) {
      event.preventDefault();
      if (direction === 'left') switchZone('side');
      else if (direction === 'right') switchZone('planks');
      else selection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      // Always claimed so Space can't scroll the page, even with nothing selected.
      event.preventDefault();
      if (event.repeat) return;
      const selectedId = selection.selectedId;
      if (selectedId === null) return;
      if (selectedId === 'back') onLeaveCallback();
      else if (selectedId === 'help') setIsHelpOpen(true);
      else handleGoToPlace(selectedId as Exclude<townLocations, 'town-hub'>);
    }
  }, isHubActive);

  // Escape/Backspace mirror the leave button: back to the hub from a sub-location, or out of the
  // town entirely. Gated on the help panel so its dismissing press doesn't also leave the town.
  useWindowKeyDown((e) => {
    if (!isCancelKey(e.key)) return;
    e.preventDefault();
    if (e.repeat) return;
    if (currentLocation === 'town-hub') {
      onLeaveCallback();
    } else {
      handleReturnToHub();
    }
  }, !isHelpOpen);

  switch (currentLocation) {
    case 'blacksmith':
      return (
        <Blacksmith backgroundImage={subLocationBackgrounds.blacksmith} onLeaveCallback={handleReturnToHub} />
      );
    case 'inn':
      return <Inn backgroundImage={subLocationBackgrounds.inn} price={innCost} onLeaveCallback={handleReturnToHub} />;
    case 'item-store':
      return (
        <ItemStore
          backgroundImage={subLocationBackgrounds['item-store']}
          itemsForSell={itemsForSell}
          onLeaveCallback={handleReturnToHub}
        />
      );
  }

  return (
    <div className="game-view town">
      <div className="bg-town" style={{ backgroundImage: `url('${townHubBackground}')` }}></div>

      {/* Top Bar Resources */}
      <div className="town-resources-bar">
        <TopBarResources resources={resources} />
      </div>

      <div className="town-content flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="town-side-buttons">
            <ToffecBeigeCornersWrapper forceDisplay={zone === 'side' && sideSelection.isSelected('back')}>
              <button className="leave-btn" onClick={onLeaveCallback} aria-label="Leave town" />
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper forceDisplay={zone === 'side' && sideSelection.isSelected('help')}>
              <WoodDiscButton
                glyph="help"
                size="lg"
                onClick={() => setIsHelpOpen(true)}
                aria-label="About the town"
              />
            </ToffecBeigeCornersWrapper>
          </div>
          <div className="relative mx-[200px] flex flex-col items-end gap-4">
            <div className="bg-post"></div>
            <ToffecBeigeCornersWrapper
              className="mt-2"
              forceDisplay={zone === 'planks' && plankSelection.isSelected('blacksmith')}
            >
              <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('blacksmith')}>
                <NarikWoodBitFont text="BLACKSMITH" size={1} />
              </div>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper forceDisplay={zone === 'planks' && plankSelection.isSelected('inn')}>
              <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('inn')}>
                <NarikWoodBitFont text="INN" size={1} />
              </div>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper forceDisplay={zone === 'planks' && plankSelection.isSelected('item-store')}>
              <div className="plank-option cursor-pointer" onClick={() => handleGoToPlace('item-store')}>
                <NarikWoodBitFont text="ITEM SHOP" size={1} />
              </div>
            </ToffecBeigeCornersWrapper>
          </div>
        </div>
      </div>

      {/* Portrait and Dialogue Section */}
      <div className="dialogue-container">
        <div className="dialogue-portraits">
          <img src="/assets/portraits/Innkeeper_02.png" alt="Innkeeper" className="dialogue-portrait__image" />
        </div>
        <DialogueBox speakerName="Innkeeper" text={dialogueText} isTyping={isTyping} showIndicator={false} />
      </div>

      {isHelpOpen && <TownHelpPanel onDismiss={() => setIsHelpOpen(false)} />}
    </div>
  );
}


