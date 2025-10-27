import type { PartySlice } from './party.types';
import { INITIAL_PARTY } from '../../constants/game';
import type { CharacterData } from '~/types/rpg-elements';

/**
 * Create the party slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createPartySlice = (set: any): PartySlice => ({
  party: {
    members: INITIAL_PARTY,
  },

  actions: {
    party: {
      setParty: (party: CharacterData[]) =>
        set(
          (state: PartySlice) => {
            state.party.members = party;
          },
          false,
          'party/setParty'
        ),

      fullyHealParty: () =>
        set(
          (state: PartySlice) => {
            state.party.members = state.party.members.map(member => ({
              ...member,
              currentHp: member.maxHp,
            }));
          },
          false,
          'party/fullyHealParty'
        ),
    },
  },

  reset: () =>
    set(
      (state: PartySlice) => {
        state.party.members = INITIAL_PARTY;
      },
      false,
      'party/reset'
    ),
});
