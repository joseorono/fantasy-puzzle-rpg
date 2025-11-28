import { useMemo } from 'react';
import { useInventory, useInventoryActions, useResources, useResourcesActions } from '~/stores/game-store';
import type { ItemStoreParams, ConsumableItemData } from '~/types';
import { Button } from '../ui/8bit/button';
import { getItemsFromIds } from '~/lib/town';
import { canAfford } from '~/lib/resources';
import { getItemQuantity } from '~/lib/inventory';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getRandomElement } from '~/lib/utils';
import { TopBarResources } from '../ui/top-bar-resources';

const ITEM_STORE_BG_IMAGES = [
  '/assets/bg/item-shop-bg1.jpg',
  '/assets/bg/item-shop-bg2.jpg',
];

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

  // Select random background image on component mount
  const backgroundImage = useMemo(() => getRandomElement(ITEM_STORE_BG_IMAGES), []);

  const itemsData = getItemsFromIds(itemsForSell);

  const handleBuyItem = (item: ConsumableItemData) => {
    if (canAfford(resources, item.cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(item.cost);
      inventoryActions.addItem(item.id);
    }
  };

  const getItemCount = (itemId: string): number => {
    return getItemQuantity(inventory, itemId);
  };

  return (
    <div className="item-store">
      <div className="bg-item-store" style={{ backgroundImage: `url('${backgroundImage}')` }}></div>
      <button className="leave-btn" onClick={onLeaveCallback}></button>
      <div className="shop-container">
        <h1>Item Shop</h1>

        {/* Resources Display */}
        <TopBarResources resources={resources} />

        {/* Store Content */}
        <div className="shop-content">
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
                <div key={item.id} className="equipment-list-item">
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
        </div>
      </div>
    </div>
  );
}
