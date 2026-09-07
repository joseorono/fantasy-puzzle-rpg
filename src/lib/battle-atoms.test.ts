import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'jotai';
import {
  addGuardAtom,
  addScoreAtom,
  applyMatchResolutionAtom,
  battleStateAtom,
  battleTickAtom,
  deadOrbColorClassesAtom,
  itemCooldownMsAtom,
  partyAtom,
  partyMemberAtom,
  partyMemberIdsAtom,
  recordMaxComboAtom,
  reduceSkillCooldownAtom,
  setupBattleAtom,
  tickGuardDecayAtom,
  tickSkillCooldownsAtom,
  type MatchResolution,
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

/** The five writes the board used to issue per match, in their original order. */
function applyLegacyMatchSequence(store: BattleStore, resolution: MatchResolution) {
  store.set(addScoreAtom, resolution.scoreDelta);
  if (resolution.primaryMatchedType) {
    store.set(battleStateAtom, { ...store.get(battleStateAtom), lastMatchedType: resolution.primaryMatchedType });
  }
  for (const { characterId, amount } of resolution.cooldownReductions) {
    store.set(reduceSkillCooldownAtom, characterId, amount);
  }
  if (resolution.guardGain > 0) store.set(addGuardAtom, resolution.guardGain);
  store.set(recordMaxComboAtom, resolution.combo);
}

/** Runs the legacy sequence and the composite from the same snapshot; returns both end states. */
function compareMatchPaths(store: BattleStore, resolution: MatchResolution) {
  const snapshot = store.get(battleStateAtom);
  applyLegacyMatchSequence(store, resolution);
  const legacy = store.get(battleStateAtom);
  store.set(battleStateAtom, snapshot);
  store.set(applyMatchResolutionAtom, resolution);
  const composite = store.get(battleStateAtom);
  return { legacy, composite };
}

const id = (i: number) => INITIAL_PARTY[i].id;

describe('applyMatchResolutionAtom', () => {
  const twoColours: MatchResolution = {
    scoreDelta: 15,
    primaryMatchedType: INITIAL_PARTY[0].color,
    cooldownReductions: [
      { characterId: id(0), amount: 0.9 },
      { characterId: id(1), amount: 0.9 },
    ],
    guardGain: 0,
    combo: 1,
  };
  const threeColoursAndGrey: MatchResolution = {
    scoreDelta: 20,
    primaryMatchedType: INITIAL_PARTY[2].color,
    cooldownReductions: [
      { characterId: id(0), amount: 1.2 },
      { characterId: id(1), amount: 1.2 },
      { characterId: id(2), amount: 1.2 },
    ],
    guardGain: 18,
    combo: 3,
  };

  it('matches the legacy five-write sequence for a two-colour match', () => {
    const { legacy, composite } = compareMatchPaths(createBattleStore([30, 20, 0, 5]), twoColours);
    expect(composite).toEqual(legacy);
  });

  it('matches the legacy sequence for three colours plus grey', () => {
    const { legacy, composite } = compareMatchPaths(createBattleStore([30, 20, 10, 5]), threeColoursAndGrey);
    expect(composite).toEqual(legacy);
    expect(composite.guard).toBe(18);
    expect(composite.maxCombo).toBe(3);
  });

  it('skips dead and already-ready heroes exactly like the legacy path', () => {
    const store = createBattleStore([30, 20, 0, 5]);
    killMember(store, 1);
    const { legacy, composite } = compareMatchPaths(store, threeColoursAndGrey);
    expect(composite).toEqual(legacy);
    expect(composite.party[1].skillCooldown).toBe(20);
    expect(composite.party[2].skillCooldown).toBe(0);
  });

  it('keeps a higher existing max combo and the previous matched type', () => {
    const store = createBattleStore([30, 20, 0, 5]);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), maxCombo: 7, lastMatchedType: 'gray' });
    const { legacy, composite } = compareMatchPaths(store, { ...twoColours, primaryMatchedType: null });
    expect(composite).toEqual(legacy);
    expect(composite.maxCombo).toBe(7);
    expect(composite.lastMatchedType).toBe('gray');
  });

  it('still records score and combo once the battle is over, but touches no cooldowns or guard', () => {
    const store = createBattleStore([30, 20, 10, 5]);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), gameStatus: 'won' });
    const { legacy, composite } = compareMatchPaths(store, threeColoursAndGrey);
    expect(composite).toEqual(legacy);
    expect(composite.guard).toBe(0);
    expect(composite.party.map((c) => c.skillCooldown)).toEqual([30, 20, 10, 5]);
    expect(composite.score).toBe(legacy.score);
  });

  it('notifies once where the legacy sequence notified per write', () => {
    const legacyStore = createBattleStore([30, 20, 10, 5]);
    const legacyState = vi.fn();
    const legacyParty = vi.fn();
    legacyStore.sub(battleStateAtom, legacyState);
    legacyStore.sub(partyAtom, legacyParty);
    applyLegacyMatchSequence(legacyStore, threeColoursAndGrey);

    const store = createBattleStore([30, 20, 10, 5]);
    const stateListener = vi.fn();
    const partyListener = vi.fn();
    store.sub(battleStateAtom, stateListener);
    store.sub(partyAtom, partyListener);
    store.set(applyMatchResolutionAtom, threeColoursAndGrey);

    expect(legacyState).toHaveBeenCalledTimes(7);
    expect(legacyParty).toHaveBeenCalledTimes(3);
    expect(stateListener).toHaveBeenCalledTimes(1);
    expect(partyListener).toHaveBeenCalledTimes(1);
  });
});

