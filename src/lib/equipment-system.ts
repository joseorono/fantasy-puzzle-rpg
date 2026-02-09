/**
 * Pure functions for the equipment system
 */

import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import type { EquipmentItemData } from '~/types/inventory';
import type { InventoryItem } from '~/lib/inventory';
import { EquipmentItems } from '~/constants/inventory';

export type EquipmentSlot = 'weapon' | 'armor';

/**
 * Determine the equipment slot for an item by its ID.
 * Weapons have forClass set; armor items don't (or contain 'armor'/'plate').
 */
export function getEquipmentSlot(itemId: string): EquipmentSlot | null {
  if (
    itemId.includes('sword') ||
    itemId.includes('broadsword') ||
    itemId.includes('dagger') ||
    itemId.includes('dirk') ||
    itemId.includes('staff') ||
    itemId.includes('scepter')
  ) {
    return 'weapon';
  }
  if (itemId.includes('armor') || itemId.includes('plate')) {
    return 'armor';
  }
  return null;
}

/**
 * Find an equipment item definition by ID.
 */
export function findEquipmentItem(itemId: string): EquipmentItemData | undefined {
  return EquipmentItems.find((item) => item.id === itemId);
}

/**
 * Check if a character can equip an item.
 * Weapons require matching class. Armor can be equipped by anyone.
 */
export function canEquip(character: CharacterData, item: EquipmentItemData): boolean {
  const slot = getEquipmentSlot(item.id);
  if (!slot) return false;

  if (slot === 'weapon') {
    // Weapons must have a forClass that matches the character's class
    if (!item.forClass) return false;
    return item.forClass === character.class;
  }

  // Armor: any class can equip
  return true;
}

/**
 * Calculate the total stat bonuses from a character's equipped items.
 */
export function getEquipmentBonuses(character: CharacterData): CoreRPGStats {
  const bonuses: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

  if (character.equippedWeaponId) {
    const weapon = findEquipmentItem(character.equippedWeaponId);
    if (weapon) {
      bonuses.pow += weapon.pow;
      bonuses.vit += weapon.vit;
      bonuses.spd += weapon.spd;
    }
  }

  if (character.equippedArmorId) {
    const armor = findEquipmentItem(character.equippedArmorId);
    if (armor) {
      bonuses.pow += armor.pow;
      bonuses.vit += armor.vit;
      bonuses.spd += armor.spd;
    }
  }

  return bonuses;
}

/**
 * Get effective stats (base + equipment bonuses) for a character.
 */
export function getEffectiveStats(character: CharacterData): CoreRPGStats {
  const bonuses = getEquipmentBonuses(character);
  return {
    pow: character.stats.pow + bonuses.pow,
    vit: character.stats.vit + bonuses.vit,
    spd: character.stats.spd + bonuses.spd,
  };
}

/**
 * Get available equipment items for a given slot and character,
 * respecting class restrictions and deducting equipped counts from inventory quantity.
 */
export function getAvailableEquipmentForSlot(
  slot: EquipmentSlot,
  character: CharacterData,
  party: CharacterData[],
  inventory: InventoryItem[],
): EquipmentItemData[] {
  return EquipmentItems.filter((item) => {
    // Must be for the correct slot
    if (getEquipmentSlot(item.id) !== slot) return false;

    // Must be equippable by this character (class check)
    if (!canEquip(character, item)) return false;

    // Must have available quantity in inventory
    const ownedQty = inventory.find((inv) => inv.itemId === item.id)?.quantity ?? 0;
    if (ownedQty <= 0) return false;

    // Count how many of this item are equipped by OTHER party members
    const equippedByOthers = party.filter((member) => {
      if (member.id === character.id) return false;
      return member.equippedWeaponId === item.id || member.equippedArmorId === item.id;
    }).length;

    // Available = owned - equipped by others
    return ownedQty - equippedByOthers > 0;
  });
}
