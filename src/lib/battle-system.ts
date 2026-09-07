/**
 * Pure functions for battle state construction and combat utilities.
 */

import type { BattleState } from '~/types/battle';
import type { CharacterData, EnemyData } from '~/types/rpg-elements';
import { resolveCharacterCooldown } from '~/lib/skill-system';
import { getPartyWithEffectiveStats } from '~/lib/equipment-system';
import { createOpeningBoard } from '~/lib/board-generation';
import { MIN_MATCH_SOUND_VOLUME, MAX_MATCH_SOUND_VOLUME } from '~/constants/audio';
import { ENEMY_STANDBY_MIN_MS, ENEMY_STANDBY_MAX_MS } from '~/constants/battle';

/**
 * Rolls a per-enemy "standby" delay (ms) that each enemy spends observing the player
 * before its attack loop begins, so a fresh encounter's attacks fan out over time
 * instead of all landing on the same tick.
 *
 * The distribution is deliberately wide: each enemy first rolls an independent value in
 * `[ENEMY_STANDBY_MIN_MS, ENEMY_STANDBY_MAX_MS]`, those rolls are **pooled** into a single
 * total, and the total is then **randomly re-split** across the enemies. Re-splitting a
 * shared pool yields a much broader spread (some enemies near 0, some large) than the
 * narrow ~2s clustering you'd get from the independent draws alone — maximizing desync.
 *
 * @param enemyIds - The encounter's enemy ids, in order. Each gets one delay.
 * @param rng - Injectable `[0, 1)` source (defaults to `Math.random`); pass a deterministic
 *   generator in tests.
 * @returns A map of `enemyId -> standby delay in ms` (non-negative integers). The values
 *   sum to the pooled total. Returns `{}` for an empty roster.
 */
export function generateEnemyStandbyDelays(
  enemyIds: string[],
  rng: () => number = Math.random,
): Record<string, number> {
  const count = enemyIds.length;
  if (count === 0) return {};

  // 1. Roll each enemy independently and pool the rolls into one total.
  const span = ENEMY_STANDBY_MAX_MS - ENEMY_STANDBY_MIN_MS + 1;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(rng() * span) + ENEMY_STANDBY_MIN_MS;
  }

  // 2. Randomly split `total` into `count` non-negative integer parts via a random
  //    composition: `count - 1` cut points in [0, total], sorted, then consecutive diffs.
  const cuts: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    cuts.push(Math.floor(rng() * (total + 1)));
  }
  cuts.sort((a, b) => a - b);

  const delays: Record<string, number> = {};
  let prev = 0;
  for (let i = 0; i < count; i++) {
    const boundary = i < count - 1 ? cuts[i] : total;
    delays[enemyIds[i]] = boundary - prev;
    prev = boundary;
  }

  return delays;
}

/** Geometry for one countdown ring: total sweep length and how far into it the fill starts. */
export interface CountdownRingAnchor {
  /** Ring length in ms; the fill empties exactly when the enemy's attack releases */
  durationMs: number;
  /** Negative animation offset in ms, so a remount resumes mid-sweep instead of snapping to full */
  elapsedMs: number;
}

/**
 * Anchors an enemy's countdown ring so the fill reads as **time remaining until its attack**,
 * measured against its normal attack interval. Extending the ring's total instead (keeping the
 * cycle start fixed) would only shift the fill by `push × elapsed / interval²`, so a stagger early
 * in a cycle would be invisible; this keeps the sweep length constant and moves the start back,
 * so a push of `p` ms always visibly nudges the fill back by `p / interval` of the ring.
 * When more than one full interval remains (a push landed right after the cycle opened) the ring
 * shows full and lengthens its sweep to still empty exactly at release.
 * @param intervalMs The enemy's effective attack interval in ms (the ring's normal sweep length)
 * @param remainingMs Milliseconds until the enemy's next attack releases
 * @returns The ring's sweep length and elapsed offset
 */
export function resolveCountdownRingAnchor(intervalMs: number, remainingMs: number): CountdownRingAnchor {
  const remaining = Math.max(0, remainingMs);
  if (remaining >= intervalMs) return { durationMs: remaining, elapsedMs: 0 };
  return { durationMs: intervalMs, elapsedMs: intervalMs - remaining };
}

/**
 * Creates a fresh BattleState for a given party and set of enemies.
 * Bakes equipment bonuses into party stats, sets skills on cooldown,
 * and resets all combat state to initial values.
 * @param party - The party members (raw, without equipment bonuses applied)
 * @param enemies - The enemies for this encounter
 * @returns A ready-to-use BattleState
 * @example
 * ```ts
 * const state = createBattleState(partyMembers, [MOSS_GOLEM, SWAMP_FROG]);
 * set(battleStateAtom, state);
 * ```
 */
