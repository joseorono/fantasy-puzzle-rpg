import { useState } from 'react';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import {
  useResources,
  useResourcesActions,
  useInventoryActions,
  useInventory,
  useParty,
  useCraftingPity,
  useCraftingActions,
} from '~/stores/game-store';
import { useOverlay } from '~/hooks/use-overlay';
import { EquipmentItems } from '~/constants/inventory';
import { canAfford, createResources } from '~/lib/resources';
import { rollRarity, getRarityColor, getRarityLabel, canUpgradeRarity, upgradeRarity } from '~/lib/rarity';
import { getUpgradeCost, getSalvageReturn } from '~/lib/crafting';
import {
  getOwnedEquipmentInstances,
  getScaledEquipmentStats,
  type OwnedEquipmentInstance,
} from '~/lib/equipment-system';
import { CRAFTING_RARITY_BIAS, PITY_BIAS_STEP, PITY_MAX } from '~/constants/rarity';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import type { EquipmentItemData } from '~/types';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { BLACKSMITH_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { BLACKSMITH_CHAR } from '~/constants/dialogue/characters';
import { TownLocationLayout } from './town-location-layout';
import { SalvageConfirmDialog } from './salvage-confirm-dialog';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { IndigolayTab } from '~/components/ui-custom/indigolay-tab';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { CostBadge, CostBadges } from './cost-badge';
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

/** Stable key for an owned equipment instance (item + rolled rarity). */
function instanceKey(instance: { item: { id: string }; rarity: string }): string {
  return `${instance.item.id}::${instance.rarity}`;
}

export default function Blacksmith({
  backgroundImage,
  onLeaveCallback,
}: {
  backgroundImage: string;
  onLeaveCallback: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState<'craft' | 'modify' | 'exchange' | 'melt'>('craft');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType>('sword');
  const [selectedItem, setSelectedItem] = useState<EquipmentItemData | null>(null);
  // The first craft of each distinct item this visit shows the success overlay.
  // Resets naturally because the blacksmith remounts on each visit.
  const [celebratedItemIds, setCelebratedItemIds] = useState<Set<string>>(() => new Set());
  // Modify (upgrade/salvage) tab: selected owned instance + a salvage confirm dialog.
  const [selectedModifyKey, setSelectedModifyKey] = useState<string | null>(null);
  const [isSalvageDialogOpen, setIsSalvageDialogOpen] = useState(false);

  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const inventoryActions = useInventoryActions();
  const inventory = useInventory();
  const party = useParty();
  const pity = useCraftingPity();
  const craftingActions = useCraftingActions();
  const { showOverlay } = useOverlay();

  // Filter equipment by type
  const filteredEquipment = EquipmentItems.filter((item) => getEquipmentType(item.id) === selectedEquipmentType);

  // Pity-adjusted craft luck: each unlucky craft nudges the odds toward rarer gear.
  const craftBias = CRAFTING_RARITY_BIAS + Math.min(pity, PITY_MAX) * PITY_BIAS_STEP;

  // Owned gear with free (non-equipped) copies, for the Modify tab.
  const modifiableInstances = getOwnedEquipmentInstances(inventory, party).filter((inst) => inst.available > 0);
  const selectedModify = selectedModifyKey
    ? modifiableInstances.find((inst) => instanceKey(inst) === selectedModifyKey)
    : undefined;

  const handleCraftItem = (item: EquipmentItemData) => {
    if (canAfford(resources, item.cost)) {
      soundService.playSound(SoundNames.clickCoin);
      resourcesActions.reduceResources(item.cost);
      // Roll the crafted item's rarity once (pity-adjusted) and store it on the stack.
      const rarity = rollRarity(craftBias);
      inventoryActions.addItem(item.id, 1, rarity);
      craftingActions.registerCraft(rarity);
      setSelectedItem(null);

      if (!celebratedItemIds.has(item.id)) {
        setCelebratedItemIds((prev) => new Set(prev).add(item.id));
        showOverlay({ kind: 'crafting-success', itemId: item.id, rarity });
      }
    }
  };

  function handleSelectModify(key: string) {
    setSelectedModifyKey((prev) => (prev === key ? prev : key));
    setIsSalvageDialogOpen(false);
  }

  function handleUpgrade(instance: OwnedEquipmentInstance) {
    const cost = getUpgradeCost(instance.rarity);
    if (!canUpgradeRarity(instance.rarity) || !canAfford(resources, cost)) return;
    soundService.playSound(SoundNames.clickCoin);
    resourcesActions.reduceResources(cost);
    const next = upgradeRarity(instance.rarity);
    inventoryActions.removeItem(instance.item.id, 1, instance.rarity);
    inventoryActions.addItem(instance.item.id, 1, next);
    showOverlay({ kind: 'crafting-success', itemId: instance.item.id, rarity: next });
    setSelectedModifyKey(null);
    setIsSalvageDialogOpen(false);
  }

  function handleOpenSalvageDialog() {
    setIsSalvageDialogOpen(true);
  }

  function handleSalvage(instance: OwnedEquipmentInstance) {
    soundService.playSound(SoundNames.clickCoin);
    inventoryActions.removeItem(instance.item.id, 1, instance.rarity);
    resourcesActions.addResources(getSalvageReturn(instance.item));
    setSelectedModifyKey(null);
    setIsSalvageDialogOpen(false);
  }

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
        <IndigolayTab size="default" isActive={selectedTab === 'modify'} onClick={() => setSelectedTab('modify')}>
          Modify
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
                    <FrostyRpgIcon name="coinPurse" size={16} />{' '}
                    <span className="town-header-badge__value--coins">{CRAFTING_FEE}</span>
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

      {/* Modify Tab */}
      {selectedTab === 'modify' && (
        <div className="craft-section">
          <div className="town-section-header town-section-header--smith-craft">
            <h2>
              <NarikWoodBitFont text="MODIFY GEAR" size={1.3} />
            </h2>
          </div>
          <p className="town-section-subtitle">Upgrade gear one tier, or salvage it for materials</p>

          <div className="craft-workspace">
            <div className="equipment-list">
              {modifiableInstances.length === 0 ? (
                <div className="craft-detail-empty">
                  <p>No spare equipment to modify. Craft or unequip gear first.</p>
                </div>
              ) : (
                modifiableInstances.map((inst) => {
                  const key = instanceKey(inst);
                  return (
                    <div
                      key={key}
                      className={cn('equipment-list-item', selectedModifyKey === key && 'selected')}
                      onClick={() => handleSelectModify(key)}
                    >
                      <div className="equipment-item-icon">
                        {inst.item.iconName ? <FrostyRpgIcon name={inst.item.iconName} size={24} /> : null}
                      </div>
                      <div className="equipment-item-content">
                        <div className="equipment-item-header">
                          <div className="equipment-item-name" style={{ color: getRarityColor(inst.rarity) }}>
                            {inst.item.name}
                            <span className="ml-1 text-[0.55rem] uppercase opacity-80">
                              {getRarityLabel(inst.rarity)}
                            </span>
                          </div>
                          <div className="equipment-item-cost">x{inst.available}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="craft-detail">
              {selectedModify ? (
                <ModifyDetail
                  instance={selectedModify}
                  onUpgrade={() => handleUpgrade(selectedModify)}
                  onSalvage={() => handleOpenSalvageDialog()}
                />
              ) : (
                <div className="craft-detail-empty">
                  <p>Select a piece of equipment to upgrade or salvage.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isSalvageDialogOpen && selectedModify && (
        <SalvageConfirmDialog
          instance={selectedModify}
          salvageReturn={getSalvageReturn(selectedModify.item)}
          onConfirm={() => handleSalvage(selectedModify)}
          onCancel={() => setIsSalvageDialogOpen(false)}
        />
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
                        className="w-full text-[#e0e0e0]!"
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
                <span className="town-header-badge__value--coins">{MELT_COINS_PER_GOLD}</span>{' '}
                <FrostyRpgIcon name="coinPurse" size={14} /> = 1{' '}
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
                        className="w-full text-[#e0e0e0]!"
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

interface ModifyDetailProps {
  instance: OwnedEquipmentInstance;
  onUpgrade: () => void;
  onSalvage: () => void;
}

/** Detail panel for the Modify tab: rarity-scaled stats plus Upgrade and Salvage actions. */
function ModifyDetail({ instance, onUpgrade, onSalvage }: ModifyDetailProps) {
  const resources = useResources();
  const stats = getScaledEquipmentStats(instance.item, instance.rarity);
  const upgradable = canUpgradeRarity(instance.rarity);
  const nextRarity = upgradeRarity(instance.rarity);
  const upgradeCost = getUpgradeCost(instance.rarity);
  const canAffordUpgrade = canAfford(resources, upgradeCost);
  const salvageReturn = getSalvageReturn(instance.item);

  return (
    <>
      <div className="craft-detail-header">
        <div className="craft-detail-icon">
          {instance.item.iconName ? <FrostyRpgIcon name={instance.item.iconName} size={40} /> : null}
        </div>
        <div className="craft-detail-name" style={{ color: getRarityColor(instance.rarity) }}>
          {instance.item.name}
          <div className="text-[0.6rem] tracking-wider uppercase">{getRarityLabel(instance.rarity)}</div>
        </div>
      </div>

      <div className="craft-detail-stats">
        <div className="craft-detail-stats-row">
          <span className="stat-badge">POW: {stats.pow}</span>
          <span className="stat-badge">VIT: {stats.vit}</span>
          <span className="stat-badge">SPD: {stats.spd}</span>
        </div>
      </div>

      {/* Upgrade action */}
      <div className="craft-detail-actions">
        {upgradable ? (
          <>
            <div className="equipment-item-cost flex flex-wrap items-center gap-1">
              <span style={{ color: getRarityColor(nextRarity) }}>→ {getRarityLabel(nextRarity)}</span>
              <CostBadges resources={upgradeCost} />
            </div>
            <ToffecBeigeCornersWrapper>
              <ToffecButton variant="orange" size="xs" onClick={onUpgrade} disabled={!canAffordUpgrade}>
                {canAffordUpgrade ? 'Upgrade' : 'Cannot Afford'}
              </ToffecButton>
            </ToffecBeigeCornersWrapper>
          </>
        ) : (
          <div className="craft-detail-for-class">Maxed — Legendary</div>
        )}
      </div>

      {/* Salvage action */}
      <div className="craft-detail-actions">
        <div className="equipment-item-cost flex flex-wrap items-center gap-1">
          <span>Salvage for</span>
          <CostBadges resources={salvageReturn} />
        </div>
        <ToffecBeigeCornersWrapper>
          <ToffecButton variant="cream" size="xs" onClick={onSalvage}>
            Salvage
          </ToffecButton>
        </ToffecBeigeCornersWrapper>
      </div>
    </>
  );
}
