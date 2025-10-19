import { atom } from 'jotai';
import type { BattleState, Character, Enemy, Orb, OrbColor } from '~/types/battle';
import { randIntInRange, substractionWithMin } from '~/lib/math';

// Helper function to generate a random orb color
const getRandomOrbColor = (): OrbColor => {
  const colors: OrbColor[] = ['blue', 'green', 'purple', 'yellow', 'gray'];
  return colors[randIntInRange(0, colors.length - 1)];
};

// Helper function to check if there's a match at a position
const hasMatchAtPosition = (board: Orb[][], row: number, col: number): boolean => {
  const color = board[row][col].color;
  const rows = board.length;
  const cols = board[0].length;
  
  // Check horizontal match (3 or more)
  let horizontalCount = 1;
  // Check left
  for (let c = col - 1; c >= 0 && board[row][c].color === color; c--) {
    horizontalCount++;
  }
  // Check right
  for (let c = col + 1; c < cols && board[row][c].color === color; c++) {
    horizontalCount++;
  }
  if (horizontalCount >= 3) return true;
  
  // Check vertical match (3 or more)
  let verticalCount = 1;
  // Check up
  for (let r = row - 1; r >= 0 && board[r][col].color === color; r--) {
    verticalCount++;
  }
  // Check down
  for (let r = row + 1; r < rows && board[r][col].color === color; r++) {
    verticalCount++;
  }
  if (verticalCount >= 3) return true;
  
  return false;
};

// Helper function to create initial board
const createInitialBoard = (rows: number = 8, cols: number = 6): Orb[][] => {
  const board: Orb[][] = [];
  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = {
        id: `orb-${row}-${col}`,
        color: getRandomOrbColor(),
        row,
        col,
      };
    }
  }
  return board;
};

// Initial party setup
const initialParty: Character[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    maxHp: 120,
    currentHp: 120,
    skillCooldown: 0,
    maxCooldown: 3,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    class: 'rogue',
    color: 'green',
    maxHp: 90,
    currentHp: 90,
    skillCooldown: 0,
    maxCooldown: 2,
  },
  {
    id: 'mage',
    name: 'Mage',
    class: 'mage',
    color: 'purple',
    maxHp: 80,
    currentHp: 80,
    skillCooldown: 0,
    maxCooldown: 4,
  },
  {
    id: 'healer',
    name: 'Healer',
    class: 'healer',
    color: 'yellow',
    maxHp: 100,
    currentHp: 100,
    skillCooldown: 0,
    maxCooldown: 3,
  },
];

// Initial enemy setup
const initialEnemy: Enemy = {
  id: 'moss-golem',
  name: 'Moss Golem',
  type: 'golem',
  maxHp: 300,
  currentHp: 300,
  sprite: '🗿', // Placeholder - will be replaced with pixel art
  attackInterval: 4000, // 4 seconds
  attackDamage: 25,
};

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
  lastMatchedColor: null,
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
  const totalMaxHp = party.reduce((sum, char) => sum + char.maxHp, 0);
  const totalCurrentHp = party.reduce((sum, char) => sum + char.currentHp, 0);
  return (totalCurrentHp / totalMaxHp) * 100;
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
    const newBoard = currentState.board.map(row => [...row]);
    
    // Swap orbs
    const temp = newBoard[from.row][from.col];
    newBoard[from.row][from.col] = newBoard[to.row][to.col];
    newBoard[to.row][to.col] = temp;
    
    // Update positions
    newBoard[from.row][from.col].row = from.row;
    newBoard[from.row][from.col].col = from.col;
    newBoard[to.row][to.col].row = to.row;
    newBoard[to.row][to.col].col = to.col;
    
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
    const testBoard = currentState.board.map(row => [...row]);
    
    // Swap orbs temporarily
    const temp = testBoard[from.row][from.col];
    testBoard[from.row][from.col] = testBoard[to.row][to.col];
    testBoard[to.row][to.col] = temp;
    
    // Check if the swap creates a match
    return hasMatchAtPosition(testBoard, from.row, from.col) || 
           hasMatchAtPosition(testBoard, to.row, to.col);
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
        currentHp: substractionWithMin(party[heroIndex].currentHp, damage, 0),
      };
    }
    
    // Check if party is defeated
    const totalHp = party.reduce((sum, char) => sum + char.currentHp, 0);
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
    
    enemy.currentHp = substractionWithMin(enemy.currentHp, damage, 0);
    
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
    lastMatchedColor: null,
  });
});

// Atom to remove matched orbs and refill board
export const removeMatchedOrbsAtom = atom(
  null,
  (get, set, matchedOrbIds: Set<string>) => {
    if (matchedOrbIds.size === 0) return;
    
    const currentState = get(battleStateAtom);
    const newBoard = currentState.board.map(row => [...row]);
    const rows = newBoard.length;
    const cols = newBoard[0].length;
    
    // Mark matched orbs for removal
    const matchedPositions = new Set<string>();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (matchedOrbIds.has(newBoard[row][col].id)) {
          matchedPositions.add(`${row}-${col}`);
        }
      }
    }
    
    // Process each column for gravity
    for (let col = 0; col < cols; col++) {
      // Collect non-matched orbs from bottom to top
      const remainingOrbs: Orb[] = [];
      for (let row = rows - 1; row >= 0; row--) {
        if (!matchedPositions.has(`${row}-${col}`)) {
          remainingOrbs.push(newBoard[row][col]);
        }
      }
      
      // Calculate how many new orbs we need
      const newOrbsNeeded = rows - remainingOrbs.length;
      
      // Fill from bottom with remaining orbs
      for (let i = 0; i < remainingOrbs.length; i++) {
        const row = rows - 1 - i;
        newBoard[row][col] = {
          ...remainingOrbs[i],
          row,
          col,
        };
      }
      
      // Fill top with new random orbs
      for (let i = 0; i < newOrbsNeeded; i++) {
        const row = newOrbsNeeded - 1 - i;
        newBoard[row][col] = {
          id: `orb-${Date.now()}-${row}-${col}`,
          color: getRandomOrbColor(),
          row,
          col,
        };
      }
    }
    
    set(battleStateAtom, {
      ...currentState,
      board: newBoard,
    });
  }
);

// Derived atom for game status
export const gameStatusAtom = atom((get) => get(battleStateAtom).gameStatus);
export const lastDamageAtom = atom((get) => get(battleStateAtom).lastDamage);
export const lastMatchedColorAtom = atom((get) => get(battleStateAtom).lastMatchedColor);