export function createBattleState(party: CharacterData[], enemies: EnemyData[]): BattleState {
  const effectiveParty = getPartyWithEffectiveStats(party);
  const enemyStandbyMs = generateEnemyStandbyDelays(enemies.map((e) => e.id));

  return {
    // currentHp is intentionally carried over from the incoming party (already clamped to
    // the equipment-adjusted maxHp by getPartyWithEffectiveStats) so HP persists between
    // battles. Only combat-transient state (skill cooldowns) is (re)initialized here.
    party: effectiveParty.map((char) => ({
      ...char,
      skillCooldown: resolveCharacterCooldown(char),
    })),
    enemies: enemies.map((e) => ({ ...e, currentHp: e.maxHp })),
    enemyStandbyMs,
    // Every enemy that actually has a standby delay starts out observing.
    standbyEnemyIds: enemies.map((e) => e.id).filter((id) => (enemyStandbyMs[id] ?? 0) > 0),
    lastPreemptiveStrike: null,
    lastReshuffle: null,
    lastMaxFlinch: null,
    selectedEnemyId: enemies[0].id,
    board: createOpeningBoard(),
    selectedOrb: null,
    currentMatches: [],
    score: 0,
    turn: 1,
    guard: 0,
    gameStatus: 'playing',
    pendingVictory: false,
    lastDamage: null,
    lastMatchedType: null,
    lastSkillActivation: null,
    startedAt: Date.now(),
    maxCombo: 0,
    itemsUsed: 0,
    ultimateSkillsUsed: 0,
  };
}

/**
 * Advances every living member's skill cooldown by `deltaSeconds`, flooring at 0.
 * Copy-on-first-change: members that are dead or already ready are left untouched (same
 * object), and when nobody changed the **input array itself** is returned, so a caller can
 * skip its state write with a reference compare. The battle loop calls this 10x/s for the
 * whole fight, most of it with every cooldown already at 0.
 * @param party - The current battle party
 * @param deltaSeconds - Elapsed time to subtract from each running cooldown
 * @returns The same array when no cooldown moved, otherwise a new array with updated members
 */
export function tickPartySkillCooldowns(party: CharacterData[], deltaSeconds: number): CharacterData[] {
  let next: CharacterData[] | null = null;
  for (let i = 0; i < party.length; i++) {
    const char = party[i];
    if (char.currentHp <= 0 || char.skillCooldown <= 0) continue;
    next ??= party.slice();
    next[i] = { ...char, skillCooldown: Math.max(0, char.skillCooldown - deltaSeconds) };
  }
  return next ?? party;
}

/** A per-hero cooldown reduction earned by a match, as applied by {@link reducePartySkillCooldowns}. */
export interface SkillCooldownReduction {
  characterId: string;
  amount: number;
}

/**
 * Applies match-earned cooldown reductions to the party. Dead heroes and heroes whose skill is
 * already ready are skipped; each hit floors at 0. Copy-on-first-change like
 * {@link tickPartySkillCooldowns}: untouched members keep their identity and the **input array**
 * comes back when nothing applied, so a caller can skip its state write with a reference compare.
 * @param party - The current battle party
 * @param reductions - One entry per matched colour, in any order
 * @returns The same array when nothing changed, otherwise a new array with updated members
 */
export function reducePartySkillCooldowns(
  party: CharacterData[],
  reductions: ReadonlyArray<SkillCooldownReduction>,
): CharacterData[] {
  let next: CharacterData[] | null = null;
  for (const { characterId, amount } of reductions) {
    const source = next ?? party;
    const i = source.findIndex((char) => char.id === characterId);
    if (i === -1) continue;
    const char = source[i];
    if (char.currentHp <= 0 || char.skillCooldown <= 0) continue;
    next ??= party.slice();
    next[i] = { ...char, skillCooldown: Math.max(0, char.skillCooldown - amount) };
  }
  return next ?? party;
}

/**
 * Returns the ID of the next living enemy after the current one, wrapping around
 * the encounter order. Useful for auto-selecting a new target when the current
 * enemy dies.
 * @param enemies - Array of enemies in encounter order
 * @param currentId - ID of the currently selected enemy
 * @returns ID of the next living enemy, or null if all are dead
 * @example
 * ```ts
 * const next = getNextLivingEnemyId(enemies, 'frog-1');
 * if (next) selectEnemy(next);
 * ```
 */
export function getNextLivingEnemyId(enemies: EnemyData[], currentId: string): string | null {
  const living = enemies.filter((e) => e.currentHp > 0);
  if (living.length === 0) return null;

  const currentIndex = enemies.findIndex((e) => e.id === currentId);
  for (let i = 1; i <= enemies.length; i++) {
    const idx = (currentIndex + i) % enemies.length;
    if (enemies[idx].currentHp > 0) return enemies[idx].id;
  }

  return living[0].id;
}

/**
 * Returns a volume level scaled by match size.
 * A 3-orb match returns MIN_MATCH_SOUND_VOLUME, a 5-orb match returns MAX_MATCH_SOUND_VOLUME,
 * and values in between are linearly interpolated.
 * @param matchSize The number of orbs matched (typically 3-5).
 * @returns A volume value between MIN_MATCH_SOUND_VOLUME and MAX_MATCH_SOUND_VOLUME.
 */
export function getMatchSoundVolume(matchSize: number): number {
  const MIN_MATCH_SIZE = 3;
  const MAX_MATCH_SIZE = 5;
  const clamped = Math.max(MIN_MATCH_SIZE, Math.min(MAX_MATCH_SIZE, matchSize));
  const t = (clamped - MIN_MATCH_SIZE) / (MAX_MATCH_SIZE - MIN_MATCH_SIZE);
  return MIN_MATCH_SOUND_VOLUME + t * (MAX_MATCH_SOUND_VOLUME - MIN_MATCH_SOUND_VOLUME);
}
