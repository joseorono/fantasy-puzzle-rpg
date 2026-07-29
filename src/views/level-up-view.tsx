import { useRef, useState } from 'react';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import type { CharacterData, CoreRPGStats, StatType } from '~/types/rpg-elements';
import { DerivedStatsDisplay } from '~/components/level-up-screen/derived-stats-display';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { getExpThresholdForLevel } from '~/lib/leveling-system';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { MarqueeText } from '~/components/marquee/marquee-text';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';
import Franuka05aBottomBar from '~/components/frames/franuka-05a-bottom-bar';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { LevelTag } from '~/components/ui-custom/level-tag';
import { usePressAndHold } from '~/hooks/use-press-and-hold';
import { IndigolayBar } from '~/components/ui-custom/indigolay-bar';
import { GradientDivider } from '~/components/dividers/gradient-divider';
import { INFO_ICON_SRC, STAT_METER_MAX } from '~/constants/ui';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

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

  // Mirror the latest allocation state into refs so the accelerating press-and-hold train (which
  // fires from setTimeout callbacks) can guard itself without stale closures. Optimistically
  // adjusted on each step and resynced to the committed state every render.
  const pointsRemainingRef = useRef(pointsRemaining);
  pointsRemainingRef.current = pointsRemaining;
  const pendingRef = useRef(pendingAllocations);
  pendingRef.current = pendingAllocations;

  // Returns whether a point was actually allocated, so the hold train stops once points run out.
  function handleIncreaseStat(stat: StatType): boolean {
    if (pointsRemainingRef.current <= 0) return false;
    pointsRemainingRef.current -= 1; // optimistic; resynced on next render
    setPendingAllocations((prev) => {
      const spent = prev.pow + prev.vit + prev.spd;
      if (spent >= availablePoints) return prev; // hard cap — never overspend
      return { ...prev, [stat]: prev[stat] + 1 };
    });
    return true;
  }

  // Returns whether a point was actually refunded, so the hold train stops at zero.
  function handleDecreaseStat(stat: StatType): boolean {
    if (pendingRef.current[stat] <= 0) return false;
    pendingRef.current = { ...pendingRef.current, [stat]: pendingRef.current[stat] - 1 }; // optimistic
    pointsRemainingRef.current += 1;
    setPendingAllocations((prev) => {
      if (prev[stat] <= 0) return prev;
      return { ...prev, [stat]: prev[stat] - 1 };
    });
    return true;
  }

  // Press-and-hold bindings (accelerating auto-repeat) for each +/- button. onClick still handles
  // the single step for a plain click / keyboard, so holds never double-count.
  const holdIncrease = {
    pow: usePressAndHold(() => handleIncreaseStat('pow')),
    vit: usePressAndHold(() => handleIncreaseStat('vit')),
    spd: usePressAndHold(() => handleIncreaseStat('spd')),
  };
  const holdDecrease = {
    pow: usePressAndHold(() => handleDecreaseStat('pow')),
    vit: usePressAndHold(() => handleDecreaseStat('vit')),
    spd: usePressAndHold(() => handleDecreaseStat('spd')),
  };

  function handleReset() {
    setPendingAllocations({ pow: 0, vit: 0, spd: 0 });
  }

  function handleConfirm() {
    if (!hasPendingChanges) return;
    onConfirm(pendingAllocations);
    setPendingAllocations({ pow: 0, vit: 0, spd: 0 });
    onBack();
  }

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
                  {potentialStatPoints.pow + pendingAllocations.pow > 0 && (
                    <NumberFlow
                      value={potentialStatPoints.pow + pendingAllocations.pow}
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
                  {potentialStatPoints.vit + pendingAllocations.vit > 0 && (
                    <NumberFlow
                      value={potentialStatPoints.vit + pendingAllocations.vit}
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
                  {potentialStatPoints.spd + pendingAllocations.spd > 0 && (
                    <NumberFlow
                      value={potentialStatPoints.spd + pendingAllocations.spd}
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
              {/* Power Stat */}
              <div className="stat-allocation-row pow">
                <div className="stat-header">
                  <div className="stat-name-group">
                    <span className="stat-name pow pixel-font text-xs sm:text-sm">Power (POW)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="info-icon" role="img" aria-label="About Power">
                          <img className="info-icon__img" src={INFO_ICON_SRC} alt="" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <ul className="indigolay-list">
                          <li className="indigolay-list__item">
                            <span className="indigolay-list__bullet">◆</span>
                            <span className="indigolay-list__text">
                              {character.class === 'healer'
                                ? 'Increases your healing output'
                                : 'Increases your damage output'}
                            </span>
                          </li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="stat-values pixel-font text-xs">
                    <span className="stat-current">{character.stats.pow}</span>
                    {potentialStatPoints.pow + pendingAllocations.pow > 0 && (
                      <>
                        <span className="stat-arrow">
                          <img
                            className="stat-arrow-icon"
                            src="/assets/icons/indigolay/Icon_arrow-right.png"
                            alt="arrow"
                          />
                        </span>
                        <span className="stat-preview number-flow-container">
                          <NumberFlow
                            value={previewStats.pow + potentialStatPoints.pow}
                            format={INTEGER_FORMAT}
                            trend={1}
                            spinTiming={SNAPPY_SPIN_TIMING}
                            transformTiming={SNAPPY_TRANSFORM_TIMING}
                            opacityTiming={SNAPPY_OPACITY_TIMING}
                          />
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="stat-hint pixel-font text-xs">
                  {character.class === 'healer' ? 'Increases your healing power.' : 'Increases your ability power.'}
                </p>
                <div className="stat-controls">
                  <ToffecBeigeCornersWrapper>
                    <ToffecSquareButton
                      icon="minus"
                      variant="fairy3"
                      size="default"
                      onClick={() => handleDecreaseStat('pow')}
                      {...holdDecrease.pow}
                      disabled={pendingAllocations.pow === 0}
                      aria-label="Decrease Power"
                    />
                  </ToffecBeigeCornersWrapper>
                  <ToffecBeigeCornersWrapper>
                    <ToffecSquareButton
                      icon="plus"
                      variant="fairy3"
                      size="default"
                      onClick={() => handleIncreaseStat('pow')}
                      {...holdIncrease.pow}
                      disabled={pointsRemaining === 0}
                      aria-label="Increase Power"
                    />
                  </ToffecBeigeCornersWrapper>
                  <IndigolayBar
                    className="stat-meter"
                    variant="orange"
                    percentage={((previewStats.pow + potentialStatPoints.pow) / STAT_METER_MAX) * 100}
                  />
                </div>
              </div>

              {/* Vitality Stat */}
              <div className="stat-allocation-row vit">
                <div className="stat-header">
                  <div className="stat-name-group">
                    <span className="stat-name vit pixel-font text-xs sm:text-sm">Vitality (VIT)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="info-icon" role="img" aria-label="About Vitality">
                          <img className="info-icon__img" src={INFO_ICON_SRC} alt="" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <ul className="indigolay-list">
                          <li className="indigolay-list__item">
                            <span className="indigolay-list__bullet">◆</span>
                            <span className="indigolay-list__text">
                              Raises Maximum HP, scaled by this character&apos;s VIT multiplier
                            </span>
                          </li>
                          <li className="indigolay-list__item">
                            <span className="indigolay-list__bullet">◆</span>
                            <span className="indigolay-list__text">Slows how fast the party Guard meter decays</span>
                          </li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="stat-values pixel-font text-xs">
                    <span className="stat-current">{character.stats.vit}</span>
                    {potentialStatPoints.vit + pendingAllocations.vit > 0 && (
                      <>
                        <span className="stat-arrow">
                          <img
                            className="stat-arrow-icon"
                            src="/assets/icons/indigolay/Icon_arrow-right.png"
                            alt="arrow"
                          />
                        </span>
                        <span className="stat-preview number-flow-container">
                          <NumberFlow
                            value={previewStats.vit + potentialStatPoints.vit}
                            format={INTEGER_FORMAT}
                            trend={1}
                            spinTiming={SNAPPY_SPIN_TIMING}
                            transformTiming={SNAPPY_TRANSFORM_TIMING}
                            opacityTiming={SNAPPY_OPACITY_TIMING}
                          />
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="stat-hint pixel-font text-xs">Increases your Maximum HP, makes Guard last longer.</p>
                <div className="stat-controls">
                  <ToffecBeigeCornersWrapper>
                    <ToffecSquareButton
                      icon="minus"
                      variant="fairy3"
                      size="default"
                      onClick={() => handleDecreaseStat('vit')}
                      {...holdDecrease.vit}
                      disabled={pendingAllocations.vit === 0}
                      aria-label="Decrease Vitality"
                    />
                  </ToffecBeigeCornersWrapper>
                  <ToffecBeigeCornersWrapper>
                    <ToffecSquareButton
                      icon="plus"
                      variant="fairy3"
                      size="default"
                      onClick={() => handleIncreaseStat('vit')}
                      {...holdIncrease.vit}
                      disabled={pointsRemaining === 0}
                      aria-label="Increase Vitality"
                    />
                  </ToffecBeigeCornersWrapper>
                  <IndigolayBar
                    className="stat-meter"
                    variant="green"
                    percentage={((previewStats.vit + potentialStatPoints.vit) / STAT_METER_MAX) * 100}
                  />
                </div>
              </div>

              {/* Speed Stat */}
              <div className="stat-allocation-row spd">
                <div className="stat-header">
                  <div className="stat-name-group">
                    <span className="stat-name spd pixel-font text-xs sm:text-sm">Speed (SPD)</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="info-icon" role="img" aria-label="About Speed">
                          <img className="info-icon__img" src={INFO_ICON_SRC} alt="" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <ul className="indigolay-list">
                          <li className="indigolay-list__item">
                            <span className="indigolay-list__bullet">◆</span>
                            <span className="indigolay-list__text">Reduces ultimate skill cooldown</span>
                          </li>
                          <li className="indigolay-list__item">
                            <span className="indigolay-list__bullet">◆</span>
                            <span className="indigolay-list__text">Reduces item cooldowns in battle</span>
                          </li>
                          <li className="indigolay-list__item">
                            <span className="indigolay-list__bullet">◆</span>
                            <span className="indigolay-list__text">Charges the party Guard meter faster</span>
                          </li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="stat-values pixel-font text-xs">
                    <span className="stat-current">{character.stats.spd}</span>
                    {potentialStatPoints.spd + pendingAllocations.spd > 0 && (
                      <>
                        <span className="stat-arrow">
                          <img
                            className="stat-arrow-icon"
                            src="/assets/icons/indigolay/Icon_arrow-right.png"
                            alt="arrow"
                          />
                        </span>
                        <span className="stat-preview number-flow-container">
                          <NumberFlow
                            value={previewStats.spd + potentialStatPoints.spd}
                            format={INTEGER_FORMAT}
                            trend={1}
                            spinTiming={SNAPPY_SPIN_TIMING}
                            transformTiming={SNAPPY_TRANSFORM_TIMING}
                            opacityTiming={SNAPPY_OPACITY_TIMING}
                          />
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="stat-hint pixel-font text-xs">
                  Reduces skill &amp; item cooldowns, charges Guard faster.
                </p>
                <div className="stat-controls">
                  <ToffecBeigeCornersWrapper>
                    <ToffecSquareButton
                      icon="minus"
                      variant="fairy3"
                      size="default"
                      onClick={() => handleDecreaseStat('spd')}
                      {...holdDecrease.spd}
                      disabled={pendingAllocations.spd === 0}
                      aria-label="Decrease Speed"
                    />
                  </ToffecBeigeCornersWrapper>
                  <ToffecBeigeCornersWrapper>
                    <ToffecSquareButton
                      icon="plus"
                      variant="fairy3"
                      size="default"
                      onClick={() => handleIncreaseStat('spd')}
                      {...holdIncrease.spd}
                      disabled={pointsRemaining === 0}
                      aria-label="Increase Speed"
                    />
                  </ToffecBeigeCornersWrapper>
                  <IndigolayBar
                    className="stat-meter"
                    variant="sky-blue"
                    percentage={((previewStats.spd + potentialStatPoints.spd) / STAT_METER_MAX) * 100}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="allocation-actions">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ToffecButton variant="cream" onClick={handleConfirm} disabled={!allPointsAllocated}>
                      Confirm
                    </ToffecButton>
                  </div>
                </TooltipTrigger>
                {!allPointsAllocated && <TooltipContent side="top">Spend all points before continuing</TooltipContent>}
              </Tooltip>
              <ToffecButton variant="tan" onClick={handleReset} disabled={!hasPendingChanges}>
                Reset
              </ToffecButton>
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
