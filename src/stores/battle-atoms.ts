import { atom } from 'jotai';
import type { BattleState } from '~/types/battle';
import type { EnemyData } from '~/types/rpg-elements';
import { subtractionWithMin } from '~/lib/math';
import { getRandomElement } from '~/lib/utils';
import { INITIAL_PARTY, INITIAL_ENEMIES } from '~/constants/game';
import { calculatePartyHpPercentage, calculateCharacterCooldown, calculateSkillDamage } from '~/lib/rpg-calculations';
import { SKILL_DEFINITIONS, BASE_SKILL_DAMAGE } from '~/constants/skills';
import {
  getLivingMembers,
  getHealableMembers,
  damagePartyMember,
  healPartyMember,
  isPartyDefeated,
} from '~/lib/party-system';
import {
  createInitialBoard,
  hasMatchAtPosition,
  swapOrbs,
  isValidSwap,
  removeMatchedOrbsAndRefill,
} from '~/lib/match-3';

// Use initial data from constants
const initialParty = INITIAL_PARTY;
const initialEnemies = INITIAL_ENEMIES;

/**
 * Returns the first living enemy's id, prioritizing enemies after currentId (wrapping around).
 * Returns null if all enemies are dead.
 */
function getNextLivingEnemyId(enemies: EnemyData[], currentId: string): string | null {
  const living = enemies.filter((e) => e.currentHp > 0);
  if (living.length === 0) return null;

  // Try to find a living enemy after the current one
  const currentIndex = enemies.findIndex((e) => e.id === currentId);
  for (let i = 1; i <= enemies.length; i++) {
    const idx = (currentIndex + i) % enemies.length;
    if (enemies[idx].currentHp > 0) return enemies[idx].id;
  }

  return living[0].id;
}

// Initial battle state — skills start on cooldown
const initialBattleState: BattleState = {
  party: initialParty.map((char) => ({
    ...char,
    skillCooldown: calculateCharacterCooldown(char),
  })),
  enemies: initialEnemies.map((e) => ({ ...e, currentHp: e.maxHp })),
  selectedEnemyId: initialEnemies[0].id,
  board: createInitialBoard(),
  selectedOrb: null,
  currentMatches: [],
  score: 0,
  turn: 1,
  gameStatus: 'playing',
  lastDamage: null,
  lastMatchedType: null,
  enemyAttackTimestamp: null,
  lastSkillActivation: null,
};

// Jotai atoms
export const battleStateAtom = atom<BattleState>(initialBattleState);
export const partyAtom = atom((get) => get(battleStateAtom).party);
export const enemiesAtom = atom((get) => get(battleStateAtom).enemies);
export const selectedEnemyIdAtom = atom((get) => get(battleStateAtom).selectedEnemyId);
export const selectedEnemyAtom = atom((get) => {
  const state = get(battleStateAtom);
  return state.enemies.find((e) => e.id === state.selectedEnemyId) ?? state.enemies[0];
});
export const boardAtom = atom((get) => get(battleStateAtom).board);
export const selectedOrbAtom = atom((get) => get(battleStateAtom).selectedOrb);
export const currentMatchesAtom = atom((get) => get(battleStateAtom).currentMatches);

// Derived atom for party health percentage
export const partyHealthPercentageAtom = atom((get) => {
  const party = get(partyAtom);
  return calculatePartyHpPercentage(party);
});

// Atom to select a target enemy
export const selectEnemyAtom = atom(null, (get, set, enemyId: string) => {
  const currentState = get(battleStateAtom);
  const enemy = currentState.enemies.find((e) => e.id === enemyId);
  if (!enemy || enemy.currentHp <= 0) return;
  set(battleStateAtom, { ...currentState, selectedEnemyId: enemyId });
});

// Atom to select an orb
export const selectOrbAtom = atom(null, (get, set, position: { row: number; col: number } | null) => {
  const currentState = get(battleStateAtom);
  set(battleStateAtom, {
    ...currentState,
    selectedOrb: position,
  });
});

