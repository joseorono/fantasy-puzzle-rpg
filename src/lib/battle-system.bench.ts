import { bench, describe } from 'vitest';
import { tickPartySkillCooldowns } from './battle-system';
import { BENCH_OPTIONS } from './bench-options';
import { INITIAL_PARTY } from '~/constants/party';
import { BATTLE_TICK_DELTA_SECONDS } from '~/constants/battle';

// Aliased once so the hot loop compares against a local, not a module getter (see the
// measurement notes in BATTLE_PERFORMANCE_PLAN.md).
const DELTA = BATTLE_TICK_DELTA_SECONDS;

const withCooldowns = (cooldowns: number[]) =>
  INITIAL_PARTY.map((char, i) => ({ ...char, currentHp: char.maxHp, skillCooldown: cooldowns[i] ?? 0 }));

const idleParty = withCooldowns([0, 0, 0, 0]);
const oneRunningParty = withCooldowns([30, 0, 0, 0]);
const allRunningParty = withCooldowns([30, 20, 50, 60]);

// The pure reducer on its own — no store, no subscribers. Pair with battle-atoms.bench.ts to
// separate the tick's own cost from Jotai's write + propagation cost.
describe('tickPartySkillCooldowns (pure, no Jotai)', () => {
  bench(
    'all cooldowns 0 (idle)',
    () => {
      tickPartySkillCooldowns(idleParty, DELTA);
    },
    BENCH_OPTIONS,
  );

  bench(
    'one of four running',
    () => {
      tickPartySkillCooldowns(oneRunningParty, DELTA);
    },
    BENCH_OPTIONS,
  );

  bench(
    'all four running',
    () => {
      tickPartySkillCooldowns(allRunningParty, DELTA);
    },
    BENCH_OPTIONS,
  );
});
