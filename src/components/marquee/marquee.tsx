import Marquee from 'react-fast-marquee';
import type { MarqueeTextTypes } from '~/constants/dialogue/marquee-text';
import { MARQUEE_HELP_TEXT } from '~/constants/dialogue/marquee-text';
import { cn } from '~/lib/utils';

interface MarqueeProps {
  type: MarqueeTextTypes;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

/**
 * Reusable marquee component that displays scrolling help text
 * Uses react-fast-marquee for smooth animation
 */
export function MarqueeText({ type, speed = 50, pauseOnHover = true, className }: MarqueeProps) {
  const textArray = MARQUEE_HELP_TEXT[type];
  const text = textArray.join(' • ');

  return (
    <div className={cn('marquee-container', className)}>
      <Marquee speed={speed} pauseOnHover={pauseOnHover} className="marquee-inner">
        <span className="marquee-text">{text}</span>
      </Marquee>
    </div>
  );
}
