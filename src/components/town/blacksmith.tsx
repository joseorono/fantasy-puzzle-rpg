import { useState } from 'react';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
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
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';

type EquipmentType = 'sword' | 'bow' | 'staff' | 'armor';

const EQUIPMENT_TYPE_FILTERS: Record<EquipmentType, string> = {
  sword: 'Swords',
  bow: 'Bows',
  staff: 'Staves',
  armor: 'Armor',
};

function getEquipmentType(itemId: string): EquipmentType | null {
  if (itemId.includes('sword') || itemId.includes('broadsword')) return 'sword';
  if (itemId.includes('bow')) return 'bow';
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
          <ToffecButton variant="tan" onClick={() => setSelectedTab('craft')} className={selectedTab === 'craft' ? 'active' : ''}>
            Craft
          </ToffecButton>
        </ToffecBeigeCornersWrapper>
        <ToffecBeigeCornersWrapper>
          <ToffecButton variant="tan" onClick={() => setSelectedTab('exchange')} className={selectedTab === 'exchange' ? 'active' : ''}>
            Exchange
          </ToffecButton>
        </ToffecBeigeCornersWrapper>
        <ToffecBeigeCornersWrapper>
          <ToffecButton variant="tan" onClick={() => setSelectedTab('melt')} className={selectedTab === 'melt' ? 'active' : ''}>
            Melt
          </ToffecButton>
        </ToffecBeigeCornersWrapper>
      </div>

      {/* Craft Tab */}
      {selectedTab === 'craft' && (
        <div className="craft-section">
          {/* Equipment Type Filters */}
          <div className="equipment-filters">
            {(Object.entries(EQUIPMENT_TYPE_FILTERS) as Array<[EquipmentType, string]>).map(([type, label]) => (
              <ToffecButton
                variant="tan"
                key={type}
                onClick={() => {
                  setSelectedEquipmentType(type);
                  setSelectedItem(null);
                }}
                className={selectedEquipmentType === type ? 'active' : ''}
              >
                {label}
              </ToffecButton>
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
                      {item.cost.gold > 0 && (
                        <span className="cost-badge gold flex items-center gap-1">
                          <FrostyRpgIcon name="goldBar" size={14} /> {item.cost.gold}
                        </span>
                      )}
                      {item.cost.silver > 0 && (
                        <span className="cost-badge silver flex items-center gap-1">
                          <FrostyRpgIcon name="silverBar" size={14} /> {item.cost.silver}
                        </span>
                      )}
                      {item.cost.copper > 0 && (
                        <span className="cost-badge copper flex items-center gap-1">
                          <FrostyRpgIcon name="copperBar" size={14} /> {item.cost.copper}
                        </span>
                      )}
                      {item.cost.iron > 0 && (
                        <span className="cost-badge iron flex items-center gap-1">
                          <FrostyRpgIcon name="ironBar" size={14} /> {item.cost.iron}
                        </span>
                      )}
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
                      <ToffecButton
                        variant="orange"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCraftItem(item);
                        }}
                        disabled={!canAfford(resources, item.cost)}
                      >
                        <span className="flex items-center gap-2">
                          {canAfford(resources, item.cost) ? (
                            <>
                              Craft for{' '}
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
            ))}
          </div>
        </div>
      )}

      {/* Exchange Tab */}
      {selectedTab === 'exchange' && (
        <div className="exchange-section">
          <h2>
            <NarikWoodBitFont text="EXCHANGE RESOURCES" size={2} />
          </h2>
          <p>Convert resources at 1:1 ratio</p>

          <div className="exchange-options">
            <div className="exchange-group">
              <h3>
                <NarikWoodBitFont text="COPPER TO SILVER" size={1} />
              </h3>
              <ToffecBeigeCornersWrapper>
                <ToffecButton
                  variant="orange"
                  onClick={() => handleExchangeResources('copper', 'silver', 5)}
                  disabled={resources.copper < 5}
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    Exchange 5 <FrostyRpgIcon name="copperBar" size={20} /> for 1{' '}
                    <FrostyRpgIcon name="silverBar" size={20} />
                  </span>
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>

            <div className="exchange-group">
              <h3>
                <NarikWoodBitFont text="IRON TO SILVER" size={1} />
              </h3>
              <ToffecBeigeCornersWrapper>
                <ToffecButton
                  variant="orange"
                  onClick={() => handleExchangeResources('iron', 'silver', 5)}
                  disabled={resources.iron < 5}
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    Exchange 5 <FrostyRpgIcon name="ironBar" size={20} /> for 1{' '}
                    <FrostyRpgIcon name="silverBar" size={20} />
                  </span>
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>

            <div className="exchange-group">
              <h3>
                <NarikWoodBitFont text="SILVER TO GOLD" size={1} />
              </h3>
              <ToffecBeigeCornersWrapper>
                <ToffecButton
                  variant="orange"
                  onClick={() => handleExchangeResources('silver', 'gold', 5)}
                  disabled={resources.silver < 5}
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    Exchange 5 <FrostyRpgIcon name="silverBar" size={20} /> for 1{' '}
                    <FrostyRpgIcon name="goldBar" size={20} />
                  </span>
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>
          </div>
        </div>
      )}

      {/* Melt Tab */}
      {selectedTab === 'melt' && (
        <div className="melt-section">
          <h2>
            <NarikWoodBitFont text="MELT COINS TO GOLD" size={2} />
          </h2>
          <p>Convert coins into gold (10 coins = 1 gold)</p>

          <div className="melt-options">
            <ToffecBeigeCornersWrapper>
              <ToffecButton 
                variant="orange" 
                onClick={() => handleMeltCoinsToGold(10)} 
                disabled={resources.coins < 10}
                className="w-full"
              >
                <span className="flex items-center gap-2">
                  Melt 10 <FrostyRpgIcon name="coinPurse" size={20} /> → 1 <FrostyRpgIcon name="goldBar" size={20} />
                </span>
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper>
              <ToffecButton 
                variant="orange" 
                onClick={() => handleMeltCoinsToGold(50)} 
                disabled={resources.coins < 50}
                className="w-full"
              >
                <span className="flex items-center gap-2">
                  Melt 50 <FrostyRpgIcon name="coinPurse" size={20} /> → 5 <FrostyRpgIcon name="goldBar" size={20} />
                </span>
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
            <ToffecBeigeCornersWrapper>
              <ToffecButton 
                variant="orange" 
                onClick={() => handleMeltCoinsToGold(100)} 
                disabled={resources.coins < 100}
                className="w-full"
              >
                <span className="flex items-center gap-2">
                  Melt 100 <FrostyRpgIcon name="coinPurse" size={20} /> → 10 <FrostyRpgIcon name="goldBar" size={20} />
                </span>
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
          </div>
        </div>
      )}
    </TownLocationLayout>
  );
}
