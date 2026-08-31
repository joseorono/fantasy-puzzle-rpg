import { useState, useEffect, useRef } from 'react';
import { PauseMenuOptions } from './pause-menu/tabs/pause-menu-options';
import { SaveLoadMenu } from './save-load/save-load-menu';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey, isCancelKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection } from '~/hooks/use-keyboard-selection';
import { useSaveGameActions, useSaveSlots } from '~/hooks/use-save-game';
import { Play, FolderOpen, RotateCcw, ScrollText } from 'lucide-react';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ModalTitle } from '~/components/typography/modal-title';
import { CreditsModal } from '~/components/credits-modal';

interface StartMenuModalProps {
  onStartGame: () => void;
}

type ModalTab = 'main' | 'options' | 'load' | 'settings';

const TAB_TITLES: Record<Exclude<ModalTab, 'main'>, string> = {
  options: 'Options',
  load: 'Load Game',
  settings: 'Settings',
};

/**
 * Main-menu entries in visual order — the keyboard ring and the click handlers share
 * these ids. `continue` only joins the ring when there's actually something to continue.
 */
const ALL_MENU_ITEM_IDS = ['continue', 'start-game', 'load-game', 'credits', 'share', 'settings'] as const;
type MenuItemId = (typeof ALL_MENU_ITEM_IDS)[number];

