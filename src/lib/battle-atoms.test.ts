import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'jotai';
import {
  abandonBattleAtom,
  activateSkillAtom,
  addGuardAtom,
  addScoreAtom,
  applyMatchResolutionAtom,
  battleModeAtom,
  battleStateAtom,
  battleTickAtom,
  damageEnemyAtom,
  enemiesAtom,
  enemyPoiseAtom,
  ensureFreshBattleAtom,
  gameStatusAtom,
  lastPoiseBreakAtom,
  staggeredEnemySignatureAtom,
  standbyEnemyIdsAtom,
  totalDamageDealtAtom,
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
import { TRAINING_DUMMY } from '~/constants/enemies/training';
import {
  BATTLE_TICK_DELTA_SECONDS,
  POISE_BREAK_IMMUNITY_MS,
  POISE_BREAK_STAGGER_DURATION_MS,
  POISE_SKILL_MULTIPLIER,
} from '~/constants/battle';
import { calculateItemCooldownInMs } from './rpg-calculations';
import { getPartyPassiveModifiers, getSelectedSkill } from './skill-system';
import { weighHitsByAttacker } from './flinch-system';
import { applyPoiseHits, isEnemyStaggered, resolveVulnerableDamage } from './poise-system';

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

describe('training mode', () => {
  function createTrainingStore() {
    const store = createStore();
    store.set(setupBattleAtom, { party: INITIAL_PARTY, enemies: [TRAINING_DUMMY], mode: 'training' });
    return store;
  }

  it('defaults to standard mode with enemies on standby', () => {
    const store = createBattleStore();
    expect(store.get(battleModeAtom)).toBe('standard');
    expect(store.get(standbyEnemyIdsAtom).length).toBeGreaterThan(0);
  });

  it('skips enemy standby entirely, so no hit is ever preemptive', () => {
    const store = createTrainingStore();
    expect(store.get(battleModeAtom)).toBe('training');
    expect(store.get(standbyEnemyIdsAtom)).toEqual([]);
    expect(store.get(battleStateAtom).enemyStandbyMs).toEqual({});

    store.set(damageEnemyAtom, 40);
    expect(store.get(battleStateAtom).lastDamage?.amount).toBe(40);
  });

  it('abandons only a live fight and re-arms on the next entry', () => {
    const store = createTrainingStore();
    store.set(damageEnemyAtom, 10);

    store.set(abandonBattleAtom);
    expect(store.get(gameStatusAtom)).toBe('abandoned');

    store.set(abandonBattleAtom);
    expect(store.get(gameStatusAtom)).toBe('abandoned');

    store.set(ensureFreshBattleAtom, INITIAL_PARTY);
    expect(store.get(gameStatusAtom)).toBe('playing');
    expect(store.get(battleModeAtom)).toBe('training');
    expect(store.get(totalDamageDealtAtom)).toBe(0);
  });

  it('cannot win against the dummy', () => {
    const store = createTrainingStore();
    store.set(damageEnemyAtom, 1_000_000);
    expect(store.get(gameStatusAtom)).toBe('playing');
    expect(store.get(battleStateAtom).pendingVictory).toBe(false);
  });
});

describe('totalDamageDealt', () => {
  function enemyHpTotal(store: BattleStore) {
    return store.get(enemiesAtom).reduce((sum, enemy) => sum + enemy.currentHp, 0);
  }

  it('starts at zero', () => {
    expect(createBattleStore().get(totalDamageDealtAtom)).toBe(0);
  });

  it('accumulates match hits, a batched multi-hit only once', () => {
    const store = createStore();
    store.set(setupBattleAtom, { party: INITIAL_PARTY, enemies: [TRAINING_DUMMY], mode: 'training' });

    store.set(damageEnemyAtom, 25);
    store.set(damageEnemyAtom, { hits: [{ amount: 10 }, { amount: 5 }] });

    expect(store.get(totalDamageDealtAtom)).toBe(40);
  });

  it('records the landed amount, preemptive bonus included', () => {
    const store = createBattleStore();
    store.set(damageEnemyAtom, 20);

    expect(store.get(totalDamageDealtAtom)).toBe(store.get(battleStateAtom).lastDamage?.amount);
  });

  it('counts every hero skill by the HP it actually removed, so heals add nothing', () => {
    const store = createBattleStore([0, 0, 0, 0]);

    for (const member of INITIAL_PARTY) {
      const before = store.get(totalDamageDealtAtom);
      const hpBefore = enemyHpTotal(store);
      store.set(activateSkillAtom, member.id);
      const removed = hpBefore - enemyHpTotal(store);

      expect(store.get(totalDamageDealtAtom) - before).toBe(removed);
    }
    expect(store.get(totalDamageDealtAtom)).toBeGreaterThan(0);
  });
});

describe('enemy poise', () => {
  /** A standard store with every enemy past standby, so hits count toward poise. */
  function createArmedStore(cooldowns?: number[]) {
    const store = createBattleStore(cooldowns);
    store.set(battleStateAtom, { ...store.get(battleStateAtom), standbyEnemyIds: [] });
    return store;
  }

  function selectedPoise(store: BattleStore) {
    return store.get(enemyPoiseAtom)[store.get(battleStateAtom).selectedEnemyId];
  }

  function selectedEnemy(store: BattleStore) {
    const state = store.get(battleStateAtom);
    return state.enemies.find((e) => e.id === state.selectedEnemyId)!;
  }

  /** Overwrites the selected enemy's poise state in place. */
  function patchSelectedPoise(store: BattleStore, patch: Partial<ReturnType<typeof selectedPoise>>) {
    const state = store.get(battleStateAtom);
    const id = state.selectedEnemyId;
    store.set(battleStateAtom, {
      ...state,
      enemyPoise: { ...state.enemyPoise, [id]: { ...state.enemyPoise[id], ...patch } },
    });
  }

  /** A hit that empties the selected enemy's pool in one go, regardless of its poise stat. */
  function breakingAmount(store: BattleStore) {
    return Math.ceil(selectedPoise(store).max / (selectedEnemy(store).poise ?? 1)) + 1;
  }

  it('seeds a full pool per enemy on setup', () => {
    const store = createBattleStore();
    for (const enemy of store.get(enemiesAtom)) {
      const poise = store.get(enemyPoiseAtom)[enemy.id];
      expect(poise.current).toBe(poise.max);
      expect(poise.breakCount).toBe(0);
    }
    expect(store.get(lastPoiseBreakAtom)).toBeNull();
    expect(store.get(staggeredEnemySignatureAtom)).toBe('');
  });

  it('damageEnemyAtom deals poise damage in the same write as HP, matching the pure reducer', () => {
    const store = createArmedStore();
    const before = selectedPoise(store);
    const enemy = selectedEnemy(store);
    const hits = [{ amount: 10, characterId: INITIAL_PARTY[0].id }, { amount: 7 }];
    const expected = applyPoiseHits(
      before,
      weighHitsByAttacker(hits, store.get(partyAtom), POISE_SKILL_MULTIPLIER, 'match'),
      enemy.poise ?? 1,
    ).next;

    const listener = vi.fn();
    store.sub(battleStateAtom, listener);
    store.set(damageEnemyAtom, { hits });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(selectedPoise(store)).toEqual(expected);
    expect(selectedPoise(store).current).toBeLessThan(before.current);
    expect(selectedEnemy(store).currentHp).toBe(enemy.currentHp - 17);
  });

  it('a standby target takes no poise damage', () => {
    const store = createBattleStore();
    expect(store.get(standbyEnemyIdsAtom)).toContain(store.get(battleStateAtom).selectedEnemyId);
    const before = selectedPoise(store);

    store.set(damageEnemyAtom, 25);

    expect(selectedPoise(store)).toBe(before);
  });

  it('a killing blow deals no poise damage', () => {
    const store = createArmedStore();
    const state = store.get(battleStateAtom);
    store.set(battleStateAtom, {
      ...state,
      enemies: state.enemies.map((e) => (e.id === state.selectedEnemyId ? { ...e, currentHp: 5 } : e)),
    });
    const id = state.selectedEnemyId;
    const before = store.get(enemyPoiseAtom)[id];

    store.set(damageEnemyAtom, 500);

    expect(store.get(enemyPoiseAtom)[id]).toBe(before);
  });

  it('breaks when the pool empties: attack window opens, event published once, breaking hit gets no bonus', () => {
    const store = createArmedStore();
    const id = store.get(battleStateAtom).selectedEnemyId;
    const amount = breakingAmount(store);

    store.set(damageEnemyAtom, amount);

    const poise = selectedPoise(store);
    expect(isEnemyStaggered(poise)).toBe(true);
    expect(poise.staggerRemainingMs).toBe(POISE_BREAK_STAGGER_DURATION_MS);
    expect(poise.breakCount).toBe(1);
    expect(poise.current).toBe(poise.max);
    expect(store.get(lastPoiseBreakAtom)).toEqual({ enemyIds: [id], timestamp: expect.any(Number) });
    expect(store.get(staggeredEnemySignatureAtom)).toBe(id);
    // The hit that causes the Break lands at face value.
    expect(store.get(battleStateAtom).lastDamage?.amount).toBe(amount);
  });

  it('hits during the window take the vulnerable bonus and leave the pool alone', () => {
    const store = createArmedStore();
    store.set(damageEnemyAtom, breakingAmount(store));
    const brokenPoise = selectedPoise(store);
    const breakEvent = store.get(lastPoiseBreakAtom);
    const hpBefore = selectedEnemy(store).currentHp;

    store.set(damageEnemyAtom, { hits: [{ amount: 10 }, { amount: 6 }] });

    const landed = resolveVulnerableDamage(10, true) + resolveVulnerableDamage(6, true);
    expect(store.get(battleStateAtom).lastDamage?.amount).toBe(landed);
    expect(selectedEnemy(store).currentHp).toBe(hpBefore - landed);
    expect(selectedPoise(store)).toBe(brokenPoise);
    expect(store.get(lastPoiseBreakAtom)).toBe(breakEvent);
  });

  it('activateSkillAtom applies the vulnerable bonus and poise damage in one commit', () => {
    const attacker = INITIAL_PARTY.find((member) => getSelectedSkill(member).target === 'enemy')!;
    const ready = INITIAL_PARTY.map(() => 0);

    // Baseline: what the skill removes from an unbroken target, and the poise it deals.
    const plain = createArmedStore(ready);
    const plainPoiseBefore = selectedPoise(plain);
    const plainHpBefore = selectedEnemy(plain).currentHp;
    plain.set(activateSkillAtom, attacker.id);
    const baseDamage = plainHpBefore - selectedEnemy(plain).currentHp;
    expect(baseDamage).toBeGreaterThan(0);
    expect(selectedPoise(plain).current).toBeLessThan(plainPoiseBefore.current);

    // Same skill on a Broken target: boosted HP damage, pool untouched.
    const broken = createArmedStore(ready);
    patchSelectedPoise(broken, { staggerRemainingMs: 1000 });
    const brokenPoiseBefore = selectedPoise(broken);
    const brokenHpBefore = selectedEnemy(broken).currentHp;
    const listener = vi.fn();
    broken.sub(battleStateAtom, listener);
    broken.set(activateSkillAtom, attacker.id);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(brokenHpBefore - selectedEnemy(broken).currentHp).toBe(resolveVulnerableDamage(baseDamage, true));
    expect(broken.get(battleStateAtom).lastDamage?.amount).toBe(resolveVulnerableDamage(baseDamage, true));
    expect(selectedPoise(broken)).toBe(brokenPoiseBefore);
  });

  it('activateSkillAtom can break, publishing the struck id', () => {
    const attacker = INITIAL_PARTY.find((member) => getSelectedSkill(member).target === 'enemy')!;
    const store = createArmedStore(INITIAL_PARTY.map(() => 0));
    const id = store.get(battleStateAtom).selectedEnemyId;
    patchSelectedPoise(store, { current: 1 });

    store.set(activateSkillAtom, attacker.id);

    expect(isEnemyStaggered(selectedPoise(store))).toBe(true);
    expect(store.get(lastPoiseBreakAtom)?.enemyIds).toEqual([id]);
  });

  it('battleTickAtom stays silent while every pool is idle', () => {
    const store = createArmedStore([0, 0, 0, 0]);
    const poiseBefore = store.get(enemyPoiseAtom);
    const listener = vi.fn();
    store.sub(battleStateAtom, listener);

    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);

    expect(listener).not.toHaveBeenCalled();
    expect(store.get(enemyPoiseAtom)).toBe(poiseBefore);
  });

  it('battleTickAtom counts the window down, flips to immunity, and only then changes the signature', () => {
    const store = createArmedStore([0, 0, 0, 0]);
    const id = store.get(battleStateAtom).selectedEnemyId;
    patchSelectedPoise(store, { staggerRemainingMs: BATTLE_TICK_DELTA_SECONDS * 1000 * 2 });
    const signatureListener = vi.fn();
    store.sub(staggeredEnemySignatureAtom, signatureListener);
    expect(store.get(staggeredEnemySignatureAtom)).toBe(id);

    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);
    expect(selectedPoise(store).staggerRemainingMs).toBeCloseTo(BATTLE_TICK_DELTA_SECONDS * 1000, 6);
    expect(signatureListener).not.toHaveBeenCalled();

    store.set(battleTickAtom, BATTLE_TICK_DELTA_SECONDS);
    expect(selectedPoise(store).staggerRemainingMs).toBe(0);
    expect(selectedPoise(store).immuneRemainingMs).toBe(POISE_BREAK_IMMUNITY_MS);
    expect(signatureListener).toHaveBeenCalledTimes(1);
    expect(store.get(staggeredEnemySignatureAtom)).toBe('');
  });

  it('ignores poise damage while immune, but HP damage still lands', () => {
    const store = createArmedStore();
    patchSelectedPoise(store, { immuneRemainingMs: 500 });
    const before = selectedPoise(store);
    const hpBefore = selectedEnemy(store).currentHp;

    store.set(damageEnemyAtom, 20);

    expect(selectedPoise(store)).toBe(before);
    expect(selectedEnemy(store).currentHp).toBe(hpBefore - 20);
  });

  it('a fresh setup resets pools and clears the break event', () => {
    const store = createArmedStore();
    store.set(damageEnemyAtom, breakingAmount(store));
    expect(store.get(lastPoiseBreakAtom)).not.toBeNull();

    store.set(setupBattleAtom, { party: INITIAL_PARTY, enemies: INITIAL_ENEMIES });

    expect(store.get(lastPoiseBreakAtom)).toBeNull();
    expect(store.get(staggeredEnemySignatureAtom)).toBe('');
    for (const poise of Object.values(store.get(enemyPoiseAtom))) expect(poise.breakCount).toBe(0);
  });
});
