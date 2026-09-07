import { bench, describe } from 'vitest';
import { createStore, type Atom } from 'jotai';
import {
  addGuardAtom,
  addScoreAtom,
  applyMatchResolutionAtom,
  battleStateAtom,
  battleTickAtom,
  boardAtom,
  deadOrbColorClassesAtom,
  enemiesAtom,
  gameStatusAtom,
  guardAtom,
  guardPercentageAtom,
  itemCooldownMsAtom,
  lastDamageAtom,
  lastMatchedTypeAtom,
  partyAtom,
  partyHealthPercentageAtom,
  partyMemberAtom,
  partyMemberIdsAtom,
  pendingVictoryAtom,
  recordMaxComboAtom,
  reduceSkillCooldownAtom,
  scoreAtom,
  selectedOrbAtom,
  setupBattleAtom,
  standbyEnemyIdsAtom,
  tickGuardDecayAtom,
  tickSkillCooldownsAtom,
  turnAtom,
  type MatchResolution,
} from '~/stores/battle-atoms';
import { BENCH_OPTIONS } from './bench-options';
import { INITIAL_PARTY, INITIAL_ENEMIES } from '~/constants/party';
import { BATTLE_TICK_DELTA_SECONDS } from '~/constants/battle';

const DELTA = BATTLE_TICK_DELTA_SECONDS;

// The derived atoms the battle screen keeps mounted, so every write pays the same dependency
// walk and `Object.is` checks Jotai does in the app.
const MOUNTED_ATOMS: Atom<unknown>[] = [
  partyAtom,
  enemiesAtom,
  boardAtom,
  selectedOrbAtom,
  guardAtom,
  guardPercentageAtom,
  partyHealthPercentageAtom,
  gameStatusAtom,
  lastDamageAtom,
  turnAtom,
  scoreAtom,
  lastMatchedTypeAtom,
  pendingVictoryAtom,
  standbyEnemyIdsAtom,
  deadOrbColorClassesAtom,
  itemCooldownMsAtom,
];

const noop = () => {};

// Running cooldowns are seeded absurdly high so a 1.5 s bench window can never tick them to 0
// and silently flip the case into the idle path.
// Guard is seeded astronomically for the same reason: decay is proportional (~0.3 % per tick), so
// 1e300 cannot reach the snap-to-zero threshold inside a bench window.
function createBattleStore(cooldowns: number[], { guard = 0, mounted = MOUNTED_ATOMS } = {}) {
  const store = createStore();
  store.set(setupBattleAtom, { party: INITIAL_PARTY, enemies: INITIAL_ENEMIES });
  const state = store.get(battleStateAtom);
  store.set(battleStateAtom, {
    ...state,
    guard,
    party: state.party.map((char, i) => ({ ...char, skillCooldown: cooldowns[i] ?? 0 })),
  });
  for (const mountedAtom of mounted) store.sub(mountedAtom, noop);
  return store;
}

const idleStore = createBattleStore([0, 0, 0, 0]);
const oneRunningStore = createBattleStore([1e9, 0, 0, 0]);
const allRunningStore = createBattleStore([1e9, 1e9, 1e9, 1e9]);

// The same three states as battle-system.bench.ts, driven through a real Jotai store with the
// battle UI's subscriptions mounted. (with Jotai) − (pure) is the store's share per tick.
describe('tickSkillCooldownsAtom (through Jotai store, 16 mounted atoms)', () => {
  bench(
    'all cooldowns 0 (idle)',
    () => {
      idleStore.set(tickSkillCooldownsAtom, DELTA);
    },
    BENCH_OPTIONS,
  );

  bench(
    'one of four running',
    () => {
      oneRunningStore.set(tickSkillCooldownsAtom, DELTA);
    },
    BENCH_OPTIONS,
  );

  bench(
    'all four running',
    () => {
      allRunningStore.set(tickSkillCooldownsAtom, DELTA);
    },
    BENCH_OPTIONS,
  );
});

// ── 1.2: two tick writes vs one ──────────────────────────────────────────────────────────────
// Legacy = the interval's back-to-back `tickSkillCooldownsAtom` + `tickGuardDecayAtom`; both still
// exist, so this is a same-process A/B with no snapshot.
const TICK_STATES: Array<[string, number[], number]> = [
  ['idle (nothing to tick)', [0, 0, 0, 0], 0],
  ['cooldown running, guard 0', [1e9, 0, 0, 0], 0],
  ['cooldown running + guard decaying', [1e9, 0, 0, 0], 1e300],
  ['guard decaying only', [0, 0, 0, 0], 1e300],
];

