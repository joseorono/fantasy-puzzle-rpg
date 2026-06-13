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
