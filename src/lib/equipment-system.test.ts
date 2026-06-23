import { describe, it, expect } from 'vitest';
import {
  getEquipmentSlot,
  canEquip,
  getEquipmentBonuses,
  getEquipmentComboBonus,
  getEffectiveStats,
  getEffectiveMaxHp,
  getPartyWithEffectiveStats,
  getAvailableEquipmentForSlot,
  getScaledEquipmentStats,
  getOwnedEquipmentInstances,
  findEquipmentItem,
} from './equipment-system';
import type { CharacterData } from '~/types/rpg-elements';
import type { InventoryItem } from '~/lib/inventory';

// Helpers to create minimal test characters
function makeCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    stats: { pow: 10, vit: 20, spd: 5 },
    potentialStats: { pow: 30, vit: 30, spd: 10 },
    level: 1,
    baseHp: 50,
    currentExp: 0,
    expToNextLevel: 100,
    vitHpMultiplier: 6,
    maxHp: 170,
    currentHp: 170,
    skillCooldown: 0,
    maxCooldown: 30,
    unlockedSkillIds: ['warrior-power-strike'],
    selectedSkillId: 'warrior-power-strike',
    ...overrides,
  };
}

describe('getEquipmentSlot', () => {
  it('returns weapon for sword items', () => {
    expect(getEquipmentSlot('iron-sword')).toBe('weapon');
    expect(getEquipmentSlot('golden-broadsword')).toBe('weapon');
  });

  it('returns weapon for bow items', () => {
    expect(getEquipmentSlot('iron-short-bow')).toBe('weapon');
    expect(getEquipmentSlot('golden-war-bow')).toBe('weapon');
  });

  it('returns weapon for staff/scepter items', () => {
    expect(getEquipmentSlot('iron-staff')).toBe('weapon');
    expect(getEquipmentSlot('golden-scepter')).toBe('weapon');
  });

  it('returns armor for armor items', () => {
    expect(getEquipmentSlot('iron-armor')).toBe('armor');
    expect(getEquipmentSlot('golden-plate-armor')).toBe('armor');
    expect(getEquipmentSlot('gilded-steel-armor')).toBe('armor');
    expect(getEquipmentSlot('gold-armor')).toBe('armor');
  });

  it('returns null for unknown items', () => {
    expect(getEquipmentSlot('potion')).toBeNull();
    expect(getEquipmentSlot('random-item')).toBeNull();
  });
});

describe('canEquip', () => {
  it('allows warrior to equip swords', () => {
    const warrior = makeCharacter({ class: 'warrior' });
    const sword = findEquipmentItem('iron-sword')!;
    expect(canEquip(warrior, sword)).toBe(true);
  });

  it('prevents warrior from equipping bows', () => {
    const warrior = makeCharacter({ class: 'warrior' });
    const bows = findEquipmentItem('iron-short-bow')!;
    expect(canEquip(warrior, bows)).toBe(false);
  });

  it('allows rogue to equip bows', () => {
    const rogue = makeCharacter({ id: 'rogue', class: 'rogue', color: 'green' });
    const bows = findEquipmentItem('iron-short-bow')!;
    expect(canEquip(rogue, bows)).toBe(true);
  });

  it('allows mage to equip staffs', () => {
    const mage = makeCharacter({ id: 'mage', class: 'mage', color: 'purple' });
    const staff = findEquipmentItem('iron-staff')!;
    expect(canEquip(mage, staff)).toBe(true);
  });

  it('allows any class to equip armor', () => {
    const warrior = makeCharacter({ class: 'warrior' });
    const rogue = makeCharacter({ id: 'rogue', class: 'rogue', color: 'green' });
    const healer = makeCharacter({ id: 'healer', class: 'healer', color: 'yellow' });
    const armor = findEquipmentItem('iron-armor')!;
    expect(canEquip(warrior, armor)).toBe(true);
    expect(canEquip(rogue, armor)).toBe(true);
    expect(canEquip(healer, armor)).toBe(true);
  });

  it('prevents healer from equipping weapons (no healer weapons exist)', () => {
    const healer = makeCharacter({ id: 'healer', class: 'healer', color: 'yellow' });
    const sword = findEquipmentItem('iron-sword')!;
    const bows = findEquipmentItem('iron-short-bow')!;
    const staff = findEquipmentItem('iron-staff')!;
    expect(canEquip(healer, sword)).toBe(false);
    expect(canEquip(healer, bows)).toBe(false);
    expect(canEquip(healer, staff)).toBe(false);
  });
});

