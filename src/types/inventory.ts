import type { CharacterClass } from "./rpg-elements";

export type ItemTypes = 'equipment' | 'consumable' | 'key';

export interface BaseItemData {
    id: string;
    name: string;
    type: ItemTypes;
    description: string;
}

export interface EquipmentItemData extends BaseItemData {
    pow: number;
    vit: number;
    spd: number;
    forClass?: CharacterClass;
}

export interface ConsumableItemData extends BaseItemData {
    amount: number;
}

export interface KeyItemData extends BaseItemData {
}