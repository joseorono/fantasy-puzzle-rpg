/**
 * Example component demonstrating store usage
 * This file is for documentation purposes only
 */

import { useResources, useResourcesActions } from './game-store';
import { canAfford, createResources } from '../lib/resources';

/**
 * Example: Simple resources display and controls
 */
export function ResourcesDisplay() {
  const resources = useResources();
  const { addResources } = useResourcesActions();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-2xl font-bold">Resources</div>
      <div className="grid grid-cols-2 gap-2">
        <div>Coins: {resources.coins}</div>
        <div>Gold: {resources.gold}</div>
        <div>Copper: {resources.copper}</div>
        <div>Silver: {resources.silver}</div>
        <div>Bronze: {resources.bronze}</div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => addResources(createResources({ gold: 10 }))}>+10 Gold</button>
        <button onClick={() => addResources(createResources({ gold: -5 }))}>-5 Gold</button>
        <button onClick={() => addResources(createResources({ coins: 10 }))}>+10 Coins</button>
        <button onClick={() => addResources(createResources({ coins: -5 }))}>-5 Coins</button>
      </div>
    </div>
  );
}

/**
 * Example: Shop item with affordability check
 */
interface ShopItemProps {
  name: string;
  cost: number;
  onPurchase: () => void;
}

export function ShopItem({ name, cost, onPurchase }: ShopItemProps) {
  const resources = useResources();
  const { addResources: addToResources } = useResourcesActions();

  const affordable = canAfford(resources, createResources({ gold: cost }));

  function handlePurchase() {
    if (affordable) {
      addToResources(createResources({ gold: -cost }));
      onPurchase();
    }
  }

  return (
    <button onClick={handlePurchase} disabled={!affordable} className={affordable ? 'text-green-500' : 'text-gray-500'}>
      {name} - {cost} gold
      {!affordable && ' (Cannot afford)'}
    </button>
  );
}

/**
 * Example: Complete shop with multiple items
 */
export function SimpleShop() {
  const resources = useResources();

  function handlePurchase(itemName: string) {
    console.log(`Purchased: ${itemName}`);
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-4 text-xl">Shop (Gold: {resources.gold})</h2>

      <div className="flex flex-col gap-2">
        <ShopItem name="Health Potion" cost={10} onPurchase={() => handlePurchase('Health Potion')} />
        <ShopItem name="Magic Scroll" cost={25} onPurchase={() => handlePurchase('Magic Scroll')} />
        <ShopItem name="Steel Sword" cost={100} onPurchase={() => handlePurchase('Steel Sword')} />
      </div>
    </div>
  );
}
