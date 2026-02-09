import { useParty } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS } from '~/constants/party';
import { cn } from '~/lib/utils';

function getHpBarClass(currentHp: number, maxHp: number): string {
  const pct = (currentHp / maxHp) * 100;
  if (pct > 50) return 'full';
  if (pct > 25) return 'medium';
  return 'low';
}

export function PauseMenuPartyBar() {
  const party = useParty();

  return (
    <div className="pause-menu-party-bar">
      {party.map((member) => {
        const colors = CHARACTER_COLORS[member.class];
        const Icon = CHARACTER_ICONS[member.class];
        const hpPct = Math.round((member.currentHp / member.maxHp) * 100);

        return (
          <div key={member.id} className="pause-menu-party-member">
            <div className={cn('pause-menu-party-icon', colors.bg)}>
              <Icon size={16} className={colors.icon} />
            </div>
            <div className="pause-menu-party-info">
              <div className="pause-menu-party-name">{member.name}</div>
              <div className="pause-menu-party-detail">
                Lv.{member.level} · HP {member.currentHp}/{member.maxHp}
              </div>
              <div className="pause-menu-party-hp-bar">
                <div
                  className={cn('pause-menu-party-hp-fill', getHpBarClass(member.currentHp, member.maxHp))}
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
