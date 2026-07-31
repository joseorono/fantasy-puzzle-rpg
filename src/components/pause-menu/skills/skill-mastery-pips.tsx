import { cn } from '~/lib/utils';

interface SkillMasteryPipsProps {
  /** The skill's current level; pips fill up to this. */
  level: number;
  /** The skill's highest level; one pip per level. */
  maxLevel: number;
}

/**
 * A skill's level as a row of gold diamond pips, filled up to `level`. Replaces
 * the "· Lv n/m" suffix the detail panel's tier line used to carry — that line
 * wrapped, and the pips read faster anyway. The diamond echoes the `◆` bullets
 * the passive effect lines already use.
 */
export function SkillMasteryPips({ level, maxLevel }: SkillMasteryPipsProps) {
  return (
    <span className="skill-mastery" aria-label={`Level ${level} of ${maxLevel}`}>
      {Array.from({ length: maxLevel }, (_, index) => (
        <span key={index} className={cn('skill-mastery__pip', index < level && 'skill-mastery__pip--filled')} />
      ))}
    </span>
  );
}
