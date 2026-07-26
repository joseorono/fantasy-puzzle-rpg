import NumberFlow from '@number-flow/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { cn } from '~/lib/utils';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';
import type { Resources } from '~/types/resources';

const resourceStatItemVariants = cva('resource-stat', {
  variants: {
    variant: {
      chip: 'resource-stat--chip',
      card: 'resource-stat--card',
    },
  },
  defaultVariants: {
    variant: 'chip',
  },
});

/** Sprite size requested from the sheet; each skin sizes the rendered icon in CSS. */
const ICON_SPRITE_SIZE = 24;

interface ResourceStatItemProps extends VariantProps<typeof resourceStatItemVariants> {
  /** Picks the value colour via the `resource-stat--<resource>` modifier. */
  resource: keyof Resources;
  label: string;
  value: number;
  iconName: FrostyRpgIconName;
  /** Running total shown after an arrow. Omit for a single-value item. */
  balance?: number;
  /** Prefix on the primary value, e.g. `+` for an amount just earned. */
  prefix?: string;
  /** Forces the digit spin direction; omit to let NumberFlow read it from the delta. */
  trend?: number;
  className?: string;
}

/**
 * One resource readout: icon, label, and an animated value. Shared by the pause
 * menu's compact bar and the battle-rewards cards, which differ only in skin.
 */
export function ResourceStatItem({
  resource,
  label,
  value,
  iconName,
  variant,
  balance,
  prefix,
  trend,
  className,
}: ResourceStatItemProps) {
  return (
    <div className={cn(resourceStatItemVariants({ variant, className }), `resource-stat--${resource}`)}>
      <FrostyRpgIcon name={iconName} size={ICON_SPRITE_SIZE} className="resource-stat__icon" />
      <div className="resource-stat__content">
        <span className="resource-stat__label">{label}</span>
        <div className="resource-stat__values">
          <span className="resource-stat__value number-flow-container">
            <NumberFlow
              value={value}
              format={INTEGER_FORMAT}
              prefix={prefix}
              trend={trend}
              spinTiming={SNAPPY_SPIN_TIMING}
              transformTiming={SNAPPY_TRANSFORM_TIMING}
              opacityTiming={SNAPPY_OPACITY_TIMING}
            />
          </span>
          {balance !== undefined && (
            <>
              <span className="resource-stat__arrow">{'→'}</span>
              <span className="resource-stat__balance number-flow-container">
                <NumberFlow
                  value={balance}
                  format={INTEGER_FORMAT}
                  trend={trend}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { resourceStatItemVariants };
