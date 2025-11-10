import { Button } from '~/components/ui/button';
import { useResources, useResourcesActions } from '~/stores/game-store';
import { canAfford, createResources } from '~/lib/resources';
import type { Resources } from '~/types/resources';

interface Product {
  id: string;
  name: string;
  cost: Resources;
}

const FAKE_PRODUCTS: Product[] = [
  {
    id: 'potion',
    name: 'Health Potion',
    cost: createResources({ coins: 50 }),
  },
  {
    id: 'sword',
    name: 'Iron Sword',
    cost: createResources({ gold: 10, coins: 100 }),
  },
  {
    id: 'armor',
    name: 'Steel Armor',
    cost: createResources({ gold: 25, silver: 5 }),
  },
  {
    id: 'ring',
    name: 'Enchanted Ring',
    cost: createResources({ gold: 50, copper: 20, bronze: 10 }),
  },
];

export default function ResourcesTestView() {
  const resources = useResources();
  const { addResources, reduceResources } = useResourcesActions();

  function handleAddCoins() {
    addResources(createResources({ coins: 100 }));
  }

  function handleAddGold() {
    addResources(createResources({ gold: 10 }));
  }

  function handleAddCopper() {
    addResources(createResources({ copper: 50 }));
  }

  function handleAddSilver() {
    addResources(createResources({ silver: 25 }));
  }

  function handleAddBronze() {
    addResources(createResources({ bronze: 75 }));
  }

  function handleAddAll() {
    addResources(
      createResources({
        coins: 100,
        gold: 10,
        copper: 50,
        silver: 25,
        bronze: 75,
      }),
    );
  }

  function handleDecreaseCoins() {
    reduceResources(createResources({ coins: 50 }));
  }

  function handleDecreaseGold() {
    reduceResources(createResources({ gold: 5 }));
  }

  function handleDecreaseAll() {
    reduceResources(
      createResources({
        coins: 50,
        gold: 5,
        copper: 25,
        silver: 10,
        bronze: 30,
      }),
    );
  }

  function handleBuyProduct(product: Product) {
    if (canAfford(resources, product.cost)) {
      reduceResources(product.cost);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-4xl font-bold">Resources Test</h1>

      {/* Current Resources Display */}
      <div className="mb-8 rounded-lg bg-slate-100 p-6 dark:bg-slate-900">
        <h2 className="mb-4 text-2xl font-semibold">Current Resources</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
            <p className="text-2xl font-bold">{resources.coins}</p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Gold</p>
            <p className="text-2xl font-bold text-yellow-600">{resources.gold}</p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Copper</p>
            <p className="text-2xl font-bold text-orange-600">{resources.copper}</p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Silver</p>
            <p className="text-2xl font-bold text-gray-400">{resources.silver}</p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bronze</p>
            <p className="text-2xl font-bold text-amber-700">{resources.bronze}</p>
          </div>
        </div>
      </div>

      {/* Add Resources Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Add Resources</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Button onClick={handleAddCoins} variant="outline">
            + 100 Coins
          </Button>
          <Button onClick={handleAddGold} variant="outline">
            + 10 Gold
          </Button>
          <Button onClick={handleAddCopper} variant="outline">
            + 50 Copper
          </Button>
          <Button onClick={handleAddSilver} variant="outline">
            + 25 Silver
          </Button>
          <Button onClick={handleAddBronze} variant="outline">
            + 75 Bronze
          </Button>
          <Button onClick={handleAddAll} className="bg-green-600 hover:bg-green-700">
            Add All
          </Button>
        </div>
      </div>

      {/* Decrease Resources Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Decrease Resources</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Button onClick={handleDecreaseCoins} variant="outline">
            - 50 Coins
          </Button>
          <Button onClick={handleDecreaseGold} variant="outline">
            - 5 Gold
          </Button>
          <Button onClick={handleDecreaseAll} className="bg-red-600 hover:bg-red-700">
            Decrease All
          </Button>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Shop - Test Purchases</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FAKE_PRODUCTS.map((product) => {
            const isAffordable = canAfford(resources, product.cost);
            return (
              <div
                key={product.id}
                className={`rounded-lg border-2 p-4 ${
                  isAffordable
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                }`}
              >
                <h3 className="mb-2 text-lg font-semibold">{product.name}</h3>
                <div className="mb-3 space-y-1 text-sm">
                  {product.cost.coins > 0 && (
                    <p>
                      <span className="font-medium">Coins:</span> {product.cost.coins}
                    </p>
                  )}
                  {product.cost.gold > 0 && (
                    <p>
                      <span className="font-medium">Gold:</span> {product.cost.gold}
                    </p>
                  )}
                  {product.cost.copper > 0 && (
                    <p>
                      <span className="font-medium">Copper:</span> {product.cost.copper}
                    </p>
                  )}
                  {product.cost.silver > 0 && (
                    <p>
                      <span className="font-medium">Silver:</span> {product.cost.silver}
                    </p>
                  )}
                  {product.cost.bronze > 0 && (
                    <p>
                      <span className="font-medium">Bronze:</span> {product.cost.bronze}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleBuyProduct(product)}
                  disabled={!isAffordable}
                  className={isAffordable ? 'w-full' : 'w-full'}
                >
                  {isAffordable ? 'Buy' : 'Cannot Afford'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
