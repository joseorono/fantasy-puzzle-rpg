import { useState } from 'react';
import type { CharacterData, CoreRPGStats, StatType } from '~/types/rpg-elements';
import { DerivedStatsDisplay } from '~/components/level-up-screen/derived-stats-display';

interface LevelUpViewProps {
  character: CharacterData;
  availablePoints: number;
  onConfirm: (allocatedStats: CoreRPGStats) => void;
  onBack: () => void;
}

export function LevelUpView({ character, availablePoints, onConfirm, onBack }: LevelUpViewProps) {
  const [pendingAllocations, setPendingAllocations] = useState<CoreRPGStats>({
    pow: 0,
    vit: 0,
    spd: 0,
  });

  const pointsSpent = pendingAllocations.pow + pendingAllocations.vit + pendingAllocations.spd;
  const pointsRemaining = availablePoints - pointsSpent;
  const hasPendingChanges = pointsSpent > 0;

  // Calculate preview stats
  const previewStats = {
    pow: character.stats.pow + pendingAllocations.pow,
    vit: character.stats.vit + pendingAllocations.vit,
    spd: character.stats.spd + pendingAllocations.spd,
  };

  function handleIncreaseStat(stat: StatType) {
    if (pointsRemaining <= 0) return;
    setPendingAllocations((prev) => ({
      ...prev,
      [stat]: prev[stat] + 1,
    }));
  }

  function handleDecreaseStat(stat: StatType) {
    if (pendingAllocations[stat] <= 0) return;
    setPendingAllocations((prev) => ({
      ...prev,
      [stat]: prev[stat] - 1,
    }));
  }

  function handleReset() {
    setPendingAllocations({ pow: 0, vit: 0, spd: 0 });
  }

  function handleConfirm() {
    if (!hasPendingChanges) return;
    onConfirm(pendingAllocations);
  }

  // Calculate HP percentage for display
  const hpPercentage = (character.currentHp / character.maxHp) * 100;
  const expPercentage = (character.expToNextLevel > 0) 
    ? Math.min(100, (character.expToNextLevel / calculateExpToNextLevel(character.level)) * 100)
    : 0;

  // Helper function for exp calculation (simplified for display)
  function calculateExpToNextLevel(level: number): number {
    return Math.floor(Math.exp(level));
  }

  const maxStatValue = 100; // For meter display

  return (
    <div className="level-up-screen">
      {/* Header */}
      <header className="level-up-header">
        <h1 className="level-up-title">Level Up!</h1>
        <div className="points-remaining">
          <span className="star-icon">★</span>
          <span>Points Remaining:</span>
          <span className="points-value">{pointsRemaining}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="level-up-content">
        {/* Left Column - Character Info & Derived Stats */}
        <div className="character-info-panel">
          <div className="character-identity">
            <div style={{ position: 'relative' }}>
              <img
                src="/assets/portraits/Innkeeper_02.png"
                alt={character.name}
                className="character-portrait-small"
              />
              <div className="level-badge">{character.level}</div>
            </div>
            <div className="character-name-class">
              <h2 className="character-name">{character.name}</h2>
              <p className="character-class">{character.class}</p>
            </div>
          </div>

          <div className="progress-section">
            <div className="stat-label">EXP</div>
            <div className="exp-bar-container">
              <div className="exp-bar" style={{ width: `${expPercentage}%` }} />
              <div className="bar-text">
                {character.expToNextLevel} / {calculateExpToNextLevel(character.level)}
              </div>
            </div>
          </div>

          <div className="progress-section">
            <div className="stat-label">HP</div>
            <div className="hp-bar-container">
              <div className="hp-bar" style={{ width: `${hpPercentage}%` }} />
              <div className="bar-text">
                {character.currentHp} / {character.maxHp}
              </div>
            </div>
          </div>

          <DerivedStatsDisplay character={character} previewStats={previewStats} />
        </div>

        {/* Center Column - Character Display */}
        <div className="character-display-panel">
          <img
            src="/assets/portraits/Innkeeper_02.png"
            alt={character.name}
            className="character-portrait-large"
          />

          <div className="stat-chips">
            <div className="stat-chip pow">
              <span className="stat-chip-label">POW</span>
              <span className="stat-chip-value">
                {character.stats.pow}
                {pendingAllocations.pow > 0 && ` +${pendingAllocations.pow}`}
              </span>
            </div>
            <div className="stat-chip vit">
              <span className="stat-chip-label">VIT</span>
              <span className="stat-chip-value">
                {character.stats.vit}
                {pendingAllocations.vit > 0 && ` +${pendingAllocations.vit}`}
              </span>
            </div>
            <div className="stat-chip spd">
              <span className="stat-chip-label">SPD</span>
              <span className="stat-chip-value">
                {character.stats.spd}
                {pendingAllocations.spd > 0 && ` +${pendingAllocations.spd}`}
              </span>
            </div>
          </div>

          {hasPendingChanges && (
            <div className="pending-changes-banner">
              <p className="pending-changes-text">Confirm to apply changes</p>
              <p className="pending-changes-hint">Use Reset to undo pending points</p>
            </div>
          )}
        </div>

        {/* Right Column - Stat Allocation */}
        <div className="stat-allocation-panel">
          <h2 className="allocation-title">Allocate Points</h2>

          {/* Power Stat */}
          <div className="stat-allocation-row">
            <div className="stat-header">
              <div className="stat-name-group">
                <span className="stat-name pow">Power (POW)</span>
                <span className="info-icon" title="Increases your damage output">ⓘ</span>
              </div>
              <div className="stat-values">
                <span className="stat-current">{character.stats.pow}</span>
                {pendingAllocations.pow > 0 && (
                  <>
                    <span className="stat-arrow">→</span>
                    <span className="stat-preview">{previewStats.pow}</span>
                  </>
                )}
              </div>
            </div>
            <p className="stat-hint">Increases your damage output.</p>
            <div className="stat-meter">
              <div
                className="stat-meter-fill pow"
                style={{ width: `${(previewStats.pow / maxStatValue) * 100}%` }}
              />
            </div>
            <div className="stat-controls">
              <button
                className="stat-button minus"
                onClick={() => handleDecreaseStat('pow')}
                disabled={pendingAllocations.pow === 0}
                aria-label="Decrease Power"
              >
                −
              </button>
              <button
                className="stat-button plus"
                onClick={() => handleIncreaseStat('pow')}
                disabled={pointsRemaining === 0}
                aria-label="Increase Power"
              >
                +
              </button>
            </div>
          </div>

          {/* Vitality Stat */}
          <div className="stat-allocation-row">
            <div className="stat-header">
              <div className="stat-name-group">
                <span className="stat-name vit">Vitality (VIT)</span>
                <span className="info-icon" title="Increases your Maximum HP">ⓘ</span>
              </div>
              <div className="stat-values">
                <span className="stat-current">{character.stats.vit}</span>
                {pendingAllocations.vit > 0 && (
                  <>
                    <span className="stat-arrow">→</span>
                    <span className="stat-preview">{previewStats.vit}</span>
                  </>
                )}
              </div>
            </div>
            <p className="stat-hint">Increases your Maximum HP.</p>
            <div className="stat-meter">
              <div
                className="stat-meter-fill vit"
                style={{ width: `${(previewStats.vit / maxStatValue) * 100}%` }}
              />
            </div>
            <div className="stat-controls">
              <button
                className="stat-button minus"
                onClick={() => handleDecreaseStat('vit')}
                disabled={pendingAllocations.vit === 0}
                aria-label="Decrease Vitality"
              >
                −
              </button>
              <button
                className="stat-button plus"
                onClick={() => handleIncreaseStat('vit')}
                disabled={pointsRemaining === 0}
                aria-label="Increase Vitality"
              >
                +
              </button>
            </div>
          </div>

          {/* Speed Stat */}
          <div className="stat-allocation-row">
            <div className="stat-header">
              <div className="stat-name-group">
                <span className="stat-name spd">Speed (SPD)</span>
                <span className="info-icon" title="Reduces skill cooldowns">ⓘ</span>
              </div>
              <div className="stat-values">
                <span className="stat-current">{character.stats.spd}</span>
                {pendingAllocations.spd > 0 && (
                  <>
                    <span className="stat-arrow">→</span>
                    <span className="stat-preview">{previewStats.spd}</span>
                  </>
                )}
              </div>
            </div>
            <p className="stat-hint">Reduces skill cooldowns.</p>
            <div className="stat-meter">
              <div
                className="stat-meter-fill spd"
                style={{ width: `${(previewStats.spd / maxStatValue) * 100}%` }}
              />
            </div>
            <div className="stat-controls">
              <button
                className="stat-button minus"
                onClick={() => handleDecreaseStat('spd')}
                disabled={pendingAllocations.spd === 0}
                aria-label="Decrease Speed"
              >
                −
              </button>
              <button
                className="stat-button plus"
                onClick={() => handleIncreaseStat('spd')}
                disabled={pointsRemaining === 0}
                aria-label="Increase Speed"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="allocation-actions">
            <button
              className="action-button confirm"
              onClick={handleConfirm}
              disabled={!hasPendingChanges}
            >
              Confirm
            </button>
            <button
              className="action-button reset"
              onClick={handleReset}
              disabled={!hasPendingChanges}
            >
              Reset
            </button>
            <button className="action-button back" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="level-up-footer">
        Allocate points to increase your stats and grow stronger.
      </footer>
    </div>
  );
}
