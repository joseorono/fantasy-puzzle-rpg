import type { BenchOptions } from 'vitest';

/**
 * Shared sampling window for the lib benches. Vitest's default (500 ms, no minimum iteration
 * count) reports ±1–5 % error, too coarse for sub-microsecond deltas; this resolves ~0.1 µs
 * changes at well under ±1 %.
 */
export const BENCH_OPTIONS: BenchOptions = {
  time: 1500,
  warmupTime: 250,
  iterations: 5000,
  warmupIterations: 500,
};
