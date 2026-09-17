import { expect, test, describe } from 'vitest';
import {
  canGoBack,
  goToBattleDemo,
  goToBattleRewards,
  goToDebug,
  goToDungeon,
  goToMap,
  goToTownHub,
  prepareGoBack,
  prepareGoBackTo,
  prepareNavigation,
  prepareSetViewData,
} from './routing';
import { ROUTER_HISTORY_LIMIT, DEFAULT_TOWN_HUB_DATA } from '~/constants/routing';
import type { HistoryEntry, RouterState, ViewDataMap, ViewType } from '~/types/routing';
import { createLootTable } from '~/types/loot';
import type { DungeonDefinition } from '~/types/dungeon';
import type { MapId } from '~/types/map';

function stateAt(
  currentView: ViewType,
  history: HistoryEntry[] = [],
  viewData: Partial<ViewDataMap> = {},
): RouterState {
  return { currentView, history, viewData };
}

/** Applies a navigation and asserts it succeeded, so a chain of steps reads as one flow. */
function step(result: ReturnType<typeof prepareNavigation>): RouterState {
  expect(result.success).toBe(true);
  return result.nextState!;
}

const views = (state: RouterState) => state.history.map((entry) => entry.view);

const rewardsData = { lootTable: createLootTable(), expReward: 100 };
const dungeonData = { dungeon: { id: 'test-dungeon' } as DungeonDefinition, isReplay: false };

describe('prepareNavigation', () => {
  test('stacks the launching view with its data, and goBack restores both', () => {
    const onMap = step(goToMap(stateAt('debug'), { mapId: 'map-00' }));
    const inTown = step(goToTownHub(onMap, DEFAULT_TOWN_HUB_DATA));

    expect(inTown.history).toEqual([
      { view: 'debug', data: undefined },
      { view: 'map', data: { mapId: 'map-00' } },
    ]);

    const backOnMap = step(prepareGoBack(inTown));
    expect(backOnMap.currentView).toBe('map');
    expect(backOnMap.viewData.map).toEqual({ mapId: 'map-00' });
    expect(views(backOnMap)).toEqual(['debug']);
  });

  test('keeps the last-known data of a view navigated to without data', () => {
    const onMap = step(goToMap(stateAt('debug'), { mapId: 'map-00' }));
    const again = step(prepareNavigation(onMap, 'map'));

    expect(again.viewData.map).toEqual({ mapId: 'map-00' });
  });

  test('a town round-trip (sparring) leaves the way out of town intact', () => {
    // debug → map → town → battle, then back three times: town, map, debug.
    const onMap = step(goToMap(stateAt('debug'), { mapId: 'map-00' }));
    const inTown = step(goToTownHub(onMap, DEFAULT_TOWN_HUB_DATA));
    const sparring = step(goToBattleDemo(inTown, { enemyId: 'training-dummy' }));

    const backInTown = step(prepareGoBack(sparring));
    expect(backInTown.currentView).toBe('town-hub');
    expect(views(backInTown)).toEqual(['debug', 'map']);

    const backOnMap = step(prepareGoBack(backInTown));
    expect(backOnMap.currentView).toBe('map');

    const backOnDebug = step(prepareGoBack(backOnMap));
    expect(backOnDebug.currentView).toBe('debug');
    expect(canGoBack(backOnDebug)).toBe(false);
  });

  test('a map can open another map and goBack lands on the first one', () => {
    const onFirst = step(goToMap(stateAt('debug'), { mapId: 'map-00' }));
    const onSecond = step(goToMap(onFirst, { mapId: 'map-01' }));
    expect(onSecond.viewData.map).toEqual({ mapId: 'map-01' });
    expect(views(onSecond)).toEqual(['debug', 'map']);

    const backOnFirst = step(prepareGoBack(onSecond));
    expect(backOnFirst.currentView).toBe('map');
    expect(backOnFirst.viewData.map).toEqual({ mapId: 'map-00' });

    expect(step(prepareGoBack(backOnFirst)).currentView).toBe('debug');
  });

  test('a dungeon floor loop returns to the run without growing the stack', () => {
    let state = step(goToDungeon(step(goToMap(stateAt('debug'), { mapId: 'map-00' })), dungeonData));

    for (let floor = 0; floor < 2; floor++) {
      const inBattle = step(goToBattleDemo(state, { enemyId: `floor-${floor}` }));
      const onRewards = step(goToBattleRewards(inBattle, rewardsData));
      state = step(prepareGoBack(onRewards));
      expect(state.currentView).toBe('dungeon');
      expect(views(state)).toEqual(['debug', 'map']);
    }

    expect(step(prepareGoBack(state)).currentView).toBe('map');
  });

  test('replace drops the current view and keeps the stack', () => {
    const onMap = step(goToMap(stateAt('debug'), { mapId: 'map-00' }));
    const replaced = step(goToTownHub(onMap, DEFAULT_TOWN_HUB_DATA, { history: 'replace' }));

    expect(views(replaced)).toEqual(['debug']);
    expect(step(prepareGoBack(replaced)).currentView).toBe('debug');
  });

  test('reset empties the stack, as a save load does', () => {
    const inDungeon = step(goToDungeon(step(goToMap(stateAt('debug'), { mapId: 'map-00' })), dungeonData));
    const loaded = step(goToMap(inDungeon, { mapId: 'map-01' }, { history: 'reset' }));

    expect(loaded.history).toEqual([]);
    expect(canGoBack(loaded)).toBe(false);
  });

  test('a DEBUG_MODE load reseeds one debug entry, leaving the map exitable', () => {
    // Mirrors loadSlot(): reset onto debug, then push the map on top of it.
    const inDungeon = step(goToDungeon(step(goToMap(stateAt('debug'), { mapId: 'map-00' })), dungeonData));
    const loaded = step(goToMap(step(goToDebug(inDungeon, {}, { history: 'reset' })), { mapId: 'map-01' }));

    expect(views(loaded)).toEqual(['debug']);
    expect(canGoBack(loaded)).toBe(true);
    // The pre-load dungeon must not be reachable, only the seeded debug entry.
    expect(step(prepareGoBack(loaded)).currentView).toBe('debug');
  });

  test('trims the oldest entries past the history limit', () => {
    // ROUTER_HISTORY_LIMIT + 1 pushes stack LIMIT + 1 entries; only the oldest (debug) falls off.
    let state = stateAt('debug');
    for (let i = 0; i <= ROUTER_HISTORY_LIMIT; i++) {
      state = step(goToMap(state, { mapId: `map-${i}` as MapId }));
    }

    expect(state.history).toHaveLength(ROUTER_HISTORY_LIMIT);
    expect(state.history[0]).toEqual({ view: 'map', data: { mapId: 'map-0' } });
  });
});

