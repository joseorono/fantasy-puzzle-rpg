import { useState } from 'react';
import type { AnimationEvent, CSSProperties } from 'react';
import { cn, getRandomElement } from '~/lib/utils';
import { MAP_LOADING_COGS, MAP_LOADING_FADE_MS } from '~/constants/loading-screen';
import { MAP_LOADING_HINTS } from '~/constants/flavor-text/loading-hints';
import type { LoadingCog } from '~/types/loading-screen';

interface MapLoadingScreenProps {
  /** False starts the fade-out; the screen unmounts itself once it finishes. */
  isVisible: boolean;
}

/** Black cover with a hint and a turning gear cluster, held over the map while it draws. */
export function MapLoadingScreen({ isVisible }: MapLoadingScreenProps) {
  const [hint] = useState(() => getRandomElement(MAP_LOADING_HINTS));
  const [hasExited, setHasExited] = useState(!isVisible);

  if (hasExited) return null;

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.animationName === 'map-loading-screen-out') setHasExited(true);
  }

  return (
    <div
      className={cn('map-loading-screen', !isVisible && 'map-loading-screen--exiting')}
      style={{ '--map-loading-fade-ms': `${MAP_LOADING_FADE_MS}ms` } as CSSProperties}
      onAnimationEnd={handleAnimationEnd}
      role="status"
      aria-live="polite"
    >
      <div className="map-loading-screen__glow" />

      <div className="map-loading-screen__text">
        <p className="map-loading-screen__title">
          Now Loading
          <span className="map-loading-screen__dots" aria-hidden />
        </p>
        <div className="map-loading-screen__hint">
          <span className="map-loading-screen__hint-label">Tip</span>
          <p className="map-loading-screen__hint-text">{hint}</p>
        </div>
      </div>

      <div className="map-loading-screen__cogs motion-exempt" aria-hidden>
        {MAP_LOADING_COGS.map((cog) => (
          <LoadingCogSprite key={cog.src} cog={cog} />
        ))}
      </div>
    </div>
  );
}

interface LoadingCogSpriteProps {
  cog: LoadingCog;
}

function LoadingCogSprite({ cog }: LoadingCogSpriteProps) {
  const sizePx = cog.frameSizePx * cog.scale;
  return (
    <div
      className={cn('loading-cog', cog.isReversed && 'loading-cog--reversed')}
      style={{ width: sizePx, height: sizePx, right: cog.rightPx, bottom: cog.bottomPx }}
    >
      <div
        className="loading-cog__strip"
        style={
          {
            backgroundImage: `url('${cog.src}')`,
            '--cog-frames': cog.frames,
            '--cog-cycle-ms': `${cog.cycleMs}ms`,
            // Literal, not a custom property: that is what keeps the step on the compositor.
            animationTimingFunction: `steps(${cog.frames}, end)`,
          } as CSSProperties
        }
      />
    </div>
  );
}
