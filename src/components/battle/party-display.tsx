import { useAtomValue, useSetAtom } from 'jotai';
import {
  partyAtom,
  partyHealthPercentageAtom,
  guardPercentageAtom,
  lastMatchedTypeAtom,
  lastDamageAtom,
  activateSkillAtom,
} from '~/stores/battle-atoms';
import type { CharacterSpriteProps } from '~/types/components';
import { cn } from '~/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { DamageDisplay } from '~/components/ui-custom/damage-display';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { CHARACTER_ICONS, CHARACTER_BATTLE_COLORS, HEALTH_BAR_COLORS } from '~/constants/party';
import {
  HP_THRESHOLD_BG,
  HP_THRESHOLD_GRADIENT,
  GUARD_BAR_GRADIENT,
  PARTY_STATS_ICON_MIN_OPACITY,
  PARTY_STATS_ICON_DIM_FILTER,
} from '~/constants/ui';
import { getHpThreshold } from '~/lib/rpg-calculations';
import { getSelectedSkill, resolveCharacterCooldown } from '~/lib/skill-system';
import { triggerHitstop } from '~/lib/animation-strategies';
import { BattleHpBar } from '~/components/battle/battle-hp-bar';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import NumberFlow from '@number-flow/react';
import { SNAPPY_SPIN_TIMING, SNAPPY_TRANSFORM_TIMING, SNAPPY_OPACITY_TIMING } from '~/constants/number-flow';

function getPartyStatsIconOpacity(fillPercentage: number) {
  const normalizedPercentage = Math.max(0, Math.min(100, fillPercentage));

  return PARTY_STATS_ICON_MIN_OPACITY + ((1 - PARTY_STATS_ICON_MIN_OPACITY) * normalizedPercentage) / 100;
}

