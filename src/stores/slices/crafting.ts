import type { CraftingSlice } from './crafting.types';
import type { RarityTier } from '~/constants/rarity';
import { nextPity } from '~/lib/rarity';
import type { SliceSet } from '~/types/store';

/**
 * Create the crafting slice.
 *
 * Designed to work with immer middleware, so the draft state is mutated directly.
 */
export const createCraftingSlice = (set: SliceSet<CraftingSlice>): CraftingSlice => ({
  crafting: {
    pity: 0,
  },

  actions: {
    crafting: {
      registerCraft: (rolledRarity: RarityTier) =>
        set(
          (state: CraftingSlice) => {
            state.crafting.pity = nextPity(state.crafting.pity, rolledRarity);
          },
          false,
          'crafting/registerCraft',
        ),

      resetPity: () =>
        set(
          (state: CraftingSlice) => {
            state.crafting.pity = 0;
          },
          false,
          'crafting/resetPity',
        ),
    },
  },

  reset: () =>
    set(
      (state: CraftingSlice) => {
        state.crafting.pity = 0;
      },
      false,
      'crafting/reset',
    ),
});
