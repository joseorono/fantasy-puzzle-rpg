import { atom, type Atom } from 'jotai';
import type {
  ArmedLineClear,
  BattleMode,
  BattleState,
  BattleStatus,
  EnemyPoiseState,
  EnemyPoiseSummary,
  LineClearRequest,
  LineOrientation,
} from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { CharacterData, EnemyData, OrbType } from '~/types/rpg-elements';
import { subtractionWithMin } from '~/lib/math';
import { getRandomElement } from '~/lib/utils';
import { INITIAL_PARTY, INITIAL_ENEMIES } from '~/constants/party';
import { BOMB_REFILL_CHANCE } from '~/constants/board';
import { GUARD_MAX, POISE_SKILL_MULTIPLIER, PREEMPTIVE_STRIKE_DAMAGE_BONUS } from '~/constants/battle';
import { BASE_SKILL_DAMAGE } from '~/constants/skills';
import { weighHitsByAttacker } from '~/lib/flinch-system';
import {
  applyPoiseHits,
  countEnemyBreaks,
  isEnemyStaggered,
  poiseSummariesMatch,
  resolveStaggeredEnemySignature,
  resolveVulnerableDamage,
  resolveVulnerableHits,
  summarizeEnemyPoise,
  tickEnemyPoise,
} from '~/lib/poise-system';
import {
  calculateGuardDecayResistance,
  calculateItemCooldownInMs,
  calculatePartyHpPercentage,
  calculateSkillDamage,
  resolveGuardedDamage,
  decayGuard,
} from '~/lib/rpg-calculations';
import {
  getSelectedSkill,
  getSkillLevel,
  resolveActiveSkillStats,
  resolveCharacterCooldown,
  getCharacterPassiveModifiers,
  getPartyPassiveModifiers,
} from '~/lib/skill-system';
import {
  getLivingMembers,
  getHealableMembers,
  getDeadMembers,
  damagePartyMember,
  healPartyMember,
  healAndReviveAllPartyMembers,
  isPartyDefeated,
} from '~/lib/party-system';
import {
  getNextLivingEnemyId,
  createBattleState,
  tickPartySkillCooldowns,
  reducePartySkillCooldowns,
  type SkillCooldownReduction,
} from '~/lib/battle-system';
import { swapOrbs, isValidSwap } from '~/lib/match-3';
import { getLineCount } from '~/lib/line-clear';
import { removeMatchedOrbsAndRefill } from '~/lib/board-generation';
import type { BattleRatingResult } from '~/lib/battle-rating';

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

// Narrow party selectors. `partyAtom` changes identity on every cooldown tick while any skill is
// counting down; these derive primitives from it, and Jotai only notifies dependents when a derived
// value fails `Object.is`, so their subscribers sit out the ticks entirely.

// Space-joined `dead-<color>` classes for the board (dead heroes' orbs are drawn inert). Gray has no hero.
export const deadOrbColorClassesAtom = atom((get) =>
  get(partyAtom)
    .filter((char) => char.currentHp <= 0 && char.color !== 'gray')
    .map((char) => `dead-${char.color}`)
    .join(' '),
);

// Shared battle-item cooldown (ms), from the party's collective SPD plus passive bonuses.
export const itemCooldownMsAtom = atom((get) => {
  const party = get(partyAtom);
  return calculateItemCooldownInMs(party, getPartyPassiveModifiers(party).itemCooldownSpdBonus);
});

// The roster as one joined string, so the party grid can lay out its slots without re-rendering
// on cooldown ticks.
export const partyMemberIdsAtom = atom((get) =>
  get(partyAtom)
    .map((char) => char.id)
    .join(','),
);

// One derived atom per hero, cached by id. Every party mutation copies only the members it touches,
// so a member atom keeps its value's identity — and stays silent — until *that* hero changes.
const partyMemberAtoms = new Map<string, Atom<CharacterData | undefined>>();
export function partyMemberAtom(characterId: string): Atom<CharacterData | undefined> {
  let memberAtom = partyMemberAtoms.get(characterId);
  if (!memberAtom) {
    memberAtom = atom((get) => get(partyAtom).find((char) => char.id === characterId));
    partyMemberAtoms.set(characterId, memberAtom);
  }
  return memberAtom;
}

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
export const swapOrbsAtom = atom(null, (get, set, from: GridPosition, to: GridPosition) => {
  const currentState = get(battleStateAtom);

  // Invalid swap: don't update state at all - keep the selection
  if (!isValidSwap(currentState.board, from, to)) return false;

  set(battleStateAtom, {
    ...currentState,
    board: swapOrbs(currentState.board, from, to),
    selectedOrb: null,
  });
  return true;
});

