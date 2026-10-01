import { MAX_LEVEL } from '~/constants/party';
import { HP_THRESHOLD_BAR_VARIANT } from '~/constants/ui';
import { IndigolayBar } from '~/components/ui-custom/indigolay-bar';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { PartyPortraitFrame } from '~/components/party/party-portrait-frame';
import { calculatePercentage } from '~/lib/math';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { getExpThresholdForLevel } from '~/lib/leveling-system';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';

interface PartyMemberCardProps {
  member: CharacterData;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'bar' | 'roster';
  /** Show the keyboard cursor ring (roster keyboard navigation rests on this card). */
  isKeyboardCursor?: boolean;
}

export function PartyMemberCard({
  member,
  isActive,
  onClick,
  variant = 'bar',
  isKeyboardCursor = false,
}: PartyMemberCardProps) {
  const hpPct = Math.round(calculatePercentage(member.currentHp, member.maxHp));
  const expThreshold = getExpThresholdForLevel(member.level);
  const expPct = Math.round(calculatePercentage(member.currentLevelExp, expThreshold));
  const isMaxLevel = member.level >= MAX_LEVEL;
  const isRoster = variant === 'roster';
  const isDead = member.currentHp <= 0;

  return (
    <div
      className={cn(
        'party-member-card',
        isRoster ? 'party-member-card--roster' : 'party-member-card--bar',
        isActive && 'active',
        isDead && 'dead',
        isKeyboardCursor && 'kb-cursor',
      )}
      onClick={onClick}
    >
      <PartyPortraitFrame
        className="party-member-card__portrait"
        characterClass={member.class}
        level={member.level}
        alt={member.name}
      />
      <div className="party-member-card__body">
        <div className="party-member-card__name">{member.name}</div>
        <div className="party-member-card__stat-row">
          <img src="/assets/icons/indigolay/icon-hp.png" alt="HP" className="party-member-card__stat-icon" />
          <IndigolayBar
            className="party-member-card__hp-bar"
            variant={HP_THRESHOLD_BAR_VARIANT[getHpThreshold(hpPct)]}
            size="sm"
            percentage={hpPct}
            label={`${member.currentHp}/${member.maxHp}`}
          />
        </div>
        <div className="party-member-card__stat-row">
          <span className="party-member-card__stat-tag pixel-font">EXP</span>
          <Tooltip>
            <TooltipTrigger>
              <IndigolayBar className="party-member-card__exp-bar" variant="yellow" size="xs" percentage={expPct} />
            </TooltipTrigger>
            <TooltipContent size="compact" className="exp-bar-tooltip">
              {isMaxLevel ? (
                <span>Max level</span>
              ) : (
                <>
                  <span>
                    EXP {member.currentLevelExp} / {expThreshold}
                  </span>
                  <span className="exp-bar-tooltip__next">
                    {expThreshold - member.currentLevelExp} to Lv.{member.level + 1}
                  </span>
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
