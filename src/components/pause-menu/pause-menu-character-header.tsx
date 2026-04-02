import type { ElementType } from 'react';
import { cn } from '~/lib/utils';

interface HeaderIconProps {
  className?: string;
  size?: number;
}

interface HeaderColors {
  bg: string;
  icon: string;
}

interface PauseMenuCharacterHeaderProps {
  name: string;
  classNameText: string;
  level: number;
  Icon: ElementType<HeaderIconProps>;
  colors: HeaderColors;
}

export function PauseMenuCharacterHeader({
  name,
  classNameText,
  level,
  Icon,
  colors,
}: PauseMenuCharacterHeaderProps) {
  return (
    <div className="pause-menu-equip-header">
      <div className={cn('pause-menu-stats-icon', colors.bg)}>
        <Icon size={16} className={colors.icon} />
      </div>
      <div className="pause-menu-equip-header-line">
        <div className="pause-menu-stats-name">{name}</div>
        <span className="pause-menu-equip-header-separator">|</span>
        <div className="pause-menu-stats-class">{classNameText}</div>
        <span className="pause-menu-equip-header-separator">|</span>
        <div className="pause-menu-equip-header-level">Lv. {level}</div>
      </div>
    </div>
  );
}
