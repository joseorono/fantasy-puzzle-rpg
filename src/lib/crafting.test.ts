import { describe, it, expect } from 'vitest';
import { getSalvageReturn, getUpgradeCost, getSellPrice } from './crafting';
import type { EquipmentItemData } from '~/types/inventory';
import type { Resources } from '~/types/resources';
import { UPGRADE_BASE_FEE } from '~/constants/blacksmith';

function makeEquip(cost: Partial<Resources>): EquipmentItemData {
  return {
    id: 'x',
    name: 'X',
    type: 'equipment',
    description: '',
    iconName: null,
    pow: 0,
    vit: 0,
    spd: 0,
    cost: { coins: 0, gold: 0, copper: 0, silver: 0, iron: 0, ...cost },
  };
}

describe('getSalvageReturn', () => {
  it('returns half (floored) of each material bar, never coins', () => {
    const result = getSalvageReturn(makeEquip({ coins: 100, copper: 3, iron: 2 }));
    expect(result).toEqual({ coins: 0, gold: 0, copper: 1, silver: 0, iron: 1 });
  });

  it('guarantees a minimum of 1 for any bar the recipe used', () => {
    const result = getSalvageReturn(makeEquip({ copper: 1 }));
    expect(result.copper).toBe(1); // floor(0.5) -> bumped to 1
  });

  it('returns nothing for a bar the recipe did not use', () => {
    const result = getSalvageReturn(makeEquip({ iron: 4 }));
    expect(result.copper).toBe(0);
    expect(result.iron).toBe(2);
  });
});

describe('getUpgradeCost', () => {
  it('rises with the source tier', () => {
    expect(getUpgradeCost('common').coins).toBe(UPGRADE_BASE_FEE);
    expect(getUpgradeCost('epic').coins).toBe(UPGRADE_BASE_FEE * 4);
  });

  it('is empty for a maxed (legendary) item', () => {
    expect(getUpgradeCost('legendary')).toEqual({ coins: 0, gold: 0, copper: 0, silver: 0, iron: 0 });
  });
});

describe('getSellPrice', () => {
  it('is half the coin cost, rounded down', () => {
    expect(getSellPrice(makeEquip({ coins: 50 }))).toBe(25);
    expect(getSellPrice(makeEquip({ coins: 51 }))).toBe(25);
  });

  it('guarantees a minimum of 1 coin', () => {
    expect(getSellPrice(makeEquip({ coins: 1 }))).toBe(1);
    expect(getSellPrice(makeEquip({ coins: 0 }))).toBe(1);
  });
});
