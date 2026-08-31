import { bench, describe } from 'vitest';
import { SAMPLE_DUNGEON } from '~/constants/dungeons';
import { randomizeDungeon } from './dungeon-randomizer';
import { getDungeonEstimatedResources } from './dungeon-system';
import { getPercentageOfResources } from './resources';

describe('randomizeDungeon', () => {
  bench('remix the sample dungeon', () => {
    randomizeDungeon(SAMPLE_DUNGEON);
  });
});

describe('getDungeonEstimatedResources', () => {
  bench('estimate the sample dungeon economy', () => {
    getDungeonEstimatedResources(SAMPLE_DUNGEON);
  });
});

const sampleResources = getDungeonEstimatedResources(SAMPLE_DUNGEON);

describe('getPercentageOfResources', () => {
  bench('scale by 25%', () => {
    getPercentageOfResources(sampleResources, 0.25);
  });
});
