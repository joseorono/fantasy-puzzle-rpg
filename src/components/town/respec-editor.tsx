import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import type { CharacterData, CoreRPGStats, StatType } from '~/types/rpg-elements';
import { getAllocatedStats, getRespecFloor } from '~/lib/leveling-system';
import { calculateMaxHp } from '~/lib/rpg-calculations';
import { useStatAllocation } from '~/hooks/use-stat-allocation';
import { useStatAllocationKeyboard } from '~/hooks/use-stat-allocation-keyboard';
import { StatAllocationRow } from '~/components/level-up-screen/stat-allocation-row';
import { DerivedStatsDisplay } from '~/components/level-up-screen/derived-stats-display';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { LevelTag } from '~/components/ui-custom/level-tag';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

const STAT_ORDER: StatType[] = ['pow', 'vit', 'spd'];
type RespecAction = 'confirm' | 'reset' | 'back';

interface RespecEditorProps {
  character: CharacterData;
  /** Whether the player can pay the fee shown in the host's header; gates Confirm. */
  isAffordable: boolean;
  /** The host says when this pane owns the keyboard. */
  keyboardActive: boolean;
  /** Called with the full new stat line once the player commits. */
  onConfirm: (newStats: CoreRPGStats) => void;
  onBack: () => void;
  /** ↑ from the top stat row hands the keyboard back to the hero picker. */
  onExitUp: () => void;
}

/**
 * Re-spends one hero's hand-allocated stat points. Opens pre-filled with the current split, so
 * the player moves points rather than starting from zero; the floor under each stat is the
 * base-plus-random-growth share that a respec never touches. Mount it keyed by hero id.
 */
export function RespecEditor({
  character,
  isAffordable,
  keyboardActive,
  onConfirm,
  onBack,
  onExitUp,
}: RespecEditorProps) {
  const allocated = getAllocatedStats(character);
  const floor = getRespecFloor(character);
  const refundable = allocated.pow + allocated.vit + allocated.spd;
  const allocation = useStatAllocation(refundable, allocated);
  const { pointsRemaining, hasPendingChanges, allPointsAllocated } = allocation;

  const previewStats: CoreRPGStats = {
    pow: floor.pow + allocation.pending.pow,
    vit: floor.vit + allocation.pending.vit,
    spd: floor.spd + allocation.pending.spd,
  };
  const previewMaxHp = calculateMaxHp(character.baseHp, previewStats.vit, character.vitHpMultiplier);
  const willLoseHp = previewMaxHp < character.currentHp;

  const canConfirm = allPointsAllocated && hasPendingChanges && isAffordable;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm(previewStats);
  }

  function handleReset() {
    allocation.reset();
    keyboard.focusStats();
  }

  const keyboard = useStatAllocationKeyboard<RespecAction>({
    allocation,
    stats: STAT_ORDER,
    actions: [{ id: 'confirm', disabled: !canConfirm }, { id: 'reset', disabled: !hasPendingChanges }, { id: 'back' }],
    onActivate: (action) => {
      if (action === 'confirm') handleConfirm();
      else if (action === 'reset') handleReset();
      else onBack();
    },
    onConfirmShortcut: handleConfirm,
    onExitUp,
    active: keyboardActive,
  });
  const { selectedStatIndex, selectedAction } = keyboard;

  return (
    <NumberFlowGroup>
      <div className="training-editor">
        <div className="training-editor__main">
          <div className="training-editor__header">
            <div className="training-editor__identity">
              <LevelTag level={character.level} />
              <span className="training-editor__name pixel-font">{character.name}</span>
            </div>
            <span className="training-editor__points pixel-font">
              Points to place:{' '}
              <span className="number-flow-container">
                <NumberFlow
                  value={pointsRemaining}
                  format={INTEGER_FORMAT}
                  trend={-1}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </span>
            </span>
          </div>

          <div className="stat-allocation-list">
            {STAT_ORDER.map((stat, index) => (
              <StatAllocationRow
                key={stat}
                stat={stat}
                characterClass={character.class}
                currentValue={character.stats[stat]}
                previewValue={previewStats[stat] !== character.stats[stat] ? previewStats[stat] : null}
                meterValue={previewStats[stat]}
                isSelected={keyboardActive && selectedStatIndex === index}
                canIncrease={pointsRemaining > 0}
                canDecrease={allocation.pending[stat] > 0}
                onIncrease={() => allocation.increase(stat)}
                onDecrease={() => allocation.decrease(stat)}
                holdIncrease={allocation.holdIncrease[stat]}
                holdDecrease={allocation.holdDecrease[stat]}
              />
            ))}
          </div>

          {willLoseHp && (
            <p className="training-editor__hp-warning pixel-font">
              Current HP will drop to {previewMaxHp} — respecing never heals.
            </p>
          )}

          <div className="training-editor__actions">
            <ToffecBeigeCornersWrapper forceDisplay={keyboardActive && selectedAction === 'confirm'}>
              <ToffecButton variant="cream" size="xs" onClick={handleConfirm} disabled={!canConfirm}>
                {isAffordable ? 'Respec' : 'Not Enough Coins'}
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper forceDisplay={keyboardActive && selectedAction === 'reset'}>
              <ToffecButton variant="tan" size="xs" onClick={handleReset} disabled={!hasPendingChanges}>
                Reset
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper forceDisplay={keyboardActive && selectedAction === 'back'}>
              <ToffecButton variant="tan" size="xs" onClick={onBack}>
                Back
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
          </div>
        </div>

        <div className="training-editor__side">
          <DerivedStatsDisplay character={character} previewStats={previewStats} />
        </div>
      </div>
    </NumberFlowGroup>
  );
}
