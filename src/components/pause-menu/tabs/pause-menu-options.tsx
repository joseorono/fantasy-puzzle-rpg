import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { masterVolumeAtom, musicVolumeAtom, sfxVolumeAtom } from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { FranukaSlider } from '~/components/ui-custom/franuka-slider';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';

export function PauseMenuOptions() {
  const [masterVolume, setMasterVolume] = useAtom(masterVolumeAtom);
  const [musicVolume, setMusicVolume] = useAtom(musicVolumeAtom);
  const [sfxVolume, setSfxVolume] = useAtom(sfxVolumeAtom);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    try {
      setIsMuted(soundService.isMuted());
    } catch {
      setIsMuted(false);
    }
  }, []);

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
    // Read the service's mute state at toggle time so we don't desync if mute
    // was changed elsewhere (e.g. the battle top bar) while this menu was open.
    let currentlyMuted = isMuted;
    try {
      currentlyMuted = soundService.isMuted();
    } catch {
      currentlyMuted = isMuted;
    }

    if (currentlyMuted) {
      soundService.unmuteAll();
      setIsMuted(false);
      return;
    }

    soundService.muteAll();
    setIsMuted(true);
  }

  return (
    <>
      <h2>
        <NarikRedwoodBitFont text="OPTIONS" size={1.2} />
      </h2>
      <div className="pause-menu-options-list">
        <div className="pause-menu-option-row">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Master Volume</span>
            <span className="pause-menu-option-value">{masterVolume}%</span>
          </div>
          <FranukaSlider value={[masterVolume]} onValueChange={handleMasterChange} min={0} max={100} step={1} frameVariant="bookstyle" fillInVariant="golden" markerVariant="ridged" />
        </div>

        <div className="pause-menu-option-row">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Music Volume</span>
            <span className="pause-menu-option-value">{musicVolume}%</span>
          </div>
          <FranukaSlider value={[musicVolume]} onValueChange={handleMusicChange} min={0} max={100} step={1} frameVariant="bookstyle" fillInVariant="golden" markerVariant="ridged" />
        </div>

        <div className="pause-menu-option-row">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">SFX Volume</span>
            <span className="pause-menu-option-value">{sfxVolume}%</span>
          </div>
          <FranukaSlider value={[sfxVolume]} onValueChange={handleSfxChange} min={0} max={100} step={1} frameVariant="bookstyle" fillInVariant="golden" markerVariant="ridged" />
        </div>

        <div className="pause-menu-option-row pause-menu-option-row--mute">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Mute Audio</span>
            <button
              type="button"
              className="pause-menu-mute-toggle"
              aria-pressed={isMuted}
              aria-label={isMuted === true ? 'Unmute audio' : 'Mute audio'}
              onClick={handleMuteToggle}
            >
              <img
                className="pause-menu-mute-toggle__icon"
                src={isMuted === true ? '/assets/icons/indigolay/icon-mute.png' : '/assets/icons/indigolay/icon-unmute.png'}
                alt=""
                draggable={false}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
