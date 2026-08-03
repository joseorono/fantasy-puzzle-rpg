import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import {
  isMutedAtom,
  masterVolumeAtom,
  musicVolumeAtom,
  reducedMotionAtom,
  sfxVolumeAtom,
} from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey, isCancelKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection } from '~/hooks/use-keyboard-selection';
import { FranukaSlider } from '~/components/ui-custom/franuka-slider';
import { IndigolayCheckbox } from '~/components/ui-custom/indigolay-checkbox';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { cn } from '~/lib/utils';

type OptionRowId = 'master' | 'music' | 'sfx' | 'mute' | 'reduced-motion';

const OPTION_ROWS: OptionRowId[] = ['master', 'music', 'sfx', 'mute', 'reduced-motion'];
const SLIDER_ROWS: OptionRowId[] = ['master', 'music', 'sfx'];

/** How far ←/→ nudges a volume slider per keypress (native key repeat gives held-key sweeps). */
const VOLUME_KEY_STEP = 5;

interface PauseMenuOptionsProps {
  /** The hosting surface has handed the keyboard to this pane (pause-menu content zone, start-menu modal). */
  keyboardActive?: boolean;
  /** Fired when ← should hand the keyboard back to the host's own nav (the pause sidebar). */
  onExitToSidebar?: () => void;
}

