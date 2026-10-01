import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { lastDamageAtom } from '~/stores/battle-atoms';
import { CHARACTER_SPRITES } from '~/constants/party';
import {
  STELLA_DAMAGE_MS,
  STELLA_DYING_MS,
  STELLA_GUARD_HOLD_MS,
  type StellaMotion,
  type StellaPlayMode,
} from '~/constants/stella-sprites';
import type { CharacterData } from '~/types/rpg-elements';

interface BattlerMotion {
  motion: StellaMotion;
  mode: StellaPlayMode;
  cycleMs?: number;
  /** Bumps on every hit reaction so back-to-back hits replay the same motion. */
  playId: number;
}

/**
 * Picks the battler motion for a party member. Priority: dead > cast > hit reaction > ready > idle.
 *
 * @param character - The party member being drawn.
 * @param isActivating - True during the slot's skill-activate window.
 */
export function useBattlerMotion(character: CharacterData, isActivating: boolean): BattlerMotion {
  const lastDamage = useAtomValue(lastDamageAtom);
  const isDead = character.currentHp <= 0;
  const isSkillReady = character.skillCooldown <= 0;
  const [isDying, setIsDying] = useState(false);
  const [reaction, setReaction] = useState<{ motion: 'damage' | 'guard'; id: number } | null>(null);
  const wasDeadRef = useRef(isDead);
  const reactionIdRef = useRef(0);

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
  useEffect(() => {
    if (!lastDamage || lastDamage.target !== 'party' || lastDamage.characterId !== character.id) return;
    const motion = lastDamage.wasGuarded ? 'guard' : lastDamage.amount > 0 ? 'damage' : null;
    if (!motion) return;
    reactionIdRef.current += 1;
    setReaction({ motion, id: reactionIdRef.current });
    const timer = setTimeout(() => setReaction(null), motion === 'guard' ? STELLA_GUARD_HOLD_MS : STELLA_DAMAGE_MS);
    return () => clearTimeout(timer);
  }, [lastDamage, character.id]);

  const playId = reaction?.id ?? 0;

  if (isDead) {
    return isDying
      ? { motion: 'dying', mode: 'once', cycleMs: STELLA_DYING_MS, playId }
      : { motion: 'dead', mode: 'once', playId };
  }
  if (isActivating) return { motion: CHARACTER_SPRITES[character.class].castMotion, mode: 'once', playId };
  if (reaction) return { motion: reaction.motion, mode: 'once', playId };
  if (isSkillReady) return { motion: 'victory', mode: 'loop', playId };
  return { motion: 'wait', mode: 'loop', playId };
}
