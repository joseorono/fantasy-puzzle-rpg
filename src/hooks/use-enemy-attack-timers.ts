import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { damagePartyAtom, enemiesAtom, enemyStandbyMsAtom, gameStatusAtom } from '~/stores/battle-atoms';
import { calculateEnemyAttackInterval, calculateEnemyDamage } from '~/lib/rpg-calculations';

/** Per-enemy attack timing exposed to the UI. */
export interface EnemyAttackTimer {
  /** The enemy's id. */
  id: string;
  /** Ring length for the current phase: the standby wait while observing, else the attack interval. */
  durationMs: number;
  /** Change this to restart the countdown ring (a new value remounts + replays the CSS fill). */
  cycleKey: number | string;
  /** True while the enemy is still on its start-of-battle standby (show the eye); false once attacking. */
  isStandby: boolean;
}

/**
 * Runs each living enemy's attack loop and reports its timing for the UI.
 *
 * At battle start every enemy first spends a randomized **standby** delay (from
 * {@link enemyStandbyMsAtom}) "observing" before its attack loop begins, so a fresh
 * encounter's attacks fan out instead of all firing on the same tick. During standby the
 * enemy reports `isStandby: true` and a ring that depletes over its standby wait; when the
 * wait elapses it starts a normal `setInterval` of its attack interval and reports
 * `isStandby: false`. A countdown view keyed on `cycleKey` (e.g. {@link RadialCountdown})
 * replays its CSS depletion in lockstep — this hook owns timing only, never the visuals.
 *
 * Performance: the timing effect's deps are the same as a plain attack loop plus the
 * (per-battle-stable) standby map — the standby→attack transition is handled *inside* the
 * timer callback, so it never re-runs the effect. `releaseAtRef` (absolute timestamps) is the
 * source of truth for the remaining wait, so a mid-battle rebuild (an enemy dies) resumes each
 * observer's countdown instead of restarting it. `standbyDone` is cosmetic state only.
 */
export function useEnemyAttackTimers(isBattlePaused: boolean = false): EnemyAttackTimer[] {
  const enemies = useAtomValue(enemiesAtom);
  const gameStatus = useAtomValue(gameStatusAtom);
  const enemyStandbyMs = useAtomValue(enemyStandbyMsAtom);
  const damageParty = useSetAtom(damagePartyAtom);
  const [cycles, setCycles] = useState<Record<string, number>>({});
  const [standbyDone, setStandbyDone] = useState<Record<string, true>>({});

  // Latest enemies, read inside the interval callbacks without widening deps.
  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;

  // Absolute release timestamps (performance.now() based), set once per enemy per battle.
  const releaseAtRef = useRef<Map<string, number>>(new Map());

  const livingEnemies = enemies.filter((enemy) => enemy.currentHp > 0);

  // Stable signature of the roster — changes only when an enemy joins/dies or an
  // interval changes, NOT when HP merely drops. This is (part of) the effect's trigger.
  const rosterSignature = livingEnemies
    .map((enemy) => `${enemy.id}:${calculateEnemyAttackInterval(enemy)}`)
    .join('|');

  // New battle (a fresh `enemyStandbyMs` object) → clear release times and phase/cycle state so
  // every enemy re-observes from scratch. Runs on mount and on each new encounter.
  useEffect(() => {
    releaseAtRef.current = new Map();
    setStandbyDone({});
    setCycles({});
  }, [enemyStandbyMs]);

  useEffect(() => {
    const disposers: Array<() => void> = [];

    function clearTimers() {
      for (const dispose of disposers) dispose();
      disposers.length = 0;
    }

    if (gameStatus !== 'playing' || isBattlePaused === true) return clearTimers;

    const now = performance.now();

    for (const enemy of enemiesRef.current.filter((e) => e.currentHp > 0)) {
      const id = enemy.id;
      const intervalMs = calculateEnemyAttackInterval(enemy);
      const damage = calculateEnemyDamage(enemy);
      const standbyMs = enemyStandbyMs[id] ?? 0;

      // Begins this enemy's real attack loop; each fire hits the party and restarts its ring.
      const startAttackLoop = () => {
        const iv = setInterval(() => {
          damageParty(damage, id);
          setCycles((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        }, intervalMs);
        disposers.push(() => clearInterval(iv));
      };

      if (!releaseAtRef.current.has(id)) releaseAtRef.current.set(id, now + standbyMs);
      const remaining = releaseAtRef.current.get(id)! - now;

      if (standbyMs > 0 && remaining > 0) {
        // Still observing — wait out the remaining standby, then flip to attacking in place.
        const t = setTimeout(() => {
          setStandbyDone((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
          startAttackLoop();
        }, remaining);
        disposers.push(() => clearTimeout(t));
      } else {
        // Standby already elapsed (or none) — make sure the UI reflects "attacking", then attack.
        if (standbyMs > 0) setStandbyDone((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
        startAttackLoop();
      }
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, isBattlePaused, rosterSignature, enemyStandbyMs, damageParty]);

  return livingEnemies.map((enemy) => {
    const standbyMs = enemyStandbyMs[enemy.id] ?? 0;
    const isStandby = !standbyDone[enemy.id] && standbyMs > 0;
    return {
      id: enemy.id,
      durationMs: isStandby ? standbyMs : calculateEnemyAttackInterval(enemy),
      cycleKey: isStandby ? `standby-${enemy.id}` : (cycles[enemy.id] ?? 0),
      isStandby,
    };
  });
}