export function PauseMenuOptions({ keyboardActive = false, onExitToSidebar }: PauseMenuOptionsProps) {
  const [masterVolume, setMasterVolume] = useAtom(masterVolumeAtom);
  const [musicVolume, setMusicVolume] = useAtom(musicVolumeAtom);
  const [sfxVolume, setSfxVolume] = useAtom(sfxVolumeAtom);
  const [isMuted, setIsMuted] = useAtom(isMutedAtom);
  const [reducedMotion, setReducedMotion] = useAtom(reducedMotionAtom);

  const selection = useKeyboardSelection(
    OPTION_ROWS.map((id) => [{ id }]),
    { onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05) },
  );

  // A slider row only consumes ←→ for its value once the player opts in, so ← keeps
  // its one meaning — back — everywhere else. Derived rather than reconciled: if the
  // cursor moves or clears (pointer move, leaving the pane), edit mode ends with it.
  const [editingRowId, setEditingRowId] = useState<OptionRowId | null>(null);
  const isEditing = editingRowId !== null && selection.selectedId === editingRowId;

  // Entering the pane reveals the first row right away (not on the next keypress).
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    if (keyboardActive && selectionRef.current.selectedId === null) selectionRef.current.select('master');
  }, [keyboardActive]);

  function handleMasterChange(value: number[]) {
    const vol = value[0];
    setMasterVolume(vol);
    soundService.setGlobalVolume(vol / 100);
  }

  function handleMusicChange(value: number[]) {
    const vol = value[0];
    setMusicVolume(vol);
    soundService.setMusicVolume(vol / 100);
  }

  function handleSfxChange(value: number[]) {
    const vol = value[0];
    setSfxVolume(vol);
    soundService.setSfxVolume(vol / 100);
  }

  function handleMuteToggle() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundService.setMuted(nextMuted);
  }

  function nudgeVolume(id: OptionRowId, delta: number) {
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    if (id === 'master') handleMasterChange([clamp(masterVolume + delta)]);
    else if (id === 'music') handleMusicChange([clamp(musicVolume + delta)]);
    else if (id === 'sfx') handleSfxChange([clamp(sfxVolume + delta)]);
  }

  function exitToSidebar() {
    // The start-menu host has no sidebar to return to, so it keeps its cursor.
    if (!onExitToSidebar) return;
    selection.clear();
    onExitToSidebar();
  }

  // Browsing: ↑↓ move the cursor, ← hands the keyboard back to the host from ANY row,
  // Enter/→ opens a slider for adjusting, Enter toggles the toggle rows. Editing: ←→
  // own the value and ↑↓ go inert, so the mode can't be left by accident. A Tab-focused
  // Radix thumb preventDefaults its own arrows, so the guard stops double-handling.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    const selectedId = selection.selectedId as OptionRowId | null;
    const isSliderRow = selectedId !== null && SLIDER_ROWS.includes(selectedId);

    if (isEditing) {
      if (direction === 'left' || direction === 'right') {
        event.preventDefault();
        // Repeat allowed: holding an arrow sweeps the volume.
        nudgeVolume(selectedId!, direction === 'right' ? VOLUME_KEY_STEP : -VOLUME_KEY_STEP);
        return;
      }
      if (direction) {
        event.preventDefault(); // ↑↓ inert while editing
        return;
      }
      if (isConfirmKey(event.key)) {
        event.preventDefault();
        if (event.repeat) return;
        soundService.playSound(SoundNames.mechanicalClick, 0.5);
        setEditingRowId(null);
      }
      return;
    }

    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      selection.move(direction);
      return;
    }

    if (direction === 'left') {
      event.preventDefault();
      exitToSidebar();
      return;
    }

    if (direction === 'right') {
      event.preventDefault();
      // → means "go deeper" here exactly as it does in the sidebar.
      if (isSliderRow) setEditingRowId(selectedId);
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      if (isSliderRow) {
        soundService.playSound(SoundNames.mechanicalClick, 0.5);
        setEditingRowId(selectedId);
      } else if (selectedId === 'mute') handleMuteToggle();
      else if (selectedId === 'reduced-motion') setReducedMotion(!reducedMotion);
    }
  }, keyboardActive);

  // Escape/Backspace leave edit mode rather than backing out of the pane. Claimed in the
  // capture phase so the pause overlay's own cancel (back to sidebar / close) never also
  // fires — and, in the start-menu host, so it doesn't close the tab modal mid-adjust.
  useWindowKeyDown(
    (event) => {
      if (!isCancelKey(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      setEditingRowId(null);
    },
    keyboardActive && isEditing,
    { capture: true },
  );

  function rowClass(id: OptionRowId, ...extra: string[]) {
    return cn(
      'pause-menu-option-row',
      ...extra,
      selection.isSelected(id) && 'pause-menu-option-row--kb-selected',
      isEditing && editingRowId === id && 'pause-menu-option-row--editing',
    );
  }

  /** Contextual key hint for the cursor's slider row — nothing for unselected rows. */
  function sliderHint(id: OptionRowId) {
    if (!keyboardActive || !selection.isSelected(id)) return null;
    return (
      <span className="pause-menu-inline-hint pixel-font">
        {isEditing && editingRowId === id ? '← → adjust · Enter done' : 'Enter to adjust'}
      </span>
    );
  }

  return (
    <>
      <h2>
        <NarikRedwoodBitFont text="OPTIONS" size={1.2} />
      </h2>
      <div className="pause-menu-options-list">
        <div className={rowClass('master')}>
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Master Volume</span>
            {sliderHint('master')}
            <span className="pause-menu-option-value">{masterVolume}%</span>
          </div>
          <FranukaSlider
            value={[masterVolume]}
            onValueChange={handleMasterChange}
            min={0}
            max={100}
            step={1}
            frameVariant="bookstyle"
            fillInVariant="golden"
            markerVariant="ridged"
          />
        </div>

        <div className={rowClass('music')}>
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Music Volume</span>
            {sliderHint('music')}
            <span className="pause-menu-option-value">{musicVolume}%</span>
          </div>
          <FranukaSlider
            value={[musicVolume]}
            onValueChange={handleMusicChange}
            min={0}
            max={100}
            step={1}
            frameVariant="bookstyle"
            fillInVariant="golden"
            markerVariant="ridged"
          />
        </div>

        <div className={rowClass('sfx')}>
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">SFX Volume</span>
            {sliderHint('sfx')}
            <span className="pause-menu-option-value">{sfxVolume}%</span>
          </div>
          <FranukaSlider
            value={[sfxVolume]}
            onValueChange={handleSfxChange}
            min={0}
            max={100}
            step={1}
            frameVariant="bookstyle"
            fillInVariant="golden"
            markerVariant="ridged"
          />
        </div>

        <div className={rowClass('mute', 'pause-menu-option-row--mute')}>
          <button type="button" className="pause-menu-mute-toggle" aria-pressed={isMuted} onClick={handleMuteToggle}>
            <img
              className="pause-menu-mute-toggle__icon"
              src={
                isMuted === true ? '/assets/icons/indigolay/icon-mute.png' : '/assets/icons/indigolay/icon-unmute.png'
              }
              alt=""
              draggable={false}
            />
            <span className="pause-menu-option-label">Mute Audio</span>
          </button>
        </div>

        <div className={rowClass('reduced-motion', 'pause-menu-option-row--toggle')}>
          <IndigolayCheckbox
            size="sm"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
            label="Reduced Motion"
          />
          <p className="pause-menu-option-description">
            Calms the screen down: no shakes, freeze-frames, or flashing bursts, and menus snap into place instead of
            sliding. Easier on the eyes if motion makes you queasy — the trade-off is that combat loses most of its
            juice.
          </p>
          <p className="pause-menu-option-note">Off by default. Flip it any time — your choice is remembered.</p>
        </div>
      </div>
    </>
  );
}