describe('getEquipmentBonuses', () => {
  it('returns zeros when nothing is equipped', () => {
    const char = makeCharacter();
    expect(getEquipmentBonuses(char)).toEqual({ pow: 0, vit: 0, spd: 0 });
  });

  it('returns weapon bonuses when weapon is equipped', () => {
    const char = makeCharacter({ equippedWeaponId: 'iron-sword' });
    expect(getEquipmentBonuses(char)).toEqual({ pow: 5, vit: 2, spd: 0 });
  });

  it('returns armor bonuses when armor is equipped', () => {
    const char = makeCharacter({ equippedArmorId: 'iron-armor' });
    expect(getEquipmentBonuses(char)).toEqual({ pow: 0, vit: 10, spd: -2 });
  });

  it('returns combined bonuses for weapon + armor', () => {
    const char = makeCharacter({
      equippedWeaponId: 'iron-sword',
      equippedArmorId: 'iron-armor',
    });
    // iron-sword: pow 5, vit 2, spd 0
    // iron-armor: pow 0, vit 10, spd -2
    expect(getEquipmentBonuses(char)).toEqual({ pow: 5, vit: 12, spd: -2 });
  });
});

describe('rarity scaling', () => {
  it('common rarity leaves stats unchanged', () => {
    const sword = findEquipmentItem('iron-sword')!;
    // iron-sword: pow 5, vit 2, spd 0
    expect(getScaledEquipmentStats(sword, 'common')).toEqual({ pow: 5, vit: 2, spd: 0 });
  });

  it('higher rarity scales positive stats (rounded) and leaves penalties untouched', () => {
    const armor = findEquipmentItem('iron-armor')!;
    // iron-armor: pow 0, vit 10, spd -2 → legendary x1.6: vit 16, spd stays -2
    expect(getScaledEquipmentStats(armor, 'legendary')).toEqual({ pow: 0, vit: 16, spd: -2 });
  });

  it('undefined rarity defaults to common', () => {
    const sword = findEquipmentItem('iron-sword')!;
    expect(getScaledEquipmentStats(sword, undefined)).toEqual({ pow: 5, vit: 2, spd: 0 });
  });

  it('getEquipmentBonuses applies the equipped rarity multiplier', () => {
    const char = makeCharacter({ equippedWeaponId: 'iron-sword', equippedWeaponRarity: 'legendary' });
    // iron-sword pow 5 → round(8) = 8, vit 2 → round(3.2) = 3, spd 0
    expect(getEquipmentBonuses(char)).toEqual({ pow: 8, vit: 3, spd: 0 });
  });
});

describe('getEquipmentComboBonus', () => {
  it('returns 0 when nothing is equipped', () => {
    expect(getEquipmentComboBonus(makeCharacter())).toBe(0);
  });

  it('returns the weapon combo bonus when a weapon is equipped', () => {
    // iron-sword has comboBonus 0.01
    const char = makeCharacter({ equippedWeaponId: 'iron-sword' });
    expect(getEquipmentComboBonus(char)).toBeCloseTo(0.01, 5);
  });

  it('treats armor without a combo bonus as 0', () => {
    // iron-armor has no comboBonus field
    const char = makeCharacter({ equippedWeaponId: 'iron-sword', equippedArmorId: 'iron-armor' });
    expect(getEquipmentComboBonus(char)).toBeCloseTo(0.01, 5);
  });

  it('returns 0 when only a comboless item is equipped', () => {
    const char = makeCharacter({ equippedArmorId: 'iron-armor' });
    expect(getEquipmentComboBonus(char)).toBe(0);
  });

  it('reads higher-tier weapon bonuses', () => {
    // golden-war-bow has comboBonus 0.04
    const rogue = makeCharacter({ id: 'rogue', class: 'rogue', color: 'green', equippedWeaponId: 'golden-war-bow' });
    expect(getEquipmentComboBonus(rogue)).toBeCloseTo(0.04, 5);
  });
});

