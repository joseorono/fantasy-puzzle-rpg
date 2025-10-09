import { expect, test } from 'vitest';
import * as utils from './utils';

// shuffleArray Tests

test('shuffleArray: Return is same length', () => {
    let arr = [1, 2, 3, 4, 5];
    let result = utils.shuffleArray(arr);
    expect(result.length).toBe(arr.length);
});

test('shuffleArray: Return is a permutation', () => {
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a'];
    let result = utils.shuffleArray(arr);
    expect(result.sort()).toEqual(arr.sort());
});


// getRandomElement
test('getRandomElement: Returns an element from the array', () => {
    let arr = [1, 2, 3, 4, 5];
    let result = utils.getRandomElement(arr);
    expect(arr).toContain(result);
});
