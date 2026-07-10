import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { lastPreemptiveStrikeAtom } from '~/stores/battle-atoms';

/** Warm near-black pixel outline + soft halo, mirroring the damage numbers so the callout
 *  stays readable over any battle background without a box. */
const OUTLINE = '#160a06';
const TEXT_SHADOW = [
  `-2px 0 0 ${OUTLINE}`,
  `2px 0 0 ${OUTLINE}`,
  `0 -2px 0 ${OUTLINE}`,
  `0 2px 0 ${OUTLINE}`,
  `-2px -2px 0 ${OUTLINE}`,
  `2px -2px 0 ${OUTLINE}`,
  `-2px 2px 0 ${OUTLINE}`,
  `2px 2px 0 ${OUTLINE}`,
  '0 3px 6px rgba(0,0,0,0.6)',
].join(', ');

/**
 * Centered "Preemptive Strike!" callout that flashes when a hit lands on a still-observing
 * enemy (see {@link lastPreemptiveStrikeAtom}). Reuses the damage-number float animation so it
 * reads as part of the same combat-feedback language.
 */
export function PreemptiveStrikeIndicator() {
  const lastPreemptiveStrike = useAtomValue(lastPreemptiveStrikeAtom);
  const [visible, setVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!lastPreemptiveStrike) return;
    setVisible(true);
    setAnimationKey((prev) => prev + 1);

    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, [lastPreemptiveStrike]);

  if (!visible) return null;

  return (
    <div
      key={animationKey}
      className="pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ animation: 'damage-float 1.2s ease-out forwards' }}
    >
      <span
        className="pixel-font text-lg font-bold whitespace-nowrap sm:text-2xl"
        style={{ color: '#ffd47a', textShadow: TEXT_SHADOW, imageRendering: 'pixelated' }}
      >
        Preemptive Strike!
      </span>
    </div>
  );
}
