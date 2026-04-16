import NumberFlow from '@number-flow/react';
import { useInventory, useInventoryActions, useResources, useResourcesActions } from '~/stores/game-store';
import type { ItemStoreParams, ConsumableItemData } from '~/types';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
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
import { CostBadge } from './cost-badge';
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
            <NarikWoodBitFont text="CONSUMABLE ITEMS" size={2} />
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
                      {item.cost.coins > 0 && <CostBadge resource="coins" amount={item.cost.coins} />}
                      {item.cost.gold > 0 && <CostBadge resource="gold" amount={item.cost.gold} />}
                      {item.cost.silver > 0 && <CostBadge resource="silver" amount={item.cost.silver} />}
                      {item.cost.copper > 0 && <CostBadge resource="copper" amount={item.cost.copper} />}
                      {item.cost.iron > 0 && <CostBadge resource="iron" amount={item.cost.iron} />}
                    </div>
                  </div>
                  <div className="equipment-item-description">{item.description}</div>
                  <div className="item-actions">
                    <ToffecBeigeCornersWrapper>
                      <ToffecButton
                        variant="orange"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyItem(item);
                        }}
                        disabled={!canAffordItem}
                      >
                        <span className="flex items-center gap-2">
                          {canAffordItem ? (
                            <>
                              Buy for{' '}
                              {item.cost.coins > 0 && (
                                <span className="flex items-center gap-1">
                                  {item.cost.coins} <FrostyRpgIcon name="coinPurse" size={18} />
                                </span>
                              )}
                              {item.cost.gold > 0 && (
                                <span className="flex items-center gap-1">
                                  {item.cost.gold} <FrostyRpgIcon name="goldBar" size={18} />
                                </span>
                              )}
                              {item.cost.silver > 0 && (
                                <span className="flex items-center gap-1">
                                  {item.cost.silver} <FrostyRpgIcon name="silverBar" size={18} />
                                </span>
                              )}
                              {item.cost.copper > 0 && (
                                <span className="flex items-center gap-1">
                                  {item.cost.copper} <FrostyRpgIcon name="copperBar" size={18} />
                                </span>
                              )}
                              {item.cost.iron > 0 && (
                                <span className="flex items-center gap-1">
                                  {item.cost.iron} <FrostyRpgIcon name="ironBar" size={18} />
                                </span>
                              )}
                            </>
                          ) : (
                            'Cannot Afford'
                          )}
                        </span>
                      </ToffecButton>
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
