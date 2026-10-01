import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useParty } from '~/stores/game-store';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { CHARACTER_SPRITES, MAX_LEVEL } from '~/constants/party';
import { getSelectedSkill } from '~/lib/skill-system';
import { getEffectiveStats, getEffectiveMaxHp } from '~/lib/equipment-system';
import { getExpThresholdForLevel } from '~/lib/leveling-system';
import { calculatePercentage } from '~/lib/math';
import { PartyMemberCard } from '~/components/party/party-member-card';
import { PauseMenuTabHeader } from '~/components/pause-menu/pause-menu-tab-header';
import { DerivedStatsDisplay } from '~/components/level-up-screen/derived-stats-display';
import { SkillDetailPanel } from '~/components/skills/skill-detail-panel';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { GradientDivider } from '~/components/dividers/gradient-divider';
import { IndigolayBar } from '~/components/ui-custom/indigolay-bar';
import { LevelTag } from '~/components/ui-custom/level-tag';
import type { StatType } from '~/types/rpg-elements';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

/** Core stat rows, in display order, with their indigolay icons. */
const CORE_STAT_ROWS: { stat: StatType; label: string; icon: string }[] = [
  { stat: 'pow', label: 'POW', icon: '/assets/icons/indigolay/icon-sys-attack.png' },
  { stat: 'vit', label: 'VIT', icon: '/assets/icons/indigolay/icon-hp.png' },
  { stat: 'spd', label: 'SPD', icon: '/assets/icons/indigolay/Icon_clock-fill.png' },
];

interface PauseMenuStatsProps {
  /** The content zone owns the keyboard — arrows act on the roster. */
  keyboardActive?: boolean;
  /** Fired when ← hands the keyboard back to the sidebar. */
  onExitToSidebar?: () => void;
}

export function PauseMenuStats({ keyboardActive = false, onExitToSidebar }: PauseMenuStatsProps) {
  const party = useParty();
  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');

  // The roster cursor IS the selected member (activate-on-land, like the sidebar
  // tabs), so ↑↓ needs no extra selection state. This tab has no main column.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      const currentIndex = party.findIndex((m) => m.id === selectedId);
      const step = direction === 'down' ? 1 : -1;
      const next = party[(currentIndex + step + party.length) % party.length];
      if (next && next.id !== selectedId) {
        soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
        setSelectedId(next.id);
      }
      return;
    }

    if (direction === 'left') {
      event.preventDefault();
      onExitToSidebar?.();
      return;
    }

    // → / Enter: swallowed — everything to the right is read-only.
    if (direction === 'right' || isConfirmKey(event.key)) {
      event.preventDefault();
    }
  }, keyboardActive);

  const selected = party.find((m) => m.id === selectedId) ?? party[0];
  if (!selected) return null;

  const activeSkill = getSelectedSkill(selected);
  const effectiveStats = getEffectiveStats(selected);
  const maxHp = getEffectiveMaxHp(selected);
  const expThreshold = getExpThresholdForLevel(selected.level);
  const isMaxLevel = selected.level >= MAX_LEVEL;

  return (
    <>
      <PauseMenuTabHeader text="Stats" hint="Review each hero's stats and active skill." />
      <div className="pause-menu-stats-layout">
        <div className="party-roster">
          {party.map((member) => (
            <PartyMemberCard
              key={member.id}
              member={member}
              variant="roster"
              isActive={member.id === selectedId}
              isKeyboardCursor={keyboardActive && member.id === selectedId}
              onClick={() => setSelectedId(member.id)}
            />
          ))}
        </div>

        <div className="pause-menu-stats-main">
          {/* Hero panel: the Level Up identity block (portrait, name, EXP/HP rows) at pause-menu scale. */}
          <div className="character-info-panel pause-menu-stats-hero">
            <div className="pause-menu-stats-portrait">
              <img src={CHARACTER_SPRITES[selected.class].face} alt={selected.name} />
              <LevelTag level={selected.level} />
            </div>
            <div className="pause-menu-stats-identity">
              <div className="pause-menu-stats-identity__name pixel-font">{selected.name}</div>
              <div className="pause-menu-stats-identity__class pixel-font">{selected.class}</div>
              <div className="progress-section">
                <div className="stat-label">
                  <NarikWoodBitFont text="EXP" size={1} />
                </div>
                <IndigolayBar
                  className="progress-section__bar"
                  variant="yellow"
                  percentage={isMaxLevel ? 100 : calculatePercentage(selected.currentLevelExp, expThreshold)}
                  label={isMaxLevel ? 'MAX' : `${selected.currentLevelExp} / ${expThreshold}`}
                />
              </div>
              <div className="progress-section">
                <div className="stat-label">
                  <NarikWoodBitFont text="HP" size={1} />
                </div>
                <IndigolayBar
                  className="progress-section__bar"
                  variant="red"
                  percentage={calculatePercentage(selected.currentHp, maxHp)}
                  label={`${selected.currentHp} / ${maxHp}`}
                />
              </div>
            </div>
          </div>

          <div className="pause-menu-stats-columns">
            <div className="pause-menu-core-stats">
              <h3 className="derived-stats-title">
                <NarikWoodBitFont text="Core Stats" size={1} />
              </h3>
              <GradientDivider variant="gold" className="derived-stats-divider" />
              {CORE_STAT_ROWS.map(({ stat, label, icon }) => {
                const gearBonus = effectiveStats[stat] - selected.stats[stat];
                return (
                  <div key={stat} className={`stat-chip ${stat} pause-menu-core-stat pixel-font`}>
                    <span className="stat-chip-label">
                      <img src={icon} alt="" className="pause-menu-core-stat__icon" />
                      {label}
                    </span>
                    <span className="stat-chip-value number-flow-container">
                      <NumberFlow
                        value={effectiveStats[stat]}
                        format={INTEGER_FORMAT}
                        spinTiming={SNAPPY_SPIN_TIMING}
                        transformTiming={SNAPPY_TRANSFORM_TIMING}
                        opacityTiming={SNAPPY_OPACITY_TIMING}
                      />
                      {gearBonus > 0 && <span className="bar-text-delta">+{gearBonus}</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Effective stats as the "preview", so the green deltas read as what gear adds. */}
            <DerivedStatsDisplay character={selected} previewStats={effectiveStats} />
          </div>

          <SkillDetailPanel character={selected} selection={{ kind: 'active', skill: activeSkill }} variant="compact" />
        </div>
      </div>
    </>
  );
}
