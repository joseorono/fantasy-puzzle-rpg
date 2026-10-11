import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { enemyPoiseSummaryAtom, lastDamageAtom, lastEnemyAttackAtom } from '~/stores/battle-atoms';
import { getAdmurinAnimationCycleMs, resolveAdmurinAttackAnimation } from '~/lib/admurin-enemy-sheet';
import type { AdmurinEnemyAnimation } from '~/types/admurin-enemies';
import type { EnemyData } from '~/types/rpg-elements';

export interface AdmurinEnemyMotion {
  animation: AdmurinEnemyAnimation;
  mode: 'loop' | 'once';
  /** Bumps whenever a new one-shot must replay the clip from frame 0. */
  playId: number;
  /** True while the battle is paused or the enemy is dead — the sprite holds its current frame. */
  paused: boolean;
}

interface OneShot {
  animation: AdmurinEnemyAnimation;
  durationMs: number;
  id: number;
}

/** A short animation that plays once, then falls back to the idle row. */
function playOneShot(
  setOneShot: Dispatch<SetStateAction<OneShot | null>>,
  endsAtRef: RefObject<number>,
  animation: AdmurinEnemyAnimation,
  force: boolean,
) {
  const now = performance.now();
  // Triggers that land while a clip is still playing are dropped, so it always completes instead
  // of twitching on every hit in a fast cycle. Forced plays (a hit) take over instead.
  if (!force && now < endsAtRef.current) return;
  const durationMs = getAdmurinAnimationCycleMs(animation);
  endsAtRef.current = now + durationMs;
  setOneShot((previous) => ({ animation, durationMs, id: (previous?.id ?? 0) + 1 }));
}

/**
 * Picks the sheet row an Admurin enemy plays. Mirrors `useBattlerMotion`: the idle row loops, hits
 * and attacks play as one-shots (latest wins, a hit interrupts a running attack) and a Poise Break
 * cancels one. A paused battle banks the running clip so it resumes where it froze instead of
 * expiring off-screen. Returns null for enemies without an `admurinSheet`, so the caller renders
 * the static sprite.
 */
export function useAdmurinEnemyMotion(enemy: EnemyData, isBattlePaused: boolean): AdmurinEnemyMotion | null {
  const sheet = enemy.admurinSheet;
  const lastDamage = useAtomValue(lastDamageAtom);
  const lastAttack = useAtomValue(lastEnemyAttackAtom);
  const poise = useAtomValue(enemyPoiseSummaryAtom(enemy.id));
  const isDead = enemy.currentHp <= 0;

  const [oneShot, setOneShot] = useState<OneShot | null>(null);
  // Absolute end of the running clip. A deadline (not a duration) so a pause can shift it.
  const endsAtRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // Ends the running clip. While frozen no timer runs; resuming shifts the deadline by the time
  // spent paused (the same trick as use-enemy-attack-timers).
  useEffect(() => {
    if (!oneShot) return;
    if (isBattlePaused || isDead) {
      if (pausedAtRef.current === null) pausedAtRef.current = performance.now();
      return;
    }
    if (pausedAtRef.current !== null) {
      endsAtRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    const remaining = Math.min(oneShot.durationMs, Math.max(0, endsAtRef.current - performance.now()));
    const timer = setTimeout(() => setOneShot(null), remaining);
    return () => clearTimeout(timer);
  }, [oneShot, isBattlePaused, isDead]);

  // A hit flinches this enemy — but matches land constantly, so a hit never interrupts a running
  // clip: the recoil CSS already reads as "hit" on every strike, and replaying the sheet clip each
  // time would twitch the enemy nonstop and starve the attack animation.
  useEffect(() => {
    const hurt = sheet?.animations.hurt;
    if (!hurt || isDead) return;
    const isHit =
      lastDamage?.target === 'enemy' && (lastDamage.enemyId === enemy.id || lastDamage.enemyIds?.includes(enemy.id));
    if (!isHit) return;
    playOneShot(setOneShot, endsAtRef, hurt, false);
  }, [lastDamage, enemy.id, isDead, sheet]);

  // The enemy's own attack: play the row the engine picked. Dropped while a clip is still playing.
  useEffect(() => {
    if (!sheet || !lastAttack || lastAttack.enemyId !== enemy.id || isDead) return;
    playOneShot(
      setOneShot,
      endsAtRef,
      resolveAdmurinAttackAnimation(sheet, lastAttack.attackIndex) ?? sheet.animations.idle,
      false,
    );
  }, [lastAttack, enemy.id, isDead, sheet]);

  // Poise Break cancels the attack outright (the engine drops the pending shot too).
  useEffect(() => {
    if (poise?.phase !== 'broken') return;
    endsAtRef.current = 0;
    setOneShot(null);
  }, [poise?.phase]);

  if (!sheet) return null;

  const paused = isBattlePaused || isDead;
  if (oneShot) return { animation: oneShot.animation, mode: 'once', playId: oneShot.id, paused };
  return { animation: sheet.animations.idle, mode: isDead ? 'once' : 'loop', playId: 0, paused };
}
