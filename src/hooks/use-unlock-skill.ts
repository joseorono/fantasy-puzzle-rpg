import { useParty, usePartyActions } from '~/stores/game-store';
import { useOverlay } from '~/hooks/use-overlay';
import { getSkillById, isSkillUnlocked } from '~/lib/skill-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Centralizes skill unlocking across triggers (level-up, town store, debug).
 * Validates the skill, unlocks it in the party store, and fires the global
 * celebration overlay. No-ops (and no celebration) when the skill is invalid,
 * belongs to another class, or is already unlocked.
 */
export function useUnlockSkill() {
  const party = useParty();
  const partyActions = usePartyActions();
  const { showOverlay } = useOverlay();

  function unlock(characterId: string, skillId: string) {
    const member = party.find((m) => m.id === characterId);
    const skill = getSkillById(skillId);
    if (!member || !skill || skill.class !== member.class) return;
    if (isSkillUnlocked(member, skillId)) return;

    partyActions.unlockSkillForCharacter(characterId, skillId);
    showOverlay({ kind: 'skill-unlock', characterId, skillId });
    soundService.playSound(SoundNames.shimmeringSuccess);
  }

  return { unlock };
}
