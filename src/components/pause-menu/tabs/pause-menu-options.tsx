import { useAtom } from 'jotai';
import { masterVolumeAtom, musicVolumeAtom, sfxVolumeAtom } from '~/stores/pause-menu-atoms';
import { soundService } from '~/services/sound-service';
import { Slider } from '~/components/ui/8bit/slider';

export function PauseMenuOptions() {
  const [masterVolume, setMasterVolume] = useAtom(masterVolumeAtom);
  const [musicVolume, setMusicVolume] = useAtom(musicVolumeAtom);
  const [sfxVolume, setSfxVolume] = useAtom(sfxVolumeAtom);

  function handleMasterChange(value: number[]) {
    const vol = value[0];
    setMasterVolume(vol);
    soundService.setGlobalVolume(vol / 100);
  }

  function handleMusicChange(value: number[]) {
    setMusicVolume(value[0]);
  }

  function handleSfxChange(value: number[]) {
    setSfxVolume(value[0]);
  }

  return (
    <>
      <h2>Options</h2>
      <div className="pause-menu-options-list">
        <div className="pause-menu-option-row">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Master Volume</span>
            <span className="pause-menu-option-value">{masterVolume}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={handleMasterChange}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="pause-menu-option-row">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">Music Volume</span>
            <span className="pause-menu-option-value">{musicVolume}%</span>
          </div>
          <Slider
            value={[musicVolume]}
            onValueChange={handleMusicChange}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="pause-menu-option-row">
          <div className="pause-menu-option-header">
            <span className="pause-menu-option-label">SFX Volume</span>
            <span className="pause-menu-option-value">{sfxVolume}%</span>
          </div>
          <Slider
            value={[sfxVolume]}
            onValueChange={handleSfxChange}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>
    </>
  );
}
