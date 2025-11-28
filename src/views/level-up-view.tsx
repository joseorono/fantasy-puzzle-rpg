import { useState } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import type { CharacterData, CoreRPGStats, StatType } from '~/types/rpg-elements';
import { DerivedStatsDisplay } from '~/components/level-up-screen/derived-stats-display';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '~/components/ui/tooltip';
import { MarqueeText } from '~/components/marquee';

interface LevelUpViewProps {
  character: CharacterData;
  availablePoints: number;
  potentialStatPoints: CoreRPGStats;
  onConfirm: (allocatedStats: CoreRPGStats) => void;
  onBack: () => void;
}

export function LevelUpView({ character, availablePoints, potentialStatPoints, onConfirm, onBack }: LevelUpViewProps) {
  const [pendingAllocations, setPendingAllocations] = useState<CoreRPGStats>({
    pow: 0,
    vit: 0,
    spd: 0,
  });

  const pointsSpent = pendingAllocations.pow + pendingAllocations.vit + pendingAllocations.spd;
  const pointsRemaining = availablePoints - pointsSpent;
  const hasPendingChanges = pointsSpent > 0;
  const allPointsAllocated = pointsRemaining === 0;

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
  const expPercentage =
    character.expToNextLevel > 0
      ? Math.min(100, (character.expToNextLevel / calculateExpToNextLevel(character.level)) * 100)
      : 0;

  // Calculate HP delta from VIT changes
  const currentMaxHp = character.maxHp;
  const previewMaxHp = calculateMaxHp(character.baseHp, previewStats.vit, character.vitHpMultiplier);
  const maxHpDelta = previewMaxHp - currentMaxHp;

  // Helper function for exp calculation (simplified for display)
  function calculateExpToNextLevel(level: number): number {
    return Math.floor(Math.exp(level));
  }

  const maxStatValue = 100; // For meter display

  return (
    <TooltipProvider>
      <div className="level-up-screen">
        {/* Header */}
        <header className="level-up-header">
          <h1 className="level-up-title pixel-font text-base sm:text-lg md:text-xl">Level Up!</h1>
          <div className="points-remaining pixel-font text-xs">
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
                  className="character-portrait-small pixel-art"
                />
                <div className="level-badge pixel-border pixel-font text-xs">{character.level}</div>
              </div>
              <div className="character-name-class">
                <h2 className="character-name pixel-font text-sm sm:text-base">{character.name}</h2>
                <p className="character-class pixel-font text-xs">{character.class}</p>
              </div>
            </div>

            <div className="progress-section">
              <div className="stat-label pixel-font text-xs">EXP</div>
              <div className="exp-bar-container">
                <div className="exp-bar" style={{ width: `${expPercentage}%` }} />
                <div className="bar-text pixel-font text-xs">
                  {character.expToNextLevel} / {calculateExpToNextLevel(character.level)}
                </div>
              </div>
            </div>

            <div className="progress-section">
              <div className="stat-label pixel-font text-xs">HP</div>
              <div className="hp-bar-container">
                <div className="hp-bar" style={{ width: `${hpPercentage}%` }} />
                <div className="bar-text pixel-font text-xs">
                  {character.currentHp}/{character.maxHp}
                  {maxHpDelta !== 0 && (
                    <span className="bar-text-delta" style={{ color: maxHpDelta > 0 ? '#4caf50' : '#e53935' }}>
                      {maxHpDelta > 0 ? ' +' : ''}
                      {maxHpDelta}
                    </span>
                  )}
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
              className="character-portrait-large pixel-art"
            />

            <div className="stat-chips">
              <div className="stat-chip pow pixel-font text-xs">
                <span className="stat-chip-label">POW</span>
                <span className="stat-chip-value">
                  {character.stats.pow}
                  {potentialStatPoints.pow + pendingAllocations.pow > 0 &&
                    ` +${potentialStatPoints.pow + pendingAllocations.pow}`}
                </span>
              </div>
              <div className="stat-chip vit pixel-font text-xs">
                <span className="stat-chip-label">VIT</span>
                <span className="stat-chip-value">
                  {character.stats.vit}
                  {potentialStatPoints.vit + pendingAllocations.vit > 0 &&
                    ` +${potentialStatPoints.vit + pendingAllocations.vit}`}
                </span>
              </div>
              <div className="stat-chip spd pixel-font text-xs">
                <span className="stat-chip-label">SPD</span>
                <span className="stat-chip-value">
                  {character.stats.spd}
                  {potentialStatPoints.spd + pendingAllocations.spd > 0 &&
                    ` +${potentialStatPoints.spd + pendingAllocations.spd}`}
                </span>
              </div>
            </div>

            {hasPendingChanges && (
              <div className="pending-changes-banner pixel-font text-xs">
                <p className="pending-changes-text">Confirm to apply changes</p>
                <p className="pending-changes-hint">Use Reset to undo pending points</p>
              </div>
            )}
          </div>

          {/* Right Column - Stat Allocation */}
          <div className="stat-allocation-panel">
            <h2 className="allocation-title pixel-font text-sm sm:text-base">Allocate Points</h2>

            {/* Power Stat */}
            <div className="stat-allocation-row">
              <div className="stat-header">
                <div className="stat-name-group">
                  <span className="stat-name pow pixel-font text-xs sm:text-sm">Power (POW)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="info-icon cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Increases your damage output</TooltipContent>
                  </Tooltip>
                </div>
                <div className="stat-values pixel-font text-xs">
                  <span className="stat-current">{character.stats.pow}</span>
                  {potentialStatPoints.pow + pendingAllocations.pow > 0 && (
                    <>
                      <span className="stat-arrow">
                        <ArrowRightIcon className="stat-arrow-icon" />
                      </span>
                      <span className="stat-preview">{previewStats.pow + potentialStatPoints.pow}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="stat-hint pixel-font text-xs">Increases your damage output.</p>
              <div className="stat-meter">
                <div className="stat-meter-fill pow" style={{ width: `${(previewStats.pow / maxStatValue) * 100}%` }} />
              </div>
              <div className="stat-controls">
                <button
                  className="stat-button minus pixel-font text-xs sm:text-sm"
                  onClick={() => handleDecreaseStat('pow')}
                  disabled={pendingAllocations.pow === 0}
                  aria-label="Decrease Power"
                >
                  −
                </button>
                <button
                  className="stat-button plus pixel-font text-xs sm:text-sm"
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
                  <span className="stat-name vit pixel-font text-xs sm:text-sm">Vitality (VIT)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="info-icon cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Increases your Maximum HP</TooltipContent>
                  </Tooltip>
                </div>
                <div className="stat-values pixel-font text-xs">
                  <span className="stat-current">{character.stats.vit}</span>
                  {potentialStatPoints.vit + pendingAllocations.vit > 0 && (
                    <>
                      <span className="stat-arrow">
                        <ArrowRightIcon className="stat-arrow-icon" />
                      </span>
                      <span className="stat-preview">{previewStats.vit + potentialStatPoints.vit}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="stat-hint pixel-font text-xs">Increases your Maximum HP.</p>
              <div className="stat-meter">
                <div
                  className="stat-meter-fill vit"
                  style={{ width: `${((previewStats.vit + potentialStatPoints.vit) / maxStatValue) * 100}%` }}
                />
              </div>
              <div className="stat-controls">
                <button
                  className="stat-button minus pixel-font text-xs sm:text-sm"
                  onClick={() => handleDecreaseStat('vit')}
                  disabled={pendingAllocations.vit === 0}
                  aria-label="Decrease Vitality"
                >
                  −
                </button>
                <button
                  className="stat-button plus pixel-font text-xs sm:text-sm"
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
                  <span className="stat-name spd pixel-font text-xs sm:text-sm">Speed (SPD)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="info-icon cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Reduces skill cooldowns</TooltipContent>
                  </Tooltip>
                </div>
                <div className="stat-values pixel-font text-xs">
                  <span className="stat-current">{character.stats.spd}</span>
                  {potentialStatPoints.spd + pendingAllocations.spd > 0 && (
                    <>
                      <span className="stat-arrow">
                        <ArrowRightIcon className="stat-arrow-icon" />
                      </span>
                      <span className="stat-preview">{previewStats.spd + potentialStatPoints.spd}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="stat-hint pixel-font text-xs">Reduces skill cooldowns.</p>
              <div className="stat-meter">
                <div
                  className="stat-meter-fill spd"
                  style={{ width: `${((previewStats.spd + potentialStatPoints.spd) / maxStatValue) * 100}%` }}
                />
              </div>
              <div className="stat-controls">
                <button
                  className="stat-button minus pixel-font text-xs sm:text-sm"
                  onClick={() => handleDecreaseStat('spd')}
                  disabled={pendingAllocations.spd === 0}
                  aria-label="Decrease Speed"
                >
                  −
                </button>
                <button
                  className="stat-button plus pixel-font text-xs sm:text-sm"
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
                className="action-button confirm pixel-font text-xs sm:text-sm"
                onClick={handleConfirm}
                disabled={!allPointsAllocated}
              >
                Confirm
              </button>
              <button
                className="action-button reset pixel-font text-xs sm:text-sm"
                onClick={handleReset}
                disabled={!hasPendingChanges}
              >
                Reset
              </button>
              <button className="action-button back pixel-font text-xs sm:text-sm" onClick={onBack}>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Marquee Help Text */}
        <footer>
          <MarqueeText type="level-up" speed={40} pauseOnHover={true} />
        </footer>
      </div>
    </TooltipProvider>
  );
}
