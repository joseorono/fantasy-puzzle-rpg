import NumberFlow from '@number-flow/react';
import type { CharacterClass, StatType } from '~/types/rpg-elements';
import type { PressAndHoldHandlers } from '~/hooks/use-press-and-hold';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';
import { IndigolayBar } from '~/components/ui-custom/indigolay-bar';
import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';
import { INFO_ICON_SRC, STAT_METER_MAX } from '~/constants/ui';
import { cn } from '~/lib/utils';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

interface StatRowCopy {
  name: string;
  /** Short form for the +/− button labels. */
  shortName: string;
  meterVariant: 'orange' | 'green' | 'sky-blue';
  tooltipVariant: 'send' | 'chevron';
  tooltip: (isHealer: boolean) => string[];
  hint: (isHealer: boolean) => string;
}

const STAT_ROW_COPY: Record<StatType, StatRowCopy> = {
  pow: {
    name: 'Power (POW)',
    shortName: 'Power',
    meterVariant: 'orange',
    tooltipVariant: 'send',
    tooltip: (isHealer) => [isHealer ? 'Increases your healing output' : 'Increases your damage output'],
    hint: (isHealer) => (isHealer ? 'Increases your healing power.' : 'Increases your ability power.'),
  },
  vit: {
    name: 'Vitality (VIT)',
    shortName: 'Vitality',
    meterVariant: 'green',
    tooltipVariant: 'chevron',
    tooltip: () => [
      "Raises Maximum HP, scaled by this character's VIT multiplier",
      'Slows how fast the party Guard meter decays',
    ],
    hint: () => 'Increases your Maximum HP, makes Guard last longer.',
  },
  spd: {
    name: 'Speed (SPD)',
    shortName: 'Speed',
    meterVariant: 'sky-blue',
    tooltipVariant: 'chevron',
    tooltip: () => [
      'Reduces ultimate skill cooldown',
      'Reduces item cooldowns in battle',
      'Charges the party Guard meter faster',
    ],
    hint: () => 'Reduces skill & item cooldowns, charges Guard faster.',
  },
};

interface StatAllocationRowProps {
  stat: StatType;
  characterClass: CharacterClass;
  /** The committed value, shown on the left of the arrow. */
  currentValue: number;
  /** The value the row is heading to; `null` hides the arrow and preview. */
  previewValue: number | null;
  /** What the meter fills to, out of `STAT_METER_MAX`. */
  meterValue: number;
  isSelected: boolean;
  canIncrease: boolean;
  canDecrease: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  holdIncrease: PressAndHoldHandlers;
  holdDecrease: PressAndHoldHandlers;
}

/**
 * One stat card of an allocation panel: name with a what-it-does tooltip, current → preview
 * values, a one-line hint, and the −/+ steppers beside a fill meter. Styled by the
 * `.stat-allocation-row` rules in `level-up-screen.css`, which are global, so any host
 * with a `useStatAllocation` can stack three of these.
 */
export function StatAllocationRow({
  stat,
  characterClass,
  currentValue,
  previewValue,
  meterValue,
  isSelected,
  canIncrease,
  canDecrease,
  onIncrease,
  onDecrease,
  holdIncrease,
  holdDecrease,
}: StatAllocationRowProps) {
  const copy = STAT_ROW_COPY[stat];
  const isHealer = characterClass === 'healer';

  return (
    <div className={cn('stat-allocation-row', stat, isSelected && 'stat-allocation-row--selected')}>
      <div className="stat-header">
        <div className="stat-name-group">
          <span className={cn('stat-name pixel-font text-xs sm:text-sm', stat)}>{copy.name}</span>
          <Tooltip>
            <TooltipTrigger>
              <span className="info-icon" role="img" aria-label={`About ${copy.shortName}`}>
                <img className="info-icon__img" src={INFO_ICON_SRC} alt="" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <IndigoLayStyledLists variant={copy.tooltipVariant}>
                {copy.tooltip(isHealer).map((line) => (
                  <IndigolayStyledListItem key={line}>{line}</IndigolayStyledListItem>
                ))}
              </IndigoLayStyledLists>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="stat-values pixel-font text-xs">
          <span className="stat-current">{currentValue}</span>
          {previewValue !== null && (
            <>
              <span className="stat-arrow">
                <img className="stat-arrow-icon" src="/assets/icons/indigolay/Icon_arrow-right.png" alt="arrow" />
              </span>
              <span className="stat-preview number-flow-container">
                <NumberFlow
                  value={previewValue}
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
      <p className="stat-hint pixel-font text-xs">{copy.hint(isHealer)}</p>
      <div className="stat-controls">
        <ToffecBeigeCornersWrapper forceDisplay={isSelected}>
          <ToffecSquareButton
            icon="minus"
            variant="fairy3"
            size="default"
            onClick={onDecrease}
            {...holdDecrease}
            disabled={!canDecrease}
            aria-label={`Decrease ${copy.shortName}`}
          />
        </ToffecBeigeCornersWrapper>
        <ToffecBeigeCornersWrapper forceDisplay={isSelected}>
          <ToffecSquareButton
            icon="plus"
            variant="fairy3"
            size="default"
            onClick={onIncrease}
            {...holdIncrease}
            disabled={!canIncrease}
            aria-label={`Increase ${copy.shortName}`}
          />
        </ToffecBeigeCornersWrapper>
        <IndigolayBar
          className="stat-meter"
          variant={copy.meterVariant}
          percentage={(meterValue / STAT_METER_MAX) * 100}
        />
      </div>
    </div>
  );
}
