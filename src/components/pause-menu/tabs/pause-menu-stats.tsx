import { useState } from 'react';
import { useParty } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS, SKILL_DEFINITIONS } from '~/constants/party';
import { HP_THRESHOLD_HEX } from '~/constants/ui';
import { calculateMaxHp, calculateDamage, calculateSkillCooldown, getHpThreshold } from '~/lib/rpg-calculations';
import { calculatePercentage } from '~/lib/math';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';

export function PauseMenuStats() {
  const party = useParty();
  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');

  const selected = party.find((m) => m.id === selectedId) ?? party[0];
  if (!selected) return null;

  const colors = CHARACTER_COLORS[selected.class];
  const Icon = CHARACTER_ICONS[selected.class];
  const skill = SKILL_DEFINITIONS[selected.class];

  const maxHp = calculateMaxHp(selected.baseHp, selected.stats.vit, selected.vitHpMultiplier);
  const attackDmg = calculateDamage(10, selected.stats.pow);
  const cooldown = calculateSkillCooldown(selected.maxCooldown, selected.stats.spd);

  return (
    <>
      <h2>Stats</h2>
      <div className="pause-menu-stats-layout">
        <div className="pause-menu-party-roster">
          {party.map((member) => (
            <RosterCard
              key={member.id}
              member={member}
              isActive={member.id === selectedId}
              onClick={() => setSelectedId(member.id)}
            />
          ))}
        </div>

        <div className="pause-menu-stats-main">
          <div className="pause-menu-stats-header">
            <div className={cn('pause-menu-stats-icon', colors.bg)}>
              <Icon size={24} className={colors.icon} />
            </div>
            <div>
              <div className="pause-menu-stats-name">{selected.name}</div>
              <div className="pause-menu-stats-class">
                {selected.class} · Lv. {selected.level}
              </div>
            </div>
          </div>

          <div className="pause-menu-stats-grid">
            <div className="pause-menu-stats-section">
              <h3>Core Stats</h3>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">POW</span>
                <span className="pause-menu-stat-value">{selected.stats.pow}</span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">VIT</span>
                <span className="pause-menu-stat-value">{selected.stats.vit}</span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">SPD</span>
                <span className="pause-menu-stat-value">{selected.stats.spd}</span>
              </div>
            </div>

            <div className="pause-menu-stats-section">
              <h3>Derived Stats</h3>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">HP</span>
                <span className="pause-menu-stat-value">
                  {selected.currentHp} / {maxHp}
                </span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">Attack</span>
                <span className="pause-menu-stat-value">{attackDmg}</span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">Cooldown</span>
                <span className="pause-menu-stat-value">{cooldown.toFixed(1)}s</span>
              </div>
            </div>
          </div>

          <div className="pause-menu-stats-skill">
            <div className="pause-menu-stats-skill-name">
              {skill.icon} {skill.name}
            </div>
            <div className="pause-menu-stats-skill-desc">{skill.description}</div>
          </div>
        </div>
      </div>
    </>
  );
}

interface RosterCardProps {
  member: CharacterData;
  isActive: boolean;
  onClick: () => void;
}

function RosterCard({ member, isActive, onClick }: RosterCardProps) {
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
