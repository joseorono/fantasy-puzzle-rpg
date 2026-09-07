/**
 * Mage / Sorcerer skill icons — 74 icons in a 10×8 grid.
 *
 * Usage:
 *   <IndigolayMageSkillIcon position={{ row: 0, col: 2 }} />
 *   <IndigolayMageSkillIcon position={{ row: 0, col: 2 }} disabled />
 *   <IndigolayMageSkillIcon position={{ row: 1, col: 4 }} size={48} sheetSize={64} />
 */

import { SKILL_SHEETS } from '~/constants/skill-icons';
import { IndigolaySkillIcon, type IndigolaySkillIconProps } from './indigolay-skill-icon';

export function IndigolayMageSkillIcon(props: IndigolaySkillIconProps) {
  return <IndigolaySkillIcon {...props} config={SKILL_SHEETS['mage-sorcerer']} />;
}
