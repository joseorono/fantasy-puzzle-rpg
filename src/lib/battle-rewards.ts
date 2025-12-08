import type { CharacterData } from '~/types/rpg-elements';

/**
 * Represents pending level ups for a character
 */
export interface PendingLevelUp {
  charId: string;
  character: CharacterData;
  pendingLevelUps: number;
  remainingExp: number;
}

/**
 * Calculate level ups for all party members based on their current EXP state
 * and the EXP gained from the latest battle.
 * @param partyMembers - Array of party members (after EXP has been applied or not)
 * @param expGained - Total experience gained from the latest battle
 * @returns Array of characters with pending level ups
 */
export function calculateLevelUpsForParty(partyMembers: CharacterData[], expGained: number): PendingLevelUp[] {
  return partyMembers.map((character) => {
    let levelUps = 0;
    let level = character.level;

    // Derive pre-battle EXP using expGained so the parameter is actually
    // part of the leveling calculation. This keeps behavior consistent
    // whether partyMembers already include the reward or not.
    const expAfterBattle = character.expToNextLevel;
    const expBeforeBattle = Math.max(0, expAfterBattle - expGained);
    let expProgress = expBeforeBattle + expGained;

    // EXP required for the current level, matching the EXP bar display logic
    let expToNextLevel = Math.floor(Math.exp(level));

    // Count how many times the character levels up based on their EXP progress
    while (expProgress >= expToNextLevel) {
      levelUps += 1;
      expProgress -= expToNextLevel;
      level += 1;
      expToNextLevel = Math.floor(Math.exp(level));
    }

    const remainingExp = expProgress;

    return {
      charId: character.id,
      character,
      pendingLevelUps: levelUps,
      remainingExp,
    };
  });
}
