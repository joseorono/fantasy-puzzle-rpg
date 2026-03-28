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
  const expPct = Math.round(calculatePercentage(member.currentExp, member.expToNextLevel));
  const isRoster = variant === 'roster';
  const isDead = member.currentHp <= 0;

  return (
    <div
      className={cn(
        'party-member-card',
        isRoster ? 'party-member-card--roster' : 'party-member-card--bar',
        isActive && 'active',
        isDead && 'dead',
      )}
      onClick={onClick}
    >
      <div className="party-member-card__icon">
        <Icon size={isRoster ? 14 : 32} className={colors.icon} />
      </div>
      <div className="party-member-card__bars">
        <div className="party-member-card__hp-bar">
          <div
            className={cn(
              'party-member-card__hp-fill',
              HP_THRESHOLD_CLASS[getHpThreshold(hpPct)],
            )}
            style={{ width: `${hpPct}%` }}
          />
        </div>
        <div className="party-member-card__exp-bar">
          <div
            className="party-member-card__exp-fill"
            style={{ width: `${expPct}%` }}
          />
        </div>
        <div className="party-member-card__info-bar">
          <div className="party-member-card__name">{member.name}</div>
          <div className="party-member-card__detail">
            Lv.{member.level} · {isRoster ? '' : 'HP '}
            {member.currentHp}/{member.maxHp}
          </div>
        </div>
      </div>
    </div>
  );
}
