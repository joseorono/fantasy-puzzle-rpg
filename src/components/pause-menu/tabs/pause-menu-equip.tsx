import { useInventory } from '~/stores/game-store';
import { EquipmentItems } from '~/constants/inventory';
import { filterInventoryByType, getItemQuantity } from '~/lib/inventory';
import type { EquipmentItemData } from '~/types';

export function PauseMenuEquip() {
  const inventory = useInventory();
  const equipmentInInventory = filterInventoryByType(inventory, EquipmentItems, 'equipment');

  return (
    <>
      <h2>Equipment</h2>
      {equipmentInInventory.length === 0 ? (
        <div className="pause-menu-empty">No equipment owned</div>
      ) : (
        <div className="pause-menu-equip-list">
          {equipmentInInventory.map((invItem) => {
            const itemData = EquipmentItems.find((e) => e.id === invItem.itemId);
            if (!itemData) return null;
            return (
              <div key={invItem.itemId} className="pause-menu-equip-item">
                <div>
                  <div className="pause-menu-equip-name">
                    {itemData.name} <span className="pause-menu-item-qty">x{invItem.quantity}</span>
                  </div>
                  <div className="pause-menu-equip-desc">{itemData.description}</div>
                  <div className="pause-menu-equip-stats">
                    {itemData.pow !== 0 && (
                      <span className="pause-menu-item-stat-badge">
                        POW {itemData.pow > 0 ? '+' : ''}{itemData.pow}
                      </span>
                    )}
                    {itemData.vit !== 0 && (
                      <span className="pause-menu-item-stat-badge">
                        VIT {itemData.vit > 0 ? '+' : ''}{itemData.vit}
                      </span>
                    )}
                    {itemData.spd !== 0 && (
                      <span className="pause-menu-item-stat-badge">
                        SPD {itemData.spd > 0 ? '+' : ''}{itemData.spd}
                      </span>
                    )}
                  </div>
                  {itemData.forClass && (
                    <div className="pause-menu-equip-for">For: {itemData.forClass}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
