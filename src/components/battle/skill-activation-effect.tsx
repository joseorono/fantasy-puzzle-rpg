import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { lastSkillActivationAtom } from '~/stores/battle-atoms';
import { DamageDisplay } from '~/components/ui/8bit/damage-display';

export function SkillActivationEffect() {
  const lastSkillActivation = useAtomValue(lastSkillActivationAtom);
  const [visible, setVisible] = useState(false);
  const [displayData, setDisplayData] = useState<{
    skillName: string;
    amount: number;
    isHeal: boolean;
  } | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (lastSkillActivation) {
      setDisplayData({
        skillName: lastSkillActivation.skillName,
        amount: lastSkillActivation.amount,
        isHeal: lastSkillActivation.isHeal,
      });
      setVisible(true);
      setAnimationKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastSkillActivation]);

  if (!visible || !displayData) return null;

  return (
    <div
      key={animationKey}
      className="damage-number pointer-events-none absolute top-1/4 left-1/2 z-30 -translate-x-1/2"
      style={{ animation: 'damage-float 1.5s ease-out forwards' }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="pixel-font text-xs font-bold text-amber-300 drop-shadow-lg sm:text-sm">
          {displayData.skillName}
        </span>
        <DamageDisplay
          amount={displayData.amount}
          type={displayData.isHeal ? 'heal' : 'critical'}
          className="text-3xl md:text-4xl"
        />
      </div>
    </div>
  );
}
