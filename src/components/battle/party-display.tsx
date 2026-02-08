import { useAtomValue, useSetAtom } from 'jotai';
import { partyAtom, partyHealthPercentageAtom, lastMatchedTypeAtom, lastDamageAtom, activateSkillAtom } from '~/stores/battle-atoms';
import type { CharacterSpriteProps } from '~/types/components';
import { cn } from '~/lib/utils';
import { useState, useEffect } from 'react';
import { DamageDisplay } from '~/components/ui/8bit/damage-display';
import { CHARACTER_ICONS, HEALTH_BAR_COLORS } from '~/constants/ui';
import { calculatePercentage } from '~/lib/math';
import { calculateCharacterCooldown } from '~/lib/rpg-calculations';
import { SKILL_DEFINITIONS } from '~/constants/skills';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';

// Character colors with cooldown property
const characterColors = {
  warrior: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    glow: 'shadow-[0_0_20px_rgba(37,99,235,0.6)]',
    text: 'text-blue-300',
    cooldown: 'bg-blue-400',
  },
  rogue: {
    bg: 'bg-green-600',
    border: 'border-green-500',
    glow: 'shadow-[0_0_20px_rgba(22,163,74,0.6)]',
    text: 'text-green-300',
    cooldown: 'bg-green-400',
  },
  mage: {
    bg: 'bg-purple-600',
    border: 'border-purple-500',
    glow: 'shadow-[0_0_20px_rgba(147,51,234,0.6)]',
    text: 'text-purple-300',
    cooldown: 'bg-purple-400',
  },
  healer: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.6)]',
    text: 'text-yellow-300',
    cooldown: 'bg-yellow-400',
  },
};

function CharacterSprite({ character, onActivateSkill }: CharacterSpriteProps) {
  const Icon = CHARACTER_ICONS[character.class];
  const colors = characterColors[character.class];
  const lastDamage = useAtomValue(lastDamageAtom);
  const healthPercentage = calculatePercentage(character.currentHp, character.maxHp);
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
                <div className="text-2xl opacity-80 sm:text-3xl">💀</div>
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

        {/* HP indicator */}
        <div className="absolute -top-1 -right-1 rounded border border-gray-700 bg-gray-900 px-1 py-0.5">
          <span className="pixel-font text-[10px] font-bold text-white">{character.currentHp}</span>
        </div>

        {/* Damage number animation with 8bitcn styling */}
        {showDamage && (
          <div className="damage-number pointer-events-none absolute -top-8 left-1/2 z-30 -translate-x-1/2 sm:-top-10">
            <DamageDisplay amount={damageAmount} type="damage" className="text-base sm:text-lg" />
          </div>
        )}
      </div>

      {/* Individual HP bar */}
      <div className="mb-0.5 w-full max-w-[70px] sm:max-w-[80px]">
        <div className="relative h-1.5 rounded-none border border-gray-700 bg-gray-800 sm:h-2">
          <div
            className={cn(
              'h-full transition-all duration-300',
              healthPercentage > 50 ? 'bg-green-500' : healthPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500',
            )}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>

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
            <span className="text-amber-300">{skill.icon} {skill.name}</span>
          ) : (
            `CD: ${Math.ceil(character.skillCooldown)}s`
          )}
        </div>
        <div className="relative h-2 rounded-none border border-gray-700 bg-gray-800 sm:h-2.5">
          <div
            className={cn('h-full transition-all duration-300', colors.cooldown, isSkillReady && 'animate-pulse')}
            style={{ width: `${cooldownPercentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          {/* Pixel border effect */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
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
    // Default color based on health percentage
    if (partyHealthPercentage > 50) return 'from-green-600 to-green-500';
    if (partyHealthPercentage > 25) return 'from-yellow-600 to-yellow-500';
    return 'from-red-600 to-red-500';
  };

  return (
    <div className="relative flex h-full flex-col items-center justify-between bg-gradient-to-b from-slate-900/50 to-slate-950/70 p-2 sm:p-3 md:p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      {/* Party members grid */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {party.map((character) => (
            <CharacterSprite key={character.id} character={character} onActivateSkill={activateSkill} />
          ))}
        </div>
      </div>

      {/* Party Info */}
      <div className="relative z-10 w-full max-w-xs px-2">
        <div className="text-center">
          <h2 className="pixel-font pt-3 text-sm font-bold tracking-wider text-white uppercase sm:text-base md:text-lg">
            ⚔️ HEROES ⚔️
          </h2>
        </div>

        {/* Party Health Bar */}
        <div className="mb-1 flex items-center justify-between">
          <span className="pixel-font text-xs font-bold tracking-wider text-white uppercase sm:text-sm">HP</span>
          <span className="pixel-font text-xs font-bold text-white sm:text-sm">
            {Math.round(partyHealthPercentage)}%
          </span>
        </div>
        <div
          className={cn(
            'relative h-4 rounded-none border-2 border-gray-700 bg-gray-800 transition-all duration-300 sm:h-5 sm:border-3 md:h-6',
            showPulse && 'scale-105 ring-4 ring-white/50',
          )}
        >
          {/* Health bar fill */}
          <div
            className={cn(
              'relative h-full overflow-hidden bg-gradient-to-r transition-all duration-500',
              getHealthBarColor(),
              showPulse && 'animate-pulse',
            )}
            style={{ width: `${partyHealthPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Segmented bars effect */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-black/20" />
              ))}
            </div>
          </div>
          {/* Pixel border effect */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
