import { atom } from 'jotai';
import type { BattleState, BattleStatus } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { subtractionWithMin } from '~/lib/math';
import { getRandomElement } from '~/lib/utils';
import { INITIAL_PARTY, INITIAL_ENEMIES } from '~/constants/party';
import { BOMB_REFILL_CHANCE } from '~/constants/game';
import { BASE_SKILL_DAMAGE } from '~/constants/skills';
import {
  calculatePartyHpPercentage,
  calculateSkillDamage,
  resolveGuardedDamage,
  decayGuard,
  GUARD_MAX,
} from '~/lib/rpg-calculations';
import { getSelectedSkill, resolveCharacterCooldown } from '~/lib/skill-system';
import {
  getLivingMembers,
  getHealableMembers,
  getDeadMembers,
  damagePartyMember,
  healPartyMember,
  healAndReviveAllPartyMembers,
  isPartyDefeated,
} from '~/lib/party-system';
import { getNextLivingEnemyId, createBattleState } from '~/lib/battle-system';
import {
  hasMatchAtPosition,
  swapOrbs,
  isValidSwap,
  removeMatchedOrbsAndRefill,
} from '~/lib/match-3';

// Use initial data from constants
const initialParty = INITIAL_PARTY;
const initialEnemies = INITIAL_ENEMIES;

// Build the default battle state using the shared factory
const initialBattleState: BattleState = createBattleState(initialParty, initialEnemies);

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

// Derived atoms for the party Guard meter
export const guardAtom = atom((get) => get(battleStateAtom).guard);
export const guardPercentageAtom = atom((get) => (get(battleStateAtom).guard / GUARD_MAX) * 100);

// Atom to select a target enemy
export const selectEnemyAtom = atom(null, (get, set, enemyId: string) => {
  const currentState = get(battleStateAtom);
  const enemy = currentState.enemies.find((e) => e.id === enemyId);
  if (!enemy || enemy.currentHp <= 0) return;
  set(battleStateAtom, { ...currentState, selectedEnemyId: enemyId });
});

// Atom to select an orb
export const selectOrbAtom = atom(null, (get, set, position: GridPosition | null) => {
  const currentState = get(battleStateAtom);
  set(battleStateAtom, {
    ...currentState,
    selectedOrb: position,
  });
});

