import { bench, describe } from 'vitest';
import { createResources, canAfford, deductCost, addResources, validateGoldAmount, howManyCanAfford } from './resources';
import type { Resources } from '~/types/resources';

const fullResources: Resources = {
  coins: 100,
  gold: 100,
  copper: 100,
  silver: 100,
  bronze: 100,
};

const cost: Resources = createResources({ gold: 50, coins: 30 });
const zeroCost: Resources = createResources();

describe('createResources', () => {
  bench('with defaults', () => {
    createResources();
  });

  bench('with overrides', () => {
    createResources({ gold: 50, coins: 30 });
  });
});

describe('canAfford', () => {
  bench('affordable', () => {
    canAfford(fullResources, cost);
  });

  bench('not affordable', () => {
    canAfford(fullResources, createResources({ gold: 150 }));
  });
});

describe('deductCost', () => {
  bench('deductCost', () => {
    deductCost(fullResources, cost);
  });
});

describe('addResources', () => {
  bench('addResources', () => {
    addResources(fullResources, cost);
  });
});

describe('validateGoldAmount', () => {
  bench('positive', () => {
    validateGoldAmount(100);
  });

  bench('negative (clamped)', () => {
    validateGoldAmount(-50);
  });
});

describe('howManyCanAfford', () => {
  bench('with limiting resource', () => {
    howManyCanAfford(fullResources, cost);
  });

  bench('zero cost (max cap)', () => {
    howManyCanAfford(fullResources, zeroCost);
  });
});
