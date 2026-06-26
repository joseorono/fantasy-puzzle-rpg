import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
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

export function SalvageConfirmDialog({ instance, salvageReturn, onConfirm, onCancel }: SalvageConfirmDialogProps) {
  const stats = getScaledEquipmentStats(instance.item, instance.rarity);

  return (
    <div className="salvage-confirm-backdrop" onClick={onCancel}>
      <div className="salvage-confirm-panel" onClick={(e) => e.stopPropagation()}>
        {/* Corner decorations */}
        <div className="salvage-confirm-corner salvage-confirm-corner--tl" />
        <div className="salvage-confirm-corner salvage-confirm-corner--tr" />
        <div className="salvage-confirm-corner salvage-confirm-corner--bl" />
        <div className="salvage-confirm-corner salvage-confirm-corner--br" />

        <button
          className="salvage-confirm-close"
          onClick={onCancel}
          aria-label="Close"
          type="button"
        />

        <div className="salvage-confirm-header">
          <NarikWoodBitFont text="Salvage Gear?" size={1.2} />
        </div>

        <div className="salvage-confirm-divider" />

        <div className="salvage-confirm-body">
          <div className="salvage-confirm-item">
            <div className="salvage-confirm-icon">
              {instance.item.iconName ? <FrostyRpgIcon name={instance.item.iconName} size={40} /> : null}
            </div>
            <div className="salvage-confirm-name" style={{ color: getRarityColor(instance.rarity) }}>
              {instance.item.name}
              <span className="salvage-confirm-rarity">{getRarityLabel(instance.rarity)}</span>
            </div>
          </div>

          <div className="salvage-confirm-stats">
            <span className="stat-badge">POW: {stats.pow}</span>
            <span className="stat-badge">VIT: {stats.vit}</span>
            <span className="stat-badge">SPD: {stats.spd}</span>
          </div>

          <div className="salvage-confirm-return">
            <span className="salvage-confirm-return-label">You will receive:</span>
            <div className="salvage-confirm-return-badges">
              <CostBadges resources={salvageReturn} />
            </div>
          </div>
        </div>

        <div className="salvage-confirm-divider" />

        <div className="salvage-confirm-actions">
          <ToffecButton variant="cream" size="xs" onClick={onCancel}>
            Cancel
          </ToffecButton>
          <ToffecButton variant="orange" size="xs" onClick={onConfirm}>
            Confirm Salvage
          </ToffecButton>
        </div>
      </div>
    </div>
  );
}