export function StartMenuModal({ onStartGame }: StartMenuModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('main');
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const { loadSlot, newGame } = useSaveGameActions();
  const { mostRecentSlotId } = useSaveSlots();

  const menuItemIds = mostRecentSlotId
    ? ALL_MENU_ITEM_IDS
    : ALL_MENU_ITEM_IDS.filter((id): id is MenuItemId => id !== 'continue');

  // null until the keyboard is used, so the toffec corners only appear once the
  // player actually navigates; pointer movement clears it again (hook default).
  const selection = useKeyboardSelection(
    menuItemIds.map((id) => [{ id }]),
    { onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05) },
  );

  useEffect(() => {
    soundService.startMusic(SoundNames.startMenuMusic, 0.15);
    return () => {
      soundService.stopMusic(SoundNames.startMenuMusic);
    };
  }, []);

  // Reset the keyboard selection whenever we leave the main view.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    if (activeTab !== 'main') selectionRef.current.clear();
  }, [activeTab]);

  const handleMenuClick = (callback: () => void, soundName: SoundNames = SoundNames.mechanicalClick) => {
    soundService.playSound(soundName, 0.4, 0.1);
    callback();
  };

  const handleStartGame = () => {
    soundService.stopMusic(SoundNames.startMenuMusic);
    // A fresh start really is fresh: the defeat path returns here with progress still
    // in memory, so without this the "new" game would silently continue the old one.
    newGame();
    handleMenuClick(onStartGame, SoundNames.shimmeringSuccessShort);
  };

  const handleContinue = () => {
    if (!mostRecentSlotId) return;
    soundService.stopMusic(SoundNames.startMenuMusic);
    soundService.playSound(SoundNames.shimmeringSuccessShort, 0.4, 0.1);
    loadSlot(mostRecentSlotId);
  };

  const handleOpenLoad = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('load');
  };

  const handleBackToMain = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('main');
  };

  const handleOpenSettings = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setActiveTab('settings');
  };

  const handleOpenCredits = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setIsCreditsOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Fantasy Puzzle RPG', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      soundService.playSound(SoundNames.mechanicalClick, 0.5);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to share:', error);
      }
    }
  };

  const handleBookmark = () => {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    const url = window.location.href;
    const title = document.title || 'Fantasy Puzzle RPG';
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const shortcut = isMac ? 'Cmd+D' : 'Ctrl+D';

    const ext = window.external as unknown as { AddFavorite?: (url: string, title: string) => void };
    if (ext?.AddFavorite) {
      // Legacy IE
      ext.AddFavorite(url, title);
      return;
    }

    const sidebar = (
      window as unknown as { sidebar?: { addPanel?: (title: string, url: string, param: string) => void } }
    ).sidebar;
    if (sidebar?.addPanel) {
      // Legacy Firefox
      sidebar.addPanel(title, url, '');
      return;
    }

    window.alert(`Press ${shortcut} to bookmark this page.`);
  };

  const menuActions: Record<MenuItemId, () => void> = {
    continue: handleContinue,
    'start-game': handleStartGame,
    'load-game': handleOpenLoad,
    credits: handleOpenCredits,
    share: () => void handleShare(),
    settings: handleOpenSettings,
  };

  // Arrow keys / WASD move the selection, Enter/Space activates it. The hook
  // always invokes the latest closure, so this reads current state directly.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;
    // The credits modal owns the keyboard while it's open (Escape to close).
    if (activeTab !== 'main' || isCreditsOpen) return;

    const direction = getNavDirection(event.key);
    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      selection.move(direction);
    } else if (isConfirmKey(event.key)) {
      // Always claim Enter/Space so they can't scroll the page, even when
      // nothing is selected yet.
      event.preventDefault();
      if (event.repeat) return;
      const selectedId = selection.selectedId as MenuItemId | null;
      if (selectedId === null) return;
      menuActions[selectedId]();
    }
  });

  // Escape/Backspace back out of an open tab modal (Options/Load/Save/Settings).
  // Credits can only open from the main view, so its own Escape handler never overlaps.
  useWindowKeyDown((event) => {
    if (!isCancelKey(event.key)) return;
    if (activeTab === 'main') return;
    event.preventDefault();
    if (event.repeat) return;
    handleBackToMain();
  });

  const isModalOpen = activeTab !== 'main';

  return (
    <div className="main-menu">
      <div className="main-menu__bg" />
      <div className="main-menu__content">
        <div className="main-menu__title">
          <h1 className="main-menu__title-text">
            <NarikWoodBitFont text="Fantasy Puzzle RPG" size={3.5} />
          </h1>
        </div>

        <div className="main-menu__buttons">
          {mostRecentSlotId && (
            <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('continue')}>
              <button className="main-menu__button" onClick={handleContinue}>
                <RotateCcw size={20} />
                Continue
              </button>
            </ToffecBeigeCornersWrapper>
          )}
          <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('start-game')}>
            <button className="main-menu__button" onClick={handleStartGame}>
              <Play size={20} />
              Start Game
            </button>
          </ToffecBeigeCornersWrapper>
          <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('load-game')}>
            <button className="main-menu__button" onClick={handleOpenLoad}>
              <FolderOpen size={20} />
              Load Game
            </button>
          </ToffecBeigeCornersWrapper>
          <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('credits')}>
            <button className="main-menu__button" onClick={handleOpenCredits}>
              <ScrollText size={20} />
              Credits
            </button>
          </ToffecBeigeCornersWrapper>
        </div>
      </div>
      <ToffecBeigeCornersWrapper className="main-menu__bookmark-corners">
        <button className="main-menu__bookmark-button" onClick={handleBookmark} aria-label="Bookmark" />
      </ToffecBeigeCornersWrapper>
      <div className="main-menu__actions">
        <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('share')} className="main-menu__action-corners">
          <button className="main-menu__share-icon" onClick={handleShare} aria-label="Share" />
        </ToffecBeigeCornersWrapper>
        <ToffecBeigeCornersWrapper
          forceDisplay={selection.isSelected('settings')}
          className="main-menu__action-corners"
        >
          <button className="main-menu__settings-icon" onClick={handleOpenSettings} aria-label="Settings" />
        </ToffecBeigeCornersWrapper>
      </div>

      {isModalOpen && (
        <div className="start-menu-modal-backdrop" onClick={handleBackToMain}>
          <div className="start-menu-modal-panel" onClick={(e) => e.stopPropagation()}>
            {/* Golden frame corner decorations */}
            <div className="start-menu-modal-corner start-menu-modal-corner--tl" />
            <div className="start-menu-modal-corner start-menu-modal-corner--tr" />
            <div className="start-menu-modal-corner start-menu-modal-corner--bl" />
            <div className="start-menu-modal-corner start-menu-modal-corner--br" />

            {/* Header bar */}
            <div className="start-menu-modal-header">
              <ModalTitle
                text={TAB_TITLES[activeTab as Exclude<ModalTab, 'main'>]}
                className="start-menu-modal-title"
              />
              <ToffecSquareButton variant="medieval1" hasBg size="sm" onClick={handleBackToMain} />
            </div>

            {/* Divider */}
            <div className="start-menu-modal-divider" />

            {/* Content */}
            <div className="start-menu-modal-body">
              {activeTab === 'options' && <PauseMenuOptions keyboardActive />}
              {/* No load confirmation here — there's no in-progress run to lose from the title. */}
              {activeTab === 'load' && (
                <SaveLoadMenu
                  mode="load"
                  keyboardActive
                  onLoaded={() => soundService.stopMusic(SoundNames.startMenuMusic)}
                />
              )}
              {activeTab === 'settings' && <PauseMenuOptions keyboardActive />}
            </div>
          </div>
        </div>
      )}

      <CreditsModal isOpen={isCreditsOpen} onClose={() => setIsCreditsOpen(false)} />
    </div>
  );
}
