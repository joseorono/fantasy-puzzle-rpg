import { useEffect, useState } from 'react';
import { findEquipmentItem, getScaledEquipmentStats } from '~/lib/equipment-system';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { IndigolayDivider } from '~/components/dividers/indigolay-divider';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { cn } from '~/lib/utils';
import { OverlayContainer } from './overlay-container';
import type { OverlayRequest } from '~/stores/overlay-atoms';

/** Delay before the SUCCESS banner gives way to the item's stat panel. */
const BANNER_TO_DETAILS_MS = 1300;

interface CraftingSuccessOverlayProps {
  request: Extract<OverlayRequest, { kind: 'crafting-success' }>;
  onDismiss: () => void;
}

/**
 * Two-phase "Forging Success" celebration for a freshly crafted item:
 * a dramatic SUCCESS banner, then a reveal of the item's stats.
 */
export function CraftingSuccessOverlay({ request, onDismiss }: CraftingSuccessOverlayProps) {
  const item = findEquipmentItem(request.itemId);
  const [phase, setPhase] = useState<'banner' | 'details'>('banner');

  useEffect(() => {
    soundService.playSound(SoundNames.blacksmith, 0.8);
    const timer = setTimeout(() => {
      setPhase('details');
      soundService.playSound(SoundNames.shimmeringSuccess, 0.9);
    }, BANNER_TO_DETAILS_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!item) return null;

  const scaled = getScaledEquipmentStats(item, request.rarity);
  const rarityColor = getRarityColor(request.rarity);
  const stats = [
    { label: 'POW', value: scaled.pow },
    { label: 'VIT', value: scaled.vit },
    { label: 'SPD', value: scaled.spd },
  ].filter((stat) => stat.value !== 0);

  return (
    <OverlayContainer
      onDismiss={onDismiss}
      dismissOnBackdropClick={request.dismissOnBackdropClick ?? true}
      autoDismissMs={request.autoDismissMs ?? 5200}
      sparkleCount={28}
    >
      <div className={cn('crafting-success', `crafting-success--${phase}`)}>
        <div className="crafting-success-title">
          <div className="title-sign title-sign--red title-sign--text-gold" style={{ width: '520px' }}>
            <span className="title-sign__text pixel-font" style={{ fontSize: '20px' }}>SUCCESS</span>
          </div>
        </div>

        <div className="crafting-success-item">
          {item.iconName && (
            <div className="crafting-success-item-icon">
              <FrostyRpgIcon name={item.iconName} size={56} />
            </div>
          )}
          <div className="crafting-success-item-name pixel-font">{item.name}</div>
          <div
            className="crafting-success-item-rarity pixel-font text-[0.7rem] tracking-wider uppercase"
            style={{ color: rarityColor }}
          >
            {getRarityLabel(request.rarity)}
          </div>
        </div>

        <div className="crafting-success-details">
          <div className="crafting-success-subtitle">
            <NarikWoodBitFont text="Forging Success" size={1} />
          </div>
          <IndigolayDivider variant="gold" />
          <div className="crafting-success-stats">
            {stats.map((stat) => (
              <div className="crafting-success-stat" key={stat.label}>
                <span className="crafting-success-stat-label">{stat.label}</span>
                <span className="crafting-success-stat-value">
                  {stat.value > 0 ? `+${stat.value}` : stat.value}
                </span>
              </div>
            ))}
            {item.forClass && (
              <div className="crafting-success-stat">
                <span className="crafting-success-stat-label">For</span>
                <span className="crafting-success-stat-value capitalize">{item.forClass}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </OverlayContainer>
  );
}
