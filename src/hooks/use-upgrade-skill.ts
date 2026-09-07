import { useParty, usePartyActions } from '~/stores/game-store';
import { canUpgradeSkill, canUpgradePassive } from '~/lib/skill-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Centralizes skill leveling for both kinds (Active and Passive). Validates the
 * upgrade gates, bumps the level in the party store, and plays the success
 * sting. No overlay — an upgrade is a minor boost, the slot flare is enough.
 * Resource costs are the caller's concern (see `PauseMenuSkills`).
 */
export function useUpgradeSkill() {
  const party = useParty();
  const partyActions = usePartyActions();

  function upgradeActive(characterId: string, skillId: string) {
    const member = party.find((m) => m.id === characterId);
    if (!member || !canUpgradeSkill(member, skillId)) return;

    partyActions.upgradeSkillForCharacter(characterId, skillId);
    soundService.playSound(SoundNames.shimmeringSuccess);
  }

  function upgradePassive(characterId: string, passiveId: string) {
    const member = party.find((m) => m.id === characterId);
    if (!member || !canUpgradePassive(member, passiveId)) return;

    partyActions.upgradePassiveForCharacter(characterId, passiveId);
    soundService.playSound(SoundNames.shimmeringSuccess);
  }

  return { upgradeActive, upgradePassive };
}
