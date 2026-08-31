/**
 * Pure functions for the equipment system
 */

import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import type { EquipmentItemData } from '~/types/inventory';
import type { InventoryItem } from '~/lib/inventory';
import type { RarityTier } from '~/constants/rarity';
import { DEFAULT_RARITY } from '~/constants/rarity';
import { EquipmentItems } from '~/constants/inventory';
import { getRarityMultiplier, scaleStat } from '~/lib/rarity';

export type EquipmentSlot = 'weapon' | 'armor';

/** An owned equipment item paired with its rolled rarity (one inventory stack). */
export interface EquipmentInstance {
  item: EquipmentItemData;
  rarity: RarityTier;
}

/** An owned equipment stack with how many copies are free (not equipped). */
export interface OwnedEquipmentInstance extends EquipmentInstance {
  quantity: number;
  /** Copies not currently equipped by any party member — safe to modify/scrap. */
  available: number;
}

/**
 * Determine the equipment slot for an item by its ID.
 * Weapons have forClass set; armor items don't (or contain 'armor'/'plate').
 */
export function getEquipmentSlot(itemId: string): EquipmentSlot | null {
  if (
    itemId.includes('sword') ||
    itemId.includes('broadsword') ||
    itemId.includes('bow') ||
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
 * Get an equipment item's stats scaled by its rolled rarity. Positive stats are
 * multiplied (and rounded); penalties are left untouched (see `scaleStat`).
 * @param item Equipment item definition.
 * @param rarity Rolled rarity tier (defaults to common when undefined).
 * @returns The rarity-scaled POW/VIT/SPD.
 */
export function getScaledEquipmentStats(item: EquipmentItemData, rarity: RarityTier | undefined): CoreRPGStats {
  const multiplier = getRarityMultiplier(rarity);
  return {
    pow: scaleStat(item.pow, multiplier),
    vit: scaleStat(item.vit, multiplier),
    spd: scaleStat(item.spd, multiplier),
  };
}

/**
 * Calculate the total stat bonuses from a character's equipped items, including
 * the rarity multiplier of each equipped piece. Called once at battle init via
 * `getPartyWithEffectiveStats`, so the scaling is never recomputed per frame.
 */
export function getEquipmentBonuses(character: CharacterData): CoreRPGStats {
  const bonuses: CoreRPGStats = { pow: 0, vit: 0, spd: 0 };

  if (character.equippedWeaponId) {
    const weapon = findEquipmentItem(character.equippedWeaponId);
    if (weapon) {
      const stats = getScaledEquipmentStats(weapon, character.equippedWeaponRarity);
      bonuses.pow += stats.pow;
      bonuses.vit += stats.vit;
      bonuses.spd += stats.spd;
    }
  }

  if (character.equippedArmorId) {
    const armor = findEquipmentItem(character.equippedArmorId);
    if (armor) {
      const stats = getScaledEquipmentStats(armor, character.equippedArmorRarity);
      bonuses.pow += stats.pow;
      bonuses.vit += stats.vit;
      bonuses.spd += stats.spd;
    }
  }

  return bonuses;
}

/**
 * Calculate the total cascade combo bonus from a character's equipped items.
 * Combines the (very low) comboBonus of the equipped weapon and armor.
 * @param character Character data
 * @returns Summed combo bonus (0 when nothing relevant is equipped)
 */
export function getEquipmentComboBonus(character: CharacterData): number {
  let comboBonus = 0;

  if (character.equippedWeaponId) {
    comboBonus += findEquipmentItem(character.equippedWeaponId)?.comboBonus ?? 0;
  }
  if (character.equippedArmorId) {
    comboBonus += findEquipmentItem(character.equippedArmorId)?.comboBonus ?? 0;
  }

  return comboBonus;
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
 * Returns effective max HP for a character, including equipment VIT bonuses.
 * Unlike calculateEntityMaxHp in rpg-calculations, this does NOT modify
 * the stored maxHp — it's for battle/display contexts only.
 * @param character Character data
 * @returns Effective max HP with equipment VIT bonuses applied
 */
export function getEffectiveMaxHp(character: CharacterData): number {
  const bonuses = getEquipmentBonuses(character);
  return character.maxHp + bonuses.vit * character.vitHpMultiplier;
}

/**
 * Returns a copy of each party member with equipment bonuses baked into
 * their stats and maxHp.
 * @param party Array of character data
 * @returns New array with effective stats and maxHp applied
 */
export function getPartyWithEffectiveStats(party: CharacterData[]): CharacterData[] {
  return party.map((char) => {
    const effectiveStats = getEffectiveStats(char);
    const effectiveMaxHp = getEffectiveMaxHp(char);
    return {
      ...char,
      stats: effectiveStats,
      maxHp: effectiveMaxHp,
      currentHp: Math.min(char.currentHp, effectiveMaxHp),
    };
  });
}

/**
 * Get available equipment instances for a given slot and character, respecting
 * class restrictions and deducting equipped counts from inventory quantity.
 *
 * Because rarity is part of the inventory stack key, this returns one entry per
 * owned (item, rarity) combination — a Common and a Rare copy of the same item
 * are distinct, independently-equippable choices.
 */
export function getAvailableEquipmentForSlot(
  slot: EquipmentSlot,
  character: CharacterData,
  party: CharacterData[],
  inventory: InventoryItem[],
): EquipmentInstance[] {
  const instances: EquipmentInstance[] = [];

  for (const inv of inventory) {
    const item = findEquipmentItem(inv.itemId);
    if (!item) continue;

    // Must be for the correct slot and equippable by this character (class check)
    if (getEquipmentSlot(item.id) !== slot) continue;
    if (!canEquip(character, item)) continue;

    const rarity = inv.rarity ?? DEFAULT_RARITY;

    // Count how many of this exact (item, rarity) are equipped by OTHER members
    const equippedByOthers = party.filter((member) => {
      if (member.id === character.id) return false;
      const weaponMatch = member.equippedWeaponId === item.id && (member.equippedWeaponRarity ?? DEFAULT_RARITY) === rarity;
      const armorMatch = member.equippedArmorId === item.id && (member.equippedArmorRarity ?? DEFAULT_RARITY) === rarity;
      return weaponMatch || armorMatch;
    }).length;

    // Available = owned of this stack - equipped by others of the same stack
    if (inv.quantity - equippedByOthers > 0) {
      instances.push({ item, rarity });
    }
  }

  return instances;
}

/**
 * Count how many party members have a specific (itemId, rarity) instance equipped
 * in either slot.
 */
export function countEquippedInstances(party: CharacterData[], itemId: string, rarity: RarityTier): number {
  return party.reduce((count, member) => {
    const weaponMatch = member.equippedWeaponId === itemId && (member.equippedWeaponRarity ?? DEFAULT_RARITY) === rarity;
    const armorMatch = member.equippedArmorId === itemId && (member.equippedArmorRarity ?? DEFAULT_RARITY) === rarity;
    return count + (weaponMatch ? 1 : 0) + (armorMatch ? 1 : 0);
  }, 0);
}

/**
 * List every owned equipment stack as an instance, annotated with how many copies
 * are free to modify or scrap (`available = quantity - equipped copies`). Used by
 * the blacksmith's upgrade/salvage UI so equipped gear can't be over-consumed.
 */
export function getOwnedEquipmentInstances(
  inventory: InventoryItem[],
  party: CharacterData[],
): OwnedEquipmentInstance[] {
  const instances: OwnedEquipmentInstance[] = [];

  for (const inv of inventory) {
    const item = findEquipmentItem(inv.itemId);
    if (!item) continue;

    const rarity = inv.rarity ?? DEFAULT_RARITY;
    const equipped = countEquippedInstances(party, item.id, rarity);
    instances.push({ item, rarity, quantity: inv.quantity, available: inv.quantity - equipped });
  }

  return instances;
}
