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
  updateCharacter: (characterId: string, character: CharacterData) => void;
  fullyHealParty: () => void;
  isPartyFullyHealed: () => boolean;
  damageAllPartyMembers: (damage: number, canDie: boolean) => void;
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
