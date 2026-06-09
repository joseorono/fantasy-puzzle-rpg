import { atom } from 'jotai';

/**
 * Identifies a skill unlock that should be celebrated with the global overlay.
 */
export interface PendingSkillUnlock {
  characterId: string;
  skillId: string;
}

/**
 * The skill unlock currently being celebrated, or null when no overlay is shown.
 * Set by `useUnlockSkill`; consumed and cleared by `SkillUnlockOverlay`.
 */
export const pendingSkillUnlockAtom = atom<PendingSkillUnlock | null>(null);
