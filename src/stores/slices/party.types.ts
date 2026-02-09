import type { CharacterData } from '~/types/rpg-elements';
import type { BaseSlice } from '../../types/store';
import type { EquipmentSlot } from '~/lib/equipment-system';

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
  equipItem: (characterId: string, itemId: string, slot: EquipmentSlot) => void;
  unequipItem: (characterId: string, slot: EquipmentSlot) => void;
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
