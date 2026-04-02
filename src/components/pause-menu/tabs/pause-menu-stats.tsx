import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useParty } from '~/stores/game-store';
import { CHARACTER_COLORS, CHARACTER_ICONS, SKILL_DEFINITIONS } from '~/constants/party';
import { calculateDamage, calculateSkillCooldown } from '~/lib/rpg-calculations';
import { getEffectiveStats, getEffectiveMaxHp } from '~/lib/equipment-system';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';
import { PauseMenuCharacterHeader } from '~/components/pause-menu/pause-menu-character-header';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

export function PauseMenuStats() {
  const party = useParty();
  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');

  const selected = party.find((m) => m.id === selectedId) ?? party[0];
  if (!selected) return null;

  const colors = CHARACTER_COLORS[selected.class];
  const Icon = CHARACTER_ICONS[selected.class];
  const skill = SKILL_DEFINITIONS[selected.class];

  const effectiveStats = getEffectiveStats(selected);
  const maxHp = getEffectiveMaxHp(selected);
  const attackDmg = calculateDamage(10, effectiveStats.pow);
  const cooldown = calculateSkillCooldown(selected.maxCooldown, effectiveStats.spd);

  return (
    <>
      <h2 className="mb-4">
        <NarikRedwoodBitFont text="STATS" size={1.2} />
      </h2>
      <div className="pause-menu-stats-layout">
        <div className="pause-menu-party-roster">
          {party.map((member) => (
            <PartyMemberCard
              key={member.id}
              member={member}
              variant="roster"
              isActive={member.id === selectedId}
              onClick={() => setSelectedId(member.id)}
            />
          ))}
        </div>

        <div className="pause-menu-stats-main">
          <PauseMenuCharacterHeader
            name={selected.name}
            classNameText={selected.class}
            level={selected.level}
            Icon={Icon}
            colors={colors}
          />

          <div className="pause-menu-stats-grid">
            <div className="pause-menu-stats-section">
              <h3>Core Stats</h3>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">POW</span>
                <span className="pause-menu-stat-value number-flow-container">
                  <NumberFlow
                    value={effectiveStats.pow}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">VIT</span>
                <span className="pause-menu-stat-value number-flow-container">
                  <NumberFlow
                    value={effectiveStats.vit}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">SPD</span>
                <span className="pause-menu-stat-value number-flow-container">
                  <NumberFlow
                    value={effectiveStats.spd}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
            </div>

            <div className="pause-menu-stats-section">
              <h3>Derived Stats</h3>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">HP</span>
                <span className="pause-menu-stat-value number-flow-container">
                  <NumberFlow
                    value={selected.currentHp}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                  {' / '}
                  <NumberFlow
                    value={maxHp}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">Attack</span>
                <span className="pause-menu-stat-value number-flow-container">
                  <NumberFlow
                    value={attackDmg}
                    format={INTEGER_FORMAT}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
              <div className="pause-menu-stat-row">
                <span className="pause-menu-stat-label">Cooldown</span>
                <span className="pause-menu-stat-value number-flow-container">
                  <NumberFlow
                    value={cooldown}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                    suffix="s"
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
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

