import { describe, it, expect } from 'vitest';
import type { Resources } from '~/types/resources';
import {
  canAfford,
  deductCost,
  addResources,
  validateGoldAmount,
  howManyCanAfford,
  createResources,
} from './resources';

const fullResources: Resources = {
  coins: 100,
  gold: 100,
  copper: 100,
  silver: 100,
  bronze: 100,
};

describe('resource utilities', () => {
  describe('canAfford', () => {
    it('should return true when resources meet cost', () => {
      expect(canAfford(fullResources, createResources({ gold: 50 }))).toBe(true);
    });

    it('should return true when resources equal cost', () => {
      expect(canAfford(fullResources, createResources({ gold: 100 }))).toBe(true);
    });

    it('should return false when resources are insufficient', () => {
      expect(canAfford(fullResources, createResources({ gold: 150 }))).toBe(false);
    });

    it('should handle multiple resource types', () => {
      expect(canAfford(fullResources, createResources({ gold: 50, coins: 30 }))).toBe(true);
      expect(canAfford(fullResources, createResources({ gold: 50, coins: 150 }))).toBe(false);
    });

    it('should handle zero cost', () => {
      expect(canAfford(fullResources, createResources({ gold: 0 }))).toBe(true);
    });

    it('should handle empty cost', () => {
      expect(canAfford(fullResources, createResources())).toBe(true);
    });
  });

  describe('deductCost', () => {
    it('should deduct cost from resources', () => {
      const result = deductCost(fullResources, createResources({ gold: 30 }));
      expect(result.gold).toBe(70);
      expect(result.coins).toBe(100);
    });

    it('should not go below zero', () => {
      const result = deductCost(fullResources, createResources({ gold: 150 }));
      expect(result.gold).toBe(0);
    });

    it('should handle multiple resource deductions', () => {
      const result = deductCost(fullResources, createResources({ gold: 30, coins: 20, copper: 10 }));
      expect(result.gold).toBe(70);
      expect(result.coins).toBe(80);
      expect(result.copper).toBe(90);
      expect(result.silver).toBe(100);
      expect(result.bronze).toBe(100);
    });

    it('should preserve unspecified resources', () => {
      const result = deductCost(fullResources, createResources({ gold: 50 }));
      expect(result.coins).toBe(100);
      expect(result.copper).toBe(100);
      expect(result.silver).toBe(100);
      expect(result.bronze).toBe(100);
    });
  });

  describe('addResources', () => {
    it('should add resources together', () => {
      const result = addResources(fullResources, createResources({ gold: 50 }));
      expect(result.gold).toBe(150);
      expect(result.coins).toBe(100);
    });

    it('should handle multiple resource additions', () => {
      const result = addResources(fullResources, createResources({ gold: 50, coins: 25, copper: 10 }));
      expect(result.gold).toBe(150);
      expect(result.coins).toBe(125);
      expect(result.copper).toBe(110);
      expect(result.silver).toBe(100);
      expect(result.bronze).toBe(100);
    });

    it('should handle adding zero', () => {
      const result = addResources(fullResources, createResources({ gold: 0 }));
      expect(result.gold).toBe(100);
    });

    it('should preserve unspecified resources', () => {
      const result = addResources(fullResources, createResources({ gold: 50 }));
      expect(result.coins).toBe(100);
      expect(result.copper).toBe(100);
      expect(result.silver).toBe(100);
      expect(result.bronze).toBe(100);
    });
  });

  describe('validateGoldAmount', () => {
    it('should return positive amounts unchanged', () => {
      expect(validateGoldAmount(100)).toBe(100);
    });

    it('should floor decimal amounts', () => {
      expect(validateGoldAmount(100.7)).toBe(100);
    });

    it('should convert negative amounts to zero', () => {
      expect(validateGoldAmount(-50)).toBe(0);
    });

    it('should handle zero', () => {
      expect(validateGoldAmount(0)).toBe(0);
    });
  });

  describe('howManyCanAfford', () => {
    it('should return how many times a cost can be afforded', () => {
      expect(howManyCanAfford(fullResources, createResources({ gold: 50 }))).toBe(2);
    });

    it('should return 0 when cost cannot be afforded', () => {
      expect(howManyCanAfford(fullResources, createResources({ gold: 200 }))).toBe(0);
    });

    it('should return 0 for zero or undefined cost', () => {
      expect(howManyCanAfford(fullResources, createResources({ gold: 0 }))).toBe(0);
      expect(howManyCanAfford(fullResources, createResources())).toBe(0);
    });

    it('should return count based on limiting resource', () => {
      expect(howManyCanAfford(fullResources, createResources({ gold: 30, coins: 50 }))).toBe(2);
      expect(howManyCanAfford(fullResources, createResources({ gold: 30, coins: 60 }))).toBe(1);
    });

    it('should cap at MAX_AMOUNT_PER_ITEM', () => {
      const resources: Resources = { coins: 10000, gold: 10000, copper: 10000, silver: 10000, bronze: 10000 };
      expect(howManyCanAfford(resources, createResources({ gold: 1 }))).toBe(99);
    });

    it('should floor the result', () => {
      const resources: Resources = { coins: 100, gold: 100, copper: 100, silver: 100, bronze: 100 };
      expect(howManyCanAfford(resources, createResources({ gold: 30 }))).toBe(3);
    });

    it('should early return 0 when any resource is insufficient', () => {
      expect(howManyCanAfford(fullResources, createResources({ gold: 50, coins: 150 }))).toBe(0);
    });
  });
});
