import { useState } from 'react';
import { Button } from '../ui/8bit/button';
import { useResources, useResourcesActions, useInventoryActions } from '~/stores/game-store';
import { EquipmentItems } from '~/constants/inventory';
import { canAfford, createResources } from '~/lib/resources';
import type { EquipmentItemData } from '~/types';

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

export default function Blacksmith({ onLeaveCallback }: { onLeaveCallback: () => void }) {
  const [selectedTab, setSelectedTab] = useState<'craft' | 'exchange' | 'melt'>('craft');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType>('sword');
  const [selectedItem, setSelectedItem] = useState<EquipmentItemData | null>(null);

  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const inventoryActions = useInventoryActions();

  // Filter equipment by type
  const filteredEquipment = EquipmentItems.filter(
    (item) => getEquipmentType(item.id) === selectedEquipmentType
  );

  const handleCraftItem = (item: EquipmentItemData) => {
    if (canAfford(resources, item.cost)) {
      resourcesActions.reduceResources(item.cost);
      inventoryActions.addItem(item.id);
      setSelectedItem(null);
    }
  };

  const handleExchangeResources = (fromResource: keyof typeof resources, toResource: keyof typeof resources, amount: number) => {
    const cost = createResources({ [fromResource]: amount });
    if (canAfford(resources, cost)) {
      resourcesActions.reduceResources(cost);
      resourcesActions.addResources(createResources({ [toResource]: amount }));
    }
  };

  const handleMeltCoinsToGold = (coinAmount: number) => {
    const cost = createResources({ coins: coinAmount });
    if (canAfford(resources, cost)) {
      // Conversion rate: 10 coins = 1 gold
      const goldGain = Math.floor(coinAmount / 10);
      resourcesActions.reduceResources(cost);
      resourcesActions.addResources(createResources({ gold: goldGain }));
    }
  };

  return (
    <div className="blacksmith-container">
      <div className="blacksmith-header">
        <Button onClick={onLeaveCallback}>Leave</Button>
        <h1>Blacksmith</h1>
      </div>

      {/* Resources Display */}
      <div className="resources-display">
        <div>Coins: {resources.coins}</div>
        <div>Gold: {resources.gold}</div>
        <div>Copper: {resources.copper}</div>
        <div>Silver: {resources.silver}</div>
        <div>Bronze: {resources.bronze}</div>
      </div>

      {/* Tab Navigation */}
      <div className="blacksmith-tabs">
        <Button
          onClick={() => setSelectedTab('craft')}
          className={selectedTab === 'craft' ? 'active' : ''}
        >
          Craft
        </Button>
        <Button
          onClick={() => setSelectedTab('exchange')}
          className={selectedTab === 'exchange' ? 'active' : ''}
        >
          Exchange
        </Button>
        <Button
          onClick={() => setSelectedTab('melt')}
          className={selectedTab === 'melt' ? 'active' : ''}
        >
          Melt
        </Button>
      </div>

      {/* Craft Tab */}
      {selectedTab === 'craft' && (
        <div className="craft-section">
          {/* Equipment Type Filters */}
          <div className="equipment-filters">
            {(Object.entries(EQUIPMENT_TYPE_FILTERS) as Array<[EquipmentType, string]>).map(
              ([type, label]) => (
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
              )
            )}
          </div>

          {/* Equipment Grid */}
          <div className="equipment-grid">
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                className={`equipment-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="equipment-card-header">
                  <div className="equipment-icon">⚔️</div>
                  <div className="equipment-name">{item.name}</div>
                </div>
                <div className="equipment-card-body">
                  <div className="equipment-stat">
                    <span className="stat-label">POW:</span>
                    <span className="stat-value">{item.pow}</span>
                  </div>
                  <div className="equipment-stat">
                    <span className="stat-label">VIT:</span>
                    <span className="stat-value">{item.vit}</span>
                  </div>
                  <div className="equipment-stat">
                    <span className="stat-label">SPD:</span>
                    <span className="stat-value">{item.spd}</span>
                  </div>
                </div>
                <div className="equipment-card-footer">
                  <div className="cost-row">
                    {item.cost.coins > 0 && <span className="cost-item coins">C:{item.cost.coins}</span>}
                    {item.cost.gold > 0 && <span className="cost-item gold">G:{item.cost.gold}</span>}
                    {item.cost.copper > 0 && <span className="cost-item copper">Cu:{item.cost.copper}</span>}
                    {item.cost.silver > 0 && <span className="cost-item silver">S:{item.cost.silver}</span>}
                    {item.cost.bronze > 0 && <span className="cost-item bronze">B:{item.cost.bronze}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment Details */}
          {selectedItem && (
            <div className="equipment-details">
              <h2>{selectedItem.name}</h2>
              <p>{selectedItem.description}</p>

              <div className="stats">
                <div>Power: {selectedItem.pow}</div>
                <div>Vitality: {selectedItem.vit}</div>
                <div>Speed: {selectedItem.spd}</div>
                {selectedItem.forClass && <div>For: {selectedItem.forClass}</div>}
              </div>

              <div className="cost-section">
                <h3>Crafting Cost:</h3>
                <div className="cost-display">
                  {selectedItem.cost.coins > 0 && <div>Coins: {selectedItem.cost.coins}</div>}
                  {selectedItem.cost.gold > 0 && <div>Gold: {selectedItem.cost.gold}</div>}
                  {selectedItem.cost.copper > 0 && <div>Copper: {selectedItem.cost.copper}</div>}
                  {selectedItem.cost.silver > 0 && <div>Silver: {selectedItem.cost.silver}</div>}
                  {selectedItem.cost.bronze > 0 && <div>Bronze: {selectedItem.cost.bronze}</div>}
                </div>
              </div>

              <Button
                onClick={() => handleCraftItem(selectedItem)}
                disabled={!canAfford(resources, selectedItem.cost)}
              >
                {canAfford(resources, selectedItem.cost) ? 'Craft' : 'Cannot Afford'}
              </Button>
            </div>
          )}
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
              <Button
                onClick={() => handleExchangeResources('copper', 'silver', 5)}
                disabled={resources.copper < 5}
              >
                Exchange 5 Copper for 1 Silver
              </Button>
            </div>

            <div className="exchange-group">
              <h3>Bronze to Silver</h3>
              <Button
                onClick={() => handleExchangeResources('bronze', 'silver', 5)}
                disabled={resources.bronze < 5}
              >
                Exchange 5 Bronze for 1 Silver
              </Button>
            </div>

            <div className="exchange-group">
              <h3>Silver to Gold</h3>
              <Button
                onClick={() => handleExchangeResources('silver', 'gold', 5)}
                disabled={resources.silver < 5}
              >
                Exchange 5 Silver for 1 Gold
              </Button>
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
            <Button
              onClick={() => handleMeltCoinsToGold(10)}
              disabled={resources.coins < 10}
            >
              Melt 10 Coins → 1 Gold
            </Button>
            <Button
              onClick={() => handleMeltCoinsToGold(50)}
              disabled={resources.coins < 50}
            >
              Melt 50 Coins → 5 Gold
            </Button>
            <Button
              onClick={() => handleMeltCoinsToGold(100)}
              disabled={resources.coins < 100}
            >
              Melt 100 Coins → 10 Gold
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}