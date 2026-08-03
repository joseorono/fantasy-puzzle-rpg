import { useEffect, useRef } from 'react';
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
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
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

  // ↑↓ moves the row cursor; ←→ on a slider row nudges the value directly (the Radix
  // thumb is never focused for this); Enter toggles the toggle rows; ← elsewhere hands
  // the keyboard back to the host. A Tab-focused thumb preventDefaults its own arrows,
  // so the defaultPrevented guard keeps the two from double-handling.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    const selectedId = selection.selectedId as OptionRowId | null;

    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      selection.move(direction);
      return;
    }

    if (direction === 'left' || direction === 'right') {
      event.preventDefault();
      if (selectedId !== null && SLIDER_ROWS.includes(selectedId)) {
        // Slider rows consume ←→ for the value and never exit — even at 0, so
        // hammering the volume down can't accidentally leave the pane.
        nudgeVolume(selectedId, direction === 'right' ? VOLUME_KEY_STEP : -VOLUME_KEY_STEP);
        return;
      }
      if (direction === 'left') {
        selection.clear();
        onExitToSidebar?.();
      }
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      if (selectedId === 'mute') handleMuteToggle();
      else if (selectedId === 'reduced-motion') setReducedMotion(!reducedMotion);
    }
  }, keyboardActive);

  function rowClass(id: OptionRowId, ...extra: string[]) {
    return cn('pause-menu-option-row', ...extra, selection.isSelected(id) && 'pause-menu-option-row--kb-selected');
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
