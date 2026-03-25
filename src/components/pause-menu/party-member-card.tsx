import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { HP_THRESHOLD_CLASS } from '~/constants/ui';
import { calculatePercentage } from '~/lib/math';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';

interface PartyMemberCardProps {
  member: CharacterData;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'bar' | 'roster';
}

export function PartyMemberCard({
  member,
  isActive,
  onClick,
  variant = 'bar',
}: PartyMemberCardProps) {
  const colors = CHARACTER_COLORS[member.class];
  const Icon = CHARACTER_ICONS[member.class];
  const hpPct = Math.round(calculatePercentage(member.currentHp, member.maxHp));
  const isRoster = variant === 'roster';

  return (
    <div
      className={cn(
        'party-member-card',
        isRoster ? 'party-member-card--roster' : 'party-member-card--bar',
        isActive && 'active',
      )}
      onClick={onClick}
    >
      <div className={cn('party-member-card__icon', colors.bg)}>
        <Icon size={isRoster ? 14 : 16} className={colors.icon} />
      </div>
      <div className="party-member-card__info">
        <div className="party-member-card__name">{member.name}</div>
        <div className="party-member-card__detail">
          Lv.{member.level} · {isRoster ? '' : 'HP '}
          {member.currentHp}/{member.maxHp}
        </div>
        <div className="party-member-card__hp-bar">
          <div
            className={cn(
              'party-member-card__hp-fill',
              HP_THRESHOLD_CLASS[getHpThreshold(hpPct)],
            )}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
