import { cn } from '~/lib/utils';

interface SkillMasteryPipsProps {
  /** The skill's current level; pips fill up to this. */
  level: number;
  /** The skill's highest level; one pip per level. */
  maxLevel: number;
  /** `slot` is the smaller set that hangs off a SkillSlot's corner. */
  size?: 'default' | 'slot';
  className?: string;
}

/**
 * A skill's level as a row of gold diamond pips, filled up to `level`. Used by
 * the detail panel's header — where it replaced the "· Lv n/m" suffix that
 * wrapped the tier line — and by each SkillSlot's corner. The diamond echoes
 * both the `◆` passive bullets and the gold gems on the slot frame art.
 *
 * Pips trade the exact number for at-a-glance reading, so every surface that
 * shows them also names the level in its tooltip.
 */
export function SkillMasteryPips({ level, maxLevel, size = 'default', className }: SkillMasteryPipsProps) {
  return (
    <span
      className={cn('skill-mastery', size === 'slot' && 'skill-mastery--slot', className)}
      aria-label={`Level ${level} of ${maxLevel}`}
    >
      {Array.from({ length: maxLevel }, (_, index) => (
        <span key={index} className={cn('skill-mastery__pip', index < level && 'skill-mastery__pip--filled')} />
      ))}
    </span>
  );
}
