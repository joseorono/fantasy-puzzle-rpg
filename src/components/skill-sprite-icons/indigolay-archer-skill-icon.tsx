/**
 * Archer / Assassin skill icons — 84 icons in a 10×9 grid.
 *
 * Usage:
 *   <IndigolayArcherSkillIcon position={{ row: 0, col: 2 }} />
 *   <IndigolayArcherSkillIcon position={{ row: 0, col: 2 }} disabled />
 *   <IndigolayArcherSkillIcon position={{ row: 1, col: 4 }} size={48} sheetSize={64} />
 */

import { SKILL_SHEETS } from '~/constants/skill-icons';
import { IndigolaySkillIcon, type IndigolaySkillIconProps } from './indigolay-skill-icon';

export function IndigolayArcherSkillIcon(props: IndigolaySkillIconProps) {
  return <IndigolaySkillIcon {...props} config={SKILL_SHEETS['archer-assassin']} />;
}
