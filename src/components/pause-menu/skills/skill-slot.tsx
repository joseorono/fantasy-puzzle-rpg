import type { KeyboardEvent, Ref } from 'react';
import { cn } from '~/lib/utils';
import type { CharacterClass } from '~/types/rpg-elements';
import type { SkillIconPosition } from '~/types/skills';
import { SkillIcon } from '~/components/skill-sprite-icons/skill-icon';
import { LevelTag } from '~/components/ui-custom/level-tag';

/** Native slot-frame art is 137x147; rendered size keeps that aspect. */
const SLOT_ASPECT = 147 / 137;
/** Fraction of the slot width the seated icon occupies (frame interior is ~107/137). */
const SLOT_ICON_FRACTION = 0.76;

interface SkillSlotProps {
  characterClass: CharacterClass;
  icon: SkillIconPosition;
  name: string;
  /** Greys the icon and shows the level gate tag. */
  locked: boolean;
  /** Level requirement shown on the tag while locked. */
  unlockLevel: number;
  /** This slot is the detail panel's current subject. */
  selected: boolean;
  /** This active skill is the character's equipped Ultimate. */
  equipped?: boolean;
  /** Rendered slot width in px. */
  size?: number;
  disabled?: boolean;
  onSelect: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

/**
 * One framed skill slot: the Indigolay slot art with the skill's icon seated in
 * its interior. Frame states (normal / hover / selected) are stacked layers
 * crossfaded on opacity — the same technique `IndigolaySkillIcon` uses for its
 * disabled twin. Locked slots grey the icon (the sheet's built-in disabled
 * variant) and hang the red `LevelTag` pennant with the required level.
 */
export function SkillSlot({
  characterClass,
  icon,
  name,
  locked,
  unlockLevel,
  selected,
  equipped = false,
  size = 84,
  disabled = false,
  onSelect,
  onKeyDown,
  buttonRef,
}: SkillSlotProps) {
  const iconSize = Math.round(size * SLOT_ICON_FRACTION);
  return (
    <button
      ref={buttonRef}
      type="button"
      className={cn('skill-slot', { locked, equipped, active: selected, disabled })}
      style={{ width: size, height: Math.round(size * SLOT_ASPECT) }}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={equipped}
      aria-label={locked ? `${name} (locked, level ${unlockLevel})` : name}
    >
      <img
        className="skill-slot__frame skill-slot__frame--normal"
        src="/assets/skills/ui/indigolay-slot-normal.png"
        alt=""
        draggable={false}
      />
      <img
        className="skill-slot__frame skill-slot__frame--hover"
        src="/assets/skills/ui/indigolay-slot-hover.png"
        alt=""
        draggable={false}
      />
      <img
        className="skill-slot__frame skill-slot__frame--selected"
        src="/assets/skills/ui/indigolay-slot-selected.png"
        alt=""
        draggable={false}
      />
      <SkillIcon
        characterClass={characterClass}
        position={icon}
        disabled={locked}
        size={iconSize}
        sheetSize={64}
        className="skill-slot__icon"
      />
      {equipped && (
        <img
          className="skill-slot__equipped-mark"
          src="/assets/skills/ui/indigolay-icon-equip.png"
          alt="Equipped"
          draggable={false}
        />
      )}
      {locked && <LevelTag level={unlockLevel} className="skill-slot__level-tag" />}
    </button>
  );
}
