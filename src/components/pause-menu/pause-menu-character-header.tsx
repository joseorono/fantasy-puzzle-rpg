import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';

interface PauseMenuCharacterHeaderProps {
  member: CharacterData;
}

/**
 * One-line identity strip for the pause menu's per-hero tabs (Stats, Equip): class icon chip,
 * name, class and level over a gold rule. Bars and portraits live in the party bar above.
 */
export function PauseMenuCharacterHeader({ member }: PauseMenuCharacterHeaderProps) {
  const Icon = CHARACTER_ICONS[member.class];

  return (
    <div className="pause-menu-character-header">
      <div className="pause-menu-character-header__icon">
        <Icon size={14} className={cn(CHARACTER_COLORS[member.class].icon)} />
      </div>
      <span className="pause-menu-character-header__name pixel-font">{member.name}</span>
      <span className="pause-menu-character-header__meta pixel-font">
        <span className="pause-menu-character-header__class">{member.class}</span>
        <span className="pause-menu-character-header__sep">·</span>
        <span className="pause-menu-character-header__level">Lv. {member.level}</span>
      </span>
    </div>
  );
}
