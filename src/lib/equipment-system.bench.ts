import { bench, describe } from 'vitest';
import {
  getEquipmentSlot,
  findEquipmentItem,
  canEquip,
  getEquipmentBonuses,
  getEffectiveStats,
  getEffectiveMaxHp,
  getPartyWithEffectiveStats,
  getAvailableEquipmentForSlot,
} from './equipment-system';
import type { CharacterData } from '~/types/rpg-elements';
import type { InventoryItem } from '~/lib/inventory';

const makeChar = (overrides: Partial<CharacterData> = {}): CharacterData => ({
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
});

const warrior = makeChar({ equippedWeaponId: 'iron-sword', equippedArmorId: 'iron-armor' });
const rogue = makeChar({ id: 'rogue', class: 'rogue', color: 'green', equippedWeaponId: 'iron-daggers' });
const bareChar = makeChar();

const threeParty: CharacterData[] = [warrior, rogue, makeChar({ id: 'mage', class: 'mage', color: 'purple' })];

const inventory: InventoryItem[] = [
  { itemId: 'iron-sword', quantity: 2 },
  { itemId: 'iron-daggers', quantity: 1 },
  { itemId: 'iron-staff', quantity: 1 },
  { itemId: 'iron-armor', quantity: 2 },
  { itemId: 'bronze-armor', quantity: 1 },
];

describe('getEquipmentSlot', () => {
  bench('weapon (sword)', () => {
    getEquipmentSlot('iron-sword');
  });

  bench('armor', () => {
    getEquipmentSlot('iron-armor');
  });

  bench('null (unknown)', () => {
    getEquipmentSlot('potion');
  });
});

describe('findEquipmentItem', () => {
  bench('findEquipmentItem', () => {
    findEquipmentItem('iron-sword');
  });
});

describe('canEquip', () => {
  bench('matching class', () => {
    const sword = findEquipmentItem('iron-sword')!;
    canEquip(warrior, sword);
  });

  bench('armor (any class)', () => {
    const armor = findEquipmentItem('iron-armor')!;
    canEquip(rogue, armor);
  });
});

describe('getEquipmentBonuses', () => {
  bench('weapon + armor equipped', () => {
    getEquipmentBonuses(warrior);
  });

  bench('nothing equipped', () => {
    getEquipmentBonuses(bareChar);
  });
});

describe('getEffectiveStats', () => {
  bench('with equipment', () => {
    getEffectiveStats(warrior);
  });

  bench('without equipment', () => {
    getEffectiveStats(bareChar);
  });
});

describe('getEffectiveMaxHp', () => {
  bench('with equipment', () => {
    getEffectiveMaxHp(warrior);
  });
});

describe('getPartyWithEffectiveStats', () => {
  bench('3-member party', () => {
    getPartyWithEffectiveStats(threeParty);
  });
});

describe('getAvailableEquipmentForSlot', () => {
  bench('weapon slot (warrior)', () => {
    getAvailableEquipmentForSlot('weapon', warrior, threeParty, inventory);
  });

  bench('armor slot (warrior)', () => {
    getAvailableEquipmentForSlot('armor', warrior, threeParty, inventory);
  });
});
