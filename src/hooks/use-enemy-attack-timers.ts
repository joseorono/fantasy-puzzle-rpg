import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { damagePartyAtom, enemiesAtom, gameStatusAtom } from '~/stores/battle-atoms';
import { calculateEnemyAttackInterval, calculateEnemyDamage } from '~/lib/rpg-calculations';

/** Per-enemy attack timing exposed to the UI. */
export interface EnemyAttackTimer {
  /** The enemy's id. */
  id: string;
  /** How long this enemy takes between attacks, in milliseconds. */
  intervalMs: number;
  /** Increments every time this enemy attacks; use it to restart a countdown UI. */
  cycleKey: number;
}

/**
 * Runs each living enemy's attack loop and reports its timing for the UI.
 *
 * Every enemy gets a `setInterval` of its own attack interval; on each fire it
 * damages the party and bumps that enemy's `cycleKey`. A countdown view keyed on
 * `cycleKey` (e.g. {@link RadialCountdown}) then replays its CSS depletion in
 * lockstep with the real attack — this hook owns timing only, never the visuals.
 *
 * The timers are re-created only when the roster of living enemies or their
 * intervals change (not on every HP tick), so landing match damage on an enemy
 * no longer silently resets every attack clock.
 */
export function useEnemyAttackTimers(): EnemyAttackTimer[] {
  const enemies = useAtomValue(enemiesAtom);
  const gameStatus = useAtomValue(gameStatusAtom);
  const damageParty = useSetAtom(damagePartyAtom);
  const [cycles, setCycles] = useState<Record<string, number>>({});

  // Latest enemies, read inside the interval callbacks without widening deps.
  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;

  const livingEnemies = enemies.filter((enemy) => enemy.currentHp > 0);

  // Stable signature of the roster — changes only when an enemy joins/dies or an
  // interval changes, NOT when HP merely drops. This is the effect's trigger.
  const rosterSignature = livingEnemies
    .map((enemy) => `${enemy.id}:${calculateEnemyAttackInterval(enemy)}`)
    .join('|');

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setInterval>>();

    function clearTimers() {
      for (const timer of timers.values()) clearInterval(timer);
      timers.clear();
    }

    if (gameStatus !== 'playing') return clearTimers;

    for (const enemy of enemiesRef.current.filter((e) => e.currentHp > 0)) {
      const intervalMs = calculateEnemyAttackInterval(enemy);
      const damage = calculateEnemyDamage(enemy);

      const timer = setInterval(() => {
        damageParty(damage, enemy.id);
        setCycles((prev) => ({ ...prev, [enemy.id]: (prev[enemy.id] ?? 0) + 1 }));
      }, intervalMs);

      timers.set(enemy.id, timer);
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, rosterSignature, damageParty]);

  return livingEnemies.map((enemy) => ({
    id: enemy.id,
    intervalMs: calculateEnemyAttackInterval(enemy),
    cycleKey: cycles[enemy.id] ?? 0,
  }));
}