// Atom to check if a swap would be valid (for preview)
export const checkSwapValidityAtom = atom(null, (get, _set, from: GridPosition, to: GridPosition): boolean => {
  const currentState = get(battleStateAtom);
  return isValidSwap(currentState.board, from, to);
});

// Atom to damage party (targets random living hero)
export const damagePartyAtom = atom(null, (get, set, damage: number, attackerEnemyId?: string) => {
  const currentState = get(battleStateAtom);

  // Get living party members
  const living = getLivingMembers(currentState.party);
  if (living.length === 0) return;

  // The Guard meter mitigates incoming damage before it reaches a hero. The attacking
  // enemy's guardBreak only scales how hard the hit drains the bar, not the mitigation.
  const attacker = attackerEnemyId ? currentState.enemies.find((e) => e.id === attackerEnemyId) : undefined;
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

type EnemyHit = { amount: number; characterId?: string };

/** A batched match: every damaging color at once, plus the cascade depth it landed at (0 = the swap). */
type EnemyHitBatch = { hits: EnemyHit[]; cascadeLevel?: number };

// Atom to damage the selected enemy. A multi-color match lands all of its colors as ONE batched
// call (`{ hits }`) so a single `lastDamage` event carries every hit: consumers that only see the
// final commit (the stagger hook, the damage popup) would otherwise miss all but the last one.
// The same hits also deal poise damage (see ~/lib/poise-system) in this same write, so HP and
// poise can never disagree; a Break here is what the attack-timer hook reacts to.
export const damageEnemyAtom = atom(null, (get, set, hit: number | EnemyHit | EnemyHitBatch) => {
  const hits: EnemyHit[] =
    typeof hit === 'number' ? [{ amount: hit, characterId: undefined }] : 'hits' in hit ? hit.hits : [hit];
  if (hits.length === 0) return;
  const cascadeLevel = typeof hit === 'object' && 'hits' in hit ? (hit.cascadeLevel ?? 0) : 0;
  const currentState = get(battleStateAtom);

  // The fight is already decided and the win is just waiting on the cascade to settle. Any
  // further chained hits land on corpses — no-op them so HP stays put and, crucially, no
  // `lastDamage` fires (which would pop a damage number over a dead enemy).
  if (currentState.pendingVictory) return;

  const selectedId = currentState.selectedEnemyId;
  const poiseBefore: EnemyPoiseState | undefined = currentState.enemyPoise[selectedId];

  // A hit on an enemy still observing (on standby) lands as a "preemptive strike" for bonus damage.
  const isPreemptive = (currentState.standbyEnemyIds ?? []).includes(selectedId);
  // A hit on a Broken enemy lands in its vulnerable window. Read from the PRE-hit state, so the
  // hit that causes a Break never gets the bonus itself.
  const isStaggered = poiseBefore ? isEnemyStaggered(poiseBefore) : false;
  const preemptiveHits = isPreemptive
    ? hits.map((h) => ({ ...h, amount: Math.round(h.amount * (1 + PREEMPTIVE_STRIKE_DAMAGE_BONUS)) }))
    : hits;
  const finalHits = resolveVulnerableHits(preemptiveHits, isStaggered);
  const finalDamage = finalHits.reduce((sum, h) => sum + h.amount, 0);
  const characterId = finalHits[finalHits.length - 1].characterId;

  const enemies = currentState.enemies.map((e) => {
    if (e.id !== selectedId) return e;
    return { ...e, currentHp: subtractionWithMin(e.currentHp, finalDamage, 0) };
  });

  // Check if selected enemy just died — auto-select next living enemy
  const damagedEnemy = enemies.find((e) => e.id === selectedId)!;
  let newSelectedId = selectedId;
  if (damagedEnemy.currentHp <= 0) {
    const nextId = getNextLivingEnemyId(enemies, selectedId);
    if (nextId) newSelectedId = nextId;
  }

  // Check if ALL enemies are dead. Rather than flip to 'won' immediately (which would cut the
  // combo chain short and freeze the rating early), mark victory as *pending* and keep playing so
  // the in-flight cascade finishes and fully counts. The board's settle branch commits the win.
  const allDead = enemies.every((e) => e.currentHp <= 0);

  const timestamp = Date.now();

  // Poise damage from the raw hits (the bonuses above are HP-only). Skipped only on a killing blow.
  // A standby target still takes poise damage so the bar moves from the opening move, but cannot
  // Break until it has an attack to cancel. `applyPoiseHits` itself no-ops while Broken/immune.
  let enemyPoise = currentState.enemyPoise;
  let lastPoiseBreak = currentState.lastPoiseBreak;
  if (poiseBefore && damagedEnemy.currentHp > 0) {
    const poiseHits = weighHitsByAttacker(hits, currentState.party, POISE_SKILL_MULTIPLIER, 'match');
    const { next, didBreak } = applyPoiseHits(poiseBefore, poiseHits, damagedEnemy.poise ?? 1, {
      cascadeLevel,
      canBreak: !isPreemptive,
    });
    if (next !== poiseBefore) enemyPoise = { ...enemyPoise, [selectedId]: next };
    if (didBreak) lastPoiseBreak = { enemyIds: [selectedId], timestamp };
  }

  set(battleStateAtom, {
    ...currentState,
    enemies,
    selectedEnemyId: newSelectedId,
    pendingVictory: allDead,
    totalDamageDealt: (currentState.totalDamageDealt ?? 0) + finalDamage,
    lastDamage: { amount: finalDamage, target: 'enemy', timestamp, enemyId: selectedId, characterId, hits: finalHits },
    lastPreemptiveStrike: isPreemptive ? { timestamp } : currentState.lastPreemptiveStrike,
    enemyPoise,
    lastPoiseBreak,
  });
});

/**
 * Setup a new battle with specific enemies and party.
 * Call this before navigating to the battle view to configure the encounter.
 */
export const setupBattleAtom = atom(
  null,
  (_get, set, params: { enemies: EnemyData[]; party: CharacterData[]; mode?: BattleMode }) => {
    set(battleStateAtom, createBattleState(params.party, params.enemies, { mode: params.mode }));
    set(resetLineClearAtom);
  },
);

// Atom to reset battle (replays the current encounter)
export const resetBattleAtom = atom(null, (get, set) => {
  const currentState = get(battleStateAtom);
  // Re-use the current encounter's enemies so a mid-battle reset replays the same fight
  set(battleStateAtom, createBattleState(initialParty, currentState.enemies, { mode: currentState.mode }));
  set(resetLineClearAtom);
});

// Ends a fight the player walks out of. Only the training leave path calls it; every "is the
// battle over" check already treats any non-'playing' status as finished, so the next entry
// re-arms through `ensureFreshBattleAtom` exactly as it does after a win.
export const abandonBattleAtom = atom(null, (get, set) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;
  set(battleStateAtom, { ...currentState, gameStatus: 'abandoned', pendingVictory: false });
});

/**
 * Re-arm the encounter when the battle view is entered onto an already-finished fight,
 * so re-entry always starts fresh with enemies at full HP. No-op while a battle is in
 * progress, so it never clobbers an encounter a caller just set up (e.g. the map's
 * `setupBattleAtom`). Reuses the current encounter's enemies and the passed-in party.
 */
export const ensureFreshBattleAtom = atom(null, (get, set, party: CharacterData[]) => {
  const state = get(battleStateAtom);
  if (state.gameStatus === 'playing') return;
  set(battleStateAtom, createBattleState(party, state.enemies, { mode: state.mode }));
  set(resetLineClearAtom);
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
    const { board, bombsSpawned, wasReshuffled } = removeMatchedOrbsAndRefill(currentState.board, matchedOrbIds, {
      bombsToSpawn,
      bombRefillChance,
      maxBombs,
    });

    set(battleStateAtom, {
      ...currentState,
      board,
      lastReshuffle: wasReshuffled ? { timestamp: Date.now() } : currentState.lastReshuffle,
    });

    return bombsSpawned;
  },
);

// Atom to heal the most damaged party member (revives dead members first)
export const healPartyAtom = atom(null, (get, set, params: { amount: number; source: 'match' | 'potion' }) => {
  const currentState = get(battleStateAtom);
  const { amount, source } = params;

  // Dead members take priority — revive the healer first, else the first one found
  const dead = getDeadMembers(currentState.party);
  if (dead.length > 0) {
    const target = dead.find((char) => char.class === 'healer') ?? dead[0];
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
});

// ─── Line-clear items (Row Clear / Column Clear) ─────────────────────────────
// Firing is split from resolving: the item bar (or the board, in aim mode) files a request, and the
// board resolves it once it has settled. See docs/LINE_CLEAR_ITEMS.md.

/**
 * The line-clear item the player is currently aiming with, if any. Transient UI state: it lives
 * outside `BattleState` so arming never touches the battle or the save.
 */
export const armedLineClearAtom = atom<ArmedLineClear | null>(null);

/**
 * A fired line clear waiting to resolve. The board picks it up as soon as it settles, resolves the
 * payout, and clears it. Holds the line, not the orb ids — see {@link LineClearRequest}.
 */
export const pendingLineClearAtom = atom<LineClearRequest | null>(null);

/**
 * Fires when an item is actually spent from the board rather than from its own button, so the item
 * bar can decrement the stack and start the shared cooldown without the two components knowing
 * about each other.
 */
export const lastItemFiredAtom = atom<{ itemId: string; timestamp: number } | null>(null);

/**
 * Commits an aimed line clear: files the request, announces the spend, and disarms. Refuses when the
 * battle is over or a clear is already queued, so one cooldown can never buy two clears.
 */
export const fireLineClearAtom = atom(
  null,
  (get, set, params: { itemId: string; orientation: LineOrientation; index: number }): boolean => {
    const currentState = get(battleStateAtom);
    if (currentState.gameStatus !== 'playing') return false;
    if (get(pendingLineClearAtom) !== null) return false;

    const { itemId, orientation, index } = params;
    if (index < 0 || index >= getLineCount(currentState.board, orientation)) return false;

    const timestamp = Date.now();
    set(pendingLineClearAtom, { orientation, index, timestamp });
    set(lastItemFiredAtom, { itemId, timestamp });
    set(armedLineClearAtom, null);
    return true;
  },
);

/**
 * The last line clear the board actually resolved (not merely fired — a queued request waits for
 * the cascade). Drives the "ROW CLEAR!" / "COLUMN CLEAR!" callout; a new timestamp replays it.
 */
export const lastLineClearAtom = atom<{ orientation: LineOrientation; timestamp: number } | null>(null);

/** Drops any armed, queued or just-resolved line clear. Called whenever an encounter is (re)armed. */
export const resetLineClearAtom = atom(null, (_get, set) => {
  set(armedLineClearAtom, null);
  set(pendingLineClearAtom, null);
  set(lastLineClearAtom, null);
});

// Derived atom for game status
export const gameStatusAtom = atom((get) => get(battleStateAtom).gameStatus);
// True while all enemies are dead but the killing-blow cascade is still resolving. The board
// reads this to lock input during the finish and to commit the win once it settles.
export const pendingVictoryAtom = atom((get) => get(battleStateAtom).pendingVictory);
// Commits a pending victory once the board settles: flips to 'won' so the BattleOverModal
// reveals the rating — by now the cascade has finished and `maxCombo` is final.
export const commitPendingVictoryAtom = atom(null, (get, set) => {
  const currentState = get(battleStateAtom);
  if (!currentState.pendingVictory) return;
  set(battleStateAtom, { ...currentState, gameStatus: 'won', pendingVictory: false });
});
// Narrow derived atoms so UI that only shows turn/score doesn't re-render on every
// board/HP/match change (see BattleTopBar).
export const turnAtom = atom((get) => get(battleStateAtom).turn);
export const scoreAtom = atom((get) => get(battleStateAtom).score);
// `?? 'standard'` guards any pre-existing state object without the field.
export const battleModeAtom = atom((get) => get(battleStateAtom).mode ?? 'standard');
export const isTrainingBattleAtom = atom((get) => get(battleModeAtom) === 'training');
export const totalDamageDealtAtom = atom((get) => get(battleStateAtom).totalDamageDealt ?? 0);
export const lastDamageAtom = atom((get) => get(battleStateAtom).lastDamage);
export const lastMatchedTypeAtom = atom((get) => get(battleStateAtom).lastMatchedType);
export const lastSkillActivationAtom = atom((get) => get(battleStateAtom).lastSkillActivation);
// Per-enemy start-of-battle standby delays (ms), regenerated whenever a new battle is created.
// `?? {}` guards any pre-existing state object without the field.
export const enemyStandbyMsAtom = atom((get) => get(battleStateAtom).enemyStandbyMs ?? {});
// Ids of enemies still observing (on standby). Drives the eye/gold ring and the preemptive-strike bonus.
export const standbyEnemyIdsAtom = atom((get) => get(battleStateAtom).standbyEnemyIds ?? []);
// Centered "Preemptive Strike!" callout trigger (see PreemptiveStrikeIndicator).
export const lastPreemptiveStrikeAtom = atom((get) => get(battleStateAtom).lastPreemptiveStrike ?? null);
// Centered "No moves! Reshuffle!" callout trigger (see BoardReshuffleIndicator).
export const lastReshuffleAtom = atom((get) => get(battleStateAtom).lastReshuffle ?? null);
// Per-enemy "Flinched!" callout trigger — fires when an enemy hits its per-cycle flinch cap.
export const lastMaxFlinchAtom = atom((get) => get(battleStateAtom).lastMaxFlinch ?? null);

// ─── Enemy Poise / Break (see ~/lib/poise-system) ────────────────────────────
// Per-enemy poise pools and Break windows. `?? {}` guards any pre-existing state object without the field.
export const enemyPoiseAtom = atom((get) => get(battleStateAtom).enemyPoise ?? {});
// Per-enemy "Staggered!" callout trigger — fires when a hit empties an enemy's poise pool.
export const lastPoiseBreakAtom = atom((get) => get(battleStateAtom).lastPoiseBreak ?? null);
// Ids of every Broken enemy as one string, so the attack-timer hook is only notified on a Break or a
// recovery — never on the per-tick countdown (a string compares by value; see `rosterSignature`).
export const staggeredEnemySignatureAtom = atom((get) => resolveStaggeredEnemySignature(get(enemyPoiseAtom)));

// One derived atom per enemy, cached by id. The tick and the damage path copy only the entries
// they touch, so an enemy's atom keeps its value's identity — and stays silent — until *that*
// enemy's pool or windows move.
const enemyPoiseStateAtoms = new Map<string, Atom<EnemyPoiseState | undefined>>();
export function enemyPoiseStateAtom(enemyId: string): Atom<EnemyPoiseState | undefined> {
  let poiseAtom = enemyPoiseStateAtoms.get(enemyId);
  if (!poiseAtom) {
    poiseAtom = atom((get) => get(enemyPoiseAtom)[enemyId]);
    enemyPoiseStateAtoms.set(enemyId, poiseAtom);
  }
  return poiseAtom;
}

// What the poise bar draws for one enemy, in integer percents, cached by id. With regen on, a
// dented pool's raw state moves on every tick; this hands back the previous summary whenever
// nothing visible changed, so the sprite sits out those ticks and only re-renders on a real flip.
const enemyPoiseSummaryAtoms = new Map<string, Atom<EnemyPoiseSummary | undefined>>();
export function enemyPoiseSummaryAtom(enemyId: string): Atom<EnemyPoiseSummary | undefined> {
  let summaryAtom = enemyPoiseSummaryAtoms.get(enemyId);
  if (!summaryAtom) {
    let lastSummary: EnemyPoiseSummary | undefined;
    summaryAtom = atom((get) => {
      const state = get(enemyPoiseStateAtom(enemyId));
      if (!state) return (lastSummary = undefined);
      const summary = summarizeEnemyPoise(state);
      if (lastSummary && poiseSummariesMatch(lastSummary, summary)) return lastSummary;
      return (lastSummary = summary);
    });
    enemyPoiseSummaryAtoms.set(enemyId, summaryAtom);
  }
  return summaryAtom;
}

// Flags an enemy reaching its per-cycle stagger cap, so the "Flinched!" callout can replay.
// Called by the attack-timer hook; the timestamp re-triggers the animation on later cycles.
export const flagMaxFlinchAtom = atom(null, (get, set, enemyId: string) => {
  const currentState = get(battleStateAtom);
  set(battleStateAtom, {
    ...currentState,
    lastMaxFlinch: { enemyId, timestamp: Date.now() },
  });
});

// ─── Victory-rating stats (see ~/lib/battle-rating.ts) ───────────────────────
// Thin read selectors for the end-of-battle rating. `?? 0` guards any pre-existing state object.
export const battleStartedAtAtom = atom((get) => get(battleStateAtom).startedAt ?? 0);
export const maxComboAtom = atom((get) => get(battleStateAtom).maxCombo ?? 0);
export const itemsUsedAtom = atom((get) => get(battleStateAtom).itemsUsed ?? 0);
export const ultimateSkillsUsedAtom = atom((get) => get(battleStateAtom).ultimateSkillsUsed);
// Breaks landed this battle, summed from the per-enemy `breakCount` pools rather than counted
// separately — those never reset mid-battle and outlive the enemy, so they can't drift.
export const enemiesBrokenAtom = atom((get) => countEnemyBreaks(get(enemyPoiseAtom)));

// The most recent victory rating, published by the BattleOverModal the moment a win is confirmed,
// so post-battle consumers (e.g. a dungeon run) can record it without recomputing — recomputing
// would be wrong, since the elapsed-time clock keeps running through the rating/rewards screens.
// Null until the first victory of the session.
export const lastBattleRatingAtom = atom<BattleRatingResult | null>(null);

// Records the deepest cascade combo reached (keeps the running max). Called from the board.
export const recordMaxComboAtom = atom(null, (get, set, combo: number) => {
  const currentState = get(battleStateAtom);
  if (combo <= currentState.maxCombo) return;
  set(battleStateAtom, { ...currentState, maxCombo: combo });
});

// Tallies a battle item consumption (a penalty in the victory rating). Called from the item bar.
// `?? 0` mirrors the read selectors so a pre-existing state object without the field can't write NaN.
export const recordItemUsedAtom = atom(null, (get, set) => {
  const currentState = get(battleStateAtom);
  set(battleStateAtom, { ...currentState, itemsUsed: (currentState.itemsUsed ?? 0) + 1 });
});

// Marks an enemy's standby as over (it begins attacking). Idempotent — called by the attack-timer
// hook as each enemy's observation window elapses.
export const endEnemyStandbyAtom = atom(null, (get, set, enemyId: string) => {
  const currentState = get(battleStateAtom);
  if (!currentState.standbyEnemyIds.includes(enemyId)) return;
  set(battleStateAtom, {
    ...currentState,
    standbyEnemyIds: currentState.standbyEnemyIds.filter((id) => id !== enemyId),
  });
});

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

/** Everything a resolved match writes synchronously, applied by {@link applyMatchResolutionAtom}. */
export interface MatchResolution {
  /** Score earned by this match. */
  scoreDelta: number;
  /** First-seen matched colour, driving the party pulse; null leaves the previous value in place. */
  primaryMatchedType: OrbType | null;
  /** Cooldown reduction per matched colour's hero. Dead or already-ready heroes are skipped. */
  cooldownReductions: ReadonlyArray<SkillCooldownReduction>;
  /** Guard gained from grey orbs (0 when none). */
  guardGain: number;
  /** Cascade chain length reached; the running max is kept. */
  combo: number;
}

// Applies one resolved match in a single write. Replaces the five back-to-back writes the board
// used to issue (score, lastMatchedType, per-colour cooldown, guard, max combo), each of which
// re-spread the whole state and committed separately. Same per-field guards as those atoms:
// score and max combo always apply; cooldowns and guard only while the battle is in progress.
export const applyMatchResolutionAtom = atom(null, (get, set, resolution: MatchResolution) => {
  const currentState = get(battleStateAtom);
  const isPlaying = currentState.gameStatus === 'playing';
  const { scoreDelta, primaryMatchedType, cooldownReductions, guardGain, combo } = resolution;

  set(battleStateAtom, {
    ...currentState,
    score: currentState.score + scoreDelta,
    lastMatchedType: primaryMatchedType ?? currentState.lastMatchedType,
    party: isPlaying ? reducePartySkillCooldowns(currentState.party, cooldownReductions) : currentState.party,
    guard: isPlaying && guardGain > 0 ? Math.min(GUARD_MAX, currentState.guard + guardGain) : currentState.guard,
    maxCombo: Math.max(currentState.maxCombo ?? 0, combo),
  });
});

// Atom to tick skill cooldowns each frame. Writes nothing when no cooldown is running, so the
// idle battle screen is not re-rendered 10x/s (the reducer returns the same array in that case).
export const tickSkillCooldownsAtom = atom(null, (get, set, deltaSeconds: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const party = tickPartySkillCooldowns(currentState.party, deltaSeconds);
  if (party === currentState.party) return;

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

/**
 * Single-entry cache for the Guard decay factor. `getPartyPassiveModifiers` walks every
 * member's passive list and allocates on each call, but the factor only moves when a member
 * dies or is revived — VIT and passives are frozen for the duration of a battle.
 *
 * Keyed on values rather than on the `party` array reference: `tickSkillCooldownsAtom` runs
 * immediately before the decay tick and allocates a fresh party array (plus fresh member
 * objects for anyone whose cooldown is counting down), so a reference key would miss every tick.
 *
 * The watched fields are exactly what the two functions read: living/dead status and VIT for
 * `calculateGuardDecayResistance`, the passive and level records for `getPartyPassiveModifiers`.
 * Anything that starts varying another input mid-battle — a VIT buff, a passive granted during
 * combat — must be added to `guardDecayFactorInputsMatch` or the factor will go stale.
 */
let guardDecayFactorParty: CharacterData[] | null = null;
let guardDecayFactor = 1;

function guardDecayFactorInputsMatch(party: CharacterData[]): boolean {
  const cached = guardDecayFactorParty;
  if (cached === null || cached.length !== party.length) return false;

  for (let i = 0; i < party.length; i++) {
    const next = party[i];
    const prev = cached[i];
    if (next === prev) continue;
    if (
      // The living/dead flip matters, the HP value itself does not.
      next.currentHp > 0 !== prev.currentHp > 0 ||
      next.stats.vit !== prev.stats.vit ||
      next.unlockedPassiveIds !== prev.unlockedPassiveIds ||
      next.skillLevels !== prev.skillLevels
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Resolves the multiplier on the Guard bleed rate, recomputing only when the party inputs it
 * depends on actually change. Passive resistance stacks multiplicatively with the VIT-derived
 * curve, and the passive set is frozen with the snapshot party, so this stays deterministic.
 * @param party The current battle party
 * @returns The combined decay resistance factor, as `decayGuard` expects it
 */
function resolveGuardDecayFactor(party: CharacterData[]): number {
  if (!guardDecayFactorInputsMatch(party)) {
    guardDecayFactor =
      calculateGuardDecayResistance(party) * getPartyPassiveModifiers(party).guardDecayResistanceMultiplier;
    guardDecayFactorParty = party;
  }
  return guardDecayFactor;
}

// Atom to bleed the Guard meter over time (anti-hoard decay)
export const tickGuardDecayAtom = atom(null, (get, set, deltaSeconds: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing' || currentState.guard <= 0) return;

  set(battleStateAtom, {
    ...currentState,
    guard: decayGuard(currentState.guard, deltaSeconds, resolveGuardDecayFactor(currentState.party)),
  });
});

// One write per battle tick: skill cooldowns, Guard decay and the enemy poise windows together.
// Replaces the interval's back-to-back `tickSkillCooldownsAtom` + `tickGuardDecayAtom` calls (two
// whole-state writes and two commit passes whenever both had work). Same math; the decay factor
// is resolved against the post-tick party exactly as the second write used to see it. Each reducer
// hands back its input by reference when idle, so a quiet battle never writes.
export const battleTickAtom = atom(null, (get, set, deltaSeconds: number) => {
  const currentState = get(battleStateAtom);
  if (currentState.gameStatus !== 'playing') return;

  const party = tickPartySkillCooldowns(currentState.party, deltaSeconds);
  const guard =
    currentState.guard > 0
      ? decayGuard(currentState.guard, deltaSeconds, resolveGuardDecayFactor(party))
      : currentState.guard;
  const enemyPoise = tickEnemyPoise(currentState.enemyPoise, deltaSeconds);
  if (party === currentState.party && guard === currentState.guard && enemyPoise === currentState.enemyPoise) return;

  set(battleStateAtom, { ...currentState, party, guard, enemyPoise });
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
  const skillStats = resolveActiveSkillStats(skill, getSkillLevel(character, skill.id));
  const passives = getCharacterPassiveModifiers(character);
  const amount = Math.round(
    calculateSkillDamage(
      BASE_SKILL_DAMAGE,
      character.stats.pow,
      skillStats.baseDamageMultiplier,
      skillStats.flatDamageBonus,
    ) * passives.skillDamageMultiplier,
  );

  let party = currentState.party;
  let enemies = currentState.enemies;
  let selectedEnemyId = currentState.selectedEnemyId;
  let gameStatus: BattleStatus = currentState.gameStatus;

  // Capture which enemy/enemies took the hit BEFORE selection advances on death,
  // so the flinch lands on the sprite that was actually struck.
  const hitEnemyId = selectedEnemyId;
  const hitEnemyIds = enemies.filter((e) => e.currentHp > 0).map((e) => e.id);

  // Poise side of an enemy-targeting skill (see damageEnemyAtom for the same rules on matches):
  // the hit lands in the vulnerable window of a Broken target (read from the PRE-hit state), and
  // deals poise damage unless it killed or the target is still on standby.
  const poiseHits = weighHitsByAttacker([{ amount, characterId }], currentState.party, POISE_SKILL_MULTIPLIER, 'skill');
  let enemyPoise = currentState.enemyPoise;
  const brokenEnemyIds: string[] = [];
  // Per-target HP damage, once the vulnerable bonus is applied; the popup reads its own entry.
  const amountByEnemyId: Record<string, number> = {};

  function isStaggeredTarget(enemyId: string): boolean {
    const poise = enemyPoise[enemyId];
    return poise ? isEnemyStaggered(poise) : false;
  }

  function landPoise(struck: EnemyData) {
    const poiseBefore = enemyPoise[struck.id];
    if (!poiseBefore || struck.currentHp <= 0) return;
    // As in `damageEnemyAtom`: a standby target's pool still moves, it just cannot Break yet.
    const canBreak = !currentState.standbyEnemyIds.includes(struck.id);
    const { next, didBreak } = applyPoiseHits(poiseBefore, poiseHits, struck.poise ?? 1, { canBreak });
    if (next !== poiseBefore) enemyPoise = { ...enemyPoise, [struck.id]: next };
    if (didBreak) brokenEnemyIds.push(struck.id);
  }

  if (skill.target === 'enemy') {
    // Damage the selected enemy
    const landed = resolveVulnerableDamage(amount, isStaggeredTarget(selectedEnemyId));
    amountByEnemyId[selectedEnemyId] = landed;
    enemies = enemies.map((e) => {
      if (e.id !== selectedEnemyId) return e;
      return { ...e, currentHp: subtractionWithMin(e.currentHp, landed, 0) };
    });

    // Check if selected enemy just died — auto-select next
    const damagedEnemy = enemies.find((e) => e.id === selectedEnemyId)!;
    landPoise(damagedEnemy);
    if (damagedEnemy.currentHp <= 0) {
      const nextId = getNextLivingEnemyId(enemies, selectedEnemyId);
      if (nextId) selectedEnemyId = nextId;
    }

    // Check if ALL enemies are dead
    if (enemies.every((e) => e.currentHp <= 0)) {
      gameStatus = 'won';
    }
  } else if (skill.target === 'allEnemy') {
    // Damage every living enemy, each by its own vulnerable-window amount
    enemies = enemies.map((e) => {
      if (e.currentHp <= 0) return e;
      const landed = resolveVulnerableDamage(amount, isStaggeredTarget(e.id));
      amountByEnemyId[e.id] = landed;
      return { ...e, currentHp: subtractionWithMin(e.currentHp, landed, 0) };
    });
    for (const struck of enemies) {
      if (hitEnemyIds.includes(struck.id)) landPoise(struck);
    }

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
    char.id === characterId ? { ...char, skillCooldown: resolveCharacterCooldown(char) } : char,
  );

  // Drive the enemy hit reaction (flinch + number) through the shared lastDamage channel.
  // Heals are left out — they keep flowing through the party-side feedback.
  const timestamp = Date.now();
  let lastDamage = currentState.lastDamage;
  let damageDealt = 0;
  if (skill.target === 'enemy') {
    const landed = amountByEnemyId[hitEnemyId];
    lastDamage = { amount: landed, target: 'enemy', timestamp, enemyId: hitEnemyId, characterId, source: 'skill' };
    damageDealt = landed;
  } else if (skill.target === 'allEnemy') {
    lastDamage = {
      amount,
      target: 'enemy',
      timestamp,
      enemyIds: hitEnemyIds,
      characterId,
      source: 'skill',
      amountByEnemyId,
    };
    damageDealt = hitEnemyIds.reduce((sum, id) => sum + amountByEnemyId[id], 0);
  }

  set(battleStateAtom, {
    ...currentState,
    party,
    enemies,
    selectedEnemyId,
    gameStatus,
    enemyPoise,
    lastPoiseBreak: brokenEnemyIds.length > 0 ? { enemyIds: brokenEnemyIds, timestamp } : currentState.lastPoiseBreak,
    totalDamageDealt: (currentState.totalDamageDealt ?? 0) + damageDealt,
    // Passive skillGuardRestore: the Ultimate also pushes the shared Guard meter back up.
    guard: Math.min(GUARD_MAX, currentState.guard + passives.skillGuardRestore),
    // A skill kill wins immediately: there's no in-flight cascade to preserve and no guaranteed
    // board-settle event to commit a deferred win. Clear any pending flag so it can't go stale.
    pendingVictory: false,
    // Every character skill is an "ultimate"; count each successful activation for the rating bonus.
    ultimateSkillsUsed: currentState.ultimateSkillsUsed + 1,
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
