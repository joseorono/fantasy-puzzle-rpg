import { useEffect, useState } from 'react';
import { BATTLE_CALLOUT_DURATION_MS } from '~/constants/battle';

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

interface BattleCalloutProps {
  /** Event that replays the callout; a new timestamp restarts the animation. */
  trigger: { timestamp: number } | null;
  label: string;
  color: string;
}

/**
 * Centered one-shot text callout for battle events. Reuses the damage-number float animation
 * so every callout reads as part of the same combat-feedback language.
 */
export function BattleCallout({ trigger, label, color }: BattleCalloutProps) {
  const [visible, setVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    setAnimationKey((prev) => prev + 1);

    const timer = setTimeout(() => setVisible(false), BATTLE_CALLOUT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      key={animationKey}
      className="motion-hold pointer-events-none absolute top-1/2 left-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ animation: `damage-float ${BATTLE_CALLOUT_DURATION_MS}ms ease-out forwards` }}
    >
      <span
        className="pixel-font text-lg font-bold whitespace-nowrap sm:text-2xl"
        style={{ color, textShadow: TEXT_SHADOW, imageRendering: 'pixelated' }}
      >
        {label}
      </span>
    </div>
  );
}
