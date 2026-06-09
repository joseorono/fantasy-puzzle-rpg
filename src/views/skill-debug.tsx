import { useParty, usePartyActions } from '~/stores/game-store';
import { getSkillsForClass, isSkillUnlocked } from '~/lib/skill-system';
import { DEFAULT_SKILL_BY_CLASS } from '~/constants/skills';
import { CHARACTER_ICONS } from '~/constants/party';
import { useUnlockSkill } from '~/hooks/use-unlock-skill';
import type { CharacterData } from '~/types/rpg-elements';

/**
 * Debug panel for arbitrarily unlocking, selecting, and resetting character skills.
 * Unlocking here also exercises the global skill-unlock celebration overlay.
 */
export default function SkillDebugView() {
  const party = useParty();
  const partyActions = usePartyActions();
  const { unlock } = useUnlockSkill();

  function resetToDefault(member: CharacterData) {
    const defaultId = DEFAULT_SKILL_BY_CLASS[member.class];
    partyActions.updateCharacter(member.id, {
      ...member,
      unlockedSkillIds: [defaultId],
      selectedSkillId: defaultId,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold text-white">Skill System Debug</h1>
        <p className="mb-8 text-slate-300">Unlock, select, and reset character skills</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {party.map((member) => {
            const skills = getSkillsForClass(member.class);
            return (
              <div key={member.id} className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-sm text-slate-400 capitalize">
                      {member.class} · Lv {member.level}
                    </p>
                  </div>
                  <button
                    onClick={() => resetToDefault(member)}
                    className="rounded bg-slate-600 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-slate-500"
                  >
                    Lock all but default
                  </button>
                </div>

                <div className="space-y-2">
                  {skills.map((skill) => {
                    const unlocked = isSkillUnlocked(member, skill.id);
                    const selected = member.selectedSkillId === skill.id;
                    const Icon = CHARACTER_ICONS[skill.class];
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between rounded bg-slate-700 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                            <Icon className="h-4 w-4 shrink-0" /> {skill.name}
                            {selected && <span className="ml-2 text-xs text-amber-300">ACTIVE</span>}
                          </div>
                          <div className="text-xs text-slate-400">
                            {skill.target} · cd×{skill.cooldownMultiplier} · unlock Lv {skill.unlockLevel}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => unlock(member.id, skill.id)}
                            disabled={unlocked}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-40"
                          >
                            {unlocked ? 'Unlocked' : 'Unlock'}
                          </button>
                          <button
                            onClick={() => partyActions.selectSkillForCharacter(member.id, skill.id)}
                            disabled={!unlocked || selected}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
