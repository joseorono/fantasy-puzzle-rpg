import { useState } from 'react';
import { Button } from '../ui/8bit/button';
import { useResources, useResourcesActions, useInventoryActions } from '~/stores/game-store';
import { EquipmentItems } from '~/constants/inventory';
import { canAfford, createResources } from '~/lib/resources';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { EquipmentItemData } from '~/types';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { BLACKSMITH_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { BLACKSMITH_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';

type EquipmentType = 'sword' | 'dagger' | 'staff' | 'armor';

const EQUIPMENT_TYPE_FILTERS: Record<EquipmentType, string> = {
  sword: 'Swords',
  dagger: 'Daggers',
  staff: 'Staves',
  armor: 'Armor',
};

function getEquipmentType(itemId: string): EquipmentType | null {
  if (itemId.includes('sword') || itemId.includes('broadsword')) return 'sword';
  if (itemId.includes('dagger') || itemId.includes('dirk')) return 'dagger';
  if (itemId.includes('staff') || itemId.includes('scepter')) return 'staff';
  if (itemId.includes('armor') || itemId.includes('plate')) return 'armor';
  return null;
}

const BLACKSMITH_BG_IMAGES = ['/assets/bg/bg-blacksmith-1.jpg', '/assets/bg/bg-blacksmith-1-2.jpg'];

export default function Blacksmith({ onLeaveCallback }: { onLeaveCallback: () => void }) {
  const [selectedTab, setSelectedTab] = useState<'craft' | 'exchange' | 'melt'>('craft');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType>('sword');
  const [selectedItem, setSelectedItem] = useState<EquipmentItemData | null>(null);

  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const inventoryActions = useInventoryActions();

  // Filter equipment by type
  const filteredEquipment = EquipmentItems.filter((item) => getEquipmentType(item.id) === selectedEquipmentType);

  const handleCraftItem = (item: EquipmentItemData) => {
    if (canAfford(resources, item.cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(item.cost);
      inventoryActions.addItem(item.id);
      setSelectedItem(null);
    }
  };

  const handleExchangeResources = (
    fromResource: keyof typeof resources,
    toResource: keyof typeof resources,
    amount: number,
  ) => {
    const cost = createResources({ [fromResource]: amount });
    if (canAfford(resources, cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(cost);
      resourcesActions.addResources(createResources({ [toResource]: amount }));
    }
  };

  const handleMeltCoinsToGold = (coinAmount: number) => {
    const cost = createResources({ coins: coinAmount });
    if (canAfford(resources, cost)) {
      soundService.playSound(SoundNames.clickCoin);
      // Conversion rate: 10 coins = 1 gold
      const goldGain = Math.floor(coinAmount / 10);
      resourcesActions.reduceResources(cost);
      resourcesActions.addResources(createResources({ gold: goldGain }));
    }
  };

  return (
    <TownLocationLayout
      locationClass="blacksmith"
      bgClass="bg-blacksmith"
      bgImages={BLACKSMITH_BG_IMAGES}
      character={BLACKSMITH_CHAR}
      welcomeTexts={BLACKSMITH_WELCOME_TEXT}
      marqueeType="blacksmith"
      onLeave={onLeaveCallback}
    >
      {/* Tab Navigation */}
      <div className="blacksmith-tabs">
        <ToffecBeigeCornersWrapper>
          <Button onClick={() => setSelectedTab('craft')} className={selectedTab === 'craft' ? 'active' : ''}>
            Craft
          </Button>
        </ToffecBeigeCornersWrapper>
        <ToffecBeigeCornersWrapper>
          <Button onClick={() => setSelectedTab('exchange')} className={selectedTab === 'exchange' ? 'active' : ''}>
            Exchange
          </Button>
        </ToffecBeigeCornersWrapper>
        <ToffecBeigeCornersWrapper>
          <Button onClick={() => setSelectedTab('melt')} className={selectedTab === 'melt' ? 'active' : ''}>
            Melt
          </Button>
        </ToffecBeigeCornersWrapper>
      </div>

      {/* Craft Tab */}
      {selectedTab === 'craft' && (
        <div className="craft-section">
          {/* Equipment Type Filters */}
          <div className="equipment-filters">
            {(Object.entries(EQUIPMENT_TYPE_FILTERS) as Array<[EquipmentType, string]>).map(([type, label]) => (
              <Button
                key={type}
                onClick={() => {
                  setSelectedEquipmentType(type);
                  setSelectedItem(null);
                }}
                className={selectedEquipmentType === type ? 'active' : ''}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Equipment List */}
          <div className="equipment-list">
            {filteredEquipment.map((item) => (
              <div key={item.id} className={`equipment-list-item ${selectedItem?.id === item.id ? 'selected' : ''}`}>
                <div className="equipment-item-icon">
                  {item.iconName ? <FrostyRpgIcon name={item.iconName} size={24} /> : null}
                </div>
                <div className="equipment-item-content">
                  <div className="equipment-item-header">
                    <div className="equipment-item-name">{item.name}</div>
                    <div className="equipment-item-cost">
                      {item.cost.gold > 0 && <span className="cost-badge gold">🏆 {item.cost.gold}</span>}
                      {item.cost.silver > 0 && <span className="cost-badge silver">🪙 {item.cost.silver}</span>}
                      {item.cost.copper > 0 && <span className="cost-badge copper">🔶 {item.cost.copper}</span>}
                      {item.cost.iron > 0 && <span className="cost-badge iron">⬛ {item.cost.iron}</span>}
                    </div>
                  </div>
                  <div className="equipment-item-description">{item.description}</div>
                  <div className="equipment-item-stats">
                    <span className="stat-badge">POW: {item.pow}</span>
                    <span className="stat-badge">VIT: {item.vit}</span>
                    <span className="stat-badge">SPD: {item.spd}</span>
                    {item.forClass && <span className="stat-badge">For: {item.forClass}</span>}
                  </div>
                  <div className="item-actions">
                    <ToffecBeigeCornersWrapper>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCraftItem(item);
                        }}
                        disabled={!canAfford(resources, item.cost)}
                        className="craft-button"
                      >
                        {canAfford(resources, item.cost) ? 'Craft' : 'Cannot Afford'}
                      </Button>
                    </ToffecBeigeCornersWrapper>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exchange Tab */}
      {selectedTab === 'exchange' && (
        <div className="exchange-section">
          <h2>Exchange Resources</h2>
          <p>Convert resources at 1:1 ratio</p>

          <div className="exchange-options">
            <div className="exchange-group">
              <h3>Copper to Silver</h3>
              <ToffecBeigeCornersWrapper>
                <Button onClick={() => handleExchangeResources('copper', 'silver', 5)} disabled={resources.copper < 5}>
                  Exchange 5 Copper for 1 Silver
                </Button>
              </ToffecBeigeCornersWrapper>
            </div>

            <div className="exchange-group">
              <h3>Iron to Silver</h3>
              <ToffecBeigeCornersWrapper>
                <Button onClick={() => handleExchangeResources('iron', 'silver', 5)} disabled={resources.iron < 5}>
                  Exchange 5 Iron for 1 Silver
                </Button>
              </ToffecBeigeCornersWrapper>
            </div>

            <div className="exchange-group">
              <h3>Silver to Gold</h3>
              <ToffecBeigeCornersWrapper>
                <Button onClick={() => handleExchangeResources('silver', 'gold', 5)} disabled={resources.silver < 5}>
                  Exchange 5 Silver for 1 Gold
                </Button>
              </ToffecBeigeCornersWrapper>
            </div>
          </div>
        </div>
      )}

      {/* Melt Tab */}
      {selectedTab === 'melt' && (
        <div className="melt-section">
          <h2>Melt Coins to Gold</h2>
          <p>Convert coins into gold (10 coins = 1 gold)</p>

          <div className="melt-options">
            <ToffecBeigeCornersWrapper>
              <Button onClick={() => handleMeltCoinsToGold(10)} disabled={resources.coins < 10}>
                Melt 10 Coins → 1 Gold
              </Button>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper>
              <Button onClick={() => handleMeltCoinsToGold(50)} disabled={resources.coins < 50}>
                Melt 50 Coins → 5 Gold
              </Button>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper>
              <Button onClick={() => handleMeltCoinsToGold(100)} disabled={resources.coins < 100}>
                Melt 100 Coins → 10 Gold
              </Button>
            </ToffecBeigeCornersWrapper>
          </div>
        </div>
      )}
    </TownLocationLayout>
  );
}
