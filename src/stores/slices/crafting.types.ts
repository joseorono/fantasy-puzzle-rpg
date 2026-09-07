import type { BaseSlice } from '../../types/store';
import type { RarityTier } from '~/constants/rarity';

/**
 * Crafting state — currently just the "pity" counter that builds bad-luck
 * protection across consecutive low-rarity crafts.
 */
export interface CraftingState {
  pity: number;
}

/**
 * Crafting slice actions
 */
export interface CraftingActions {
  /** Record a craft's rolled rarity, advancing or resetting the pity counter. */
  registerCraft: (rolledRarity: RarityTier) => void;
  /** Reset the pity counter to 0. */
  resetPity: () => void;
}

/**
 * Complete crafting slice interface
 */
export interface CraftingSlice extends BaseSlice {
  crafting: CraftingState;
  actions: {
    crafting: CraftingActions;
  };
}
