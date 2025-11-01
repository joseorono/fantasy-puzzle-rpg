import type { ConsumableItemData, ConsumableItemIds } from "~/types/inventory";
import { ConsumableItems } from "~/constants/inventory";

export function getItemFromId(id: ConsumableItemIds ): ConsumableItemData | undefined {
    return ConsumableItems.find(item => item.id === id);
}

export function getItemsFromIds(ids: ConsumableItemIds[]): ConsumableItemData[] {
    const arrItems: ConsumableItemData[] = [];
    ids.forEach(id => {
        const item = getItemFromId(id);
        if (item) {
            arrItems.push(item);
        }
    });
    return arrItems;
}
