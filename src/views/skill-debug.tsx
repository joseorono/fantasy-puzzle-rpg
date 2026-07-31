import { useParty, usePartyActions, useResources, useResourcesActions } from '~/stores/game-store';
import {
  getSkillsForClass,
  getPassivesForClass,
  isSkillUnlocked,
  isPassiveUnlocked,
  getSkillLevel,
} from '~/lib/skill-system';
import { DEFAULT_SKILL_BY_CLASS } from '~/constants/skills';
import { useUnlockSkill } from '~/hooks/use-unlock-skill';
import { useUnlockPassive } from '~/hooks/use-unlock-passive';
import { SkillIcon } from '~/components/skill-sprite-icons/skill-icon';
import { createResources } from '~/lib/resources';
import type { CharacterData } from '~/types/rpg-elements';

const DEBUG_LEVELS = [1, 4, 10, 17, 24, 30];

/** Paired −/+ buttons for nudging a skill's level directly. */
function LevelNudgeButtons({ disabled, onNudge }: { disabled: boolean; onNudge: (delta: number) => void }) {
  return (
    <>
      <button
        onClick={() => onNudge(-1)}
        disabled={disabled}
        className="rounded bg-slate-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-500 disabled:opacity-40"
      >
        −
      </button>
      <button
        onClick={() => onNudge(1)}
        disabled={disabled}
        className="rounded bg-slate-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-500 disabled:opacity-40"
      >
        +
      </button>
    </>
  );
}

/**
 * Debug panel for arbitrarily unlocking, selecting, and resetting character skills.
 * Unlocking here also exercises the global skill-unlock celebration overlay.
 */
export default function SkillDebugView() {
  const party = useParty();
  const partyActions = usePartyActions();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const { unlock } = useUnlockSkill();
  const unlockPassive = useUnlockPassive().unlock;

  function setPartyLevel(level: number) {
    for (const member of party) {
      partyActions.updateCharacter(member.id, { ...member, level });
    }
  }

  function resetToDefault(member: CharacterData) {
    const defaultId = DEFAULT_SKILL_BY_CLASS[member.class];
    partyActions.updateCharacter(member.id, {
      ...member,
      unlockedSkillIds: [defaultId],
      selectedSkillId: defaultId,
      unlockedPassiveIds: [],
      skillLevels: {},
    });
  }

  // Writes a level directly, bypassing the upgrade gates (like "Unlock free").
  function nudgeSkillLevel(member: CharacterData, id: string, delta: number, maxLevel: number) {
    const next = Math.min(Math.max(getSkillLevel(member, id) + delta, 1), maxLevel);
    partyActions.updateCharacter(member.id, {
      ...member,
      skillLevels: { ...member.skillLevels, [id]: next },
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold text-white">Skill System Debug</h1>
        <p className="mb-4 text-slate-300">Unlock, select, and reset character skills</p>

        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3">
          <button
            onClick={() =>
              resourcesActions.addResources(
                createResources({ coins: 1000, iron: 50, silver: 25, gold: 25, copper: 25 }),
              )
            }
            className="rounded bg-amber-600 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
          >
            +1000c / +50 iron / +25 silver / +25 gold
          </button>
          <span className="text-xs text-slate-400">
            coins {resources.coins} · iron {resources.iron} · silver {resources.silver} · gold {resources.gold}
          </span>
          <span className="ml-2 text-xs text-slate-500">Party level:</span>
          {DEBUG_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setPartyLevel(level)}
              className="rounded bg-slate-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-500"
            >
              {level}
            </button>
          ))}
        </div>

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
                    return (
                      <div key={skill.id} className="flex items-center justify-between rounded bg-slate-700 px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                            <SkillIcon characterClass={skill.class} position={skill.icon} size={16} sheetSize={32} />{' '}
                            {skill.name}
                            {selected && <span className="ml-2 text-xs text-amber-300">ACTIVE</span>}
                          </div>
                          <div className="text-xs text-slate-400">
                            {skill.target} · cd×{skill.cooldownMultiplier} · unlock Lv {skill.unlockLevel} · Lv{' '}
                            {getSkillLevel(member, skill.id)}/{skill.maxLevel}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <LevelNudgeButtons
                            disabled={!unlocked}
                            onNudge={(delta) => nudgeSkillLevel(member, skill.id, delta, skill.maxLevel)}
                          />
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

                <div className="mt-4 space-y-2">
                  <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">Passives</div>
                  {getPassivesForClass(member.class).map((passive) => {
                    const unlocked = isPassiveUnlocked(member, passive.id);
                    return (
                      <div
                        key={passive.id}
                        className="flex items-center justify-between rounded bg-slate-700 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                            <SkillIcon
                              characterClass={passive.class}
                              position={passive.icon}
                              size={16}
                              sheetSize={32}
                            />{' '}
                            {passive.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            tier {passive.tier} · unlock Lv {passive.unlockLevel} · Lv {getSkillLevel(member, passive.id)}
                            /{passive.maxLevel}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <LevelNudgeButtons
                            disabled={!unlocked}
                            onNudge={(delta) => nudgeSkillLevel(member, passive.id, delta, passive.maxLevel)}
                          />
                          <button
                            onClick={() => unlockPassive(member.id, passive.id)}
                            disabled={unlocked}
                            className="rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-40"
                          >
                            {unlocked ? 'Learned' : 'Unlock free'}
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
