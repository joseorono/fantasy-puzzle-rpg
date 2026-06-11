import { useState } from 'react';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { useResources, useResourcesActions, useInventoryActions } from '~/stores/game-store';
import { useOverlay } from '~/hooks/use-overlay';
import { EquipmentItems } from '~/constants/inventory';
import { canAfford, createResources } from '~/lib/resources';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { EquipmentItemData } from '~/types';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { BLACKSMITH_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { BLACKSMITH_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { IndigolayTab } from '~/components/ui-custom/indigolay-tab';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { CostBadge } from './cost-badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import {
  MELT_BATCHES,
  EXCHANGE_CONFIGS,
  MELT_COINS_PER_GOLD,
  EXCHANGE_RATIO,
  CRAFTING_FEE,
} from '~/constants/blacksmith';

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

export default function Blacksmith({
  backgroundImage,
  onLeaveCallback,
}: {
  backgroundImage: string;
  onLeaveCallback: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState<'craft' | 'exchange' | 'melt'>('craft');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType>('sword');
  const [selectedItem, setSelectedItem] = useState<EquipmentItemData | null>(null);
  // The first craft of each distinct item this visit shows the success overlay.
  // Resets naturally because the blacksmith remounts on each visit.
  const [celebratedItemIds, setCelebratedItemIds] = useState<Set<string>>(() => new Set());

  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const inventoryActions = useInventoryActions();
  const { showOverlay } = useOverlay();

  // Filter equipment by type
  const filteredEquipment = EquipmentItems.filter((item) => getEquipmentType(item.id) === selectedEquipmentType);

  const handleCraftItem = (item: EquipmentItemData) => {
    if (canAfford(resources, item.cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(item.cost);
      inventoryActions.addItem(item.id);
      setSelectedItem(null);

      if (!celebratedItemIds.has(item.id)) {
        setCelebratedItemIds((prev) => new Set(prev).add(item.id));
        showOverlay({ kind: 'crafting-success', itemId: item.id });
      }
    }
  };

  const handleExchangeResources = (
    fromResource: keyof typeof resources,
    toResource: keyof typeof resources,
    fromAmount: number,
    toAmount: number,
  ) => {
    const cost = createResources({ [fromResource]: fromAmount });
    if (canAfford(resources, cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(cost);
      resourcesActions.addResources(createResources({ [toResource]: toAmount }));
    }
  };

  const handleMeltCoinsToGold = (coinAmount: number) => {
    const cost = createResources({ coins: coinAmount });
    if (canAfford(resources, cost)) {
      soundService.playSound(SoundNames.clickCoin);
      const goldGain = Math.floor(coinAmount / MELT_COINS_PER_GOLD);
      resourcesActions.reduceResources(cost);
      resourcesActions.addResources(createResources({ gold: goldGain }));
    }
  };

  return (
    <TownLocationLayout
      locationClass="blacksmith"
      bgClass="bg-blacksmith"
      backgroundImage={backgroundImage}
      character={BLACKSMITH_CHAR}
      welcomeTexts={BLACKSMITH_WELCOME_TEXT}
      marqueeType="blacksmith"
      onLeave={onLeaveCallback}
    >
      {/* Tab Navigation */}
      <div className="blacksmith-tabs">
        <IndigolayTab size="default" isActive={selectedTab === 'craft'} onClick={() => setSelectedTab('craft')}>
          Craft
        </IndigolayTab>
        <IndigolayTab size="default" isActive={selectedTab === 'exchange'} onClick={() => setSelectedTab('exchange')}>
          Exchange
        </IndigolayTab>
        <IndigolayTab size="default" isActive={selectedTab === 'melt'} onClick={() => setSelectedTab('melt')}>
          Melt
        </IndigolayTab>
      </div>

      {/* Craft Tab */}
      {selectedTab === 'craft' && (
        <div className="craft-section">
          <div className="town-section-header town-section-header--smith-craft">
            <h2>
              <NarikWoodBitFont text="CRAFT EQUIPMENT" size={1.3} />
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="town-header-badge">
                  <span className="town-header-badge__label">Forge Fee</span>
                  <span className="town-header-badge__value">
                    <FrostyRpgIcon name="coinPurse" size={16} /> {CRAFTING_FEE}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                A flat fee of {CRAFTING_FEE} coins charged each time you craft an item, on top of its material cost.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="town-section-subtitle">Choose an equipment type to craft</p>
          {/* Equipment Type Filters */}
          <div className="equipment-filters">
            {(Object.entries(EQUIPMENT_TYPE_FILTERS) as Array<[EquipmentType, string]>).map(([type, label]) => (
              <IndigolayTab
                glow={false}
                size="sm"
                key={type}
                onClick={() => {
                  setSelectedEquipmentType(type);
                  setSelectedItem(null);
                }}
                isActive={selectedEquipmentType === type}
              >
                {label}
              </IndigolayTab>
            ))}
          </div>

          {/* Master-Detail Workspace */}
          <div className="craft-workspace">
            {/* Equipment List */}
            <div className="equipment-list">
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className={`equipment-list-item ${selectedItem?.id === item.id ? 'selected' : ''} ${
                    canAfford(resources, item.cost) ? '' : 'cannot-afford'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="equipment-item-icon">
                    {item.iconName ? <FrostyRpgIcon name={item.iconName} size={24} /> : null}
                  </div>
                  <div className="equipment-item-content">
                    <div className="equipment-item-header">
                      <div className="equipment-item-name">{item.name}</div>
                      <div className="equipment-item-cost">
                        {item.cost.gold > 0 && <CostBadge resource="gold" amount={item.cost.gold} />}
                        {item.cost.silver > 0 && <CostBadge resource="silver" amount={item.cost.silver} />}
                        {item.cost.copper > 0 && <CostBadge resource="copper" amount={item.cost.copper} />}
                        {item.cost.iron > 0 && <CostBadge resource="iron" amount={item.cost.iron} />}
                      </div>
                    </div>
                    <div className="equipment-item-stats">
                      <span className="stat-badge">POW: {item.pow}</span>
                      <span className="stat-badge">VIT: {item.vit}</span>
                      <span className="stat-badge">SPD: {item.spd}</span>
                      {item.forClass && <span className="stat-badge">For: {item.forClass}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Panel */}
            <div className="craft-detail">
              {selectedItem ? (
                <>
                  <div className="craft-detail-header">
                    <div className="craft-detail-icon">
                      {selectedItem.iconName ? <FrostyRpgIcon name={selectedItem.iconName} size={40} /> : null}
                    </div>
                    <div className="craft-detail-name">{selectedItem.name}</div>
                  </div>

                  <p className="craft-detail-desc">{selectedItem.description}</p>

                  <div className="craft-detail-stats">
                    {selectedItem.forClass && (
                      <div className="craft-detail-for-class">For: {selectedItem.forClass}</div>
                    )}
                    <div className="craft-detail-stats-row">
                      <span className="stat-badge">POW: {selectedItem.pow}</span>
                      <span className="stat-badge">VIT: {selectedItem.vit}</span>
                      <span className="stat-badge">SPD: {selectedItem.spd}</span>
                    </div>
                  </div>

                  <div className="craft-detail-actions">
                    <ToffecBeigeCornersWrapper>
                      <ToffecButton
                        className="craft-detail-buy-button"
                        variant="orange"
                        size="xs"
                        onClick={() => handleCraftItem(selectedItem)}
                        disabled={!canAfford(resources, selectedItem.cost)}
                      >
                        <span className="flex items-center gap-2">
                          {canAfford(resources, selectedItem.cost) ? 'Craft Item' : 'Cannot Afford'}
                        </span>
                      </ToffecButton>
                    </ToffecBeigeCornersWrapper>
                  </div>
                </>
              ) : (
                <div className="craft-detail-empty">
                  <p>Select an item from the list to see its crafting details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exchange Tab */}
      {selectedTab === 'exchange' && (
        <div className="exchange-section">
          <div className="town-section-header town-section-header--smith-exchange">
            <h2>
              <NarikWoodBitFont text="EXCHANGE RESOURCES" size={1.3} />
            </h2>
          </div>
          <p className="town-section-subtitle">Convert resources at a {EXCHANGE_RATIO}:1 ratio</p>

          <div className="exchange-options">
            {EXCHANGE_CONFIGS.map((config) => (
              <div className="exchange-group" key={config.label}>
                <h3>
                  <NarikWoodBitFont text={config.label} size={1} />
                </h3>
                <div className="exchange-buttons">
                  {config.tiers.map((tier, tierIndex) => (
                    <ToffecBeigeCornersWrapper
                      key={tier.from}
                      // Third tier only appears where there's vertical headroom.
                      className={cn('exchange-button', tierIndex === 2 && 'exchange-button--tall-only')}
                    >
                      <ToffecButton
                        variant="orange"
                        size="xs"
                        onClick={() =>
                          handleExchangeResources(config.fromResource, config.toResource, tier.from, tier.to)
                        }
                        disabled={resources[config.fromResource] < tier.from}
                        className="w-full"
                      >
                        <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                          Exchange {tier.from} <FrostyRpgIcon name={config.fromIcon} size={20} /> for {tier.to}{' '}
                          <FrostyRpgIcon name={config.toIcon} size={20} />
                        </span>
                      </ToffecButton>
                    </ToffecBeigeCornersWrapper>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Melt Tab */}
      {selectedTab === 'melt' && (
        <div className="melt-section">
          <div className="town-section-header town-section-header--smith-melt">
            <h2>
              <NarikWoodBitFont text="MELT COINS TO GOLD" size={1.3} />
            </h2>
            <div className="town-header-badge">
              <span className="town-header-badge__label">Rate</span>
              <span className="town-header-badge__value">
                {MELT_COINS_PER_GOLD} <FrostyRpgIcon name="coinPurse" size={14} /> = 1{' '}
                <FrostyRpgIcon name="goldBar" size={14} />
              </span>
            </div>
          </div>
          <p className="town-section-subtitle">Convert spare coins into gold bars</p>

          <div className="melt-options">
            {MELT_BATCHES.map((batch) => (
              <div className="melt-group" key={batch.label}>
                <h3>
                  <NarikWoodBitFont text={batch.label} size={1} />
                </h3>
                <div className="melt-buttons">
                  {batch.tiers.map((tier) => (
                    <ToffecBeigeCornersWrapper key={tier.coins} className="melt-button">
                      <ToffecButton
                        variant="orange"
                        size="xs"
                        onClick={() => handleMeltCoinsToGold(tier.coins)}
                        disabled={resources.coins < tier.coins}
                        className="w-full"
                      >
                        <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                          Melt {tier.coins} <FrostyRpgIcon name="coinPurse" size={20} /> → {tier.gold}{' '}
                          <FrostyRpgIcon name="goldBar" size={20} />
                        </span>
                      </ToffecButton>
                    </ToffecBeigeCornersWrapper>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TownLocationLayout>
  );
}
