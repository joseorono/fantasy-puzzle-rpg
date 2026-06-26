import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import type { Resources } from '~/types/resources';

type ResourceKey = keyof Resources;

interface ResourceDisplay {
  label: string;
  iconName: FrostyRpgIconName;
  variant: 'gold' | 'silver' | 'copper' | 'iron';
}

const RESOURCE_DISPLAY: Record<ResourceKey, ResourceDisplay> = {
  coins: { label: 'Coins', iconName: 'coinPurse', variant: 'gold' },
  gold: { label: 'Gold', iconName: 'goldBar', variant: 'gold' },
  silver: { label: 'Silver', iconName: 'silverBar', variant: 'silver' },
  copper: { label: 'Copper', iconName: 'copperBar', variant: 'copper' },
  iron: { label: 'Iron', iconName: 'ironBar', variant: 'iron' },
};

interface CostBadgeProps {
  resource: ResourceKey;
  amount: number;
}

export function CostBadge({ resource, amount }: CostBadgeProps) {
  const display = RESOURCE_DISPLAY[resource];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`cost-badge ${display.variant} flex items-center gap-1`}>
          <FrostyRpgIcon name={display.iconName} size={14} /> {amount}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {amount} {display.label}
      </TooltipContent>
    </Tooltip>
  );
}

interface CostBadgesProps {
  resources: Resources;
}

export function CostBadges({ resources }: CostBadgesProps) {
  return (
    <>
      {resources.coins > 0 && <CostBadge resource="coins" amount={resources.coins} />}
      {resources.gold > 0 && <CostBadge resource="gold" amount={resources.gold} />}
      {resources.silver > 0 && <CostBadge resource="silver" amount={resources.silver} />}
      {resources.copper > 0 && <CostBadge resource="copper" amount={resources.copper} />}
      {resources.iron > 0 && <CostBadge resource="iron" amount={resources.iron} />}
    </>
  );
}
