import type { CharacterData } from '~/types/rpg-elements';
import type { BaseSlice } from '../../types/store';

/**
 * Party state
 */
export interface PartyState {
  members: CharacterData[];
}

/**
 * Party slice actions
 */
export interface PartyActions {
  setParty: (party: CharacterData[]) => void;
  fullyHealParty: () => void;
}

/**
 * Complete party slice interface
 */
export interface PartySlice extends BaseSlice {
  party: PartyState;
  actions: {
    party: PartyActions;
  };
}
