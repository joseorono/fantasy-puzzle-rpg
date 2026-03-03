import NumberFlow from '@number-flow/react';
import { useInventory, useInventoryActions, useResources, useResourcesActions } from '~/stores/game-store';
import type { ItemStoreParams, ConsumableItemData } from '~/types';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { Button } from '../ui/8bit/button';
import { getItemsFromIds } from '~/lib/town';
import { canAfford } from '~/lib/resources';
import { getItemQuantity } from '~/lib/inventory';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { ITEM_SHOP_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { SHOPKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

const ITEM_STORE_BG_IMAGES = ['/assets/bg/item-shop-bg1.jpg', '/assets/bg/item-shop-bg2.jpg'];

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
    <TownLocationLayout
      locationClass="item-store"
      bgClass="bg-item-store"
      bgImages={ITEM_STORE_BG_IMAGES}
      character={SHOPKEEPER_CHAR}
      welcomeTexts={ITEM_SHOP_WELCOME_TEXT}
      marqueeType="item-shop"
      onLeave={onLeaveCallback}
    >
      <div className="shop-content">
        <div className="store-info">
          <h2>
            <span className="sr-only">Consumable Items</span>
            <span aria-hidden="true">
              <NarikWoodBitFont text="CONSUMABLE ITEMS" size={2} />
            </span>
          </h2>
          <p>Purchase items to aid you in battle</p>
        </div>

        {/* Items List */}
        <div className="equipment-list">
          {itemsData.map((item) => {
            const itemCount = getItemCount(item.id);
            const canAffordItem = canAfford(resources, item.cost);

            return (
              <div key={item.id} className="equipment-list-item">
                <div className="equipment-item-icon">
                  {item.iconName ? <FrostyRpgIcon name={item.iconName} size={24} /> : null}
                </div>
                <div className="equipment-item-content">
                  <div className="equipment-item-header">
                    <div className="equipment-item-name">
                      {item.name}
                      {itemCount > 0 && (
                        <span className="item-count number-flow-container">
                          {' '}
                          (Owned:{' '}
                          <NumberFlow
                            value={itemCount}
                            format={INTEGER_FORMAT}
                            trend={1}
                            spinTiming={SNAPPY_SPIN_TIMING}
                            transformTiming={SNAPPY_TRANSFORM_TIMING}
                            opacityTiming={SNAPPY_OPACITY_TIMING}
                          />
                          )
                        </span>
                      )}
                    </div>
                    <div className="equipment-item-cost">
                      {item.cost.coins > 0 && <span className="cost-badge gold">💰 {item.cost.coins}</span>}
                      {item.cost.gold > 0 && <span className="cost-badge gold">🏆 {item.cost.gold}</span>}
                      {item.cost.silver > 0 && <span className="cost-badge silver">🪙 {item.cost.silver}</span>}
                      {item.cost.copper > 0 && <span className="cost-badge copper">🔶 {item.cost.copper}</span>}
                      {item.cost.iron > 0 && <span className="cost-badge iron">⬛ {item.cost.iron}</span>}
                    </div>
                  </div>
                  <div className="equipment-item-description">{item.description}</div>
                  <div className="item-actions">
                    <ToffecBeigeCornersWrapper>
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
                    </ToffecBeigeCornersWrapper>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TownLocationLayout>
  );
}
