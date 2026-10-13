import { useParty, usePartyActions } from '~/stores/game-store';
import { useOverlay } from '~/hooks/use-overlay';
import { getPassiveById, isPassiveUnlocked, hasPreviousPassiveTier } from '~/lib/skill-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Centralizes passive unlocking: validates the passive (class, duplicate, tier
 * order), unlocks it in the party store, and fires the celebration overlay.
 * Mirrors `useUnlockSkill`. Resource costs are the caller's concern — check
 * `canAfford` and call `reduceResources` before invoking `unlock`.
 */
export function useUnlockPassive() {
  const party = useParty();
  const partyActions = usePartyActions();
  const { showOverlay } = useOverlay();

  function unlock(characterId: string, passiveId: string) {
    const member = party.find((m) => m.id === characterId);
    const passive = getPassiveById(passiveId);
    if (!member || !passive || passive.class !== member.class) return;
    if (isPassiveUnlocked(member, passiveId)) return;
    if (!hasPreviousPassiveTier(member, passive)) return;

    partyActions.unlockPassiveForCharacter(characterId, passiveId);
    showOverlay({ kind: 'passive-unlock', characterId, passiveId });
    soundService.playSound(SoundNames.shimmeringSuccess);
  }

  return { unlock };
}
