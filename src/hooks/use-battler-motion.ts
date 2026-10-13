import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { useAtomValue } from 'jotai';
import { battlerActionAtom, lastDamageAtom } from '~/stores/battle-atoms';
import { CHARACTER_SPRITES } from '~/constants/party';
import {
  STELLA_ACTION_MS,
  STELLA_DAMAGE_MS,
  STELLA_DYING_MS,
  STELLA_GUARD_HOLD_MS,
  STELLA_IDLE_MOTION,
  type StellaMotion,
  type StellaPlayMode,
} from '~/constants/stella-sprites';
import type { CharacterData } from '~/types/rpg-elements';

interface BattlerMotion {
  motion: StellaMotion;
  mode: StellaPlayMode;
  cycleMs?: number;
  /** Bumps on every one-shot so back-to-back hits or actions replay the same motion. */
  playId: number;
}

/** A short motion that plays once and then falls back (a match action or a hit reaction). */
interface OneShot {
  motion: StellaMotion;
  id: number;
}

type OneShotTimer = RefObject<ReturnType<typeof setTimeout> | undefined>;

/**
 * Plays a one-shot and schedules its end. The timer lives in a ref this hook alone controls, so
 * unrelated events (another hero's hit, this hero's own attack landing) can't cancel the reset.
 */
function playOneShot(
  setOneShot: Dispatch<SetStateAction<OneShot | null>>,
  timerRef: OneShotTimer,
  motion: StellaMotion,
  durationMs: number,
) {
  setOneShot((previous) => ({ motion, id: (previous?.id ?? 0) + 1 }));
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => setOneShot(null), durationMs);
}

/**
 * Picks the battler motion for a party member.
 * Priority: dead > skill cast > one-shot (match action or hit, latest wins) > ready > idle.
 *
 * @param character - The party member being drawn.
 * @param isActivating - True during the slot's skill-activate window.
 */
export function useBattlerMotion(character: CharacterData, isActivating: boolean): BattlerMotion {
  const lastDamage = useAtomValue(lastDamageAtom);
  const actionCount = useAtomValue(battlerActionAtom(character.id));
  const isDead = character.currentHp <= 0;
  const isSkillReady = character.skillCooldown <= 0;
  const [isDying, setIsDying] = useState(false);
  const [oneShot, setOneShot] = useState<OneShot | null>(null);
  const wasDeadRef = useRef(isDead);
  const oneShotTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Mount sees the current count as already handled, so re-mounting never replays an action.
  const seenActionCountRef = useRef(actionCount);
  const actionUntilRef = useRef(0);

  useEffect(() => () => clearTimeout(oneShotTimerRef.current), []);

  // Dying pre-roll only on the alive → dead transition; a member already down on mount lies still.
  useEffect(() => {
    const wasDead = wasDeadRef.current;
    wasDeadRef.current = isDead;
    if (!isDead || wasDead) return;
    setIsDying(true);
    const timer = setTimeout(() => setIsDying(false), STELLA_DYING_MS);
    return () => clearTimeout(timer);
  }, [isDead]);

  // Flinch on a hit aimed at this member; a hit Guard mitigated shows the guard pose instead.
  // A hit interrupts a running action — getting hit should read as getting hit.
  useEffect(() => {
    if (!lastDamage || lastDamage.target !== 'party' || lastDamage.characterId !== character.id) return;
    const motion = lastDamage.wasGuarded ? 'guard' : lastDamage.amount > 0 ? 'damage' : null;
    if (!motion) return;
    actionUntilRef.current = 0;
    playOneShot(setOneShot, oneShotTimerRef, motion, motion === 'guard' ? STELLA_GUARD_HOLD_MS : STELLA_DAMAGE_MS);
  }, [lastDamage, character.id]);

  // Match action. Triggers that land while one is still playing (fast cascades) are dropped,
  // so the motion always completes instead of restarting every hit.
  useEffect(() => {
    if (actionCount === seenActionCountRef.current) return;
    seenActionCountRef.current = actionCount;
    if (isDead) return;
    const now = performance.now();
    if (now < actionUntilRef.current) return;
    actionUntilRef.current = now + STELLA_ACTION_MS;
    playOneShot(setOneShot, oneShotTimerRef, CHARACTER_SPRITES[character.class].actionMotion, STELLA_ACTION_MS);
  }, [actionCount, isDead, character.class]);

  const playId = oneShot?.id ?? 0;

  if (isDead) {
    return isDying
      ? { motion: 'dying', mode: 'once', cycleMs: STELLA_DYING_MS, playId }
      : { motion: 'dead', mode: 'once', playId };
  }
  if (isActivating) return { motion: CHARACTER_SPRITES[character.class].castMotion, mode: 'once', playId };
  if (oneShot) return { motion: oneShot.motion, mode: 'once', playId };
  if (isSkillReady) return { motion: 'victory', mode: 'loop', playId };
  return { motion: STELLA_IDLE_MOTION, mode: 'loop', playId };
}
