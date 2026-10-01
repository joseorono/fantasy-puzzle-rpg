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
  /**
   * `bar`: full card for the party bar. `roster`: the full card, selectable.
   * `slim`: selectable portrait + name + class, no bars — for rosters shown under the party bar.
   */
  variant?: 'bar' | 'roster' | 'slim';
  /** Show the keyboard cursor ring (roster keyboard navigation rests on this card). */
  isKeyboardCursor?: boolean;
  /** Show the EXP breakdown tooltip on hover. */
  showTooltips?: boolean;
}

export function PartyMemberCard({
  member,
  isActive,
  onClick,
  variant = 'bar',
  isKeyboardCursor = false,
  showTooltips = true,
}: PartyMemberCardProps) {
  const hpPct = Math.round(calculatePercentage(member.currentHp, member.maxHp));
  const expThreshold = getExpThresholdForLevel(member.level);
  const expPct = Math.round(calculatePercentage(member.currentLevelExp, expThreshold));
  const isMaxLevel = member.level >= MAX_LEVEL;
  const isDead = member.currentHp <= 0;
  const cardClassName = cn(
    'party-member-card',
    variant === 'bar' ? 'party-member-card--bar' : 'party-member-card--roster',
    variant === 'slim' && 'party-member-card--slim',
    isActive && 'active',
    isDead && 'dead',
    isKeyboardCursor && 'kb-cursor',
  );

  if (variant === 'slim') {
    return (
      <div className={cardClassName} onClick={onClick}>
        <PartyPortraitFrame
          className="party-member-card__portrait"
          characterClass={member.class}
          level={member.level}
          alt={member.name}
        />
        <div className="party-member-card__header">
          <span className="party-member-card__name">{member.name}</span>
          <span className="party-member-card__class">{member.class}</span>
        </div>
      </div>
    );
  }

  const expBar = (
    <IndigolayBar className="party-member-card__exp-bar" variant="yellow" size="sm" percentage={expPct} />
  );

  return (
    <div className={cardClassName} onClick={onClick}>
      <PartyPortraitFrame
        className="party-member-card__portrait"
        characterClass={member.class}
        level={member.level}
        alt={member.name}
      />
      <div className="party-member-card__body">
        <div className="party-member-card__header">
          <span className="party-member-card__name">{member.name}</span>
          <span className="party-member-card__class">{member.class}</span>
        </div>
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
          <img src="/assets/icons/indigolay/icon-star.png" alt="EXP" className="party-member-card__stat-icon" />
          {showTooltips ? (
            <Tooltip>
              <TooltipTrigger>{expBar}</TooltipTrigger>
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
          ) : (
            expBar
          )}
        </div>
      </div>
    </div>
  );
}
