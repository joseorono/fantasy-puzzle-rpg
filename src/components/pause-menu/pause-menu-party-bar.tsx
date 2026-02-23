import NumberFlow from '@number-flow/react';
import { useParty } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { HP_THRESHOLD_CLASS } from '~/constants/ui';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { calculatePercentage } from '~/lib/math';
import { cn } from '~/lib/utils';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

export function PauseMenuPartyBar() {
  const party = useParty();

  return (
    <div className="pause-menu-party-bar">
      {party.map((member) => {
        const colors = CHARACTER_COLORS[member.class];
        const Icon = CHARACTER_ICONS[member.class];
        const hpPct = Math.round(calculatePercentage(member.currentHp, member.maxHp));

        return (
          <div key={member.id} className="pause-menu-party-member">
            <div className={cn('pause-menu-party-icon', colors.bg)}>
              <Icon size={16} className={colors.icon} />
            </div>
            <div className="pause-menu-party-info">
              <div className="pause-menu-party-name">{member.name}</div>
              <div className="pause-menu-party-detail number-flow-container">
                Lv.{member.level} · HP{' '}
                <NumberFlow
                  value={member.currentHp}
                  format={INTEGER_FORMAT}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
                /
                <NumberFlow
                  value={member.maxHp}
                  format={INTEGER_FORMAT}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </div>
              <div className="pause-menu-party-hp-bar">
                <div
                  className={cn('pause-menu-party-hp-fill', HP_THRESHOLD_CLASS[getHpThreshold(hpPct)])}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
