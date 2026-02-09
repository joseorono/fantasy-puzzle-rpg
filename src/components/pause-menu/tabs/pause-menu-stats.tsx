import { useState } from 'react';
import { useParty } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS, SKILL_DEFINITIONS } from '~/constants/party';
import { calculateMaxHp, calculateDamage, calculateSkillCooldown } from '~/lib/rpg-calculations';
import { cn } from '~/lib/utils';
import { RosterCard } from '~/components/pause-menu/roster-card';

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

