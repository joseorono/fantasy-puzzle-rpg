import { bench, describe } from 'vitest';
import {
  randIntInRange,
  randFloatInRange,
  getRandomlyVariedValue,
  generateRange,
  betweenZeroAndOne,
  subtractionWithMin,
  additionWithMax,
  multiplyDimensions,
  calculatePercentage,
} from './math';

describe('randIntInRange', () => {
  bench('randIntInRange(1, 100)', () => {
    randIntInRange(1, 100);
  });
});

describe('randFloatInRange', () => {
  bench('randFloatInRange(0, 1)', () => {
    randFloatInRange(0, 1);
  });
});

describe('getRandomlyVariedValue', () => {
  bench('no variance', () => {
    getRandomlyVariedValue(100);
  });

  bench('with variance', () => {
    getRandomlyVariedValue(100, 20);
  });
});

describe('generateRange', () => {
  bench('small range (1–10)', () => {
    generateRange(1, 10);
  });

  bench('medium range (1–100)', () => {
    generateRange(1, 100);
  });

  bench('large range (1–1000)', () => {
    generateRange(1, 1000);
  });
});

describe('betweenZeroAndOne', () => {
  bench('value in range', () => {
    betweenZeroAndOne(0.5);
  });

  bench('value out of range (clamped)', () => {
    betweenZeroAndOne(5);
  });
});

describe('subtractionWithMin', () => {
  bench('subtractionWithMin(10, 5)', () => {
    subtractionWithMin(10, 5);
  });

  bench('subtractionWithMin clamped', () => {
    subtractionWithMin(5, 10);
  });
});

describe('additionWithMax', () => {
  bench('additionWithMax(5, 3, 10)', () => {
    additionWithMax(5, 3, 10);
  });

  bench('additionWithMax clamped', () => {
    additionWithMax(5, 10, 12);
  });
});

describe('multiplyDimensions', () => {
  bench('integer factor', () => {
    multiplyDimensions(10, 10, 2);
  });

  bench('decimal factor', () => {
    multiplyDimensions(10, 15, 1.5);
  });
});

describe('calculatePercentage', () => {
  bench('normal', () => {
    calculatePercentage(50, 100);
  });

  bench('zero total (safe division)', () => {
    calculatePercentage(50, 0);
  });
});
