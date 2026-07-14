import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import NumberFlow from '@number-flow/react';
import { Star } from 'lucide-react';
import type { DungeonRatingSummary } from '~/lib/dungeon-system';
import {
  MAX_STARS,
  STAR_RANK_LABELS,
  STAR_RANK_TAGLINES,
  CLOSE_CALL_MAX_STARS,
  RATING_REVEAL,
  STAR_COLOR_FILLED,
  STAR_COLOR_EMPTY,
} from '~/constants/battle-rating';
import {
  INTEGER_FORMAT,
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
} from '~/constants/number-flow';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { cn } from '~/lib/utils';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { IndigolayCornersWrapper } from '~/components/cursor/indigolay-corners-wrapper';

/** One rated floor line: its name and the stars earned in its combat. */
export interface DungeonClearFloorRow {
  name: string;
  stars: number;
}

interface DungeonClearScreenProps {
  /** Aggregate rank across the run's rated floors (see `summarizeFloorRatings`). */
  summary: DungeonRatingSummary;
  /** Per-floor combat ratings, rated floors only, in descent order. */
  floors: DungeonClearFloorRow[];
  /** Dismiss the overlay (falls back to the inline "Dungeon Cleared" card). */
  onContinue: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/** A single floor line: name on the left, a compact star row on the right. */
function FloorRow({ name, stars, revealed }: { name: string; stars: number; revealed: boolean }) {
  return (
    <li className={cn('dcs-row pixel-font', revealed && 'dcs-row--revealed')}>
      <span className="dcs-row-name">{name}</span>
      <span className="dcs-row-stars" aria-label={`${stars} of ${MAX_STARS} stars`}>
        {Array.from({ length: MAX_STARS }, (_, i) => (
          <Star
            key={i}
            className="dcs-row-star"
            fill="currentColor"
            strokeWidth={0}
            style={{ color: i < stars ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY } as CSSProperties}
          />
        ))}
      </span>
    </li>
  );
}

/**
 * Flashy dungeon-clear results overlay — mirrors the post-battle rating screen. Per-floor ratings
 * tick in one at a time (tab click), the overall rank stars fill left-to-right (coin), then a rank
 * word/tagline and a NumberFlow star total land. Pure presentation; the run's rating data is
 * pre-shaped by the caller so this component stays stateless about the dungeon.
 */
export function DungeonClearScreen({ summary, floors, onContinue }: DungeonClearScreenProps) {
  const reduced = prefersReducedMotion();
  const [revealedCount, setRevealedCount] = useState(reduced ? floors.length : 0);
  const [filledStars, setFilledStars] = useState(reduced ? summary.averageStars : 0);
  const [showTotal, setShowTotal] = useState(reduced);
  const [canContinue, setCanContinue] = useState(reduced);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const maxStars = summary.ratedFloors * MAX_STARS;

  // Timeline: reveal each floor row (tab click), fill each rank star (coin), pop the star total,
  // then enable Continue. A celebratory shimmer plays on mount either way.
  useEffect(() => {
    soundService.playSound(SoundNames.shimmeringSuccess, 0.7);
    if (reduced) return;

    const timers = timersRef.current;
    const { startDelayMs, rowStaggerMs, starStaggerMs, lootRevealDelayMs, continueDelayMs } =
      RATING_REVEAL;

    floors.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setRevealedCount(i + 1);
          soundService.playSound(SoundNames.clickChangeTab, 0.5, 0.1, 0.05);
        }, startDelayMs + i * rowStaggerMs),
      );
    });

    // +250ms pre-stars beat mirrors the battle-rating cadence.
    const starsStart = startDelayMs + floors.length * rowStaggerMs + 250;
    for (let s = 0; s < summary.averageStars; s++) {
      timers.push(
        setTimeout(() => {
          setFilledStars(s + 1);
          soundService.playSound(SoundNames.clickCoin, 0.6, 0.1, 0.05);
        }, starsStart + s * starStaggerMs),
      );
    }

    const totalAt = starsStart + summary.averageStars * starStaggerMs + lootRevealDelayMs;
    timers.push(
      setTimeout(() => {
        setShowTotal(true);
        soundService.playSound(SoundNames.clickCoin, 0.7);
      }, totalAt),
    );

    timers.push(setTimeout(() => setCanContinue(true), totalAt + continueDelayMs));

    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, [reduced, summary, floors]);

  // Tap anywhere during the reveal to fast-forward to the finished state.
  function handleSkip() {
    if (canContinue) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current.length = 0;
    setRevealedCount(floors.length);
    setFilledStars(summary.averageStars);
    setShowTotal(true);
    setCanContinue(true);
    soundService.playSound(SoundNames.clickCoin, 0.6);
  }

  const rankLabel = STAR_RANK_LABELS[summary.averageStars] ?? '';
  const tagline = STAR_RANK_TAGLINES[summary.averageStars] ?? '';
  const isCloseCall = summary.averageStars <= CLOSE_CALL_MAX_STARS;

  return (
    <div className="dcs-backdrop" onClick={handleSkip}>
      <IndigolayCornersWrapper alwaysVisible className="dcs-card-wrap">
        <div className="dcs-card">
          <header className="dcs-header">
            <NarikWoodBitFont text="Dungeon Cleared" size={1.1} />
          </header>

          <ul className="dcs-floors">
            {floors.map((floor, i) => (
              <FloorRow key={i} name={floor.name} stars={floor.stars} revealed={i < revealedCount} />
            ))}
          </ul>

          <div className="dcs-divider" />

          <div
            className="dcs-stars"
            role="img"
            aria-label={`${summary.averageStars} of ${MAX_STARS} stars`}
          >
            {Array.from({ length: MAX_STARS }, (_, i) => {
              const isFilled = i < filledStars;
              return (
                <span
                  key={i}
                  className={cn('dcs-star', isFilled && 'dcs-star--filled')}
                  style={{ color: isFilled ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY } as CSSProperties}
                >
                  <Star className="dcs-star-icon" fill="currentColor" strokeWidth={1.5} />
                </span>
              );
            })}
          </div>

          {filledStars >= summary.averageStars && (
            <div className="dcs-rank-block">
              {rankLabel && (
                <div className="dcs-rank title-sign title-sign--red title-sign--text-gold">
                  <span className="dcs-rank-text title-sign__text pixel-font">{rankLabel}</span>
                </div>
              )}
              {tagline && (
                <p className={cn('dcs-tagline pixel-font', isCloseCall && 'dcs-tagline--close')}>
                  {tagline}
                </p>
              )}
              <div className={cn('dcs-total', showTotal && 'dcs-total--shown')}>
                <span className="dcs-total-label pixel-font">STARS</span>
                <span className="dcs-total-value pixel-font number-flow-container">
                  <NumberFlow
                    value={showTotal ? summary.totalStars : 0}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                  <span className="dcs-total-max">/ {maxStars}</span>
                </span>
              </div>
            </div>
          )}

          <ToffecButton
            variant="indigolay-red"
            onClick={onContinue}
            disabled={!canContinue}
            className={cn('dcs-continue crt-top-highlight', canContinue && 'dcs-continue--ready')}
          >
            Continue
          </ToffecButton>
        </div>
      </IndigolayCornersWrapper>
    </div>
  );
}
