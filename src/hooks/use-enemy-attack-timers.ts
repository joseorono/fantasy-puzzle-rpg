import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  damagePartyAtom,
  enemiesAtom,
  enemyStandbyMsAtom,
  endEnemyStandbyAtom,
  gameStatusAtom,
  lastDamageAtom,
  standbyEnemyIdsAtom,
} from '~/stores/battle-atoms';
import {
  calculateEnemyAttackInterval,
  calculateEnemyDamage,
  calculateStaggerPushMs,
  clampStaggerToCycleBudget,
} from '~/lib/rpg-calculations';

/** Per-enemy attack timing exposed to the UI. */
export interface EnemyAttackTimer {
  /** The enemy's id. */
  id: string;
  /** Ring length for the current phase: the standby wait while observing, else the attack interval (extended by any stagger this cycle). */
  durationMs: number;
  /**
   * Milliseconds already elapsed in the current ring cycle. A stagger extends `durationMs`
   * mid-cycle; feeding this as a negative animation offset keeps the ring where it visually is
   * (nudging backward by the push) instead of snapping to full. Always 0 at the start of a cycle.
   */
  elapsedMs: number;
  /** Change this to restart the countdown ring (a new value remounts + replays the CSS fill). */
  cycleKey: number | string;
  /** True while the enemy is still on its start-of-battle standby (show the eye); false once attacking. */
  isStandby: boolean;
}

/**
 * Runs each living enemy's attack loop and reports its timing for the UI.
 *
 * At battle start every enemy first spends a randomized **standby** delay (from
 * {@link enemyStandbyMsAtom}) "observing" before its attack loop begins, so a fresh encounter's
 * attacks fan out instead of all firing on the same tick. Once attacking, each enemy runs a
 * self-rescheduling `setTimeout` anchored to an absolute release timestamp (`releaseAtRef`)
 * rather than a fixed `setInterval`, which lets a hit **stagger** it: hitting an enemy pushes its
 * next attack back a little (VIT-resisted, capped per cycle so it can never be stunlocked — see
 * {@link calculateStaggerPushMs} / {@link clampStaggerToCycleBudget}). The stagger is derived
 * from the shared {@link lastDamageAtom} channel, so it needs no extra battle state.
 *
 * Performance: no central loop and no polling. Still one timer per living enemy (<= 4); a stagger
 * only re-anchors the ring and extends `releaseAtRef` — the running shot timer re-defers itself on
 * its next wake, so staggering never tears the timers down. `releaseAtRef` (absolute timestamps)
 * is the source of truth, so a mid-battle rebuild (an enemy dies) resumes each observer's standby
 * instead of restarting it. Which enemies are still observing lives in battle state
 * (`standbyEnemyIds`), so the damage path can award preemptive-strike bonuses.
 */
