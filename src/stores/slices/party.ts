import type { PartySlice } from './party.types';
import { INITIAL_PARTY } from '~/constants/party';
import {
  fullyHealParty as fullyHealPartyLib,
  fullyHealMember as fullyHealMemberLib,
  isPartyFullyHealed,
  damageAllPartyMembers as damageAllPartyMembersLib,
  applyHpFromBattle,
} from '~/lib/party-system';
import { unlockSkill as unlockSkillLib, selectSkill as selectSkillLib } from '~/lib/skill-system';
import type { CharacterData } from '~/types/rpg-elements';
import type { RarityTier } from '~/constants/rarity';
import type { EquipmentSlot } from '~/lib/equipment-system';
import type { SliceSet, SliceGet } from '~/types/store';

/**
 * Create the party slice
 *
 * This function is designed to work with immer middleware,
 * so we can mutate the draft state directly.
 */
export const createPartySlice = (set: SliceSet<PartySlice>, get: SliceGet<PartySlice>): PartySlice => ({
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
          'party/setParty',
        ),

      updateCharacter: (characterId: string, character: CharacterData) =>
        set(
          (state: PartySlice) => {
            const index = state.party.members.findIndex((member) => member.id === characterId);
            if (index !== -1) {
              state.party.members[index] = character;
            }
          },
          false,
          'party/updateCharacter',
        ),

      fullyHealParty: () =>
        set(
          (state: PartySlice) => {
            state.party.members = fullyHealPartyLib(state.party.members);
          },
          false,
          'party/fullyHealParty',
        ),
      fullyHealMember: (characterId: string) =>
        set(
          (state: PartySlice) => {
            state.party.members = fullyHealMemberLib(state.party.members, characterId);
          },
          false,
          'party/fullyHealMember',
        ),
      isPartyFullyHealed: () => isPartyFullyHealed(get().party.members),
      damageAllPartyMembers: (damage: number, canDie: boolean) =>
        set(
          (state: PartySlice) => {
            state.party.members = damageAllPartyMembersLib(state.party.members, damage, canDie);
          },
          false,
          'party/damageAllPartyMembers',
        ),
      syncBattleHp: (battleParty: CharacterData[]) =>
        set(
          (state: PartySlice) => {
            state.party.members = applyHpFromBattle(state.party.members, battleParty);
          },
          false,
          'party/syncBattleHp',
        ),
      equipItem: (characterId: string, itemId: string, slot: EquipmentSlot, rarity?: RarityTier) =>
        set(
          (state: PartySlice) => {
            const member = state.party.members.find((m) => m.id === characterId);
            if (!member) return;
            if (slot === 'weapon') {
              member.equippedWeaponId = itemId;
              member.equippedWeaponRarity = rarity;
            } else {
              member.equippedArmorId = itemId;
              member.equippedArmorRarity = rarity;
            }
          },
          false,
          'party/equipItem',
        ),
      unequipItem: (characterId: string, slot: EquipmentSlot) =>
        set(
          (state: PartySlice) => {
            const member = state.party.members.find((m) => m.id === characterId);
            if (!member) return;
            if (slot === 'weapon') {
              member.equippedWeaponId = undefined;
              member.equippedWeaponRarity = undefined;
            } else {
              member.equippedArmorId = undefined;
              member.equippedArmorRarity = undefined;
            }
          },
          false,
          'party/unequipItem',
        ),
      unlockSkillForCharacter: (characterId: string, skillId: string) =>
        set(
          (state: PartySlice) => {
            const index = state.party.members.findIndex((m) => m.id === characterId);
            if (index === -1) return;
            state.party.members[index] = unlockSkillLib(state.party.members[index], skillId);
          },
          false,
          'party/unlockSkillForCharacter',
        ),
      selectSkillForCharacter: (characterId: string, skillId: string) =>
        set(
          (state: PartySlice) => {
            const index = state.party.members.findIndex((m) => m.id === characterId);
            if (index === -1) return;
            state.party.members[index] = selectSkillLib(state.party.members[index], skillId);
          },
          false,
          'party/selectSkillForCharacter',
        ),
    },
  },

  reset: () =>
    set(
      (state: PartySlice) => {
        state.party.members = INITIAL_PARTY;
      },
      false,
      'party/reset',
    ),
});