// Atom to swap orbs (with match validation)
export const swapOrbsAtom = atom(
  null,
  (get, set, from: { row: number; col: number }, to: { row: number; col: number }) => {
    const currentState = get(battleStateAtom);
    const newBoard = swapOrbs(currentState.board, from, to);

    // Check if the swap creates a match
    const createsMatch =
      hasMatchAtPosition(newBoard, from.row, from.col) || hasMatchAtPosition(newBoard, to.row, to.col);

    if (createsMatch) {
      // Valid swap - update board and clear selection
      set(battleStateAtom, {
        ...currentState,
        board: newBoard,
        selectedOrb: null,
      });
    }
    // If invalid, don't update state at all - keep the selection

    return createsMatch;
  },
);

// Atom to check if a swap would be valid (for preview)
export const checkSwapValidityAtom = atom(
  null,
  (get, _set, from: { row: number; col: number }, to: { row: number; col: number }): boolean => {
    const currentState = get(battleStateAtom);
    return isValidSwap(currentState.board, from, to);
  },
);

// Atom to damage party (targets random living hero)
export const damagePartyAtom = atom(null, (get, set, damage: number, attackerEnemyId?: string) => {
  const currentState = get(battleStateAtom);

  // Get living party members
  const living = getLivingMembers(currentState.party);
  if (living.length === 0) return;

  // Select a random living hero to take damage
  const targetHero = getRandomElement(living);

  const party = damagePartyMember(currentState.party, targetHero.id, damage);
  const gameStatus = isPartyDefeated(party) ? 'lost' : 'playing';

  set(battleStateAtom, {
    ...currentState,
    party,
    gameStatus,
    lastDamage: {
      amount: damage,
      target: 'party',
      timestamp: Date.now(),
      characterId: targetHero.id,
      enemyId: attackerEnemyId,
    },
  });
});

// Atom to damage the selected enemy
export const damageEnemyAtom = atom(null, (get, set, damage: number) => {
  const currentState = get(battleStateAtom);
  const selectedId = currentState.selectedEnemyId;

  const enemies = currentState.enemies.map((e) => {
    if (e.id !== selectedId) return e;
    return { ...e, currentHp: subtractionWithMin(e.currentHp, damage, 0) };
  });

  // Check if selected enemy just died — auto-select next living enemy
  const damagedEnemy = enemies.find((e) => e.id === selectedId)!;
  let newSelectedId = selectedId;
  if (damagedEnemy.currentHp <= 0) {
    const nextId = getNextLivingEnemyId(enemies, selectedId);
    if (nextId) newSelectedId = nextId;
  }

  // Check if ALL enemies are dead
  const allDead = enemies.every((e) => e.currentHp <= 0);
  const gameStatus = allDead ? 'won' : 'playing';

  set(battleStateAtom, {
    ...currentState,
    enemies,
    selectedEnemyId: newSelectedId,
    gameStatus,
    lastDamage: { amount: damage, target: 'enemy', timestamp: Date.now(), enemyId: selectedId },
  });
});

// Atom to reset battle
export const resetBattleAtom = atom(null, (_get, set) => {
  set(battleStateAtom, {
    party: initialParty.map((char) => ({
      ...char,
      currentHp: char.maxHp,
      skillCooldown: calculateCharacterCooldown(char),
    })),
    enemies: initialEnemies.map((e) => ({ ...e, currentHp: e.maxHp })),
    selectedEnemyId: initialEnemies[0].id,
    board: createInitialBoard(),
    selectedOrb: null,
    currentMatches: [],
    score: 0,
    turn: 1,
    gameStatus: 'playing',
    lastDamage: null,
    lastMatchedType: null,
    lastSkillActivation: null,
  });
});

// Atom to remove matched orbs and refill board
export const removeMatchedOrbsAtom = atom(null, (get, set, matchedOrbIds: Set<string>) => {
  if (matchedOrbIds.size === 0) return;

  const currentState = get(battleStateAtom);
  const newBoard = removeMatchedOrbsAndRefill(currentState.board, matchedOrbIds);

  set(battleStateAtom, {
    ...currentState,
    board: newBoard,
  });
});

// Atom to heal the most damaged party member
export const healPartyAtom = atom(null, (get, set, amount: number) => {
  const currentState = get(battleStateAtom);

  // Find living party members that aren't at full HP, sorted by HP% ascending
  const healable = getHealableMembers(currentState.party);
  if (healable.length === 0) return;

  // Heal the member with the lowest HP percentage
  const targetHero = healable[0];
  const party = healPartyMember(currentState.party, targetHero.id, amount);

  set(battleStateAtom, {
    ...currentState,
    party,
  });
});