function compareTickPaths(store: BattleStore) {
  const snapshot = store.get(battleStateAtom);
  store.set(tickSkillCooldownsAtom, BATTLE_TICK_DELTA_SECONDS);
  store.set(tickGuardDecayAtom, BATTLE_TICK_DELTA_SECONDS);
  const legacy = store.get(battleStateAtom);
  store.set(battleStateAtom, snapshot);
  store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);
  const merged = store.get(battleStateAtom);
  return { snapshot, legacy, merged };
}

describe('battleTickAtom', () => {
  it('writes nothing when no cooldown runs and guard is empty', () => {
    const store = createBattleStore([0, 0, 0, 0]);
    const before = store.get(battleStateAtom);
    const listener = vi.fn();
    store.sub(battleStateAtom, listener);

    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(listener).not.toHaveBeenCalled();
    expect(store.get(battleStateAtom)).toBe(before);
  });

  it('matches the two legacy writes when only a cooldown runs', () => {
    const { snapshot, legacy, merged } = compareTickPaths(createBattleStore([12, 0, 0, 0]));
    expect(merged).toEqual(legacy);
    expect(merged.guard).toBe(snapshot.guard);
    expect(merged.party[0].skillCooldown).toBeCloseTo(12 - BATTLE_TICK_DELTA_SECONDS, 10);
  });

  it('matches the two legacy writes when only guard decays', () => {
    const store = createBattleStore([0, 0, 0, 0]);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), guard: 50 });
    const { snapshot, legacy, merged } = compareTickPaths(store);
    expect(merged).toEqual(legacy);
    expect(merged.party).toBe(snapshot.party);
    expect(merged.guard).toBeLessThan(50);
  });

  it('applies both in one write and one notification', () => {
    const store = createBattleStore([12, 0, 0, 0]);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), guard: 50 });
    const { legacy, merged } = compareTickPaths(store);
    expect(merged).toEqual(legacy);

    const listener = vi.fn();
    store.sub(battleStateAtom, listener);
    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does nothing once the battle is over', () => {
    const store = createBattleStore([5, 5, 5, 5]);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), gameStatus: 'lost', guard: 50 });
    const before = store.get(battleStateAtom);
    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);
    expect(store.get(battleStateAtom)).toBe(before);
  });
});

describe('partyMemberAtom / partyMemberIdsAtom', () => {
  it('returns the same atom for the same id', () => {
    expect(partyMemberAtom(id(0))).toBe(partyMemberAtom(id(0)));
    expect(partyMemberAtom(id(0))).not.toBe(partyMemberAtom(id(1)));
  });

  it('only notifies the member whose cooldown moved', () => {
    const store = createBattleStore([30, 0, 0, 0]);
    const moving = vi.fn();
    const still = vi.fn();
    store.sub(partyMemberAtom(id(0)), moving);
    store.sub(partyMemberAtom(id(1)), still);
    const stillBefore = store.get(partyMemberAtom(id(1)));

    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(moving).toHaveBeenCalledTimes(1);
    expect(still).not.toHaveBeenCalled();
    expect(store.get(partyMemberAtom(id(1)))).toBe(stillBefore);
    expect(store.get(partyMemberAtom(id(0)))?.skillCooldown).toBeCloseTo(30 - BATTLE_TICK_DELTA_SECONDS, 10);
  });

  it('keeps the roster string stable across ticks and damage', () => {
    const store = createBattleStore([30, 20, 10, 5]);
    const listener = vi.fn();
    store.sub(partyMemberIdsAtom, listener);
    expect(store.get(partyMemberIdsAtom)).toBe(INITIAL_PARTY.map((c) => c.id).join(','));

    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);
    killMember(store, 2);

    expect(listener).not.toHaveBeenCalled();
    expect(store.get(partyMemberAtom(id(2)))?.currentHp).toBe(0);
  });
});
