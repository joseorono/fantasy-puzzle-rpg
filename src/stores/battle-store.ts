import { atom } from 'jotai';
import type { BattleState } from '~/types/battle';
import { randIntInRange, subtractionWithMin } from '~/lib/math';
import { INITIAL_PARTY, INITIAL_ENEMY } from '~/constants/game';
import { calculatePartyCurrentHp, calculatePartyHpPercentage } from '~/lib/rpg-calculations';
import {
  createInitialBoard,
  hasMatchAtPosition,
  swapOrbs,
  isValidSwap,
  removeMatchedOrbsAndRefill,
} from '~/lib/match-3';

// Use initial data from constants
const initialParty = INITIAL_PARTY;
const initialEnemy = INITIAL_ENEMY;

// Initial battle state
const initialBattleState: BattleState = {
  party: initialParty,
  enemy: initialEnemy,
  board: createInitialBoard(),
  selectedOrb: null,
  currentMatches: [],
  score: 0,
  turn: 1,
  gameStatus: 'playing',
  lastDamage: null,
  lastMatchedType: null,
  enemyAttackTimestamp: null,
};

// Jotai atoms
export const battleStateAtom = atom<BattleState>(initialBattleState);
export const partyAtom = atom((get) => get(battleStateAtom).party);
export const enemyAtom = atom((get) => get(battleStateAtom).enemy);
export const boardAtom = atom((get) => get(battleStateAtom).board);
export const selectedOrbAtom = atom((get) => get(battleStateAtom).selectedOrb);
export const currentMatchesAtom = atom((get) => get(battleStateAtom).currentMatches);

// Derived atom for party health percentage
export const partyHealthPercentageAtom = atom((get) => {
  const party = get(partyAtom);
  return calculatePartyHpPercentage(party);
});

// Atom to select an orb
export const selectOrbAtom = atom(
  null,
  (get, set, position: { row: number; col: number } | null) => {
    const currentState = get(battleStateAtom);
    set(battleStateAtom, {
      ...currentState,
      selectedOrb: position,
    });
  }
);

// Atom to swap orbs (with match validation)
export const swapOrbsAtom = atom(
  null,
  (get, set, from: { row: number; col: number }, to: { row: number; col: number }) => {
    const currentState = get(battleStateAtom);
    const newBoard = swapOrbs(currentState.board, from, to);

    // Check if the swap creates a match
    const createsMatch = hasMatchAtPosition(newBoard, from.row, from.col) ||
                         hasMatchAtPosition(newBoard, to.row, to.col);

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
  }
);

// Atom to check if a swap would be valid (for preview)
export const checkSwapValidityAtom = atom(
  null,
  (get, _set, from: { row: number; col: number }, to: { row: number; col: number }): boolean => {
    const currentState = get(battleStateAtom);
    return isValidSwap(currentState.board, from, to);
  }
);

// Atom to damage party (targets random living hero)
export const damagePartyAtom = atom(
  null,
  (get, set, damage: number) => {
    const currentState = get(battleStateAtom);
    const party = [...currentState.party];

    // Get living party members
    const livingMembers = party.filter(char => char.currentHp > 0);
    if (livingMembers.length === 0) return;

    // Select a random living hero to take damage
    const targetIndex = randIntInRange(0, livingMembers.length - 1);
    const targetHero = livingMembers[targetIndex];

    // Find and damage the target hero
    const heroIndex = party.findIndex(char => char.id === targetHero.id);
    if (heroIndex !== -1) {
      party[heroIndex] = {
        ...party[heroIndex],
        currentHp: subtractionWithMin(party[heroIndex].currentHp, damage, 0),
      };
    }

    // Check if party is defeated
    const totalHp = calculatePartyCurrentHp(party);
    const gameStatus = totalHp <= 0 ? 'lost' : 'playing';

    set(battleStateAtom, {
      ...currentState,
      party,
      gameStatus,
      lastDamage: {
        amount: damage,
        target: 'party',
        timestamp: Date.now(),
        characterId: targetHero.id,
      },
    });
  }
);

// Atom to damage enemy
export const damageEnemyAtom = atom(
  null,
  (get, set, damage: number) => {
    const currentState = get(battleStateAtom);
    const enemy = { ...currentState.enemy };

    enemy.currentHp = subtractionWithMin(enemy.currentHp, damage, 0);

    // Check if enemy is defeated
    const gameStatus = enemy.currentHp <= 0 ? 'won' : 'playing';

    set(battleStateAtom, {
      ...currentState,
      enemy,
      gameStatus,
      lastDamage: { amount: damage, target: 'enemy', timestamp: Date.now() },
    });
  }
);

// Atom to reset battle
export const resetBattleAtom = atom(null, (_get, set) => {
  set(battleStateAtom, {
    party: initialParty.map(char => ({ ...char, currentHp: char.maxHp, skillCooldown: 0 })),
    enemy: { ...initialEnemy, currentHp: initialEnemy.maxHp },
    board: createInitialBoard(),
    selectedOrb: null,
    currentMatches: [],
    score: 0,
    turn: 1,
    gameStatus: 'playing',
    lastDamage: null,
    lastMatchedType: null,
  });
});

// Atom to remove matched orbs and refill board
export const removeMatchedOrbsAtom = atom(
  null,
  (get, set, matchedOrbIds: Set<string>) => {
    if (matchedOrbIds.size === 0) return;

    const currentState = get(battleStateAtom);
    const newBoard = removeMatchedOrbsAndRefill(currentState.board, matchedOrbIds);

    set(battleStateAtom, {
      ...currentState,
      board: newBoard,
    });
  }
);

// Derived atom for game status
export const gameStatusAtom = atom((get) => get(battleStateAtom).gameStatus);
export const lastDamageAtom = atom((get) => get(battleStateAtom).lastDamage);
export const lastMatchedTypeAtom = atom((get) => get(battleStateAtom).lastMatchedType);