export function useEnemyAttackTimers(isBattlePaused: boolean = false): EnemyAttackTimer[] {
  const enemies = useAtomValue(enemiesAtom);
  const gameStatus = useAtomValue(gameStatusAtom);
  const enemyStandbyMs = useAtomValue(enemyStandbyMsAtom);
  const standbyEnemyIds = useAtomValue(standbyEnemyIdsAtom);
  const lastDamage = useAtomValue(lastDamageAtom);
  const damageParty = useSetAtom(damagePartyAtom);
  const endStandby = useSetAtom(endEnemyStandbyAtom);

  // Per-enemy ring cycle counter; bumped on each attack AND each stagger to remount the ring.
  const [version, setVersion] = useState<Record<string, number>>({});

  // Latest values, read inside timer/stagger callbacks without widening effect deps.
  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;
  const standbyIdsRef = useRef(standbyEnemyIds);
  standbyIdsRef.current = standbyEnemyIds;

  // Absolute release timestamps (performance.now() based) — the source of truth for timing.
  const releaseAtRef = useRef<Map<string, number>>(new Map()); // when the enemy next attacks
  const cycleStartRef = useRef<Map<string, number>>(new Map()); // when the current ring cycle began
  const staggerUsedRef = useRef<Map<string, number>>(new Map()); // push-back (ms) spent this cycle
  // Ring geometry captured at each (re)anchor, read during render.
  const ringDurationRef = useRef<Map<string, number>>(new Map());
  const ringElapsedRef = useRef<Map<string, number>>(new Map());
  // One pending timeout per enemy (standby wait or the next attack), for cleanup.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Guards against re-processing the same hit (effect re-runs / StrictMode double-invoke).
  const processedDamageRef = useRef<typeof lastDamage>(null);

  const livingEnemies = enemies.filter((enemy) => enemy.currentHp > 0);

  // Stable signature of the roster — changes only when an enemy joins/dies or an
  // interval changes, NOT when HP merely drops. This is (part of) the effect's trigger.
  const rosterSignature = livingEnemies
    .map((enemy) => `${enemy.id}:${calculateEnemyAttackInterval(enemy)}`)
    .join('|');

  function bumpVersion(id: string) {
    setVersion((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  // New battle (a fresh `enemyStandbyMs` object) → wipe all timing bookkeeping so every enemy
  // re-observes from scratch. (The observing set itself is reset in createBattleState.)
  useEffect(() => {
    releaseAtRef.current = new Map();
    cycleStartRef.current = new Map();
    staggerUsedRef.current = new Map();
    ringDurationRef.current = new Map();
    ringElapsedRef.current = new Map();
    setVersion({});
  }, [enemyStandbyMs]);

  useEffect(() => {
    function clearTimers() {
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    }

    if (gameStatus !== 'playing' || isBattlePaused === true) return clearTimers;

    // Opens a fresh attack cycle: a full ring over the interval, empty stagger budget, and the
    // scheduled shot (which self-reschedules and re-defers when a stagger extends the release).
    function startCycle(id: string) {
      const enemy = enemiesRef.current.find((e) => e.id === id);
      if (!enemy || enemy.currentHp <= 0) return;
      const interval = calculateEnemyAttackInterval(enemy);
      const start = performance.now();
      cycleStartRef.current.set(id, start);
      releaseAtRef.current.set(id, start + interval);
      staggerUsedRef.current.set(id, 0);
      ringDurationRef.current.set(id, interval);
      ringElapsedRef.current.set(id, 0);
      bumpVersion(id);
      scheduleShot(id);
    }

    function scheduleShot(id: string) {
      const delay = Math.max(0, (releaseAtRef.current.get(id) ?? performance.now()) - performance.now());
      timersRef.current.set(id, setTimeout(() => fireShot(id), delay));
    }

    function fireShot(id: string) {
      const now = performance.now();
      const target = releaseAtRef.current.get(id) ?? now;
      // A stagger pushed the release past this wake-up — wait out the remaining delta (the only
      // extra work a stagger costs the timer, bounded by the per-cycle cap).
      if (now < target - 1) {
        timersRef.current.set(id, setTimeout(() => fireShot(id), target - now));
        return;
      }
      const enemy = enemiesRef.current.find((e) => e.id === id);
      if (!enemy || enemy.currentHp <= 0) return;
      damageParty(calculateEnemyDamage(enemy), id);
      startCycle(id);
    }

    const now = performance.now();

    for (const enemy of enemiesRef.current.filter((e) => e.currentHp > 0)) {
      const id = enemy.id;
      const standbyMs = enemyStandbyMs[id] ?? 0;
      const isObserving = standbyIdsRef.current.includes(id);

      if (!releaseAtRef.current.has(id)) releaseAtRef.current.set(id, now + standbyMs);
      const remaining = releaseAtRef.current.get(id)! - now;

      if (isObserving && standbyMs > 0 && remaining > 0) {
        // Still observing — wait out the remaining standby, then begin attacking in place.
        timersRef.current.set(
          id,
          setTimeout(() => {
            endStandby(id);
            startCycle(id);
          }, remaining),
        );
      } else {
        // Past standby (or none) — make sure state reflects "attacking", then open a fresh cycle.
        if (isObserving) endStandby(id);
        startCycle(id);
      }
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, isBattlePaused, rosterSignature, enemyStandbyMs, damageParty, endStandby]);

  // Stagger: on each new enemy-targeting hit, push the struck enemy's next attack back (capped),
  // and re-anchor its ring. Reads from `lastDamage` (which already carries the amount + which
  // enemy) so no extra battle state is needed. The running shot timer re-defers itself.
  useEffect(() => {
    if (lastDamage === processedDamageRef.current) return;
    processedDamageRef.current = lastDamage;
    if (!lastDamage || lastDamage.target !== 'enemy') return;
    if (gameStatus !== 'playing' || isBattlePaused === true) return;

    const now = performance.now();
    const ids = lastDamage.enemyIds ?? (lastDamage.enemyId ? [lastDamage.enemyId] : []);

    for (const id of ids) {
      // Skip enemies still observing (not attacking yet) or without a live attack cycle.
      if (standbyIdsRef.current.includes(id)) continue;
      if (!releaseAtRef.current.has(id) || !cycleStartRef.current.has(id)) continue;
      const enemy = enemiesRef.current.find((e) => e.id === id);
      if (!enemy || enemy.currentHp <= 0) continue;

      const interval = calculateEnemyAttackInterval(enemy);
      const push = calculateStaggerPushMs(lastDamage.amount, enemy.maxHp, enemy.stats.vit, interval);
      const used = staggerUsedRef.current.get(id) ?? 0;
      const applied = clampStaggerToCycleBudget(push, interval, used);
      if (applied <= 0) continue;

      staggerUsedRef.current.set(id, used + applied);
      const release = (releaseAtRef.current.get(id) ?? now) + applied;
      releaseAtRef.current.set(id, release);
      // Re-anchor the ring to the extended release WITHOUT snapping to full: keep the same cycle
      // start so the fill nudges backward by `applied` and still empties at the new release.
      const cycleStart = cycleStartRef.current.get(id) ?? now;
      ringDurationRef.current.set(id, release - cycleStart);
      ringElapsedRef.current.set(id, Math.max(0, now - cycleStart));
      bumpVersion(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDamage, gameStatus, isBattlePaused]);

  return livingEnemies.map((enemy) => {
    const id = enemy.id;
    const isStandby = standbyEnemyIds.includes(id);
    if (isStandby) {
      return {
        id,
        durationMs: enemyStandbyMs[id] ?? 0,
        elapsedMs: 0,
        cycleKey: `standby-${id}`,
        isStandby: true,
      };
    }
    return {
      id,
      durationMs: ringDurationRef.current.get(id) ?? calculateEnemyAttackInterval(enemy),
      elapsedMs: ringElapsedRef.current.get(id) ?? 0,
      cycleKey: version[id] ?? 0,
      isStandby: false,
    };
  });
}
