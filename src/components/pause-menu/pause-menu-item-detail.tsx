import NumberFlow from '@number-flow/react';
import { cn } from '~/lib/utils';
import { describeConsumableAction, getConsumableUsability } from '~/lib/inventory';
import { getEquipmentSlot, getEquippedHolders, getScaledEquipmentStats } from '~/lib/equipment-system';
import { getSellPrice } from '~/lib/crafting';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { DEFAULT_RARITY, type RarityTier } from '~/constants/rarity';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import { CostBadge } from '~/components/ui-custom/cost-badge';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import type { BaseItemData, ConsumableItemData, EquipmentItemData } from '~/types/inventory';
import type { CharacterData } from '~/types/rpg-elements';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

const STAT_KEYS = ['pow', 'vit', 'spd'] as const;

/** Whether the card offers Use, and if so whether it can be pressed right now. */
export type ItemUseState = { kind: 'hidden' } | { kind: 'enabled' } | { kind: 'disabled'; reason: string };

interface PauseMenuItemDetailProps {
  item: BaseItemData;
  /** Rolled rarity of the inspected stack (equipment only). */
  rarity?: RarityTier;
  /** Quantity in the inspected stack. */
  owned: number;
  party: CharacterData[];
  itemUse: ItemUseState;
  /** The target picker is open for this item — the Use button reads Cancel. */
  isPickerOpen: boolean;
  onToggleUse: () => void;
}

/**
 * The Items tab's parchment card for the inspected stack: icon and tags, flavor text, a dark
 * ledger of facts (effect and usability for consumables, scaled stats and wearers for gear),
 * then owned count, sell price and Use.
 */
export function PauseMenuItemDetail({
  item,
  rarity,
  owned,
  party,
  itemUse,
  isPickerOpen,
  onToggleUse,
}: PauseMenuItemDetailProps) {
  const isEquipment = item.type === 'equipment';
  const slot = isEquipment ? getEquipmentSlot(item.id) : null;

  return (
    <div className="pause-menu-item-detail">
      <div className="pause-menu-item-card__header">
        <span className="pause-menu-item-card__icon">
          <ItemIcon item={item} size={32} />
        </span>
        <div className="pause-menu-item-card__title-group">
          <span className="pause-menu-item-card__name pixel-font">{item.name}</span>
          <span className="pause-menu-item-card__tags">
            <span className="pause-menu-item-card__tag">
              {item.type === 'consumable' ? 'Consumable' : item.type === 'key' ? 'Key item' : (slot ?? 'Gear')}
            </span>
            {isEquipment && (
              <span className="pause-menu-item-card__tag" style={{ color: getRarityColor(rarity) }}>
                {getRarityLabel(rarity)}
              </span>
            )}
          </span>
        </div>
      </div>

      <p className="pause-menu-item-card__desc">{item.description}</p>

      {item.type === 'consumable' && <ConsumableFacts item={item as ConsumableItemData} />}
      {isEquipment && <EquipmentFacts item={item as EquipmentItemData} rarity={rarity} party={party} />}

      <div className="pause-menu-item-card__footer">
        <div className="pause-menu-item-card__summary">
          <span className="pause-menu-item-card__owned number-flow-container">
            Owned&nbsp;
            <strong>
              ×
              <NumberFlow
                value={owned}
                format={INTEGER_FORMAT}
                trend={-1}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
            </strong>
          </span>
          <span className="pause-menu-item-card__sell">
            Sells <CostBadge resource="coins" amount={getSellPrice(item)} compact />
          </span>
        </div>
        {itemUse.kind !== 'hidden' && (
          <>
            <ToffecBeigeCornersWrapper className="pause-menu-item-card__use">
              <ToffecButton
                variant={isPickerOpen ? 'gray' : 'orange'}
                size="xs"
                disabled={itemUse.kind === 'disabled' && !isPickerOpen}
                onClick={onToggleUse}
              >
                {isPickerOpen ? 'Cancel' : 'Use'}
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
            {itemUse.kind === 'disabled' && !isPickerOpen && (
              <p className="pause-menu-item-card__reason">{itemUse.reason}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Effect line plus where the item can be used. */
function ConsumableFacts({ item }: { item: ConsumableItemData }) {
  const effect = describeConsumableAction(item.action);
  const usability = getConsumableUsability(item);

  return (
    <div className="pause-menu-item-card__ledger">
      {effect && <span className="pause-menu-item-card__effect">{effect}</span>}
      <span className="pause-menu-item-card__chips">
        {usability === 'anywhere' && (
          <>
            <span className="pause-menu-item-card__chip pause-menu-item-card__chip--battle">Battle</span>
            <span className="pause-menu-item-card__chip pause-menu-item-card__chip--field">Anywhere</span>
          </>
        )}
        {usability === 'battle' && (
          <span className="pause-menu-item-card__chip pause-menu-item-card__chip--battle">Battle only</span>
        )}
        {usability === 'field' && (
          <span className="pause-menu-item-card__chip pause-menu-item-card__chip--field">Field only</span>
        )}
      </span>
    </div>
  );
}

interface EquipmentFactsProps {
  item: EquipmentItemData;
  rarity?: RarityTier;
  party: CharacterData[];
}

/** Rarity-scaled POW/VIT/SPD, then slot, class, combo bonus and who is wearing this stack. */
function EquipmentFacts({ item, rarity, party }: EquipmentFactsProps) {
  const stats = getScaledEquipmentStats(item, rarity);
  const holders = getEquippedHolders(party, item.id, rarity ?? DEFAULT_RARITY);

  return (
    <div className="pause-menu-item-card__ledger">
      <div className="pause-menu-item-card__stats">
        {STAT_KEYS.map((stat) => {
          const value = stats[stat];
          return (
            <span key={stat} className="gear-stats__chip">
              <span className={`gear-stats__label gear-stats__label--${stat}`}>{stat}</span>
              <span
                className={cn(
                  'gear-stats__value',
                  value === 0 && 'gear-stats__value--zero',
                  value < 0 && 'gear-stats__value--down',
                )}
              >
                {value > 0 ? `+${value}` : value}
              </span>
            </span>
          );
        })}
      </div>
      <ItemFact label="Class" value={item.forClass ?? 'Any'} isCapitalized />
      {item.comboBonus ? <ItemFact label="Combo" value={`+${Math.round(item.comboBonus * 100)}% / cascade`} /> : null}
      <ItemFact
        label="Worn by"
        value={holders.length > 0 ? holders.map((member) => member.name).join(', ') : 'Nobody'}
      />
    </div>
  );
}

interface ItemFactProps {
  label: string;
  value: string;
  isCapitalized?: boolean;
}

function ItemFact({ label, value, isCapitalized = false }: ItemFactProps) {
  return (
    <span className="pause-menu-item-card__fact">
      <span className="pause-menu-item-card__fact-label">{label}</span>
      <span className={cn('pause-menu-item-card__fact-value', isCapitalized && 'capitalize')}>{value}</span>
    </span>
  );
}
