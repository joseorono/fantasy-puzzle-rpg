import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { lastSkillActivationAtom, partyAtom } from '~/stores/battle-atoms';
import { CHARACTER_ICONS, SKILL_BURST_COLORS, SKILL_BURST_DURATION_MS } from '~/constants/party';
import type { CharacterClass } from '~/types/rpg-elements';

export function SkillBurstOverlay() {
  const lastSkillActivation = useAtomValue(lastSkillActivationAtom);
  const party = useAtomValue(partyAtom);
  const [visible, setVisible] = useState(false);
  const [displayData, setDisplayData] = useState<{
    skillName: string;
    characterClass: CharacterClass;
  } | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!lastSkillActivation) return;

    const character = party.find((c) => c.id === lastSkillActivation.characterId);
    if (!character) return;

    setDisplayData({
      skillName: lastSkillActivation.skillName,
      characterClass: character.class,
    });
    setVisible(true);
    setAnimationKey((prev) => prev + 1);

    const timer = setTimeout(() => {
      setVisible(false);
    }, SKILL_BURST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [lastSkillActivation]);

  if (!visible || !displayData) return null;

  const colors = SKILL_BURST_COLORS[displayData.characterClass];
  const Icon = CHARACTER_ICONS[displayData.characterClass];

  return (
    <div
      key={animationKey}
      className="skill-burst-overlay pointer-events-none fixed inset-0 z-40 overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Radial speed lines */}
      <div
        className="skill-burst-lines"
        style={{ '--burst-color-light': colors.light } as React.CSSProperties}
      />

      {/* Character icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="skill-burst-icon drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]">
          <Icon className="h-24 w-24 text-white sm:h-32 sm:w-32 md:h-40 md:w-40" strokeWidth={2.5} />
        </div>
      </div>

      {/* Skill name text */}
      <div className="absolute inset-0 flex items-end justify-center pb-[20%]">
        <span className="skill-burst-text pixel-font text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl md:text-3xl">
          {displayData.skillName}
        </span>
      </div>
    </div>
  );
}
