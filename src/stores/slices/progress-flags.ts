import type { ProgressFlagsSlice, ProgressFlagsState } from './progress-flags.types';
import type { SliceSet } from '~/types/store';

/** A fresh set of progress flags, shared by the slice initializer and `resetGameState`. */
export const createInitialProgressFlagsState = (): ProgressFlagsState => ({
  respecCount: 0,
});

/**
 * Create the progress flags slice.
 *
 * Designed to work with immer middleware, so the draft state is mutated directly.
 */
export const createProgressFlagsSlice = (set: SliceSet<ProgressFlagsSlice>): ProgressFlagsSlice => ({
  progressFlags: createInitialProgressFlagsState(),

  actions: {
    progressFlags: {
      registerRespec: () =>
        set(
          (state: ProgressFlagsSlice) => {
            state.progressFlags.respecCount += 1;
          },
          false,
          'progressFlags/registerRespec',
        ),
    },
  },
});
