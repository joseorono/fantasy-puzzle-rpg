import { describe, it, expect } from 'vitest';
import {
  getEquipmentSlot,
  canEquip,
  getEquipmentBonuses,
  getEffectiveStats,
  getAvailableEquipmentForSlot,
  findEquipmentItem,
} from './equipment-system';
import type { CharacterData } from '~/types/rpg-elements';
import type { EquipmentItemData } from '~/types/inventory';
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
    expToNextLevel: 100,
    vitHpMultiplier: 6,
    maxHp: 170,
    currentHp: 170,
    skillCooldown: 0,
    maxCooldown: 30,
    ...overrides,
  };
}

describe('getEquipmentSlot', () => {
  it('returns weapon for sword items', () => {
    expect(getEquipmentSlot('iron-sword')).toBe('weapon');
    expect(getEquipmentSlot('golden-broadsword')).toBe('weapon');
  });

  it('returns weapon for dagger/dirk items', () => {
    expect(getEquipmentSlot('iron-daggers')).toBe('weapon');
    expect(getEquipmentSlot('golden-dirks')).toBe('weapon');
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

  it('prevents warrior from equipping daggers', () => {
    const warrior = makeCharacter({ class: 'warrior' });
    const daggers = findEquipmentItem('iron-daggers')!;
    expect(canEquip(warrior, daggers)).toBe(false);
  });

  it('allows rogue to equip daggers', () => {
    const rogue = makeCharacter({ id: 'rogue', class: 'rogue', color: 'green' });
    const daggers = findEquipmentItem('iron-daggers')!;
    expect(canEquip(rogue, daggers)).toBe(true);
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
    const daggers = findEquipmentItem('iron-daggers')!;
    const staff = findEquipmentItem('iron-staff')!;
    expect(canEquip(healer, sword)).toBe(false);
    expect(canEquip(healer, daggers)).toBe(false);
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

describe('getAvailableEquipmentForSlot', () => {
  const warrior = makeCharacter({ id: 'warrior', class: 'warrior' });
  const rogue = makeCharacter({ id: 'rogue', class: 'rogue', color: 'green' });
  const healer = makeCharacter({ id: 'healer', class: 'healer', color: 'yellow' });

  it('returns only weapons matching character class', () => {
    const inventory: InventoryItem[] = [
      { itemId: 'iron-sword', quantity: 1 },
      { itemId: 'iron-daggers', quantity: 1 },
      { itemId: 'iron-staff', quantity: 1 },
    ];
    const result = getAvailableEquipmentForSlot('weapon', warrior, [warrior], inventory);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('iron-sword');
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
      { itemId: 'iron-daggers', quantity: 1 },
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
    const rogueWithDagger = { ...rogue, equippedWeaponId: 'iron-daggers' };
    const inventory: InventoryItem[] = [{ itemId: 'iron-daggers', quantity: 1 }];
    const anotherRogue = makeCharacter({ id: 'rogue-2', class: 'rogue', color: 'green' });
    const party = [rogueWithDagger, anotherRogue];

    // rogue-2 should NOT see iron-daggers because rogue already has it equipped and qty is 1
    const result = getAvailableEquipmentForSlot('weapon', anotherRogue, party, inventory);
    expect(result.find((i) => i.id === 'iron-daggers')).toBeUndefined();
  });

  it('allows equipping if quantity exceeds equipped count', () => {
    const rogueWithDagger = { ...rogue, equippedWeaponId: 'iron-daggers' };
    const inventory: InventoryItem[] = [{ itemId: 'iron-daggers', quantity: 2 }];
    const anotherRogue = makeCharacter({ id: 'rogue-2', class: 'rogue', color: 'green' });
    const party = [rogueWithDagger, anotherRogue];

    // rogue-2 SHOULD see iron-daggers because qty is 2 and only 1 is equipped
    const result = getAvailableEquipmentForSlot('weapon', anotherRogue, party, inventory);
    expect(result.find((i) => i.id === 'iron-daggers')).toBeDefined();
  });
});
