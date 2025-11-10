import { Button } from '~/components/ui/button';
import { useInventory, useInventoryActions } from '~/stores/game-store';
import { getItemQuantity } from '~/lib/inventory';
import { EquipmentItems, ConsumableItems } from '~/constants/inventory';

export default function InventoryTestView() {
  const inventory = useInventory();
  const inventoryActions = useInventoryActions();

  if (!inventoryActions) {
    return <div className="p-8">Error: Inventory actions not available</div>;
  }

  const { addItem, removeItem, clearInventory } = inventoryActions;

  // Combine all items for display
  const allItems = [...EquipmentItems, ...ConsumableItems];

  function handleAddItem(itemId: string) {
    addItem(itemId, 1);
  }

  function handleAddMultiple(itemId: string) {
    addItem(itemId, 5);
  }

  function handleRemoveItem(itemId: string) {
    removeItem(itemId, 1);
  }

  function handleClearInventory() {
    clearInventory();
  }

  // Get items that are in inventory
  const inventoryItems = inventory
    .map((invItem) => {
      const itemData = allItems.find((item) => item.id === invItem.itemId);
      return itemData ? { ...itemData, quantity: invItem.quantity } : null;
    })
    .filter((item) => item !== null);

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-8 text-4xl font-bold">Inventory Test</h1>

      {/* Current Inventory Display */}
      <div className="mb-8 rounded-lg bg-slate-100 p-6 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Current Inventory</h2>
          <Button onClick={handleClearInventory} variant="outline" className="bg-red-600 text-white hover:bg-red-700">
            Clear All
          </Button>
        </div>

        {inventoryItems.length === 0 ? (
          <p className="text-gray-500 italic">Inventory is empty</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inventoryItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border-2 border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">×{item.quantity}</span>
                </div>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                <div className="mb-3 text-xs text-gray-500">
                  <span className="font-medium">Type:</span> {item.type}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleRemoveItem(item.id)} size="sm" variant="outline">
                    - 1
                  </Button>
                  <Button onClick={() => handleAddItem(item.id)} size="sm" variant="outline">
                    + 1
                  </Button>
                  <Button onClick={() => handleAddMultiple(item.id)} size="sm" variant="outline">
                    + 5
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Items Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Add Items to Inventory</h2>

        {/* Consumables */}
        <div className="mb-6">
          <h3 className="mb-3 text-xl font-semibold text-green-600">Consumables</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ConsumableItems.map((item) => {
              const currentQty = getItemQuantity(inventory, item.id);
              return (
                <div
                  key={item.id}
                  className="rounded border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500">({currentQty})</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAddItem(item.id)} size="sm" className="flex-1">
                      Add 1
                    </Button>
                    <Button onClick={() => handleAddMultiple(item.id)} size="sm" variant="outline" className="flex-1">
                      Add 5
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <h3 className="mb-3 text-xl font-semibold text-purple-600">Equipment</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {EquipmentItems.slice(0, 9).map((item) => {
              const currentQty = getItemQuantity(inventory, item.id);
              return (
                <div
                  key={item.id}
                  className="rounded border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500">({currentQty})</span>
                  </div>
                  <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                    {item.forClass && <span className="capitalize">{item.forClass} • </span>}
                    POW: {item.pow} VIT: {item.vit} SPD: {item.spd}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAddItem(item.id)} size="sm" className="flex-1">
                      Add 1
                    </Button>
                    <Button onClick={() => handleAddMultiple(item.id)} size="sm" variant="outline" className="flex-1">
                      Add 5
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="rounded-lg bg-slate-100 p-6 dark:bg-slate-900">
        <h2 className="mb-4 text-2xl font-semibold">Inventory Stats</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Unique Items</p>
            <p className="text-3xl font-bold">{inventory.length}</p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            <p className="text-3xl font-bold">{inventory.reduce((sum, item) => sum + item.quantity, 0)}</p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Consumables</p>
            <p className="text-3xl font-bold">
              {inventory.filter((item) => ConsumableItems.some((c) => c.id === item.itemId)).length}
            </p>
          </div>
          <div className="rounded bg-white p-4 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
            <p className="text-3xl font-bold">
              {inventory.filter((item) => EquipmentItems.some((e) => e.id === item.itemId)).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
