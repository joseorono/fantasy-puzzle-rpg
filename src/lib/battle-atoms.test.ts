import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'jotai';
import {
  battleStateAtom,
  deadOrbColorClassesAtom,
  itemCooldownMsAtom,
  partyAtom,
  setupBattleAtom,
  tickSkillCooldownsAtom,
} from '~/stores/battle-atoms';
import { INITIAL_PARTY, INITIAL_ENEMIES } from '~/constants/party';
import { BATTLE_TICK_DELTA_SECONDS } from '~/constants/battle';
import { calculateItemCooldownInMs } from './rpg-calculations';
import { getPartyPassiveModifiers } from './skill-system';

/**
 * These run the battle atoms through Jotai's vanilla store (no React), so they exercise the
 * store's own change detection: a `store.sub` listener fires only when the atom's value fails
 * `Object.is`, exactly as a `useAtomValue` subscriber would re-render.
 */
function createBattleStore(cooldowns?: number[]) {
  const store = createStore();
  store.set(setupBattleAtom, { party: INITIAL_PARTY, enemies: INITIAL_ENEMIES });
  if (cooldowns) setCooldowns(store, cooldowns);
  return store;
}

type BattleStore = ReturnType<typeof createBattleStore>;

function setCooldowns(store: BattleStore, cooldowns: number[]) {
  const state = store.get(battleStateAtom);
  store.set(battleStateAtom, {
    ...state,
    party: state.party.map((char, i) => ({ ...char, skillCooldown: cooldowns[i] ?? 0 })),
  });
}

function killMember(store: BattleStore, index: number) {
  const state = store.get(battleStateAtom);
  store.set(battleStateAtom, {
    ...state,
    party: state.party.map((char, i) => (i === index ? { ...char, currentHp: 0 } : char)),
  });
}

describe('tickSkillCooldownsAtom', () => {
  it('does not write when every living member is already at 0', () => {
    const store = createBattleStore([0, 0, 0, 0]);
    const partyBefore = store.get(partyAtom);
    const stateBefore = store.get(battleStateAtom);
    const listener = vi.fn();
    store.sub(partyAtom, listener);

    store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(listener).not.toHaveBeenCalled();
    expect(store.get(partyAtom)).toBe(partyBefore);
    expect(store.get(battleStateAtom)).toBe(stateBefore);
  });

  it('writes once and decrements only the running cooldown', () => {
    const store = createBattleStore([0, 12, 0, 0]);
    const partyBefore = store.get(partyAtom);
    const listener = vi.fn();
    store.sub(partyAtom, listener);

    store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);

    const party = store.get(partyAtom);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(party).not.toBe(partyBefore);
    expect(party[1].skillCooldown).toBeCloseTo(12 - BATTLE_TICK_DELTA_SECONDS, 10);
    expect(party[0]).toBe(partyBefore[0]);
    expect(party[2]).toBe(partyBefore[2]);
    expect(party[3]).toBe(partyBefore[3]);
  });

  it('ignores dead members with a leftover cooldown', () => {
    const store = createBattleStore([0, 0, 9, 0]);
    killMember(store, 2);
    const partyBefore = store.get(partyAtom);

    store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(store.get(partyAtom)).toBe(partyBefore);
  });

  it('does nothing once the battle is over', () => {
    const store = createBattleStore([5, 5, 5, 5]);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), gameStatus: 'won' });
    const partyBefore = store.get(partyAtom);

    store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(store.get(partyAtom)).toBe(partyBefore);
  });
});

describe('deadOrbColorClassesAtom', () => {
  it('is empty for a living party and names each dead hero color', () => {
    const store = createBattleStore();
    expect(store.get(deadOrbColorClassesAtom)).toBe('');

    killMember(store, 0);
    expect(store.get(deadOrbColorClassesAtom)).toBe(`dead-${INITIAL_PARTY[0].color}`);

    killMember(store, 2);
    expect(store.get(deadOrbColorClassesAtom)).toBe(`dead-${INITIAL_PARTY[0].color} dead-${INITIAL_PARTY[2].color}`);
  });

  it('does not notify subscribers when a cooldown tick replaces the party', () => {
    const store = createBattleStore([30, 0, 0, 0]);
    const partyListener = vi.fn();
    const classesListener = vi.fn();
    store.sub(partyAtom, partyListener);
    store.sub(deadOrbColorClassesAtom, classesListener);

    store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(partyListener).toHaveBeenCalledTimes(1);
    expect(classesListener).not.toHaveBeenCalled();
  });
});

describe('itemCooldownMsAtom', () => {
  it('matches the direct calculation from the current party', () => {
    const store = createBattleStore();
    const party = store.get(partyAtom);
    expect(store.get(itemCooldownMsAtom)).toBe(
      calculateItemCooldownInMs(party, getPartyPassiveModifiers(party).itemCooldownSpdBonus),
    );
  });

  it('does not notify subscribers when a cooldown tick replaces the party', () => {
    const store = createBattleStore([30, 20, 0, 0]);
    const listener = vi.fn();
    store.sub(itemCooldownMsAtom, listener);

    store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(listener).not.toHaveBeenCalled();
  });
});
