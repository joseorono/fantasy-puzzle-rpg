import { cn } from '~/lib/utils';
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
  compact?: boolean;
}

export function CostBadge({ resource, amount, compact = false }: CostBadgeProps) {
  const display = RESOURCE_DISPLAY[resource];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            compact ? 'resource-chip' : `cost-badge ${display.variant}`,
            'flex items-center gap-1',
          )}
        >
          <FrostyRpgIcon
            name={display.iconName}
            size={compact ? 16 : 14}
            className={cn(compact && 'resource-chip__icon')}
          />
          <span className={cn(compact && 'resource-chip__amount')}>{amount}</span>
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
  compact?: boolean;
}

export function CostBadges({ resources, compact = false }: CostBadgesProps) {
  return (
    <>
      {resources.coins > 0 && <CostBadge resource="coins" amount={resources.coins} compact={compact} />}
      {resources.gold > 0 && <CostBadge resource="gold" amount={resources.gold} compact={compact} />}
      {resources.silver > 0 && <CostBadge resource="silver" amount={resources.silver} compact={compact} />}
      {resources.copper > 0 && <CostBadge resource="copper" amount={resources.copper} compact={compact} />}
      {resources.iron > 0 && <CostBadge resource="iron" amount={resources.iron} compact={compact} />}
    </>
  );
}
