import { useEffect, useState } from 'react';
import { useAtomValue, useStore } from 'jotai';
import { lastSkillActivationAtom, partyAtom } from '~/stores/battle-atoms';
import { CHARACTER_SPRITES, SKILL_BURST_COLORS, SKILL_BURST_DURATION_MS } from '~/constants/party';
import { StellaBattlerSprite } from '~/components/battle/stella-battler-sprite';
import type { CharacterClass } from '~/types/rpg-elements';

export function SkillBurstOverlay() {
  const lastSkillActivation = useAtomValue(lastSkillActivationAtom);
  const store = useStore();
  const [visible, setVisible] = useState(false);
  const [displayData, setDisplayData] = useState<{
    skillName: string;
    characterClass: CharacterClass;
  } | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!lastSkillActivation) return;

    const character = store.get(partyAtom).find((c) => c.id === lastSkillActivation.characterId);
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
  }, [lastSkillActivation, store]);

  if (!visible || !displayData) return null;

  const colors = SKILL_BURST_COLORS[displayData.characterClass];
  const sprites = CHARACTER_SPRITES[displayData.characterClass];

  return (
    <div
      key={animationKey}
      className="skill-burst-overlay pointer-events-none fixed inset-0 z-40 overflow-hidden"
      style={
        {
          backgroundColor: colors.bg,
          '--skill-burst-ms': `${SKILL_BURST_DURATION_MS}ms`,
        } as React.CSSProperties
      }
    >
      {/* Radial speed lines */}
      <div className="skill-burst-lines" style={{ '--burst-color-light': colors.light } as React.CSSProperties} />

      {/* Centered stage so the cut-in, battler and ribbon stay grouped on wide screens */}
      <div className="skill-burst-stage">
        {/* Full-body portrait backdrop on a diagonal band */}
        <div className="skill-burst-cutin">
          <img src={sprites.face} alt="" className="skill-burst-cutin__portrait" />
        </div>

        <div className="skill-burst-hero">
          {/* Battler playing its cast motion, scaled up */}
          <div className="skill-burst-battler">
            <StellaBattlerSprite characterClass={displayData.characterClass} motion={sprites.castMotion} mode="once" />
          </div>

          {/* Skill name on a ribbon banner (reuses the title-sign artwork). */}
          <div className="skill-burst-text title-sign title-sign--large title-sign--text-gold">
            <span className="title-sign__text pixel-font">{displayData.skillName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
