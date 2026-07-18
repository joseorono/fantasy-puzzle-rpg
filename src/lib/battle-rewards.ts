import type { CharacterData } from '~/types/rpg-elements';
import { getExpThresholdForLevel } from '~/lib/leveling-system';
import { MAX_LEVEL, MAX_LEVEL_UPS_PER_BATTLE } from '~/constants/party';

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
    const expAfterBattle = character.currentLevelExp;
    const expBeforeBattle = Math.max(0, expAfterBattle - expGained);
    let expProgress = expBeforeBattle + expGained;

    // EXP required for the current level, matching the EXP bar display logic
    let expThreshold = getExpThresholdForLevel(level);

    // Count how many times the character levels up based on their EXP progress.
    // Bounded by the level ceiling (MAX_LEVEL) and the per-battle cap so corrupt/debug
    // EXP can't spin the loop and lock the UI — mirrors the guards in buildExpGainTimeline.
    while (expProgress >= expThreshold && level < MAX_LEVEL && levelUps < MAX_LEVEL_UPS_PER_BATTLE) {
      levelUps += 1;
      expProgress -= expThreshold;
      level += 1;
      expThreshold = getExpThresholdForLevel(level);
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
