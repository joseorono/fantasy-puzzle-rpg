import { useEffect, useState, type CSSProperties } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import type {
  TitleSignRequest,
  TitleSignSize,
  TitleSignTextColor,
  TitleSignVariant,
} from '~/stores/title-sign-atoms';

/** Defaults for every optional field of a {@link TitleSignRequest}. */
const TITLE_SIGN_DEFAULTS = {
  VARIANT: 'tan',
  SIZE: 'md',
  POSITION: 'top',
  HOLD_MS: 2000,
  HAS_ENTRY_ANIMATION: true,
} as const;

/**
 * Default text colour per ribbon variant. The tan ribbon is light, so dark text
 * reads best on it; the red/large ribbons keep the warm gold.
 */
const DEFAULT_TEXT_COLOR_BY_VARIANT: Record<TitleSignVariant, TitleSignTextColor> = {
  tan: 'dark',
  red: 'gold',
  large: 'gold',
};

/** Slide-in animation duration (must match the CSS keyframe duration). */
const ENTRY_DURATION_MS = 500;
/** Slide-out animation duration (must match the CSS keyframe duration). */
const EXIT_DURATION_MS = 400;

/** Scale multiplier per size; multiplies ribbon width, padding and font together. */
const SIZE_SCALE: Record<TitleSignSize, number> = {
  sm: 0.75,
  md: 1,
  lg: 1.5,
};

/**
 * Styling variants for the ribbon. Mirrors the literal unions in
 * `title-sign-atoms.ts`. `size` is tracked here for completeness, but the
 * actual scaling is driven by the `--ts-scale` custom property (see SIZE_SCALE).
 */
const titleSignVariants = cva('title-sign', {
  variants: {
    variant: {
      tan: 'title-sign--tan',
      red: 'title-sign--red',
      large: 'title-sign--large',
    },
    textColor: {
      gold: 'title-sign--text-gold',
      cream: 'title-sign--text-cream',
      white: 'title-sign--text-white',
      dark: 'title-sign--text-dark',
    },
    size: {
      sm: 'title-sign--sm',
      md: 'title-sign--md',
      lg: 'title-sign--lg',
    },
    position: {
      top: 'title-sign--top',
      bottom: 'title-sign--bottom',
      left: 'title-sign--left',
      right: 'title-sign--right',
      center: 'title-sign--center',
    },
  },
  defaultVariants: {
    variant: TITLE_SIGN_DEFAULTS.VARIANT,
    textColor: DEFAULT_TEXT_COLOR_BY_VARIANT[TITLE_SIGN_DEFAULTS.VARIANT],
    size: TITLE_SIGN_DEFAULTS.SIZE,
    position: TITLE_SIGN_DEFAULTS.POSITION,
  },
});

type Phase = 'entering' | 'holding' | 'exiting';

const PHASE_CLASS: Record<Phase, string> = {
  entering: 'title-sign--entering',
  holding: 'title-sign--holding',
  exiting: 'title-sign--exiting',
};

interface TitleSignProps {
  request: TitleSignRequest;
  /** Called once the exit animation finishes; clears the active sign. */
  onDismiss: () => void;
}

/**
 * Decorative location banner that slides in from off-screen, rests, then
 * retracts. Renders in a fixed, click-through layer so it never blocks the
 * screen underneath. When `holdMs` is `null` the ribbon stays until clicked.
 */
export function TitleSign({ request, onDismiss }: TitleSignProps) {
  const {
    text,
    variant = TITLE_SIGN_DEFAULTS.VARIANT,
    textColor,
    size = TITLE_SIGN_DEFAULTS.SIZE,
    position = TITLE_SIGN_DEFAULTS.POSITION,
    holdMs = TITLE_SIGN_DEFAULTS.HOLD_MS,
    hasEntryAnimation = TITLE_SIGN_DEFAULTS.HAS_ENTRY_ANIMATION,
  } = request;

  // Fall back to the per-variant default colour when the request doesn't set one.
  const resolvedTextColor = textColor ?? DEFAULT_TEXT_COLOR_BY_VARIANT[variant];

  const [phase, setPhase] = useState<Phase>(hasEntryAnimation ? 'entering' : 'holding');

  // entering → holding once the slide-in completes
  useEffect(() => {
    if (phase !== 'entering') return;
    const timer = setTimeout(() => setPhase('holding'), ENTRY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // holding → exiting after the rest time (skipped when holdMs is null)
  useEffect(() => {
    if (phase !== 'holding' || holdMs === null || holdMs === undefined) return;
    const timer = setTimeout(() => setPhase('exiting'), holdMs);
    return () => clearTimeout(timer);
  }, [phase, holdMs]);

  // exiting → dismiss once the slide-out completes
  useEffect(() => {
    if (phase !== 'exiting') return;
    const timer = setTimeout(onDismiss, EXIT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase, onDismiss]);

  const isClickToDismiss = holdMs === null;
  const handleClick = () => {
    if (isClickToDismiss && phase === 'holding') setPhase('exiting');
  };

  return (
    <div className="title-sign-layer" aria-hidden>
      <div
        className={cn(
          titleSignVariants({ variant, textColor: resolvedTextColor, size, position }),
          PHASE_CLASS[phase],
          isClickToDismiss && 'title-sign--dismissable',
        )}
        style={{ '--ts-scale': SIZE_SCALE[size] } as CSSProperties}
        onClick={isClickToDismiss ? handleClick : undefined}
      >
        <span className="title-sign__text pixel-font">{text}</span>
      </div>
    </div>
  );
}
