import type { CharacterData } from '~/types/rpg-elements';

/**
 * Represents pending level ups for a character
 */
export interface PendingLevelUp {
  charId: string;
  character: CharacterData;
  pendingLevelUps: number;
}

/**
 * Calculate level ups for all party members based on experience gained
 * @param partyMembers - Array of party members
 * @param expGained - Total experience gained from battle
 * @returns Array of characters with pending level ups
 */
export function calculateLevelUpsForParty(partyMembers: CharacterData[], expGained: number): PendingLevelUp[] {
  return partyMembers.map((character) => {
    let currentExp = character.expToNextLevel - expGained;
    let levelUps = 0;

    // Count how many times the character levels up
    while (currentExp <= 0) {
      levelUps += 1;
      currentExp += 100; // Assuming 100 exp needed per level (adjust as needed)
    }

    return {
      charId: character.id,
      character,
      pendingLevelUps: levelUps,
    };
  });
}
