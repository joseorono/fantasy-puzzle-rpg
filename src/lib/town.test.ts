import { describe, it, expect } from 'vitest';
import { getItemFromId, getItemsFromIds } from './town';
import { ConsumableItemIds, ConsumableItems } from '~/constants/inventory';

describe('getItemFromId', () => {
  it('returns the consumable whose id matches', () => {
    const item = getItemFromId('potion');
    expect(item?.id).toBe('potion');
    expect(item?.name).toBe('Potion');
  });

  it('returns undefined for an id no consumable owns', () => {
    expect(getItemFromId('elixir-of-nothing')).toBeUndefined();
  });

  it('returns undefined for an empty id', () => {
    expect(getItemFromId('')).toBeUndefined();
  });

  it('returns the definition itself, not a copy', () => {
    expect(getItemFromId('high-potion')).toBe(ConsumableItems.find((item) => item.id === 'high-potion'));
  });

  it('resolves every id listed in ConsumableItemIds', () => {
    for (const id of ConsumableItemIds) {
      expect(getItemFromId(id), `no consumable defined for id "${id}"`).toBeDefined();
    }
  });

  it('is case-sensitive', () => {
    expect(getItemFromId('Potion')).toBeUndefined();
  });
});

describe('getItemsFromIds', () => {
  it('returns an empty array for no ids', () => {
    expect(getItemsFromIds([])).toEqual([]);
  });

  it('maps ids to items in the order given', () => {
    const items = getItemsFromIds(['row-clear', 'potion']);
    expect(items.map((item) => item.id)).toEqual(['row-clear', 'potion']);
  });

  it('drops ids that match no consumable', () => {
    const items = getItemsFromIds(['potion', 'nonexistent', 'high-potion']);
    expect(items.map((item) => item.id)).toEqual(['potion', 'high-potion']);
  });

  it('returns an empty array when no id matches', () => {
    expect(getItemsFromIds(['nope', 'still-nope'])).toEqual([]);
  });

  it('keeps duplicates rather than de-duplicating', () => {
    expect(getItemsFromIds(['potion', 'potion']).map((item) => item.id)).toEqual(['potion', 'potion']);
  });

  it('resolves the whole catalogue at once', () => {
    expect(getItemsFromIds([...ConsumableItemIds])).toHaveLength(ConsumableItems.length);
  });
});
