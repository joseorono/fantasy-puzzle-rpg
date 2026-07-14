import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { CSSProperties } from 'react';
import NumberFlow from '@number-flow/react';
import { Star } from 'lucide-react';
import {
  partyAtom,
  scoreAtom,
  maxComboAtom,
  itemsUsedAtom,
  battleStartedAtAtom,
} from '~/stores/battle-atoms';
import { computeBattleRating } from '~/lib/battle-rating';
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

interface BattleRatingScreenProps {
  /** Advance to the existing VICTORY summary card. */
  onContinue: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/**
 * Arcade victory rating — shown before the VICTORY card. Criteria rows tick in one at a time (each
 * with a tab-click), then 1–3 stars fill left-to-right (each with a coin). Pure presentation; all
 * scoring lives in {@link computeBattleRating} and its constants.
 */
export function BattleRatingScreen({ onContinue }: BattleRatingScreenProps) {
  const party = useAtomValue(partyAtom);
  const score = useAtomValue(scoreAtom);
  const maxCombo = useAtomValue(maxComboAtom);
  const itemsUsed = useAtomValue(itemsUsedAtom);
  const startedAt = useAtomValue(battleStartedAtAtom);

  // Snapshot the rating once, at mount (the win moment) — elapsed time must not drift on re-render.
  const [result] = useState(() => {
    const maxHpTotal = party.reduce((sum, c) => sum + c.maxHp, 0);
    const currentHpTotal = party.reduce((sum, c) => sum + c.currentHp, 0);
    return computeBattleRating({
      elapsedMs: Date.now() - startedAt,
      score,
      maxCombo,
      hpRemainingPct: maxHpTotal > 0 ? currentHpTotal / maxHpTotal : 0,
      itemsUsed,
    });
  });

  const reduced = prefersReducedMotion();
  const [revealedCount, setRevealedCount] = useState(reduced ? result.criteria.length : 0);
  const [filledStars, setFilledStars] = useState(reduced ? result.stars : 0);
  const [canContinue, setCanContinue] = useState(reduced);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Timeline: reveal each row (tab click), then fill each star (coin), then enable Continue.
  useEffect(() => {
    if (reduced) {
      soundService.playSound(SoundNames.clickCoin, 0.6);
      return;
    }
    const timers = timersRef.current;
    const { startDelayMs, rowStaggerMs, starStaggerMs, continueDelayMs } = RATING_REVEAL;

    result.criteria.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setRevealedCount(i + 1);
          soundService.playSound(SoundNames.clickChangeTab, 0.5, 0.1, 0.05);
        }, startDelayMs + i * rowStaggerMs),
      );
    });

    const starsStart = startDelayMs + result.criteria.length * rowStaggerMs + 250;
    for (let s = 0; s < result.stars; s++) {
      timers.push(
        setTimeout(() => {
          setFilledStars(s + 1);
          soundService.playSound(SoundNames.clickCoin, 0.6, 0.1, 0.05);
        }, starsStart + s * starStaggerMs),
      );
    }

    timers.push(
      setTimeout(
        () => setCanContinue(true),
        starsStart + result.stars * starStaggerMs + continueDelayMs,
      ),
    );

    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, [reduced, result]);

  // Tap anywhere during the reveal to fast-forward to the finished state.
  function handleSkip() {
    if (canContinue) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current.length = 0;
    setRevealedCount(result.criteria.length);
    setFilledStars(result.stars);
    setCanContinue(true);
    soundService.playSound(SoundNames.clickCoin, 0.6);
  }

  // Running points total across the revealed rows (clamped at 0, like the final score).
  const revealedTotal = Math.max(
    0,
    result.criteria.slice(0, revealedCount).reduce((sum, c) => sum + c.points, 0),
  );

  const rankLabel = STAR_RANK_LABELS[result.stars] ?? '';
  const tagline = STAR_RANK_TAGLINES[result.stars] ?? '';
  const isCloseCall = result.stars <= CLOSE_CALL_MAX_STARS;

  return (
    <div className="brs-backdrop" onClick={handleSkip}>
      <IndigolayCornersWrapper alwaysVisible className="brs-card-wrap">
        <div className="brs-card">
          <header className="brs-header">
            <NarikWoodBitFont text="RESULTS" size={1.8} />
          </header>

          <ul className="brs-criteria">
            {result.criteria.map((criterion, i) => {
              const isRevealed = i < revealedCount;
              return (
                <li
                  key={criterion.key}
                  className={cn(
                    'brs-row pixel-font',
                    isRevealed && 'brs-row--revealed',
                    criterion.isPenalty && 'brs-row--penalty',
                    criterion.isRngHeavy && 'brs-row--rng',
                  )}
                >
                  <span className="brs-row-label">
                    {criterion.label}
                    {criterion.isFlawless && <span className="brs-flawless">FLAWLESS</span>}
                    {criterion.isRngHeavy && <span className="brs-rng-tag">luck</span>}
                  </span>
                  <span className="brs-row-value">{criterion.displayValue}</span>
                  <span className="brs-row-points number-flow-container">
                    <NumberFlow
                      value={isRevealed ? criterion.points : 0}
                      format={INTEGER_FORMAT}
                      prefix={criterion.points >= 0 ? '+' : ''}
                      trend={criterion.isPenalty ? -1 : 1}
                      spinTiming={SNAPPY_SPIN_TIMING}
                      transformTiming={SNAPPY_TRANSFORM_TIMING}
                      opacityTiming={SNAPPY_OPACITY_TIMING}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="brs-total pixel-font">
            <span className="brs-total-label">TOTAL</span>
            <span className="brs-total-value number-flow-container">
              <NumberFlow
                value={revealedTotal}
                format={INTEGER_FORMAT}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          </div>

          <div className="brs-stars" role="img" aria-label={`${result.stars} of ${MAX_STARS} stars`}>
            {Array.from({ length: MAX_STARS }, (_, i) => {
              const isFilled = i < filledStars;
              return (
                <span
                  key={i}
                  className={cn('brs-star', isFilled && 'brs-star--filled')}
                  style={
                    { color: isFilled ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY } as CSSProperties
                  }
                >
                  <Star className="brs-star-icon" fill="currentColor" strokeWidth={1.5} />
                </span>
              );
            })}
          </div>

          {filledStars >= result.stars && (
            <div className="brs-rank-block">
              {rankLabel && (
                <div className="brs-rank title-sign title-sign--red title-sign--text-gold">
                  <span className="brs-rank-text title-sign__text pixel-font">{rankLabel}</span>
                </div>
              )}
              {tagline && (
                <p className={cn('brs-tagline pixel-font', isCloseCall && 'brs-tagline--close')}>
                  {tagline}
                </p>
              )}
            </div>
          )}

          <ToffecButton
            variant="indigolay-red"
            onClick={onContinue}
            disabled={!canContinue}
            className={cn('brs-continue crt-top-highlight', canContinue && 'brs-continue--ready')}
          >
            Continue
          </ToffecButton>
        </div>
      </IndigolayCornersWrapper>
    </div>
  );
}
