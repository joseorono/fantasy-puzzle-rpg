/**
 * A skill icon seated on the Indigolay gold eight-point deco frame
 * (`indigolay-skill-slot-deco.png`). The featured-icon treatment used by the
 * Skills tab detail panel and the unlock celebration overlays.
 */

import type { CharacterClass } from '~/types/rpg-elements';
import type { SkillIconPosition } from '~/types/skills';
import { SkillIcon } from './skill-icon';

/** Native deco art is 169x172; the flat interior square holds the icon. */
const DECO_ASPECT = 172 / 169;
/** Fraction of the deco width the seated icon occupies. */
const DECO_ICON_FRACTION = 0.58;

interface SkillDecoIconProps {
  characterClass: CharacterClass;
  position: SkillIconPosition;
  /** Rendered deco width in px (height follows the art's aspect). */
  size?: number;
  className?: string;
}

export function SkillDecoIcon({ characterClass, position, size = 96, className }: SkillDecoIconProps) {
  const iconSize = Math.round(size * DECO_ICON_FRACTION);
  return (
    <span
      className={className ? `skill-deco-icon ${className}` : 'skill-deco-icon'}
      style={{ width: size, height: Math.round(size * DECO_ASPECT) }}
    >
      <img
        className="skill-deco-icon__frame"
        src="/assets/skills/ui/indigolay-skill-slot-deco.png"
        alt=""
        draggable={false}
      />
      <SkillIcon
        characterClass={characterClass}
        position={position}
        size={iconSize}
        sheetSize={64}
        className="skill-deco-icon__icon"
      />
    </span>
  );
}
