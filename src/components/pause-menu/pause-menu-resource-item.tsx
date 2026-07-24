import NumberFlow from '@number-flow/react';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

interface PauseMenuResourceItemProps {
  resourceKey: string;
  label: string;
  value: number;
  iconName: FrostyRpgIconName;
}

export function PauseMenuResourceItem({ resourceKey, label, value, iconName }: PauseMenuResourceItemProps) {
  return (
    <div className={`pause-menu-resource pause-menu-resource--${resourceKey}`}>
      <FrostyRpgIcon name={iconName} size={24} className="pause-menu-resource__icon" />
      <div className="pause-menu-resource__content">
        <span className="pause-menu-resource__label">{label}</span>
        <span className="pause-menu-resource__value number-flow-container">
          <NumberFlow
            value={value}
            format={INTEGER_FORMAT}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
        </span>
      </div>
    </div>
  );
}
