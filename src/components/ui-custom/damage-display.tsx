import { cn } from '~/lib/utils';
import type { DamageDisplayProps } from '~/types/components';

/** Numeral fill per hit type — the only thing carrying the type now (boxless). */
function getNumeralColor(type: DamageDisplayProps['type']): string {
  switch (type) {
    case 'heal':
      return '#9bf0a6';
    case 'critical':
      return '#ffd47a';
    case 'damage':
    default:
      return '#ff8a78';
  }
}

/** Warm near-black, built into a chunky 2px pixel outline + a soft dark halo so the
 *  numerals stay readable over any battle background without a box or border. */
const OUTLINE = '#160a06';
const NUMERAL_SHADOW = [
  `-2px 0 0 ${OUTLINE}`,
  `2px 0 0 ${OUTLINE}`,
  `0 -2px 0 ${OUTLINE}`,
  `0 2px 0 ${OUTLINE}`,
  `-2px -2px 0 ${OUTLINE}`,
  `2px -2px 0 ${OUTLINE}`,
  `-2px 2px 0 ${OUTLINE}`,
  `2px 2px 0 ${OUTLINE}`,
  '0 3px 4px rgba(0,0,0,0.55)',
].join(', ');

export function DamageDisplay({ amount, type, className }: DamageDisplayProps) {
  return (
    <div
      className={cn('animate-in zoom-in relative inline-flex items-center justify-center duration-150', className)}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Boxless — bold numerals, thick dark pixel outline + soft halo. No box, no border. */}
      <span
        className="pixel-font-alt relative z-10 text-xl font-bold md:text-2xl"
        style={{ color: getNumeralColor(type), textShadow: NUMERAL_SHADOW }}
      >
        {type === 'heal' ? '+' : '-'}
        {amount}
      </span>
    </div>
  );
}
