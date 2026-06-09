import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';
import type { SkillTarget } from '~/types/skills';
import { getUnlockedSkills } from '~/lib/skill-system';
import { CHARACTER_ICONS } from '~/constants/party';
import { usePartyActions } from '~/stores/game-store';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { KeyboardKeys } from '~/constants/keyboard';

const TARGET_LABELS: Record<SkillTarget, string> = {
  enemy: 'Single enemy',
  allEnemy: 'All enemies',
  ally: 'Lowest-HP ally',
  allAlly: 'All allies',
};

interface SkillSelectorProps {
  character: CharacterData;
  /** When true (e.g. during a battle) options render dimmed and non-interactive. */
  disabled?: boolean;
}

/**
 * Compact picker for the character's active skill, chosen from its unlocked
 * skills. Selection writes to the party store; it is the same skill battle reads
 * from its frozen snapshot, so changing it cannot affect an in-progress fight.
 */
export function SkillSelector({ character, disabled = false }: SkillSelectorProps) {
  const partyActions = usePartyActions();
  const skills = getUnlockedSkills(character);
  const Icon = CHARACTER_ICONS[character.class];
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function selectAt(index: number) {
    const skill = skills[index];
    if (!skill || skill.id === character.selectedSkillId) return;
    soundService.playSound(SoundNames.clickChangeTab, 0.5);
    partyActions.selectSkillForCharacter(character.id, skill.id);
  }

  // Arrow-key navigation scoped to the selector. stopPropagation keeps the
  // pause-menu sidebar (which listens for arrows on window to switch tabs)
  // from also reacting while the cursor is moving between skills.
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== KeyboardKeys.ArrowUp && e.key !== KeyboardKeys.ArrowDown) return;
    e.preventDefault();
    e.stopPropagation();
    const direction = e.key === KeyboardKeys.ArrowUp ? -1 : 1;
    const nextIndex = (index + direction + skills.length) % skills.length;
    buttonRefs.current[nextIndex]?.focus();
    selectAt(nextIndex);
  }

  return (
    <div className="pause-menu-skill-select pause-menu-skill-select--compact">
      <div className="pause-menu-skill-select-options">
        {skills.map((skill, index) => {
          const isActive = skill.id === character.selectedSkillId;
          return (
            <ToffecBeigeCornersWrapper key={skill.id} className="pause-menu-skill-option-wrapper">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
                    type="button"
                    className={cn('pause-menu-skill-option', isActive && 'active', disabled && 'disabled')}
                    onClick={() => selectAt(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    disabled={disabled}
                    aria-pressed={isActive}
                  >
                    <Icon className="pause-menu-skill-option-icon" size={14} />
                    <span className="pause-menu-skill-option-name">{skill.name}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  <div className="max-w-[200px] space-y-1">
                    <div className="font-bold">{skill.name}</div>
                    <div className="opacity-80">{skill.description}</div>
                    <div className="opacity-60">
                      {TARGET_LABELS[skill.target]} · charge ×{skill.cooldownMultiplier}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </ToffecBeigeCornersWrapper>
          );
        })}
      </div>

      {disabled && <div className="pause-menu-skill-select-locked">Locked during battle</div>}
    </div>
  );
}