function CharacterSprite({ character, onActivateSkill }: CharacterSpriteProps) {
  const Icon = CHARACTER_ICONS[character.class];
  const colors = CHARACTER_BATTLE_COLORS[character.class];
  const lastDamage = useAtomValue(lastDamageAtom);
  const maxCooldownSeconds = resolveCharacterCooldown(character);
  const cooldownPercentage = ((maxCooldownSeconds - character.skillCooldown) / maxCooldownSeconds) * 100;
  const isSkillReady = character.skillCooldown <= 0;
  const isDead = character.currentHp <= 0;
  const skill = getSelectedSkill(character);
  const [showDamage, setShowDamage] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  function handleClick() {
    if (isDead || !isSkillReady || !onActivateSkill) return;
    onActivateSkill(character.id);
    soundService.playSound(SoundNames.shimmeringSuccessShort);
    setIsActivating(true);
    setTimeout(() => setIsActivating(false), 600);
    // Freeze-frame on damaging casts (heals get their feedback over the party instead).
    if (skill.target === 'enemy' || skill.target === 'allEnemy') {
      triggerHitstop();
    }
  }

  // Show damage animation when this character is hit
  useEffect(() => {
    if (
      lastDamage &&
      lastDamage.target === 'party' &&
      lastDamage.characterId === character.id &&
      lastDamage.amount > 0
    ) {
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
        thresholdColors={HP_THRESHOLD_BG}
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
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Icon className="h-3 w-3" /> {skill.name}
            </span>
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
  const guardPercentage = useAtomValue(guardPercentageAtom);
  const lastMatchedType = useAtomValue(lastMatchedTypeAtom);
  const lastDamage = useAtomValue(lastDamageAtom);
  const activateSkill = useSetAtom(activateSkillAtom);
  const [showPulse, setShowPulse] = useState(false);
  const isPartyHealthEmpty = partyHealthPercentage <= 0;
  const isGuardEmpty = guardPercentage <= 0;
  const partyHealthIconOpacity = getPartyStatsIconOpacity(partyHealthPercentage);
  const guardIconOpacity = getPartyStatsIconOpacity(guardPercentage);

  // Guard feedback: shimmer while charging, shatter + popup when a hit is mitigated.
  const [guardCharging, setGuardCharging] = useState(false);
  const [guardBlock, setGuardBlock] = useState<{ full: boolean; key: number } | null>(null);
  const prevGuardRef = useRef(0);
  const guardBlockKeyRef = useRef(0);
  const isGuardFull = guardPercentage >= 99.5;

  // Trigger pulse animation when type changes
  useEffect(() => {
    if (lastMatchedType) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastMatchedType]);

  // Shimmer the Guard bar whenever it gains charge.
  useEffect(() => {
    if (guardPercentage > prevGuardRef.current + 0.01) {
      setGuardCharging(true);
      const timer = setTimeout(() => setGuardCharging(false), 450);
      prevGuardRef.current = guardPercentage;
      return () => clearTimeout(timer);
    }
    prevGuardRef.current = guardPercentage;
  }, [guardPercentage]);

  // Shatter + "BLOCK!" popup (and a metallic clang) when an incoming hit was mitigated by Guard.
  useEffect(() => {
    if (lastDamage && lastDamage.target === 'party' && lastDamage.wasGuarded) {
      guardBlockKeyRef.current += 1;
      setGuardBlock({ full: !!lastDamage.blocked, key: guardBlockKeyRef.current });
      soundService.playSound(SoundNames.blacksmithShorter, lastDamage.blocked ? 0.9 : 0.5);
      const timer = setTimeout(() => setGuardBlock(null), 800);
      return () => clearTimeout(timer);
    }
  }, [lastDamage]);

  // Determine health bar color
  const getHealthBarColor = () => {
    if (lastMatchedType && lastMatchedType !== 'gray') {
      return HEALTH_BAR_COLORS[lastMatchedType];
    }
    return HP_THRESHOLD_GRADIENT[getHpThreshold(partyHealthPercentage)];
  };

  return (
    <div id="party-display-root" className="relative flex h-full flex-col items-center justify-center gap-3 p-2 sm:gap-4 sm:p-3 md:gap-5 md:p-4">
      {/* Party members grid */}
      <div id="party-members-grid" className="relative flex items-center justify-center">
        <div className="grid grid-cols-4 gap-2 xl:gap-7 sm:gap-3 md:gap-4 2xl:gap-12">
          {party.map((character) => (
            <CharacterSprite key={character.id} character={character} onActivateSkill={activateSkill} />
          ))}
        </div>
      </div>

      {/* Party Info — HEROES label to the left of the stacked HP + Guard bars (compact) */}
      <div
        id="party-stats-panel"
        className="relative z-10 mb-2 flex w-full max-w-sm items-center gap-2 px-2 xl:translate-y-[-5px] 2xl:translate-y-[0]"
      >
        {/* HEROES label, left of the bars to reclaim vertical space */}
        <h2 className="pixel-font shrink-0 text-[9px] leading-tight font-bold tracking-wider text-white uppercase sm:text-[11px]">
          HEROES
        </h2>

        {/* Stacked HP + Guard bars */}
        <div id="party-bars" className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Party Health Bar */}
          <div id="party-hp-row" className="flex items-center gap-1.5">
            <span
              className="flex w-5 shrink-0 justify-center"
              style={{
                opacity: partyHealthIconOpacity,
                filter: isPartyHealthEmpty === true ? PARTY_STATS_ICON_DIM_FILTER : undefined,
              }}
            >
              <FrostyRpgIcon name="redVial" size={20} />
            </span>
            <div
              id="party-hp-bar"
              className="relative h-4 flex-1 rounded-none border border-gray-700 bg-gray-800 sm:h-5 xl:h-4"
            >
              <div
                id="party-hp-fill"
                className={cn(
                  'relative h-full overflow-hidden bg-gradient-to-r transition-all duration-500',
                  getHealthBarColor(),
                  showPulse && 'brightness-125',
                )}
                style={{ width: `${partyHealthPercentage}%` }}
              >
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-black/20" />
                  ))}
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
              />
            </div>
            <span
              id="party-hp-percent"
              className="pixel-font inline-flex w-[3.25rem] shrink-0 items-center justify-end whitespace-nowrap text-[9px] font-bold text-white sm:text-[11px]"
            >
              <NumberFlow
                value={Math.round(partyHealthPercentage)}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
              %
            </span>
          </div>

          {/* Party Guard Bar */}
          <div id="party-guard-row" className="flex items-center gap-1.5">
            <span
              className="flex w-5 shrink-0 justify-center"
              style={{
                opacity: guardIconOpacity,
                filter: isGuardEmpty === true ? PARTY_STATS_ICON_DIM_FILTER : undefined,
              }}
            >
              <FrostyRpgIcon
                name="steelArmor"
                size={20}
                className={cn(
                  !isGuardEmpty && guardCharging && 'guard-icon-charging',
                  !isGuardEmpty && isGuardFull && 'guard-icon-full',
                )}
              />
            </span>
            <div
              id="party-guard-bar"
              className={cn(
                'relative h-4 flex-1 rounded-none border border-gray-700 bg-gray-800 sm:h-5 xl:h-4',
                isGuardFull && 'guard-bar-full',
              )}
            >
              <div
                id="party-guard-fill"
                className={cn(
                  'relative h-full overflow-hidden bg-gradient-to-r transition-all duration-300',
                  GUARD_BAR_GRADIENT,
                )}
                style={{ width: `${guardPercentage}%` }}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent',
                    guardCharging ? 'guard-shimmer' : 'opacity-0',
                  )}
                />
                <div className="absolute inset-0 flex">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-black/20" />
                  ))}
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
              />
              {/* Shatter flash + "BLOCK!" / "GUARD" popup when a hit is mitigated */}
              {guardBlock && (
                <div
                  key={guardBlock.key}
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                >
                  <div
                    className={cn('guard-shatter absolute inset-0', guardBlock.full ? 'bg-white/70' : 'bg-white/30')}
                  />
                  <span
                    className={cn(
                      'guard-block-popup pixel-font relative font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.85)]',
                      guardBlock.full ? 'text-[11px] sm:text-sm' : 'text-[8px] sm:text-[10px]',
                    )}
                  >
                    {guardBlock.full ? 'BLOCK!' : 'GUARD'}
                  </span>
                </div>
              )}
            </div>
            <span
              id="party-guard-percent"
              className="pixel-font inline-flex w-[3.25rem] shrink-0 items-center justify-end whitespace-nowrap text-[9px] font-bold text-white sm:text-[11px]"
            >
              <NumberFlow
                value={Math.round(guardPercentage)}
                spinTiming={SNAPPY_SPIN_TIMING}
                transformTiming={SNAPPY_TRANSFORM_TIMING}
                opacityTiming={SNAPPY_OPACITY_TIMING}
              />
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}