import type { Resources } from "./resources";
import type { CharacterClass } from "./rpg-elements";
import { ConsumableItemIds } from "~/constants/inventory";

export type ItemTypes = 'equipment' | 'consumable' | 'key';

export interface BaseItemData {
    id: string;
    name: string;
    type: ItemTypes;
    description: string;
    cost: Resources;
}

export interface EquipmentItemData extends BaseItemData {
    pow: number;
    vit: number;
    spd: number;
    forClass?: CharacterClass;
}

export interface ConsumableItemData extends BaseItemData {
}

export type ConsumableItemIds = typeof ConsumableItemIds[number];
export type ItemStoreParams = Array<ConsumableItemIds>;



export interface KeyItemData extends BaseItemData {
}