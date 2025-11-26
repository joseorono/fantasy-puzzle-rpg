import type { Resources } from '~/types/resources';

interface TopBarResourcesProps {
  resources: Resources;
}

export function TopBarResources({ resources }: TopBarResourcesProps) {
  const resourceItems = [
    { 
      key: 'coins' as keyof Resources, 
      label: 'Coins', 
      value: resources.coins,
      className: 'top-bar-resource--coins'
    },
    { 
      key: 'gold' as keyof Resources, 
      label: 'Gold', 
      value: resources.gold,
      className: 'top-bar-resource--gold'
    },
    { 
      key: 'silver' as keyof Resources, 
      label: 'Silver', 
      value: resources.silver,
      className: 'top-bar-resource--silver'
    },
    { 
      key: 'bronze' as keyof Resources, 
      label: 'Bronze', 
      value: resources.bronze,
      className: 'top-bar-resource--bronze'
    },
    { 
      key: 'copper' as keyof Resources, 
      label: 'Copper', 
      value: resources.copper,
      className: 'top-bar-resource--copper'
    },
  ];

  return (
    <div className="top-bar-resources">
      <div className="top-bar-resources__container mr-14">
        {resourceItems.map((item) => (
          <div key={item.key} className={`top-bar-resource ${item.className}`}>
            <div className="top-bar-resource__icon"></div>
            <div className="top-bar-resource__content">
              <span className="top-bar-resource__label">{item.label}</span>
              <span className="top-bar-resource__value">{item.value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
