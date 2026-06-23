import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useInventory, useResources, useParty, useInventoryActions, usePartyActions } from '~/stores/game-store';
import { ConsumableItems, EquipmentItems } from '~/constants/inventory';
import { filterInventoryByType, getItemQuantity } from '~/lib/inventory';
import { getHealableMembers, getDeadMembers, healPartyMember } from '~/lib/party-system';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { BaseItemData } from '~/types/inventory';
import type { RarityTier } from '~/constants/rarity';
import { getScaledEquipmentStats } from '~/lib/equipment-system';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { IndigolayTab } from '~/components/ui-custom/indigolay-tab';
import type { ConsumableItemData, EquipmentItemData } from '~/types';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

type ItemCategory = 'consumable' | 'equipment' | 'key';

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'consumable', label: 'Consumable' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'key', label: 'Key' },
];

const ALL_ITEMS: BaseItemData[] = [...ConsumableItems, ...EquipmentItems];

/**
 * Stable selection key for an inventory stack. Equipment of the same id but
 * different rarity are separate stacks, so rarity is part of the key.
 */
function stackKey(itemId: string, rarity?: RarityTier): string {
  return `${itemId}::${rarity ?? ''}`;
}

export function PauseMenuItems() {
  const inventory = useInventory();
  const resources = useResources();
  const party = useParty();
  const inventoryActions = useInventoryActions();
  const partyActions = usePartyActions();
  const [category, setCategory] = useState<ItemCategory>('consumable');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filteredInventory = filterInventoryByType(inventory, ALL_ITEMS, category);

  const selectedInvItem = selectedKey
    ? filteredInventory.find((inv) => stackKey(inv.itemId, inv.rarity) === selectedKey)
    : undefined;
  const selectedItem = selectedInvItem ? (ALL_ITEMS.find((item) => item.id === selectedInvItem.itemId) ?? null) : null;
  const selectedRarity = selectedInvItem?.rarity;
  const selectedIsEquipment = !!selectedItem && 'pow' in selectedItem;
  const selectedScaledStats =
    selectedIsEquipment && selectedItem
      ? getScaledEquipmentStats(selectedItem as EquipmentItemData, selectedRarity)
      : null;

  function getItemData(itemId: string): BaseItemData | undefined {
    return ALL_ITEMS.find((item) => item.id === itemId);
  }

  function isUsableConsumable(item: BaseItemData): item is ConsumableItemData {
    return item.type === 'consumable' && (item as ConsumableItemData).usableOutOfBattle;
  }

  function canUseItem(item: ConsumableItemData): boolean {
    if (!item.action) return false;
    if (item.action.type === 'heal') {
      return getHealableMembers(party).length > 0 || getDeadMembers(party).length > 0;
    }
    return false;
  }

  function handleUseItem(item: ConsumableItemData) {
    if (!item.action || !canUseItem(item)) return;

    if (item.action.type === 'heal') {
      // Prioritize reviving dead members, then heal most damaged living member
      const dead = getDeadMembers(party);
      if (dead.length > 0) {
        const target = dead[0];
        const reviveAmount = 1 + item.action.amount;
        const healed = healPartyMember(party, target.id, reviveAmount);
        partyActions.setParty(healed);
      } else {
        const healable = getHealableMembers(party);
        if (healable.length === 0) return;
        const target = healable[0];
        const healed = healPartyMember(party, target.id, item.action.amount);
        partyActions.setParty(healed);
      }

      inventoryActions.removeItem(item.id);
      soundService.playSound(SoundNames.shimmeringSuccessShorter, 0.6);

      // Deselect if we used the last one
      if (getItemQuantity(inventory, item.id) <= 1) {
        setSelectedKey(null);
      }
    }
  }

  return (
    <>
      <h2>
        <NarikRedwoodBitFont text="ITEMS" size={1.2} />
      </h2>
      <div className="pause-menu-item-categories">
        {CATEGORIES.map((cat) => (
          <IndigolayTab
            key={cat.id}
            size="sm"
            glow={false}
            isActive={category === cat.id}
            className="pause-menu-item-category-tab"
            onClick={() => {
              setCategory(cat.id);
              setSelectedKey(null);
            }}
          >
            {cat.label}
          </IndigolayTab>
        ))}
      </div>
      <div className="pause-menu-items-layout">
        <div className="pause-menu-item-list">
          {filteredInventory.length === 0 && <div className="pause-menu-empty">No items</div>}
          {filteredInventory.map((invItem) => {
            const itemData = getItemData(invItem.itemId);
            if (!itemData) return null;
            const key = stackKey(invItem.itemId, invItem.rarity);
            const isEquip = itemData.type === 'equipment';
            return (
              <div
                key={key}
                className={cn('pause-menu-item-row', selectedKey === key && 'selected')}
                onClick={() => setSelectedKey(key)}
              >
                <span className="pause-menu-item-icon-slot">
                  {itemData.iconName && <FrostyRpgIcon name={itemData.iconName} size={24} />}
                </span>
                <span
                  className="pause-menu-item-name"
                  style={isEquip ? { color: getRarityColor(invItem.rarity) } : undefined}
                >
                  {itemData.name}
                </span>
                <span className="pause-menu-item-qty number-flow-container">
                  x
                  <NumberFlow
                    value={invItem.quantity}
                    format={INTEGER_FORMAT}
                    trend={-1}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
            );
          })}
        </div>
        <div className="pause-menu-item-detail">
          {selectedItem ? (
            <>
              {selectedItem.iconName ? (
                <div className="pause-menu-item-detail-icon">
                  <FrostyRpgIcon name={selectedItem.iconName} size={48} />
                </div>
              ) : (
                'icon' in selectedItem && (
                  <div className="pause-menu-item-detail-icon">{(selectedItem as ConsumableItemData).icon}</div>
                )
              )}
              <div className="pause-menu-item-detail-name">{selectedItem.name}</div>
              {selectedIsEquipment && (
                <div
                  className="pause-menu-item-detail-rarity text-[0.65rem] tracking-wider uppercase"
                  style={{ color: getRarityColor(selectedRarity) }}
                >
                  {getRarityLabel(selectedRarity)}
                </div>
              )}
              <div className="pause-menu-item-detail-desc">{selectedItem.description}</div>
              {selectedScaledStats && (
                <div className="pause-menu-item-detail-stats">
                  {selectedScaledStats.pow !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      POW {selectedScaledStats.pow > 0 ? '+' : ''}
                      {selectedScaledStats.pow}
                    </span>
                  )}
                  {selectedScaledStats.vit !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      VIT {selectedScaledStats.vit > 0 ? '+' : ''}
                      {selectedScaledStats.vit}
                    </span>
                  )}
                  {selectedScaledStats.spd !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      SPD {selectedScaledStats.spd > 0 ? '+' : ''}
                      {selectedScaledStats.spd}
                    </span>
                  )}
                </div>
              )}
              <div className="pause-menu-item-detail-desc number-flow-container">
                Owned:{' '}
                <NumberFlow
                  value={getItemQuantity(inventory, selectedItem.id, selectedRarity)}
                  format={INTEGER_FORMAT}
                  trend={-1}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </div>
              {isUsableConsumable(selectedItem) && (
                <button
                  className="pause-menu-use-btn"
                  disabled={!canUseItem(selectedItem)}
                  onClick={() => handleUseItem(selectedItem)}
                >
                  Use
                </button>
              )}
            </>
          ) : (
            <div className="pause-menu-empty">Select an item</div>
          )}
        </div>
      </div>
      <div className="pause-menu-resources-bar">
        {[
          { key: 'coins', label: 'Coins', value: resources.coins, iconName: 'coinPurse' as const },
          { key: 'gold', label: 'Gold', value: resources.gold, iconName: 'goldBar' as const },
          { key: 'silver', label: 'Silver', value: resources.silver, iconName: 'silverBar' as const },
          { key: 'iron', label: 'Iron', value: resources.iron, iconName: 'ironBar' as const },
          { key: 'copper', label: 'Copper', value: resources.copper, iconName: 'copperBar' as const },
        ].map((item) => (
          <div key={item.key} className={`pause-menu-resource pause-menu-resource--${item.key}`}>
            <FrostyRpgIcon name={item.iconName} size={24} className="pause-menu-resource__icon" />
            <div className="pause-menu-resource__content">
              <span className="pause-menu-resource__label">{item.label}</span>
              <span className="pause-menu-resource__value number-flow-container">
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
    </>
  );
}
