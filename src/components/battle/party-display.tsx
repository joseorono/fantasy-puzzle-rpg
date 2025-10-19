import { useAtomValue } from 'jotai';
import { partyAtom, partyHealthPercentageAtom, lastMatchedTypeAtom, lastDamageAtom } from '~/stores/battle-store';
import type { CharacterSpriteProps } from '~/types/components';
import { cn } from '~/lib/utils';
import { useState, useEffect } from 'react';
import { DamageDisplay } from '~/components/ui/8bit/damage-display';
import { CHARACTER_ICONS, HEALTH_BAR_COLORS } from '~/constants/ui';

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

function CharacterSprite({ character }: CharacterSpriteProps) {
  const Icon = CHARACTER_ICONS[character.class];
  const colors = characterColors[character.class];
  const lastDamage = useAtomValue(lastDamageAtom);
  const healthPercentage = (character.currentHp / character.maxHp) * 100;
  const cooldownPercentage = ((character.maxCooldown - character.skillCooldown) / character.maxCooldown) * 100;
  const isSkillReady = character.skillCooldown === 0;
  const isDead = character.currentHp <= 0;
  const [showDamage, setShowDamage] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  
  // Show damage animation when this character is hit
  useEffect(() => {
    if (lastDamage && 
        lastDamage.target === 'party' && 
        lastDamage.characterId === character.id) {
      setDamageAmount(lastDamage.amount);
      setShowDamage(true);
      const timer = setTimeout(() => setShowDamage(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastDamage, character.id]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Character sprite */}
      <div className="relative group">
        {/* Glow effect when skill is ready */}
        {isSkillReady && (
          <div className={cn('absolute inset-0 rounded-lg blur-xl animate-pulse', colors.glow)} />
        )}
        
        {/* Character container */}
        <div
          className={cn(
            'relative w-20 h-24 md:w-24 md:h-28 rounded-lg border-4 transition-all duration-300',
            'hover:scale-110 cursor-pointer',
            isDead ? 'bg-gray-600 border-gray-500 grayscale opacity-50' : colors.bg,
            !isDead && colors.border,
            !isDead && isSkillReady && 'animate-bounce'
          )}
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Chibi character representation */}
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center p-2",
            isDead && "opacity-40"
          )}>
            {/* Head */}
            <div className={cn(
              "w-8 h-8 rounded-full border-2 mb-1",
              isDead ? "bg-gray-400 border-gray-500" : "bg-amber-200 border-amber-300"
            )} />
            
            {/* Body with icon */}
            <div className="flex-1 flex items-center justify-center">
              <Icon className={cn(
                "w-8 h-8 drop-shadow-lg",
                isDead ? "text-gray-400" : "text-white"
              )} strokeWidth={3} />
            </div>
            
            {/* Death indicator */}
            {isDead && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl opacity-80">💀</div>
              </div>
            )}
          </div>
          
          {/* Pixel border effect */}
          <div className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.3), inset 0 4px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>

        {/* HP indicator */}
        <div className="absolute -top-2 -right-2 bg-gray-900 border-2 border-gray-700 rounded px-1.5 py-0.5">
          <span className="text-white text-xs font-bold pixel-font">
            {character.currentHp}
          </span>
        </div>
        
        {/* Damage number animation with 8bitcn styling */}
        {showDamage && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 damage-number pointer-events-none">
            <DamageDisplay 
              amount={damageAmount} 
              type="damage"
              className="text-xl md:text-2xl"
            />
          </div>
        )}
      </div>
      
      {/* Individual HP bar */}
      <div className="w-full max-w-[100px] mb-1">
        <div className="relative h-2 bg-gray-800 border-2 border-gray-700 rounded-none">
          <div
            className={cn(
              'h-full transition-all duration-300',
              healthPercentage > 50 ? 'bg-green-500' : 
              healthPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Character name */}
      <div className={cn(
        'text-[10px] md:text-xs font-bold uppercase pixel-font',
        isDead ? 'text-gray-500 line-through' : colors.text
      )}>
        {character.name}
        {isDead && <span className="ml-1 text-red-500">✝</span>}
      </div>

      {/* Skill cooldown bar */}
      <div className="w-full max-w-[100px]">
        <div className="text-[10px] text-gray-400 mb-1 text-center pixel-font">
          {isSkillReady ? 'READY!' : `CD: ${character.skillCooldown}`}
        </div>
        <div className="relative h-3 bg-gray-800 border-2 border-gray-700 rounded-none">
          <div
            className={cn(
              'h-full transition-all duration-300',
              colors.cooldown,
              isSkillReady && 'animate-pulse'
            )}
            style={{ width: `${cooldownPercentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
          {/* Pixel border effect */}
          <div className="absolute inset-0 pointer-events-none"
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
    <div className="relative h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-900/50 to-slate-950/70">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      
      {/* Party members grid */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-4 md:gap-8">
          {party.map((character) => (
            <CharacterSprite key={character.id} character={character} />
          ))}
        </div>
      </div>

      {/* Party Info */}
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-3">
          <h2 className="text-white font-bold text-xl md:text-2xl uppercase tracking-wider pixel-font">
            ⚔️ HEROES ⚔️
          </h2>
        </div>
        
        {/* Party Health Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm md:text-base uppercase tracking-wider pixel-font">
            HP
          </span>
          <span className="text-white font-bold text-sm md:text-base pixel-font">
            {Math.round(partyHealthPercentage)}%
          </span>
        </div>
        <div className={cn(
          "relative h-8 bg-gray-800 border-4 border-gray-700 rounded-none transition-all duration-300",
          showPulse && "ring-4 ring-white/50 scale-105"
        )}>
          {/* Health bar fill */}
          <div
            className={cn(
              'h-full transition-all duration-500 relative overflow-hidden bg-gradient-to-r',
              getHealthBarColor(),
              showPulse && 'animate-pulse'
            )}
            style={{ width: `${partyHealthPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            
            {/* Segmented bars effect */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-black/20" />
              ))}
            </div>
          </div>
          {/* Pixel border effect */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
