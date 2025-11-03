import type { CharacterData } from '~/types/rpg-elements';
import {
  calculateMaxHp,
  calculateCooldownFillRate,
  calculateCooldown,
  calculateDamage,
} from '~/lib/rpg-calculations';

interface DerivedStatsDisplayProps {
  character: CharacterData;
  previewStats: { pow: number; vit: number; spd: number };
}

export function DerivedStatsDisplay({ character, previewStats }: DerivedStatsDisplayProps) {
  // Calculate current derived stats
  const currentMaxHp = calculateMaxHp(character.baseHp, character.stats.vit, character.vitHpMultiplier);
  const currentFillRate = calculateCooldownFillRate(character.maxCooldown, character.stats.spd);
  const currentCooldown = calculateCooldown(character.maxCooldown, character.stats.spd);
  const currentPower = calculateDamage(50, character.stats.pow); // Base damage of 50 for display

  // Calculate preview derived stats
  const previewMaxHp = calculateMaxHp(character.baseHp, previewStats.vit, character.vitHpMultiplier);
  const previewFillRate = calculateCooldownFillRate(character.maxCooldown, previewStats.spd);
  const previewCooldown = calculateCooldown(character.maxCooldown, previewStats.spd);
  const previewPower = calculateDamage(50, previewStats.pow);

  // Calculate deltas
  const maxHpDelta = previewMaxHp - currentMaxHp;
  const fillRateDelta = previewFillRate - currentFillRate;
  const cooldownDelta = previewCooldown - currentCooldown;
  const powerDelta = previewPower - currentPower;

  const isHealer = character.class === 'healer';
  const powerLabel = isHealer ? 'Healing Power' : 'Attack Power';

  return (
    <div className="derived-stats">
      <h3 className="derived-stats-title">Derived Stats</h3>
      
      <div className="derived-stat-row">
        <span className="derived-stat-name">Max HP</span>
        <div className="derived-stat-value">
          {previewMaxHp}
          {maxHpDelta !== 0 && (
            <span className="stat-delta">+{maxHpDelta}</span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name">Skill Cooldown Fill Rate</span>
        <div className="derived-stat-value">
          {previewFillRate.toFixed(2)}/s
          {fillRateDelta !== 0 && (
            <span className="stat-delta">+{fillRateDelta.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name">Skill Cooldown Fill Time</span>
        <div className="derived-stat-value">
          {previewCooldown.toFixed(2)}s
          {cooldownDelta !== 0 && (
            <span className="stat-delta" style={{ color: cooldownDelta < 0 ? '#4caf50' : '#e53935' }}>
              {cooldownDelta > 0 ? '+' : ''}{cooldownDelta.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="derived-stat-row">
        <span className="derived-stat-name">{powerLabel}</span>
        <div className="derived-stat-value">
          {previewPower}
          {powerDelta !== 0 && (
            <span className="stat-delta">+{powerDelta}</span>
          )}
        </div>
      </div>
    </div>
  );
}