// Atom to swap orbs (with match validation)
export const swapOrbsAtom = atom(
  null,
  (get, set, from: GridPosition, to: GridPosition) => {
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
  (get, _set, from: GridPosition, to: GridPosition): boolean => {
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

  // The Guard meter mitigates incoming damage before it reaches a hero. The attacking
  // enemy's guardBreak only scales how hard the hit drains the bar, not the mitigation.
  const attacker = attackerEnemyId
    ? currentState.enemies.find((e) => e.id === attackerEnemyId)
    : undefined;
  const { damageTaken, guardAfter, wasFullBlock } = resolveGuardedDamage(
    damage,
    currentState.guard,
    attacker?.guardBreak ?? 1,
  );
  const wasGuarded = damageTaken < damage;

  // Select a random living hero to take the post-Guard damage
  const targetHero = getRandomElement(living);

  const party = damagePartyMember(currentState.party, targetHero.id, damageTaken);
  const gameStatus = isPartyDefeated(party) ? 'lost' : 'playing';

  set(battleStateAtom, {
    ...currentState,
    party,
    guard: guardAfter,
    gameStatus,
    lastDamage: {
      amount: damageTaken,
      target: 'party',
      timestamp: Date.now(),
      characterId: targetHero.id,
      enemyId: attackerEnemyId,
      wasGuarded,
      blocked: wasFullBlock,
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

/**
 * Setup a new battle with specific enemies and party.
 * Call this before navigating to the battle view to configure the encounter.
 */
export const setupBattleAtom = atom(
  null,
  (_get, set, params: { enemies: EnemyData[]; party: CharacterData[] }) => {
    set(battleStateAtom, createBattleState(params.party, params.enemies));
  },
);

// Atom to reset battle (replays the current encounter)
export const resetBattleAtom = atom(null, (get, set) => {
  const currentState = get(battleStateAtom);
  // Re-use the current encounter's enemies so a mid-battle reset replays the same fight
  set(battleStateAtom, createBattleState(initialParty, currentState.enemies));
});

// Atom to remove matched orbs and refill board.
// `bombsToSpawn` guarantees that many refilled orbs become wildcard bombs
// (on top of the per-orb random chance baked into removeMatchedOrbsAndRefill).
export const removeMatchedOrbsAtom = atom(
  null,
  (
    get,
    set,
    matchedOrbIds: Set<string>,
    bombsToSpawn: number = 0,
    bombRefillChance: number = BOMB_REFILL_CHANCE,
    maxBombs: number = Infinity,
  ): number => {
    if (matchedOrbIds.size === 0) return 0;

    const currentState = get(battleStateAtom);
    const { board, bombsSpawned } = removeMatchedOrbsAndRefill(
      currentState.board,
      matchedOrbIds,
      bombsToSpawn,
      bombRefillChance,
      maxBombs,
    );

    set(battleStateAtom, {
      ...currentState,
      board,
    });

    return bombsSpawned;
  },
);

// Atom to heal the most damaged party member (revives dead members first)
export const healPartyAtom = atom(
  null,
  (get, set, params: { amount: number; source: 'match' | 'potion' }) => {
    const currentState = get(battleStateAtom);
    const { amount, source } = params;

    // Dead members take priority — revive the first one found
    const dead = getDeadMembers(currentState.party);
    if (dead.length > 0) {
      const target = dead[0];
      // Healer match: double healing. Potion: 1 HP + potion amount.
      const reviveAmount = source === 'match' ? amount * 2 : 1 + amount;
      const party = healPartyMember(currentState.party, target.id, reviveAmount);
      set(battleStateAtom, { ...currentState, party });
      return;
    }

    // Otherwise heal the most damaged living member
    const healable = getHealableMembers(currentState.party);
    if (healable.length === 0) return;

    const targetHero = healable[0];
    const party = healPartyMember(currentState.party, targetHero.id, amount);

    set(battleStateAtom, {
      ...currentState,
      party,
    });
  },
);

// Atom to clear an entire row of orbs
export const clearBoardRowAtom = atom(null, (get, set, row: number) => {
  const currentState = get(battleStateAtom);
  const board = currentState.board;

  const orbIds = new Set(board[row].map((orb) => orb.id));
  const newBoard = removeMatchedOrbsAndRefill(board, orbIds);

  set(battleStateAtom, {
    ...currentState,
    board: newBoard.board,
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
    board: newBoard.board,
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

// Atom to fill all party members' ultimate bars by a percentage of their max cooldown
export const fillPartyUltimateAtom = atom(null, (get, set, amount: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const party = currentState.party.map((char) => {
    if (char.currentHp <= 0 || char.skillCooldown <= 0) return char;
    const maxCooldown = resolveCharacterCooldown(char);
    const reduction = maxCooldown * amount;
    return {
      ...char,
      skillCooldown: Math.max(0, char.skillCooldown - reduction),
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

// Atom to add to the party Guard meter (e.g. from matching gray orbs)
export const addGuardAtom = atom(null, (get, set, amount: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing' || amount <= 0) return;

  set(battleStateAtom, {
    ...currentState,
    guard: Math.min(GUARD_MAX, currentState.guard + amount),
  });
});

// Atom to bleed the Guard meter over time (anti-hoard decay)
export const tickGuardDecayAtom = atom(null, (get, set, deltaSeconds: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing' || currentState.guard <= 0) return;

  set(battleStateAtom, {
    ...currentState,
    guard: decayGuard(currentState.guard, deltaSeconds),
  });
});

// Atom to increment turn counter
export const incrementTurnAtom = atom(null, (get, set) => {
  const currentState = get(battleStateAtom);
  set(battleStateAtom, {
    ...currentState,
    turn: currentState.turn + 1,
  });
});

// Atom to add score
export const addScoreAtom = atom(null, (get, set, points: number) => {
  const currentState = get(battleStateAtom);
  set(battleStateAtom, {
    ...currentState,
    score: currentState.score + points,
  });
});

// Atom to activate a character's skill
export const activateSkillAtom = atom(null, (get, set, characterId: string) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const character = currentState.party.find((c) => c.id === characterId);
  if (!character || character.currentHp <= 0 || character.skillCooldown > 0) return;

  const skill = getSelectedSkill(character);
  const amount = calculateSkillDamage(BASE_SKILL_DAMAGE, character.stats.pow, skill.baseDamageMultiplier, skill.flatDamageBonus);

  let party = currentState.party;
  let enemies = currentState.enemies;
  let selectedEnemyId = currentState.selectedEnemyId;
  let gameStatus: BattleStatus = currentState.gameStatus;

  // Capture which enemy/enemies took the hit BEFORE selection advances on death,
  // so the flinch lands on the sprite that was actually struck.
  const hitEnemyId = selectedEnemyId;
  const hitEnemyIds = enemies.filter((e) => e.currentHp > 0).map((e) => e.id);

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
  } else if (skill.target === 'allEnemy') {
    // Damage every living enemy
    enemies = enemies.map((e) =>
      e.currentHp <= 0 ? e : { ...e, currentHp: subtractionWithMin(e.currentHp, amount, 0) },
    );

    // Re-select if the current target died
    const selectedEnemy = enemies.find((e) => e.id === selectedEnemyId);
    if (selectedEnemy && selectedEnemy.currentHp <= 0) {
      const nextId = getNextLivingEnemyId(enemies, selectedEnemyId);
      if (nextId) selectedEnemyId = nextId;
    }

    // Check if ALL enemies are dead
    if (enemies.every((e) => e.currentHp <= 0)) {
      gameStatus = 'won';
    }
  } else if (skill.target === 'allAlly') {
    // Heal all living party members and revive dead ones with half healing
    party = healAndReviveAllPartyMembers(party, amount, Math.floor(amount / 2));
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
      ? { ...char, skillCooldown: resolveCharacterCooldown(char) }
      : char,
  );

  // Drive the enemy hit reaction (flinch + number) through the shared lastDamage channel.
  // Heals are left out — they keep flowing through the party-side feedback.
  const timestamp = Date.now();
  let lastDamage = currentState.lastDamage;
  if (skill.target === 'enemy') {
    lastDamage = { amount, target: 'enemy', timestamp, enemyId: hitEnemyId, source: 'skill' };
  } else if (skill.target === 'allEnemy') {
    lastDamage = { amount, target: 'enemy', timestamp, enemyIds: hitEnemyIds, source: 'skill' };
  }

  set(battleStateAtom, {
    ...currentState,
    party,
    enemies,
    selectedEnemyId,
    gameStatus,
    lastDamage,
    lastSkillActivation: {
      characterId,
      skillName: skill.name,
      amount,
      isHeal: skill.target === 'ally' || skill.target === 'allAlly',
      timestamp,
    },
  });
});
