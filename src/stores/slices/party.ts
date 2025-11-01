import type { PartySlice } from './party.types';
import { INITIAL_PARTY } from '~/constants/game';
import { fullyHealParty as fullyHealPartyLib, isPartyFullyHealed, damageAllPartyMembers as damageAllPartyMembersLib } from '~/lib/party-system';
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
            state.party.members = fullyHealPartyLib(state.party.members);
          },
          false,
          'party/fullyHealParty'
        ),
      isPartyFullyHealed: () =>
        set(
          (state: PartySlice) => {
            return isPartyFullyHealed(state.party.members);
          },
          false,
          'party/isPartyFullyHealed'
        ),
        damageAllPartyMembers: (damage: number, canDie: boolean) =>
          set(
            (state: PartySlice) => {
              state.party.members = damageAllPartyMembersLib(state.party.members, damage, canDie);
            },
            false,
            'party/damageAllPartyMembers'
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

