import { useAtomValue, useSetAtom } from 'jotai';
import {
  partyAtom,
  partyHealthPercentageAtom,
  lastMatchedTypeAtom,
  lastDamageAtom,
  activateSkillAtom,
} from '~/stores/battle-atoms';
import type { CharacterSpriteProps } from '~/types/components';
import { cn } from '~/lib/utils';
import { useState, useEffect } from 'react';
import { DamageDisplay } from '~/components/ui-custom/damage-display';
import { CHARACTER_ICONS, CHARACTER_BATTLE_COLORS, HEALTH_BAR_COLORS, SKILL_DEFINITIONS } from '~/constants/party';
import { HP_THRESHOLD_GRADIENT } from '~/constants/ui';
import { calculateCharacterCooldown, getHpThreshold } from '~/lib/rpg-calculations';
import { BattleHpBar } from '~/components/battle/battle-hp-bar';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import NumberFlow from '@number-flow/react';
import { SNAPPY_SPIN_TIMING, SNAPPY_TRANSFORM_TIMING, SNAPPY_OPACITY_TIMING } from '~/constants/number-flow';

function CharacterSprite({ character, onActivateSkill }: CharacterSpriteProps) {
  const Icon = CHARACTER_ICONS[character.class];
  const colors = CHARACTER_BATTLE_COLORS[character.class];
  const lastDamage = useAtomValue(lastDamageAtom);
  const maxCooldownSeconds = calculateCharacterCooldown(character);
  const cooldownPercentage = ((maxCooldownSeconds - character.skillCooldown) / maxCooldownSeconds) * 100;
  const isSkillReady = character.skillCooldown <= 0;
  const isDead = character.currentHp <= 0;
  const skill = SKILL_DEFINITIONS[character.class];
  const [showDamage, setShowDamage] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  function handleClick() {
    if (isDead || !isSkillReady || !onActivateSkill) return;
    onActivateSkill(character.id);
    soundService.playSound(SoundNames.shimmeringSuccessShort);
    setIsActivating(true);
    setTimeout(() => setIsActivating(false), 600);
  }

  // Show damage animation when this character is hit
  useEffect(() => {
    if (lastDamage && lastDamage.target === 'party' && lastDamage.characterId === character.id) {
      setDamageAmount(lastDamage.amount);
      setShowDamage(true);
      const timer = setTimeout(() => setShowDamage(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastDamage, character.id]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Character sprite */}
      <div className="group relative">
        {/* Glow effect when skill is ready */}
        {isSkillReady && <div className={cn('absolute inset-0 animate-pulse rounded-lg blur-xl', colors.glow)} />}

        {/* Character container */}
        <div
          onClick={handleClick}
          className={cn(
            'relative h-16 w-14 rounded-lg border-2 transition-all duration-300 sm:h-20 sm:w-16 sm:border-3 md:h-22 md:w-18',
            isDead ? 'border-gray-500 bg-gray-600 opacity-50 grayscale' : colors.bg,
            !isDead && colors.border,
            !isDead && isSkillReady && 'animate-bounce cursor-pointer hover:scale-110',
            !isDead && !isSkillReady && 'cursor-default',
            isActivating && 'skill-activate',
          )}
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Chibi character representation */}
          <div className={cn('absolute inset-0 flex flex-col items-center justify-center p-1', isDead && 'opacity-40')}>
            {/* Head */}
            <div
              className={cn(
                'mb-0.5 h-5 w-5 rounded-full border sm:h-6 sm:w-6',
                isDead ? 'border-gray-500 bg-gray-400' : 'border-amber-300 bg-amber-200',
              )}
            />

            {/* Body with icon */}
            <div className="flex flex-1 items-center justify-center">
              <Icon
                className={cn('h-5 w-5 drop-shadow-lg sm:h-6 sm:w-6', isDead ? 'text-gray-400' : 'text-white')}
                strokeWidth={3}
              />
            </div>

            {/* Death indicator */}
            {isDead && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/assets/icons/skull-frostyrabbid.png"
                  alt="Dead"
                  className="h-10 w-10 opacity-80 sm:h-12 sm:w-12"
                />
              </div>
            )}
          </div>

          {/* Pixel border effect */}
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>

        {/* Damage number animation with 8bitcn styling */}
        {showDamage && (
          <div className="damage-number pointer-events-none absolute -top-8 left-1/2 z-30 -translate-x-1/2 sm:-top-10">
            <DamageDisplay amount={damageAmount} type="damage" className="text-base sm:text-lg" />
          </div>
        )}
      </div>

      {/* Individual HP bar */}
      <BattleHpBar
        currentHp={character.currentHp}
        maxHp={character.maxHp}
        className="mb-0.5 max-w-[70px] sm:max-w-[80px]"
      />

      {/* Character name */}
      <div
        className={cn(
          'pixel-font text-[8px] font-bold uppercase sm:text-[10px]',
          isDead ? 'text-gray-500 line-through' : colors.text,
        )}
      >
        {character.name}
        {isDead && <span className="ml-0.5 text-red-500">✝</span>}
      </div>

      {/* Skill cooldown bar */}
      <div className="w-full max-w-[70px] sm:max-w-[80px]">
        <div className="pixel-font mb-0.5 text-center text-[8px] text-gray-400 sm:text-[9px]">
          {isSkillReady ? (
            <span className="text-amber-300">
              {skill.icon} {skill.name}
            </span>
          ) : (
            `CD: ${Math.ceil(character.skillCooldown)}s`
          )}
        </div>
        <div className="battle-skill-bar-container">
          <div
            className={cn('battle-skill-bar-fill transition-all duration-300', colors.cooldown, isSkillReady && 'animate-pulse')}
            style={{ width: `${cooldownPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PartyDisplay() {
  const party = useAtomValue(partyAtom);
  const partyHealthPercentage = useAtomValue(partyHealthPercentageAtom);
  const lastMatchedType = useAtomValue(lastMatchedTypeAtom);
  const activateSkill = useSetAtom(activateSkillAtom);
  const [showPulse, setShowPulse] = useState(false);

  // Trigger pulse animation when type changes
  useEffect(() => {
    if (lastMatchedType) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastMatchedType]);

  // Determine health bar color
  const getHealthBarColor = () => {
    if (lastMatchedType && lastMatchedType !== 'gray') {
      return HEALTH_BAR_COLORS[lastMatchedType];
    }
    return HP_THRESHOLD_GRADIENT[getHpThreshold(partyHealthPercentage)];
  };

  return (
    <div className="relative flex h-[50vh] flex-col items-center justify-between p-2 sm:p-3 md:p-4 2xl:h-[43vh]">
      {/* Party members grid */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="grid grid-cols-4 gap-2 xl:gap-7 xl:mt-4 sm:gap-3 md:gap-4 2xl:gap-12 2xl:scale-100 xl:scale-90">
          {party.map((character) => (
            <CharacterSprite key={character.id} character={character} onActivateSkill={activateSkill} />
          ))}
        </div>
      </div>

      {/* Party Info */}
      <div className="relative z-10 mb-10 w-full max-w-xs px-2">
        <div className="text-center">
          <h2 className="pixel-font text-sm mt-5 xl:mt-0 pt-2 scale-90 font-bold tracking-wider text-white uppercase sm:text-base md:text-lg">
            HEROES
          </h2>
        </div>

        {/* Party Health Bar */}
        <div className="flex items-center justify-between xl:-mt-4 mb-1">
          <span className="pixel-font text-xs font-bold tracking-wider text-white uppercase sm:text-sm">HP</span>
          <span className="pixel-font text-xs font-bold text-white sm:text-sm">
            <NumberFlow
              value={Math.round(partyHealthPercentage)}
              spinTiming={SNAPPY_SPIN_TIMING}
              transformTiming={SNAPPY_TRANSFORM_TIMING}
              opacityTiming={SNAPPY_OPACITY_TIMING}
            />
            %
          </span>
        </div>
        
        <div className="battle-party-hp-bar-container">
          <div className="battle-party-hp-bar-fill-wrapper">
            <div
              className={cn(
                'battle-party-hp-bar-fill transition-all duration-500',
                getHealthBarColor(),
                showPulse && 'scale-[1.02]'
              )}
              style={{ width: `${partyHealthPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
