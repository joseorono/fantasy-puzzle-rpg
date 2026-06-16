import type { Resources } from '~/types/resources';
import { cn } from '~/lib/utils';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { RESOURCE_ICON_NAMES, RESOURCE_LABELS } from '~/constants/resources';

interface ResourceChipProps {
  /** Resource key, used to pick the icon and tooltip label. */
  resource: keyof Resources;
  /** Amount collected. */
  amount: number;
  /** Icon size in pixels (default 24). */
  iconSize?: number;
  /** Additional CSS classes for the chip wrapper. */
  className?: string;
}

/**
 * Compact pill showing a resource icon next to a "+amount" gained value.
 * Shared by the floor-loot and treasure loot notifications.
 */
export function ResourceChip({ resource, amount, iconSize = 24, className }: ResourceChipProps) {
  return (
    <div className={cn('resource-chip', className)} title={RESOURCE_LABELS[resource]}>
      <FrostyRpgIcon name={RESOURCE_ICON_NAMES[resource]} size={iconSize} className="resource-chip__icon" />
      <span className="resource-chip__amount">+{amount}</span>
    </div>
  );
}
