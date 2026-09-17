import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import type { CharacterData, CoreRPGStats, StatType } from '~/types/rpg-elements';
import { DerivedStatsDisplay } from '~/components/level-up-screen/derived-stats-display';
import { StatAllocationRow } from '~/components/level-up-screen/stat-allocation-row';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { getExpThresholdForLevel } from '~/lib/leveling-system';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import Franuka05aBottomBar from '~/components/frames/franuka-05a-bottom-bar';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { LevelTag } from '~/components/ui-custom/level-tag';
import { useStatAllocation } from '~/hooks/use-stat-allocation';
import { useStatAllocationKeyboard } from '~/hooks/use-stat-allocation-keyboard';
import { IndigolayBar } from '~/components/ui-custom/indigolay-bar';
import { GradientDivider } from '~/components/dividers/gradient-divider';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

/** The three stat rows in the order they appear in the allocation panel. */
const STAT_ORDER: StatType[] = ['pow', 'vit', 'spd'];
type AllocationAction = 'confirm' | 'reset';

interface LevelUpViewProps {
  character: CharacterData;
  availablePoints: number;
  potentialStatPoints: CoreRPGStats;
  onConfirm: (allocatedStats: CoreRPGStats) => void;
  /** Applies the level-up with random stats only and advances. No control is bound to it yet. */
  onBack: () => void;
}

