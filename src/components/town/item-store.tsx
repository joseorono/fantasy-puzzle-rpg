import { useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useInventory, useInventoryActions, useResources, useResourcesActions } from '~/stores/game-store';
import type { ItemStoreParams, ConsumableItemData } from '~/types';
import { ConsumableItems } from '~/constants/inventory';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { getItemsFromIds } from '~/lib/town';
import { canAfford, createResources } from '~/lib/resources';
import { getSellPrice } from '~/lib/crafting';
import { cn } from '~/lib/utils';
import { getItemQuantity, filterInventoryByType } from '~/lib/inventory';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { ITEM_SHOP_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { SHOPKEEPER_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { IndigolayTab } from '~/components/ui-custom/indigolay-tab';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { CostBadge } from './cost-badge';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

export default function ItemStore({
  backgroundImage,
  itemsForSell,
  onLeaveCallback,
}: {
  backgroundImage: string;
  itemsForSell: ItemStoreParams;
  onLeaveCallback: () => void;
}) {
  const inventory = useInventory();
  const inventoryActions = useInventoryActions();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const [selectedTab, setSelectedTab] = useState<'buy' | 'sell'>('buy');

  const itemsData = getItemsFromIds(itemsForSell);

  // Owned consumables, resolved to their definitions, for the Sell tab.
  const sellableItems = filterInventoryByType(inventory, ConsumableItems, 'consumable')
    .map((inv) => ({ item: ConsumableItems.find((c) => c.id === inv.itemId), quantity: inv.quantity }))
    .filter((entry): entry is { item: ConsumableItemData; quantity: number } => Boolean(entry.item));

  const handleBuyItem = (item: ConsumableItemData) => {
    if (canAfford(resources, item.cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(item.cost);
      inventoryActions.addItem(item.id);
    }
  };

  const handleSellItem = (item: ConsumableItemData) => {
    soundService.playSound(SoundNames.clickCoin);
    inventoryActions.removeItem(item.id, 1);
    resourcesActions.addResources(createResources({ coins: getSellPrice(item) }));
  };

  const getItemCount = (itemId: string): number => {
    return getItemQuantity(inventory, itemId);
  };

  return (
    <TownLocationLayout
      locationClass="item-store"
      bgClass="bg-item-store"
      backgroundImage={backgroundImage}
      character={SHOPKEEPER_CHAR}
      welcomeTexts={ITEM_SHOP_WELCOME_TEXT}
      marqueeType="item-shop"
      onLeave={onLeaveCallback}
    >
      <div className="shop-content">
        {/* Buy / Sell tabs */}
        <div className="blacksmith-tabs">
          <IndigolayTab size="default" isActive={selectedTab === 'buy'} onClick={() => setSelectedTab('buy')}>
            Buy
          </IndigolayTab>
          <IndigolayTab size="default" isActive={selectedTab === 'sell'} onClick={() => setSelectedTab('sell')}>
            Sell
          </IndigolayTab>
        </div>

        <div className="store-info">
          <div className="town-section-header town-section-header--items">
            <h2>
              <NarikWoodBitFont text={selectedTab === 'buy' ? 'CONSUMABLE ITEMS' : 'SELL ITEMS'} size={1.3} />
            </h2>
          </div>
          <p className="town-section-subtitle">
            {selectedTab === 'buy' ? 'Purchase items to aid you in battle' : 'Sell items for half their value'}
          </p>
        </div>

        {/* Sell List */}
        {selectedTab === 'sell' && (
          <div className="equipment-list">
            {sellableItems.length === 0 ? (
              <p className="town-section-subtitle">You have no items to sell.</p>
            ) : (
              sellableItems.map(({ item, quantity }) => (
                <div key={item.id} className="equipment-list-item">
                  <div className="equipment-item-icon">
                    {item.iconName ? <FrostyRpgIcon name={item.iconName} size={24} /> : null}
                  </div>
                  <div className="equipment-item-content">
                    <div className="equipment-item-header">
                      <div className="equipment-item-name">
                        {item.name}
                        <span className="owned-badge">Owned {quantity}</span>
                      </div>
                      <div className="equipment-item-cost">
                        <CostBadge resource="coins" amount={getSellPrice(item)} />
                      </div>
                    </div>
                    <div className="item-store-item-summary">
                      <div className="equipment-item-description">{item.description}</div>
                      <div className="item-actions">
                        <ToffecBeigeCornersWrapper>
                          <ToffecButton
                            variant="cream"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSellItem(item);
                            }}
                          >
                            <span className="flex items-center gap-2">
                              Sell for {getSellPrice(item)} <FrostyRpgIcon name="coinPurse" size={18} />
                            </span>
                          </ToffecButton>
                        </ToffecBeigeCornersWrapper>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Buy List */}
        {selectedTab === 'buy' && (
        <div className="equipment-list">
          {itemsData.map((item) => {
            const itemCount = getItemCount(item.id);
            const canAffordItem = canAfford(resources, item.cost);

            return (
              <div key={item.id} className={cn('equipment-list-item', !canAffordItem && 'cannot-afford')}>
                <div className="equipment-item-icon">
                  {item.iconName ? <FrostyRpgIcon name={item.iconName} size={24} /> : null}
                </div>
                <div className="equipment-item-content">
                  <div className="equipment-item-header">
                    <div className="equipment-item-name">
                      {item.name}
                      {itemCount > 0 && (
                        <span className="owned-badge number-flow-container">
                          Owned{' '}
                          <NumberFlow
                            value={itemCount}
                            format={INTEGER_FORMAT}
                            trend={1}
                            spinTiming={SNAPPY_SPIN_TIMING}
                            transformTiming={SNAPPY_TRANSFORM_TIMING}
                            opacityTiming={SNAPPY_OPACITY_TIMING}
                          />
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
                  <div className="item-store-item-summary">
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
              </div>
            );
          })}
        </div>
        )}
      </div>
    </TownLocationLayout>
  );
}
