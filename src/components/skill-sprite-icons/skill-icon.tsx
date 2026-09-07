/**
 * Class-aware skill icon: picks the right Indigolay sheet for a character class
 * and renders the icon at `position`. The thin dispatch layer that lets callers
 * hold only a `CharacterClass` + `SkillIconPosition` (what skill definitions
 * carry) without ever touching sheet slugs.
 */

import type { CharacterClass } from '~/types/rpg-elements';
import { SKILL_SHEETS } from '~/constants/skill-icons';
import { CLASS_SKILL_SHEET } from '~/constants/skills';
import { IndigolaySkillIcon, type IndigolaySkillIconProps } from './indigolay-skill-icon';

export interface SkillIconProps extends IndigolaySkillIconProps {
  /** Owning class; selects the Indigolay sheet via `CLASS_SKILL_SHEET`. */
  characterClass: CharacterClass;
}

export function SkillIcon({ characterClass, ...props }: SkillIconProps) {
  return <IndigolaySkillIcon {...props} config={SKILL_SHEETS[CLASS_SKILL_SHEET[characterClass]]} />;
}