export function LevelUpView({ character, availablePoints, potentialStatPoints, onConfirm }: LevelUpViewProps) {
  const allocation = useStatAllocation(availablePoints);
  const { pointsRemaining, hasPendingChanges, allPointsAllocated } = allocation;

  // Calculate preview stats
  const previewStats: CoreRPGStats = {
    pow: character.stats.pow + allocation.pending.pow,
    vit: character.stats.vit + allocation.pending.vit,
    spd: character.stats.spd + allocation.pending.spd,
  };

  function handleReset() {
    allocation.reset();
    keyboard.focusStats();
  }

  // Gated on allPointsAllocated to match the Confirm button's own `disabled`, so the keyboard
  // shortcut can't confirm with points still unspent. Deliberately does NOT call onBack(): the
  // parent's onConfirm already applies the level-up and advances to the next character.
  function handleConfirm() {
    if (!allPointsAllocated) return;
    onConfirm(allocation.pending);
    allocation.reset();
  }

  // Arrows/WASD pick a stat row and spend points on it. Once the stat rows are exhausted, the
  // same vertical navigation enters the Confirm/Reset action row without changing allocation.
  const keyboard = useStatAllocationKeyboard<AllocationAction>({
    allocation,
    stats: STAT_ORDER,
    actions: [
      { id: 'confirm', disabled: !allPointsAllocated },
      { id: 'reset', disabled: !hasPendingChanges },
    ],
    onActivate: (action) => (action === 'confirm' ? handleConfirm() : handleReset()),
    onConfirmShortcut: handleConfirm,
    onEscape: hasPendingChanges ? handleReset : undefined,
  });
  const { selectedStatIndex, selectedAction } = keyboard;

  // Calculate HP percentage for display
  const hpPercentage = (character.currentHp / character.maxHp) * 100;
  const expPercentage =
    character.currentLevelExp > 0
      ? Math.min(100, (character.currentLevelExp / getExpThresholdForLevel(character.level)) * 100)
      : 0;

  // Calculate HP delta from VIT changes
  const currentMaxHp = character.maxHp;
  const previewMaxHp = calculateMaxHp(character.baseHp, previewStats.vit, character.vitHpMultiplier);
  const maxHpDelta = previewMaxHp - currentMaxHp;

  return (
    <div className="level-up-screen">
      {/* Header */}
      <Franuka05aBottomBar>
        <header className="level-up-header">
          <h1 className="level-up-title">
            <NarikWoodBitFont text="Level Up!" size={1.4} />
          </h1>
          <div className="points-remaining">
            <span className="points-remaining__label">Points Remaining:</span>
            <span className="points-remaining__value number-flow-container">
              <NumberFlow
                value={pointsRemaining}
                format={INTEGER_FORMAT}
                trend={-1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </span>
          </div>
        </header>
      </Franuka05aBottomBar>

      {/* Main Content */}
      <NumberFlowGroup>
        <div className="level-up-content">
          {/* Left Column - Character Info & Derived Stats */}
          <div className="character-info-panel">
            <div className="character-identity">
              <div className="portrait-badge-wrap">
                <img
                  src="/assets/portraits/Innkeeper_02.png"
                  alt={character.name}
                  className="character-portrait-small pixel-art"
                />
                <LevelTag level={character.level} />
              </div>
              <div className="character-name-class">
                <h2 className="character-name pixel-font text-sm sm:text-base">{character.name}</h2>
                <p className="character-class pixel-font text-xs">{character.class}</p>
              </div>
            </div>

            <div className="progress-section">
              <div className="stat-label">
                <NarikWoodBitFont text="EXP" size={1} />
              </div>
              <IndigolayBar
                className="progress-section__bar"
                variant="yellow"
                size="lg"
                percentage={expPercentage}
                label={`${character.currentLevelExp} / ${getExpThresholdForLevel(character.level)}`}
              />
            </div>

            <div className="progress-section">
              <div className="stat-label">
                <NarikWoodBitFont text="HP" size={1} />
              </div>
              <IndigolayBar
                className="progress-section__bar"
                variant="red"
                size="lg"
                percentage={hpPercentage}
                label={
                  <>
                    {character.currentHp}/{character.maxHp}
                    {maxHpDelta > 0 && (
                      <span className="bar-text-delta number-flow-container">
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
                  </>
                }
              />
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
                <span className="stat-chip-value number-flow-container">
                  {character.stats.pow}
                  {potentialStatPoints.pow + allocation.pending.pow > 0 && (
                    <NumberFlow
                      value={potentialStatPoints.pow + allocation.pending.pow}
                      format={INTEGER_FORMAT}
                      prefix=" +"
                      trend={1}
                      spinTiming={SNAPPY_SPIN_TIMING}
                      transformTiming={SNAPPY_TRANSFORM_TIMING}
                      opacityTiming={SNAPPY_OPACITY_TIMING}
                    />
                  )}
                </span>
              </div>
              <div className="stat-chip vit pixel-font text-xs">
                <span className="stat-chip-label">VIT</span>
                <span className="stat-chip-value number-flow-container">
                  {character.stats.vit}
                  {potentialStatPoints.vit + allocation.pending.vit > 0 && (
                    <NumberFlow
                      value={potentialStatPoints.vit + allocation.pending.vit}
                      format={INTEGER_FORMAT}
                      prefix=" +"
                      trend={1}
                      spinTiming={SNAPPY_SPIN_TIMING}
                      transformTiming={SNAPPY_TRANSFORM_TIMING}
                      opacityTiming={SNAPPY_OPACITY_TIMING}
                    />
                  )}
                </span>
              </div>
              <div className="stat-chip spd pixel-font text-xs">
                <span className="stat-chip-label">SPD</span>
                <span className="stat-chip-value number-flow-container">
                  {character.stats.spd}
                  {potentialStatPoints.spd + allocation.pending.spd > 0 && (
                    <NumberFlow
                      value={potentialStatPoints.spd + allocation.pending.spd}
                      format={INTEGER_FORMAT}
                      prefix=" +"
                      trend={1}
                      spinTiming={SNAPPY_SPIN_TIMING}
                      transformTiming={SNAPPY_TRANSFORM_TIMING}
                      opacityTiming={SNAPPY_OPACITY_TIMING}
                    />
                  )}
                </span>
              </div>
            </div>

            {hasPendingChanges && (
              <div className="pending-changes-banner pixel-font">
                <span className="pending-changes-text">Confirm to apply</span>
                <span className="pending-changes-hint">Reset to undo</span>
              </div>
            )}
          </div>

          {/* Right Column - Stat Allocation */}
          <div className="stat-allocation-panel">
            <div className="allocation-header">
              <h2 className="allocation-title">
                <NarikWoodBitFont text="Allocate Points" size={1.2} />
              </h2>
              <GradientDivider variant="gold" className="allocation-title-divider" />
            </div>

            {/* Stat cards share the panel's free height so the actions sit on the bottom padding line. */}
            <div className="stat-allocation-list">
              {STAT_ORDER.map((stat, index) => {
                const preview = previewStats[stat] + potentialStatPoints[stat];
                return (
                  <StatAllocationRow
                    key={stat}
                    stat={stat}
                    characterClass={character.class}
                    currentValue={character.stats[stat]}
                    previewValue={potentialStatPoints[stat] + allocation.pending[stat] > 0 ? preview : null}
                    meterValue={preview}
                    isSelected={selectedStatIndex === index}
                    canIncrease={allocation.pointsRemaining > 0}
                    canDecrease={allocation.pending[stat] > 0}
                    onIncrease={() => allocation.increase(stat)}
                    onDecrease={() => allocation.decrease(stat)}
                    holdIncrease={allocation.holdIncrease[stat]}
                    holdDecrease={allocation.holdDecrease[stat]}
                  />
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="allocation-actions">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ToffecBeigeCornersWrapper forceDisplay={selectedAction === 'confirm'}>
                      <ToffecButton variant="cream" onClick={handleConfirm} disabled={!allPointsAllocated}>
                        Confirm
                      </ToffecButton>
                    </ToffecBeigeCornersWrapper>
                  </div>
                </TooltipTrigger>
                {!allPointsAllocated && <TooltipContent side="top">Spend all points before continuing</TooltipContent>}
              </Tooltip>
              <ToffecBeigeCornersWrapper forceDisplay={selectedAction === 'reset'}>
                <ToffecButton variant="tan" onClick={handleReset} disabled={!hasPendingChanges}>
                  Reset
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>
          </div>
        </div>
      </NumberFlowGroup>

      {/* Footer - Marquee Help Text */}
      <footer className="level-up-footer">
        <MarqueeText type="level-up" speed={40} pauseOnHover={true} className="marquee-container--footer" />
      </footer>
    </div>
  );
}
