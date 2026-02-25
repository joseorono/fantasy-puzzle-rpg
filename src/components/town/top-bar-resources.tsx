import NumberFlow from '@number-flow/react';
import type { Resources } from '~/types/resources';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
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
  const resourceItems = [
    {
      key: 'coins' as keyof Resources,
      label: 'Coins',
      value: resources.coins,
      className: 'top-bar-resource--coins',
    },
    {
      key: 'gold' as keyof Resources,
      label: 'Gold',
      value: resources.gold,
      className: 'top-bar-resource--gold',
    },
    {
      key: 'silver' as keyof Resources,
      label: 'Silver',
      value: resources.silver,
      className: 'top-bar-resource--silver',
    },
    {
      key: 'iron' as keyof Resources,
      label: 'Iron',
      value: resources.iron,
      className: 'top-bar-resource--iron',
    },
    {
      key: 'copper' as keyof Resources,
      label: 'Copper',
      value: resources.copper,
      className: 'top-bar-resource--copper',
    },
  ];

  return (
    <div className="top-bar-resources">
      <div className="top-bar-resources__container mr-14">
        {resourceItems.map((item) => (
          <div key={item.key} className={`top-bar-resource ${item.className}`}>
            <FrostyRpgIcon name="coinPurse" size={32} className="top-bar-resource__icon" />
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
