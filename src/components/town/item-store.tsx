import { useState } from 'react';
import { useInventory, useInventoryActions, useResources, useResourcesActions } from '~/stores/game-store';
import type { ItemStoreParams, ConsumableItemData } from '~/types';
import { Button } from '../ui/8bit/button';
import { getItemsFromIds } from '~/lib/town';
import { canAfford } from '~/lib/resources';
import { getItemQuantity } from '~/lib/inventory';

export default function ItemStore({
  itemsForSell,
  onLeaveCallback,
}: {
  itemsForSell: ItemStoreParams;
  onLeaveCallback: () => void;
}) {
  const inventory = useInventory();
  const inventoryActions = useInventoryActions();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const [selectedItem, setSelectedItem] = useState<ConsumableItemData | null>(null);

  const itemsData = getItemsFromIds(itemsForSell);

  const handleBuyItem = (item: ConsumableItemData) => {
    if (canAfford(resources, item.cost)) {
      resourcesActions.reduceResources(item.cost);
      inventoryActions.addItem(item.id);
      setSelectedItem(null);
    }
  };

  const getItemCount = (itemId: string): number => {
    return getItemQuantity(inventory, itemId);
  };

  return (
    <div className="blacksmith-container">
      <div className="blacksmith-header">
        <Button onClick={onLeaveCallback}>Leave</Button>
        <h1>Item Store</h1>
      </div>

      {/* Resources Display */}
      <div className="resources-display">
        <div>Coins: {resources.coins}</div>
        <div>Gold: {resources.gold}</div>
        <div>Copper: {resources.copper}</div>
        <div>Silver: {resources.silver}</div>
        <div>Bronze: {resources.bronze}</div>
      </div>

      {/* Store Content */}
      <div className="store-content">
        <div className="store-info">
          <h2>Consumable Items</h2>
          <p>Purchase items to aid you in battle</p>
        </div>

        {/* Items List */}
        <div className="equipment-list">
          {itemsData.map((item) => {
            const itemCount = getItemCount(item.id);
            const canAffordItem = canAfford(resources, item.cost);

            return (
              <div
                key={item.id}
                className={`equipment-list-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="equipment-item-icon">🧪</div>
                <div className="equipment-item-content">
                  <div className="equipment-item-header">
                    <div className="equipment-item-name">
                      {item.name}
                      {itemCount > 0 && <span className="item-count"> (Owned: {itemCount})</span>}
                    </div>
                    <div className="equipment-item-cost">
                      {item.cost.coins > 0 && <span className="cost-badge gold">💰 {item.cost.coins}</span>}
                      {item.cost.gold > 0 && <span className="cost-badge gold">🏆 {item.cost.gold}</span>}
                      {item.cost.silver > 0 && <span className="cost-badge silver">🪙 {item.cost.silver}</span>}
                      {item.cost.copper > 0 && <span className="cost-badge copper">🔶 {item.cost.copper}</span>}
                      {item.cost.bronze > 0 && <span className="cost-badge bronze">🟤 {item.cost.bronze}</span>}
                    </div>
                  </div>
                  <div className="equipment-item-description">{item.description}</div>
                  <div className="item-actions">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyItem(item);
                      }}
                      disabled={!canAffordItem}
                      className="buy-button"
                    >
                      {canAffordItem ? 'Buy' : 'Cannot Afford'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Item Details */}
        {selectedItem && (
          <div className="equipment-details">
            <h2>{selectedItem.name}</h2>
            <p>{selectedItem.description}</p>

            <div className="cost-section">
              <h3>Price:</h3>
              <div className="cost-display">
                {selectedItem.cost.coins > 0 && <div>Coins: {selectedItem.cost.coins}</div>}
                {selectedItem.cost.gold > 0 && <div>Gold: {selectedItem.cost.gold}</div>}
                {selectedItem.cost.copper > 0 && <div>Copper: {selectedItem.cost.copper}</div>}
                {selectedItem.cost.silver > 0 && <div>Silver: {selectedItem.cost.silver}</div>}
                {selectedItem.cost.bronze > 0 && <div>Bronze: {selectedItem.cost.bronze}</div>}
              </div>
            </div>

            <div className="inventory-info">
              <strong>In Inventory:</strong> {getItemCount(selectedItem.id)}
            </div>

            <Button
              onClick={() => handleBuyItem(selectedItem)}
              disabled={!canAfford(resources, selectedItem.cost)}
            >
              {canAfford(resources, selectedItem.cost) ? 'Buy' : 'Cannot Afford'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
