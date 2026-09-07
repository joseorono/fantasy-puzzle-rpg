import { bench, describe } from 'vitest';
import { createStore } from 'jotai';
import {
  battleStateAtom,
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
  pendingVictoryAtom,
  scoreAtom,
  selectedOrbAtom,
  setupBattleAtom,
  standbyEnemyIdsAtom,
  tickSkillCooldownsAtom,
  turnAtom,
} from '~/stores/battle-atoms';
import { BENCH_OPTIONS } from './bench-options';
import { INITIAL_PARTY, INITIAL_ENEMIES } from '~/constants/party';
import { BATTLE_TICK_DELTA_SECONDS } from '~/constants/battle';

const DELTA = BATTLE_TICK_DELTA_SECONDS;

// The derived atoms the battle screen keeps mounted, so every write pays the same dependency
// walk and `Object.is` checks Jotai does in the app.
const MOUNTED_ATOMS = [
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
function createBattleStore(cooldowns: number[]) {
  const store = createStore();
  store.set(setupBattleAtom, { party: INITIAL_PARTY, enemies: INITIAL_ENEMIES });
  const state = store.get(battleStateAtom);
  store.set(battleStateAtom, {
    ...state,
    party: state.party.map((char, i) => ({ ...char, skillCooldown: cooldowns[i] ?? 0 })),
  });
  for (const mountedAtom of MOUNTED_ATOMS) store.sub(mountedAtom, noop);
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
