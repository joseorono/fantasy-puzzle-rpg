import type { CharacterClass } from '~/types/rpg-elements';
import type { SkillIconPosition } from '~/types/skills';
import { SKILL_SHEETS, type SkillSheetSlug } from '~/constants/skill-icons';

/**
 * Pack index (the 1-based number in the source pack's filename, e.g. `52` in
 * `UI_SkillIcon_WR_52_ReleasePower.png`) → grid cell on the class sheet.
 *
 * The spritesheet builder (`scripts/build-skill-icon-spritesheets.py`) packs the
 * pack's zero-padded, lexically-sorted PNGs left-to-right at 10 columns, so the
 * pack's own numbering maps directly to a cell. Always reference icons through
 * this helper — a literal `{row, col}` can't be audited against a filename.
 */
export function packIcon(packIndex: number): SkillIconPosition {
  return { row: Math.floor((packIndex - 1) / 10), col: (packIndex - 1) % 10 };
}

/**
 * The Indigolay sheet each class draws its icons from. `rogue → archer-assassin`
 * and `healer → priest-paladin` are the two non-obvious pairings.
 */
export const CLASS_SKILL_SHEET: Record<CharacterClass, SkillSheetSlug> = {
  warrior: 'warrior-berserker',
  rogue: 'archer-assassin',
  mage: 'mage-sorcerer',
  healer: 'priest-paladin',
};

/** Icon count of a class's sheet — the upper bound for `packIcon` indices. */
export function classSheetIconCount(characterClass: CharacterClass): number {
  return SKILL_SHEETS[CLASS_SKILL_SHEET[characterClass]].iconCount;
}
