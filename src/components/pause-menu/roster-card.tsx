import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { HP_THRESHOLD_HEX } from '~/constants/ui';
import { calculatePercentage } from '~/lib/math';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';

interface RosterCardProps {
  member: CharacterData;
  isActive: boolean;
  onClick: () => void;
}

export function RosterCard({ member, isActive, onClick }: RosterCardProps) {
  const colors = CHARACTER_COLORS[member.class];
  const Icon = CHARACTER_ICONS[member.class];
  const hpPct = Math.round(calculatePercentage(member.currentHp, member.maxHp));

  return (
    <div
      className={cn('pause-menu-roster-card', isActive && 'active')}
      onClick={onClick}
    >
      <div className={cn('pause-menu-roster-icon', colors.bg)}>
        <Icon size={14} className={colors.icon} />
      </div>
      <div className="pause-menu-roster-info">
        <div className="pause-menu-roster-name">{member.name}</div>
        <div className="pause-menu-roster-detail">
          Lv.{member.level} · {member.currentHp}/{member.maxHp}
        </div>
        <div className="pause-menu-roster-hp">
          <div
            className="pause-menu-roster-hp-fill"
            style={{ width: `${hpPct}%`, background: HP_THRESHOLD_HEX[getHpThreshold(hpPct)] }}
          />
        </div>
      </div>
    </div>
  );
}
