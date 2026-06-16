import NumberFlow from '@number-flow/react';
import type { Resources } from '~/types/resources';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { RESOURCE_DISPLAY_ORDER, RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

interface TopBarResourcesProps {
  resources: Resources;
}

export function TopBarResources({ resources }: TopBarResourcesProps) {
  const resourceItems = RESOURCE_DISPLAY_ORDER.map((key) => ({
    key,
    label: RESOURCE_LABELS[key],
    value: resources[key],
    className: `top-bar-resource--${key}`,
    iconName: RESOURCE_ICON_NAMES[key],
  }));

  return (
    <div className="top-bar-resources">
      <div className="top-bar-resources__container mr-14">
        {resourceItems.map((item) => (
          <div key={item.key} className={`top-bar-resource ${item.className}`}>
            <FrostyRpgIcon name={item.iconName} size={32} className="top-bar-resource__icon" />
            <div className="top-bar-resource__content">
              <span className="top-bar-resource__label">{item.label}</span>
              <span className="top-bar-resource__value number-flow-container">
                <NumberFlow
                  value={item.value}
                  format={INTEGER_FORMAT}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
