import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ConfirmPanel } from '~/components/confirm-dialog/confirm-panel';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { getScaledEquipmentStats, type OwnedEquipmentInstance } from '~/lib/equipment-system';
import type { Resources } from '~/types/resources';
import { CostBadges } from './cost-badge';

interface SalvageConfirmDialogProps {
  instance: OwnedEquipmentInstance;
  salvageReturn: Resources;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Salvage confirmation — the generic {@link ConfirmPanel} shell filled with an item
 * preview (icon, name, rarity, scaled stats) and the resources the player gets back.
 */
export function SalvageConfirmDialog({ instance, salvageReturn, onConfirm, onCancel }: SalvageConfirmDialogProps) {
  const stats = getScaledEquipmentStats(instance.item, instance.rarity);

  return (
    <ConfirmPanel
      title="Salvage Gear?"
      confirmLabel="Confirm Salvage"
      cancelLabel="Cancel"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className="salvage-confirm">
        <div className="salvage-confirm__item">
          <div className="salvage-confirm__icon">
            {instance.item.iconName ? <FrostyRpgIcon name={instance.item.iconName} size={40} /> : null}
          </div>
          <div className="salvage-confirm__name" style={{ color: getRarityColor(instance.rarity) }}>
            {instance.item.name}
            <span className="salvage-confirm__rarity">{getRarityLabel(instance.rarity)}</span>
          </div>
        </div>

        <div className="salvage-confirm__stats">
          <span className="stat-badge">POW: {stats.pow}</span>
          <span className="stat-badge">VIT: {stats.vit}</span>
          <span className="stat-badge">SPD: {stats.spd}</span>
        </div>

        <div className="salvage-confirm__return">
          <span className="salvage-confirm__return-label">You will receive:</span>
          <div className="salvage-confirm__return-badges">
            <CostBadges resources={salvageReturn} />
          </div>
        </div>
      </div>
    </ConfirmPanel>
  );
}
