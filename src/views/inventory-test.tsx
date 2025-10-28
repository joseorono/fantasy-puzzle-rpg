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
    .map(invItem => {
      const itemData = allItems.find(item => item.id === invItem.itemId);
      return itemData ? { ...itemData, quantity: invItem.quantity } : null;
    })
    .filter(item => item !== null);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Inventory Test</h1>

      {/* Current Inventory Display */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Current Inventory</h2>
          <Button onClick={handleClearInventory} variant="outline" className="bg-red-600 hover:bg-red-700 text-white">
            Clear All
          </Button>
        </div>
        
        {inventoryItems.length === 0 ? (
          <p className="text-gray-500 italic">Inventory is empty</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-slate-300 dark:border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">×{item.quantity}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.description}</p>
                <div className="text-xs text-gray-500 mb-3">
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
        <h2 className="text-2xl font-semibold mb-4">Add Items to Inventory</h2>
        
        {/* Consumables */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-green-600">Consumables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ConsumableItems.map(item => {
              const currentQty = getItemQuantity(inventory, item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700"
                >
                  <div className="flex justify-between items-center mb-2">
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
          <h3 className="text-xl font-semibold mb-3 text-purple-600">Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EquipmentItems.slice(0, 9).map(item => {
              const currentQty = getItemQuantity(inventory, item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500">({currentQty})</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
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
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Inventory Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Unique Items</p>
            <p className="text-3xl font-bold">{inventory.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            <p className="text-3xl font-bold">
              {inventory.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Consumables</p>
            <p className="text-3xl font-bold">
              {inventory.filter(item => 
                ConsumableItems.some(c => c.id === item.itemId)
              ).length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
            <p className="text-3xl font-bold">
              {inventory.filter(item => 
                EquipmentItems.some(e => e.id === item.itemId)
              ).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
