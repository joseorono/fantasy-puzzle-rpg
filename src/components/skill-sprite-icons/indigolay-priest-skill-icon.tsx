/**
 * Priest / Paladin skill icons — 56 icons in a 10×6 grid.
 *
 * Usage:
 *   <IndigolayPriestSkillIcon position={{ row: 0, col: 2 }} />
 *   <IndigolayPriestSkillIcon position={{ row: 0, col: 2 }} disabled />
 *   <IndigolayPriestSkillIcon position={{ row: 1, col: 4 }} size={48} sheetSize={64} />
 */

import { SKILL_SHEETS } from '~/constants/skill-icons';
import { IndigolaySkillIcon, type IndigolaySkillIconProps } from './indigolay-skill-icon';

export function IndigolayPriestSkillIcon(props: IndigolaySkillIconProps) {
  return <IndigolaySkillIcon {...props} config={SKILL_SHEETS['priest-paladin']} />;
}
