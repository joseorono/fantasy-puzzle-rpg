import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Slider as EightBitSlider } from '~/components/ui/8bit/slider';

interface LabeledSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (next: number) => void;
}

function LabeledSlider({ label, value, min = 0, max = 1, step = 0.01, onChange }: LabeledSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-40 text-sm">{label}: {value.toFixed(2)}</label>
      <div className="flex-1">
        <EightBitSlider
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(vals: number[]) => onChange(vals[0] ?? value)}
        />
      </div>
    </div>
  );
}

export default function SoundTestView() {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState<boolean>(false);
  const [globalVolume, setGlobalVolume] = useState<number>(1);
  const [playVolume, setPlayVolume] = useState<number>(1);
  const [playVariance, setPlayVariance] = useState<number>(0);

  useEffect(() => {
    try {
      setIsMuted(soundService.isMuted());
    } catch {}
  }, []);

  const handlePreload = async () => {
    await soundService.preloadAudios();
    setIsAudioLoaded(true);
  };

  const handleSetGlobalVolume = (next: number) => {
    setGlobalVolume(next);
    soundService.setGlobalVolume(next);
  };

  const handleToggleMute = () => {
    const currentlyMuted = soundService.isMuted();
    if (currentlyMuted === true) {
      soundService.unmuteAll();
      setIsMuted(false);
    } else {
      soundService.muteAll();
      setIsMuted(true);
    }
  };

  const soundNameList = Object.values(SoundNames);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Sound Service Test</h2>

      <div className="flex gap-3 flex-wrap items-center">
        <Button onClick={handlePreload}>Preload Audio</Button>
        <Button onClick={handleToggleMute}>{isMuted ? 'Unmute All' : 'Mute All'}</Button>
        <div className="text-sm px-2 py-1 rounded bg-neutral-200 text-neutral-800">
          Loaded: {isAudioLoaded ? 'yes' : 'no'}
        </div>
      </div>

      <div className="space-y-3 max-w-xl">
        <LabeledSlider label="Global Volume" value={globalVolume} onChange={handleSetGlobalVolume} />
        <LabeledSlider label="Play Volume" value={playVolume} onChange={setPlayVolume} />
        <LabeledSlider label="Play Variance" value={playVariance} onChange={setPlayVariance} />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">One-shot Sounds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {soundNameList.map((alias) => (
            <div key={alias} className="flex items-center justify-between gap-2 border rounded px-2 py-2">
              <div className="text-sm truncate">{alias}</div>
              <Button onClick={() => soundService.playSound(alias as SoundNames, playVolume, playVariance)}>
                Play
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Looping (Start/Stop)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {soundNameList.map((alias) => (
            <div key={alias + '-loop'} className="flex items-center justify-between gap-2 border rounded px-2 py-2">
              <div className="text-sm truncate">{alias}</div>
              <div className="flex gap-2">
                <Button onClick={() => soundService.startMusic(alias as SoundNames, playVolume)}>Start</Button>
                <Button onClick={() => soundService.stopMusic(alias as SoundNames)}>Stop</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
