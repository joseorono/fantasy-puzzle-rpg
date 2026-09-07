import { expect, test, describe } from 'vitest';
import { goToMap, goToBattleRewards, prepareGoBack } from './routing';
import type { RouterState, ViewType } from '~/types/routing';
import { createLootTable } from '~/types/loot';

function stateAt(currentView: ViewType, previousView: ViewType | null = null): RouterState {
  return { currentView, previousView, viewData: {} };
}

const rewardsData = { lootTable: createLootTable(), expReward: 100 };

describe('goToMap', () => {
  test('records the launching view so the map can be left after previousView is cleared', () => {
    const result = goToMap(stateAt('debug'), { mapId: 'map-00' });

    expect(result.nextState?.currentView).toBe('map');
    expect(result.nextState?.viewData.map?.returnView).toBe('debug');
  });

  test('the return view survives a battle round-trip that clears previousView', () => {
    // debug → map → battle → rewards → goBack lands back on the map with no history left,
    // which is exactly when the back button used to disappear.
    const onMap = goToMap(stateAt('debug'), { mapId: 'map-00' }).nextState!;
    const backOnMap = prepareGoBack({ ...onMap, currentView: 'battle-rewards', previousView: 'map' }).nextState!;

    expect(backOnMap.currentView).toBe('map');
    expect(backOnMap.previousView).toBeNull();
    expect(backOnMap.viewData.map?.returnView).toBe('debug');
  });

  test('does not record itself when a map launches a map', () => {
    const result = goToMap(stateAt('map'), { mapId: 'map-01' });

    expect(result.nextState?.viewData.map?.returnView).toBeUndefined();
  });

  test('an explicit return view wins over the launching view', () => {
    const result = goToMap(stateAt('debug'), { mapId: 'map-00', returnView: 'town-hub' });

    expect(result.nextState?.viewData.map?.returnView).toBe('town-hub');
  });
});

describe('goToBattleRewards', () => {
  test('skips the battle it was launched from, returning to the pre-battle view', () => {
    const result = goToBattleRewards(stateAt('battle-demo', 'map'), rewardsData);

    expect(result.nextState?.previousView).toBe('map');
  });

  test('returns to the launching view when not launched from a battle', () => {
    // The debug demo jumps straight to rewards; inheriting previousView would send it
    // somewhere the player never came from — or nowhere at all.
    const result = goToBattleRewards(stateAt('debug', 'dungeon'), rewardsData);

    expect(result.nextState?.previousView).toBe('debug');
  });

  test('leaves no return target when a battle itself had none', () => {
    const result = goToBattleRewards(stateAt('battle-demo', null), rewardsData);

    expect(result.nextState?.previousView).toBeNull();
  });
});
