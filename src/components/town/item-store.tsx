import { useInventory, useInventoryActions } from '~/stores/game-store';
import type { ItemStoreParams } from '~/types';
import { Button } from '../ui/8bit/button';
import { getItemsFromIds } from '~/lib/town';

export default function ItemStore({ itemsForSell, onLeaveCallback }: { itemsForSell: ItemStoreParams, onLeaveCallback: () => void }) {

    const inventory = useInventory();
    const inventoryActions = useInventoryActions();

    const itemsData = getItemsFromIds(itemsForSell);
    
    return (
        <div>
            <Button onClick={onLeaveCallback}>Leave</Button>
            <h1>Item Store</h1>
            <div>
                {itemsData.map((item) => (
                    <div key={item.id}>
                        <p>{item.name}</p>
                        <p>{item.description}</p>
                        <p>{item.cost.coins} coins</p>
                        <Button onClick={() => inventoryActions.addItem(item.id)}>Buy</Button>
                    </div>
                ))}
            </div>
        </div>
    );
}