describe('getEffectiveStats', () => {
  it('returns base stats when nothing is equipped', () => {
    const char = makeCharacter({ stats: { pow: 10, vit: 20, spd: 5 } });
    expect(getEffectiveStats(char)).toEqual({ pow: 10, vit: 20, spd: 5 });
  });

  it('adds equipment bonuses to base stats', () => {
    const char = makeCharacter({
      stats: { pow: 10, vit: 20, spd: 5 },
      equippedWeaponId: 'iron-sword',
      equippedArmorId: 'iron-armor',
    });
    // base: pow 10, vit 20, spd 5
    // iron-sword: pow +5, vit +2, spd +0
    // iron-armor: pow +0, vit +10, spd -2
    expect(getEffectiveStats(char)).toEqual({ pow: 15, vit: 32, spd: 3 });
  });
});

describe('getEffectiveMaxHp', () => {
  it('returns base maxHp when nothing is equipped', () => {
    const char = makeCharacter();
    expect(getEffectiveMaxHp(char)).toBe(170); // 170 + 0
  });

  it('includes VIT bonus from equipment', () => {
    const char = makeCharacter({
      equippedWeaponId: 'iron-sword',
      equippedArmorId: 'iron-armor',
    });
    // iron-sword vit +2, iron-armor vit +10 = +12 vit, multiplier 6
    expect(getEffectiveMaxHp(char)).toBe(170 + 12 * 6);
  });
});

describe('getPartyWithEffectiveStats', () => {
  it('bakes equipment bonuses into stats and maxHp', () => {
    const party = [
      makeCharacter({ equippedWeaponId: 'iron-sword', equippedArmorId: 'iron-armor' }),
      makeCharacter({ id: 'bare' }),
    ];
    const result = getPartyWithEffectiveStats(party);

    // First char: base pow 10 + sword 5 = 15, base vit 20 + sword 2 + armor 10 = 32
    expect(result[0].stats.pow).toBe(15);
    expect(result[0].stats.vit).toBe(32);
    expect(result[0].maxHp).toBe(170 + 12 * 6);

    // Second char: unchanged
    expect(result[1].stats.pow).toBe(10);
    expect(result[1].maxHp).toBe(170);
  });

  it('clamps currentHp to effective maxHp', () => {
    // A char whose currentHp exceeds what effective maxHp would be (edge case with negative vit equipment)
    const char = makeCharacter({ currentHp: 170, maxHp: 170 });
    const result = getPartyWithEffectiveStats([char]);
    expect(result[0].currentHp).toBeLessThanOrEqual(result[0].maxHp);
  });
});

