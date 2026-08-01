import { useAtom } from 'jotai';
import {
  isMutedAtom,
  masterVolumeAtom,
  musicVolumeAtom,
  reducedMotionAtom,
  sfxVolumeAtom,
} from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { FranukaSlider } from '~/components/ui-custom/franuka-slider';
import { IndigolayCheckbox } from '~/components/ui-custom/indigolay-checkbox';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';

export function PauseMenuOptions() {
  const [masterVolume, setMasterVolume] = useAtom(masterVolumeAtom);
  const [musicVolume, setMusicVolume] = useAtom(musicVolumeAtom);
  const [sfxVolume, setSfxVolume] = useAtom(sfxVolumeAtom);
  const [isMuted, setIsMuted] = useAtom(isMutedAtom);
  const [reducedMotion, setReducedMotion] = useAtom(reducedMotionAtom);

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

        <div className="pause-menu-option-row">
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

        <div className="pause-menu-option-row">
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

        <div className="pause-menu-option-row pause-menu-option-row--mute">
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

        <div className="pause-menu-option-row pause-menu-option-row--toggle">
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