// Atom to clear an entire row of orbs
export const clearBoardRowAtom = atom(null, (get, set, row: number) => {
  const currentState = get(battleStateAtom);
  const board = currentState.board;

  const orbIds = new Set(board[row].map((orb) => orb.id));
  const newBoard = removeMatchedOrbsAndRefill(board, orbIds);

  set(battleStateAtom, {
    ...currentState,
    board: newBoard,
  });
});

// Atom to clear an entire column of orbs
export const clearBoardColumnAtom = atom(null, (get, set, col: number) => {
  const currentState = get(battleStateAtom);
  const board = currentState.board;

  const orbIds = new Set(board.map((row) => row[col].id));
  const newBoard = removeMatchedOrbsAndRefill(board, orbIds);

  set(battleStateAtom, {
    ...currentState,
    board: newBoard,
  });
});

// Derived atom for game status
export const gameStatusAtom = atom((get) => get(battleStateAtom).gameStatus);
export const lastDamageAtom = atom((get) => get(battleStateAtom).lastDamage);
export const lastMatchedTypeAtom = atom((get) => get(battleStateAtom).lastMatchedType);
export const lastSkillActivationAtom = atom((get) => get(battleStateAtom).lastSkillActivation);

// Atom to reduce a specific character's skill cooldown (e.g. from matching their color orbs)
export const reduceSkillCooldownAtom = atom(null, (get, set, characterId: string, amount: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const party = currentState.party.map((char) => {
    if (char.id !== characterId || char.currentHp <= 0 || char.skillCooldown <= 0) return char;
    return {
      ...char,
      skillCooldown: Math.max(0, char.skillCooldown - amount),
    };
  });

  set(battleStateAtom, { ...currentState, party });
});

// Atom to tick skill cooldowns each frame
export const tickSkillCooldownsAtom = atom(null, (get, set, deltaSeconds: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const party = currentState.party.map((char) => {
    if (char.currentHp <= 0 || char.skillCooldown <= 0) return char;
    return {
      ...char,
      skillCooldown: Math.max(0, char.skillCooldown - deltaSeconds),
    };
  });

  set(battleStateAtom, { ...currentState, party });
});

// Atom to activate a character's skill
export const activateSkillAtom = atom(null, (get, set, characterId: string) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const character = currentState.party.find((c) => c.id === characterId);
  if (!character || character.currentHp <= 0 || character.skillCooldown > 0) return;

  const skill = SKILL_DEFINITIONS[character.class];
  const amount = calculateSkillDamage(BASE_SKILL_DAMAGE, character.stats.pow, skill.baseDamageMultiplier, skill.flatDamageBonus);

  let party = currentState.party;
  let enemies = currentState.enemies;
  let selectedEnemyId = currentState.selectedEnemyId;
  let gameStatus = currentState.gameStatus;

  if (skill.target === 'enemy') {
    // Damage the selected enemy
    enemies = enemies.map((e) => {
      if (e.id !== selectedEnemyId) return e;
      return { ...e, currentHp: subtractionWithMin(e.currentHp, amount, 0) };
    });

    // Check if selected enemy just died — auto-select next
    const damagedEnemy = enemies.find((e) => e.id === selectedEnemyId)!;
    if (damagedEnemy.currentHp <= 0) {
      const nextId = getNextLivingEnemyId(enemies, selectedEnemyId);
      if (nextId) selectedEnemyId = nextId;
    }

    // Check if ALL enemies are dead
    if (enemies.every((e) => e.currentHp <= 0)) {
      gameStatus = 'won';
    }
  } else {
    // Heal the most damaged living ally
    const healable = getHealableMembers(party);
    if (healable.length > 0) {
      party = healPartyMember(party, healable[0].id, amount);
    }
  }

  // Put skill back on cooldown
  party = party.map((char) =>
    char.id === characterId
      ? { ...char, skillCooldown: calculateCharacterCooldown(char) }
      : char,
  );

  set(battleStateAtom, {
    ...currentState,
    party,
    enemies,
    selectedEnemyId,
    gameStatus,
    lastSkillActivation: {
      characterId,
      skillName: skill.name,
      amount,
      isHeal: skill.target === 'ally',
      timestamp: Date.now(),
    },
  });
});
