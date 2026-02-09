import { useState } from 'react';
import { useInventory, useResources, useParty, useInventoryActions, usePartyActions } from '~/stores/game-store';
import { ConsumableItems, EquipmentItems } from '~/constants/inventory';
import { filterInventoryByType, getItemQuantity } from '~/lib/inventory';
import { getHealableMembers, healPartyMember } from '~/lib/party-system';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { BaseItemData } from '~/types/inventory';
import type { ConsumableItemData, EquipmentItemData } from '~/types';

type ItemCategory = 'consumable' | 'equipment' | 'key';

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'consumable', label: 'Consumable' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'key', label: 'Key' },
];

const ALL_ITEMS: BaseItemData[] = [...ConsumableItems, ...EquipmentItems];

export function PauseMenuItems() {
  const inventory = useInventory();
  const resources = useResources();
  const party = useParty();
  const inventoryActions = useInventoryActions();
  const partyActions = usePartyActions();
  const [category, setCategory] = useState<ItemCategory>('consumable');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const filteredInventory = filterInventoryByType(inventory, ALL_ITEMS, category);

  const selectedItem = selectedItemId
    ? ALL_ITEMS.find((item) => item.id === selectedItemId)
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
      return getHealableMembers(party).length > 0;
    }
    return false;
  }

  function handleUseItem(item: ConsumableItemData) {
    if (!item.action || !canUseItem(item)) return;

    if (item.action.type === 'heal') {
      const healable = getHealableMembers(party);
      if (healable.length === 0) return;

      const target = healable[0];
      const healed = healPartyMember(party, target.id, item.action.amount);
      partyActions.setParty(healed);
      inventoryActions.removeItem(item.id);
      soundService.playSound(SoundNames.shimmeringSuccessShorter, 0.6);

      // Deselect if we used the last one
      if (getItemQuantity(inventory, item.id) <= 1) {
        setSelectedItemId(null);
      }
    }
  }

  return (
    <>
      <h2>Items</h2>
      <div className="pause-menu-item-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={cn('pause-menu-category-btn', category === cat.id && 'active')}
            onClick={() => {
              setCategory(cat.id);
              setSelectedItemId(null);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="pause-menu-items-layout">
        <div className="pause-menu-item-list">
          {filteredInventory.length === 0 && (
            <div className="pause-menu-empty">No items</div>
          )}
          {filteredInventory.map((invItem) => {
            const itemData = getItemData(invItem.itemId);
            if (!itemData) return null;
            return (
              <div
                key={invItem.itemId}
                className={cn('pause-menu-item-row', selectedItemId === invItem.itemId && 'selected')}
                onClick={() => setSelectedItemId(invItem.itemId)}
              >
                <span className="pause-menu-item-name">{itemData.name}</span>
                <span className="pause-menu-item-qty">x{invItem.quantity}</span>
              </div>
            );
          })}
        </div>
        <div className="pause-menu-item-detail">
          {selectedItem ? (
            <>
              {'icon' in selectedItem && (
                <div className="pause-menu-item-detail-icon">
                  {(selectedItem as ConsumableItemData).icon}
                </div>
              )}
              <div className="pause-menu-item-detail-name">{selectedItem.name}</div>
              <div className="pause-menu-item-detail-desc">{selectedItem.description}</div>
              {'pow' in selectedItem && (
                <div className="pause-menu-item-detail-stats">
                  {(selectedItem as EquipmentItemData).pow !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      POW {(selectedItem as EquipmentItemData).pow > 0 ? '+' : ''}
                      {(selectedItem as EquipmentItemData).pow}
                    </span>
                  )}
                  {(selectedItem as EquipmentItemData).vit !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      VIT {(selectedItem as EquipmentItemData).vit > 0 ? '+' : ''}
                      {(selectedItem as EquipmentItemData).vit}
                    </span>
                  )}
                  {(selectedItem as EquipmentItemData).spd !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      SPD {(selectedItem as EquipmentItemData).spd > 0 ? '+' : ''}
                      {(selectedItem as EquipmentItemData).spd}
                    </span>
                  )}
                </div>
              )}
              <div className="pause-menu-item-detail-desc">
                Owned: {getItemQuantity(inventory, selectedItem.id)}
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
      <div className="pause-menu-gold-display">
        Coins: {resources.coins}
      </div>
    </>
  );
}