describe('goToBattleRewards', () => {
  test('replaces the battle it was launched from, returning to the pre-battle view', () => {
    const inBattle = step(goToBattleDemo(step(goToMap(stateAt('debug'), { mapId: 'map-00' })), { enemyId: 'slime' }));
    const onRewards = step(goToBattleRewards(inBattle, rewardsData));

    expect(views(onRewards)).toEqual(['debug', 'map']);
    expect(step(prepareGoBack(onRewards)).currentView).toBe('map');
  });

  test('returns to the launching view when not launched from a battle', () => {
    // The debug demo jumps straight to rewards.
    const onRewards = step(goToBattleRewards(stateAt('debug'), rewardsData));

    expect(views(onRewards)).toEqual(['debug']);
    expect(step(prepareGoBack(onRewards)).currentView).toBe('debug');
  });

  test('leaves no return target when a battle itself had none', () => {
    const onRewards = step(goToBattleRewards(stateAt('battle-demo'), rewardsData));

    expect(canGoBack(onRewards)).toBe(false);
    expect(prepareGoBack(onRewards).success).toBe(false);
  });
});

describe('prepareGoBackTo', () => {
  const deep = step(
    goToDungeon(step(goToMap(step(goToMap(stateAt('debug'), { mapId: 'map-00' })), { mapId: 'map-01' })), dungeonData),
  );

  test('unwinds to the nearest occurrence and restores its data', () => {
    const result = step(prepareGoBackTo(deep, 'map'));

    expect(result.currentView).toBe('map');
    expect(result.viewData.map).toEqual({ mapId: 'map-01' });
    expect(views(result)).toEqual(['debug', 'map']);
  });

  test('unwinds several levels at once', () => {
    const result = step(prepareGoBackTo(deep, 'debug'));

    expect(result.currentView).toBe('debug');
    expect(result.history).toEqual([]);
  });

  test('fails instead of jumping when the view is not in the history', () => {
    const result = prepareGoBackTo(deep, 'town-hub');

    expect(result.success).toBe(false);
    expect(result.nextState).toBeUndefined();
  });
});

describe('prepareSetViewData', () => {
  test('updates the current view without touching the stack', () => {
    const onMap = step(goToMap(stateAt('debug'), { mapId: 'map-00' }));
    const updated = prepareSetViewData(onMap, 'map', { mapId: 'map-01' });

    expect(updated.viewData.map).toEqual({ mapId: 'map-01' });
    expect(updated.history).toBe(onMap.history);
  });

  test('updates a stacked view so goBack shows the new data', () => {
    const inTown = step(goToTownHub(step(goToMap(stateAt('debug'), { mapId: 'map-00' })), DEFAULT_TOWN_HUB_DATA));
    const updated = prepareSetViewData(inTown, 'map', { mapId: 'map-01' });

    expect(step(prepareGoBack(updated)).viewData.map).toEqual({ mapId: 'map-01' });
  });
});

describe('prepareGoBack', () => {
  test('fails with nothing stacked', () => {
    const result = prepareGoBack(stateAt('debug'));

    expect(result.success).toBe(false);
    expect(canGoBack(stateAt('debug'))).toBe(false);
  });
});
