import NumberFlow from '@number-flow/react';
import type { CharacterData } from '~/types/rpg-elements';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import {
  calculateMaxHp,
  calculateSkillCooldownFillRate,
  calculateSkillCooldown,
  calculateDamage,
  calculateItemCooldownInMs,
} from '~/lib/rpg-calculations';
import { useParty } from '~/stores/game-store';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
  DECIMAL_2_FORMAT,
} from '~/constants/number-flow';

interface DerivedStatsDisplayProps {
  character: CharacterData;
  previewStats: { pow: number; vit: number; spd: number };
}

export function DerivedStatsDisplay({ character, previewStats }: DerivedStatsDisplayProps) {
  const party = useParty();

  // Calculate current derived stats
  const currentMaxHp = calculateMaxHp(character.baseHp, character.stats.vit, character.vitHpMultiplier);
  const currentFillRate = calculateSkillCooldownFillRate(character.maxCooldown, character.stats.spd);
  const currentCooldown = calculateSkillCooldown(character.maxCooldown, character.stats.spd);
  const currentPower = calculateDamage(50, character.stats.pow); // Base damage of 50 for display
  const currentItemCooldown = calculateItemCooldownInMs(party);

  // Calculate preview derived stats
  const previewMaxHp = calculateMaxHp(character.baseHp, previewStats.vit, character.vitHpMultiplier);
  const previewFillRate = calculateSkillCooldownFillRate(character.maxCooldown, previewStats.spd);
  const previewCooldown = calculateSkillCooldown(character.maxCooldown, previewStats.spd);
  const previewPower = calculateDamage(50, previewStats.pow);

  // Calculate preview item cooldown with this character's SPD changed
  const previewParty = party.map((member) =>
    member.id === character.id ? { ...member, stats: { ...member.stats, spd: previewStats.spd } } : member,
  );
  const previewItemCooldown = calculateItemCooldownInMs(previewParty);

  // Calculate deltas
  const maxHpDelta = previewMaxHp - currentMaxHp;
  const fillRateDelta = previewFillRate - currentFillRate;
  const cooldownDelta = previewCooldown - currentCooldown;
  const powerDelta = previewPower - currentPower;
  const itemCooldownDelta = previewItemCooldown - currentItemCooldown;

  const isHealer = character.class === 'healer';
  const powerLabel = isHealer ? 'Healing Power' : 'Attack Power';

  return (
    <div className="derived-stats">
      <h3 className="derived-stats-title">
        <NarikWoodBitFont text="Derived Stats" size={1} />
      </h3>

      <div className="derived-stat-row">
        <span className="derived-stat-name pixel-font text-xs">Max HP</span>
        <div className="derived-stat-value pixel-font number-flow-container text-xs">
          <NumberFlow
            value={previewMaxHp}
            format={INTEGER_FORMAT}
            trend={1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
          {maxHpDelta !== 0 && (
            <span className="stat-delta number-flow-container">
              <NumberFlow
                value={maxHpDelta}
                format={INTEGER_FORMAT}
                prefix="+"
                trend={1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name pixel-font text-xs">Skill Cooldown Fill Rate</span>
        <div className="derived-stat-value pixel-font number-flow-container text-xs">
          <NumberFlow
            value={previewFillRate * 100}
            format={DECIMAL_2_FORMAT}
            suffix="%/s"
            trend={1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
          {fillRateDelta !== 0 && (
            <span className="stat-delta number-flow-container">
              <NumberFlow
                value={fillRateDelta * 100}
                format={DECIMAL_2_FORMAT}
                prefix="+"
                suffix="%"
                trend={1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name pixel-font text-xs">Skill Cooldown Fill Time</span>
        <div className="derived-stat-value pixel-font number-flow-container text-xs">
          <NumberFlow
            value={previewCooldown}
            format={DECIMAL_2_FORMAT}
            suffix="s"
            trend={-1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
          {cooldownDelta !== 0 && (
            <span className="stat-delta number-flow-container">
              <NumberFlow
                value={cooldownDelta}
                format={DECIMAL_2_FORMAT}
                prefix={cooldownDelta > 0 ? '+' : ''}
                trend={cooldownDelta > 0 ? 1 : -1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name pixel-font text-xs">Item Cooldown</span>
        <div className="derived-stat-value pixel-font number-flow-container text-xs">
          <NumberFlow
            value={previewItemCooldown / 1000}
            format={DECIMAL_2_FORMAT}
            suffix="s"
            trend={-1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
          {itemCooldownDelta !== 0 && (
            <span className="stat-delta number-flow-container">
              <NumberFlow
                value={itemCooldownDelta / 1000}
                format={DECIMAL_2_FORMAT}
                prefix={itemCooldownDelta > 0 ? '+' : ''}
                trend={itemCooldownDelta > 0 ? 1 : -1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name pixel-font text-xs">{powerLabel}</span>
        <div className="derived-stat-value pixel-font number-flow-container text-xs">
          <NumberFlow
            value={previewPower}
            format={INTEGER_FORMAT}
            trend={1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
          {powerDelta !== 0 && (
            <span className="stat-delta number-flow-container">
              <NumberFlow
                value={powerDelta}
                format={INTEGER_FORMAT}
                prefix="+"
                trend={1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
