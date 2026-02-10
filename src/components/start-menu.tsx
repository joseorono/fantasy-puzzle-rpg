import { useState, useEffect } from 'react';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

interface StartMenuProps {
  onStartClick: () => void;
}

export function StartMenu({ onStartClick }: StartMenuProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsLoading(false);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleStartClick = () => {
    soundService.playSound(SoundNames.shimmeringSuccessShort);
    onStartClick();
  };

  return (
    <div className="start-menu">
      <div className="start-menu__bg" />
      <img src="/assets/menu/start/start.menu.png" alt="Start Menu" className="start-menu__image" />

      <div className="start-menu__loading-section">
        {isLoading && (
          <>
            <p className="start-menu__loading-text">Loading...</p>
            <div className="start-menu__progress-bar-container">
              <div className="start-menu__progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <p className="start-menu__progress-text">{Math.floor(Math.min(progress, 100))}%</p>
          </>
        )}

        {!isLoading && (
          <button onClick={handleStartClick} className="start-menu__button">
            START
          </button>
        )}
      </div>
    </div>
  );
}