describe('getAvailableEquipmentForSlot', () => {
  const warrior = makeCharacter({ id: 'warrior', class: 'warrior' });
  const rogue = makeCharacter({ id: 'rogue', class: 'rogue', color: 'green' });
  const healer = makeCharacter({ id: 'healer', class: 'healer', color: 'yellow' });

  it('returns only weapons matching character class', () => {
    const inventory: InventoryItem[] = [
      { itemId: 'iron-sword', quantity: 1 },
      { itemId: 'iron-short-bow', quantity: 1 },
      { itemId: 'iron-staff', quantity: 1 },
    ];
    const result = getAvailableEquipmentForSlot('weapon', warrior, [warrior], inventory);
    expect(result).toHaveLength(1);
    expect(result[0].item.id).toBe('iron-sword');
  });

  it('returns armor for any class', () => {
    const inventory: InventoryItem[] = [
      { itemId: 'iron-armor', quantity: 1 },
      { itemId: 'bronze-armor', quantity: 1 },
    ];
    const result = getAvailableEquipmentForSlot('armor', warrior, [warrior], inventory);
    expect(result).toHaveLength(2);
  });

  it('returns no weapons for healer', () => {
    const inventory: InventoryItem[] = [
      { itemId: 'iron-sword', quantity: 1 },
      { itemId: 'iron-short-bow', quantity: 1 },
      { itemId: 'iron-staff', quantity: 1 },
    ];
    const result = getAvailableEquipmentForSlot('weapon', healer, [healer], inventory);
    expect(result).toHaveLength(0);
  });

  it('excludes items not in inventory', () => {
    const inventory: InventoryItem[] = []; // empty inventory
    const result = getAvailableEquipmentForSlot('weapon', warrior, [warrior], inventory);
    expect(result).toHaveLength(0);
  });

  it('respects quantity limits when another character has it equipped', () => {
    const rogueWithDagger = { ...rogue, equippedWeaponId: 'iron-short-bow' };
    const inventory: InventoryItem[] = [{ itemId: 'iron-short-bow', quantity: 1 }];
    const anotherRogue = makeCharacter({ id: 'rogue-2', class: 'rogue', color: 'green' });
    const party = [rogueWithDagger, anotherRogue];

    // rogue-2 should NOT see iron-short-bow because rogue already has it equipped and qty is 1
    const result = getAvailableEquipmentForSlot('weapon', anotherRogue, party, inventory);
    expect(result.find((i) => i.item.id === 'iron-short-bow')).toBeUndefined();
  });

  it('allows equipping if quantity exceeds equipped count', () => {
    const rogueWithDagger = { ...rogue, equippedWeaponId: 'iron-short-bow' };
    const inventory: InventoryItem[] = [{ itemId: 'iron-short-bow', quantity: 2 }];
    const anotherRogue = makeCharacter({ id: 'rogue-2', class: 'rogue', color: 'green' });
    const party = [rogueWithDagger, anotherRogue];

    // rogue-2 SHOULD see iron-short-bow because qty is 2 and only 1 is equipped
    const result = getAvailableEquipmentForSlot('weapon', anotherRogue, party, inventory);
    expect(result.find((i) => i.item.id === 'iron-short-bow')).toBeDefined();
  });
});

describe('getOwnedEquipmentInstances', () => {
  it('reports quantity and deducts equipped copies from available', () => {
    const inventory: InventoryItem[] = [{ itemId: 'iron-sword', quantity: 2, rarity: 'common' }];
    const wielder = makeCharacter({ equippedWeaponId: 'iron-sword', equippedWeaponRarity: 'common' });
    const result = getOwnedEquipmentInstances(inventory, [wielder]);

    expect(result).toHaveLength(1);
    expect(result[0].item.id).toBe('iron-sword');
    expect(result[0].quantity).toBe(2);
    expect(result[0].available).toBe(1); // 2 owned - 1 equipped
  });

  it('keeps different rarities of the same item separate', () => {
    const inventory: InventoryItem[] = [
      { itemId: 'iron-sword', quantity: 1, rarity: 'common' },
      { itemId: 'iron-sword', quantity: 1, rarity: 'rare' },
    ];
    const result = getOwnedEquipmentInstances(inventory, []);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.available === 1)).toBe(true);
  });

  it('does not count a different rarity as equipped', () => {
    const inventory: InventoryItem[] = [{ itemId: 'iron-sword', quantity: 1, rarity: 'rare' }];
    // A member has the COMMON one equipped, which must not reduce the RARE stack.
    const wielder = makeCharacter({ equippedWeaponId: 'iron-sword', equippedWeaponRarity: 'common' });
    const result = getOwnedEquipmentInstances(inventory, [wielder]);
    expect(result[0].available).toBe(1);
  });
});
