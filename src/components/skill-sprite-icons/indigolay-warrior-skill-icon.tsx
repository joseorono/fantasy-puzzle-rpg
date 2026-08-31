/**
 * Warrior / Berserker skill icons — 57 icons in a 10×6 grid.
 *
 * Usage:
 *   <IndigolayWarriorSkillIcon position={{ row: 0, col: 2 }} />
 *   <IndigolayWarriorSkillIcon position={{ row: 0, col: 2 }} disabled />
 *   <IndigolayWarriorSkillIcon position={{ row: 1, col: 4 }} size={48} sheetSize={64} />
 */

import { SKILL_SHEETS } from '~/constants/skill-icons';
import { IndigolaySkillIcon, type IndigolaySkillIconProps } from './indigolay-skill-icon';

export function IndigolayWarriorSkillIcon(props: IndigolaySkillIconProps) {
  return <IndigolaySkillIcon {...props} config={SKILL_SHEETS['warrior-berserker']} />;
}