describe('battle tick: legacy two writes vs battleTickAtom (store, 16 mounted atoms)', () => {
  for (const [name, cooldowns, guard] of TICK_STATES) {
    const legacyStore = createBattleStore(cooldowns, { guard });
    const mergedStore = createBattleStore(cooldowns, { guard });
    bench(
      `legacy two writes — ${name}`,
      () => {
        legacyStore.set(tickSkillCooldownsAtom, DELTA);
        legacyStore.set(tickGuardDecayAtom, DELTA);
      },
      BENCH_OPTIONS,
    );
    bench(
      `battleTickAtom — ${name}`,
      () => {
        mergedStore.set(battleTickAtom, DELTA);
      },
      BENCH_OPTIONS,
    );
  }
});

// ── 1.4: five-to-seven match writes vs one ──────────────────────────────────────────────────
const TWO_COLOURS: MatchResolution = {
  scoreDelta: 15,
  primaryMatchedType: INITIAL_PARTY[0].color,
  cooldownReductions: [
    { characterId: INITIAL_PARTY[0].id, amount: 0.9 },
    { characterId: INITIAL_PARTY[1].id, amount: 0.9 },
  ],
  guardGain: 0,
  combo: 1,
};
const THREE_COLOURS_AND_GREY: MatchResolution = {
  scoreDelta: 20,
  primaryMatchedType: INITIAL_PARTY[2].color,
  cooldownReductions: [
    { characterId: INITIAL_PARTY[0].id, amount: 1.2 },
    { characterId: INITIAL_PARTY[1].id, amount: 1.2 },
    { characterId: INITIAL_PARTY[2].id, amount: 1.2 },
  ],
  guardGain: 18,
  combo: 1,
};

/** The board's former synchronous write sequence, in its original order. */
function applyLegacyMatchSequence(store: ReturnType<typeof createBattleStore>, resolution: MatchResolution) {
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

// `combo` is constant, so legacy `recordMaxCombo` early-returns after the first iteration — which is
// also the in-game common case (a chain only sets a new record early in a battle).
describe('match resolution: legacy sequence vs applyMatchResolutionAtom (store, 16 mounted atoms)', () => {
  const legacyTwo = createBattleStore([1e12, 1e12, 1e12, 1e12]);
  const compositeTwo = createBattleStore([1e12, 1e12, 1e12, 1e12]);
  const legacyThree = createBattleStore([1e12, 1e12, 1e12, 1e12]);
  const compositeThree = createBattleStore([1e12, 1e12, 1e12, 1e12]);

  bench(
    'legacy 5 writes — two colours',
    () => {
      applyLegacyMatchSequence(legacyTwo, TWO_COLOURS);
    },
    BENCH_OPTIONS,
  );
  bench(
    'applyMatchResolutionAtom — two colours',
    () => {
      compositeTwo.set(applyMatchResolutionAtom, TWO_COLOURS);
    },
    BENCH_OPTIONS,
  );
  bench(
    'legacy 7 writes — three colours + grey',
    () => {
      applyLegacyMatchSequence(legacyThree, THREE_COLOURS_AND_GREY);
    },
    BENCH_OPTIONS,
  );
  bench(
    'applyMatchResolutionAtom — three colours + grey',
    () => {
      compositeThree.set(applyMatchResolutionAtom, THREE_COLOURS_AND_GREY);
    },
    BENCH_OPTIONS,
  );
});

// ── PartyDisplay split: what the extra per-member selectors cost the store ─────────────────
// The win of the split is React renders (measured in-browser); this only prices the five extra
// derived atoms a tick now has to walk.
describe('party subscription: whole partyAtom vs ids + 4 member atoms (one cooldown running)', () => {
  const wholeParty = createBattleStore([1e9, 0, 0, 0]);
  const perMember = createBattleStore([1e9, 0, 0, 0], {
    mounted: [...MOUNTED_ATOMS, partyMemberIdsAtom, ...INITIAL_PARTY.map((char) => partyMemberAtom(char.id))],
  });

  bench(
    'tick with partyAtom subscribed (legacy PartyDisplay)',
    () => {
      wholeParty.set(battleTickAtom, DELTA);
    },
    BENCH_OPTIONS,
  );
  bench(
    'tick with ids + 4 member atoms subscribed (split PartyDisplay)',
    () => {
      perMember.set(battleTickAtom, DELTA);
    },
    BENCH_OPTIONS,
  );
});
