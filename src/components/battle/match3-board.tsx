import { useAtomValue, useSetAtom } from 'jotai';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import {
  boardAtom,
  selectedOrbAtom,
  selectOrbAtom,
  swapOrbsAtom,
  damageEnemyAtom,
  healPartyAtom,
  removeMatchedOrbsAtom,
  battleStateAtom,
  partyAtom,
  reduceSkillCooldownAtom,
  incrementTurnAtom,
  addScoreAtom,
  recordMaxComboAtom,
  addGuardAtom,
  pendingVictoryAtom,
  commitPendingVictoryAtom,
} from '~/stores/battle-atoms';
import type { Orb, BattleState } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { OrbType } from '~/types/rpg-elements';
import type { OrbComponentProps } from '~/types/components';
import {
  calculateMatchDamage,
  calculateComboMultiplier,
  calculateGuardChargeRate,
} from '~/lib/rpg-calculations';
import { findLineMatches, expandBombExplosions } from '~/lib/match-3';
import { getEquipmentComboBonus } from '~/lib/equipment-system';
import {
  BASE_MATCH_DAMAGE,
  COOLDOWN_REDUCTION_PER_ORB,
  BASE_MATCH_SCORE,
  MATCH_SIZE_BONUS_MULTIPLIER,
  GRAY_MATCH_DAMAGE_MULTIPLIER,
  GUARD_CHARGE_PER_ORB,
} from '~/constants/party';
import {
  BOMB_MATCH_SPAWN_THRESHOLD,
  BOMB_REFILL_CHANCE,
  CASCADE_BOMB_CHANCE_MULTIPLIER,
  MAX_CHAIN_BOMB_SPAWNS,
} from '~/constants/game';
import { cn } from '~/lib/utils';
import { ORB_TYPE_CLASSES, ORB_GLOW_CLASSES } from '~/constants/ui';
import { soundService } from '~/services/sound-service';
import { SoundNames, BOMB_EXPLOSION_SOUND } from '~/constants/audio';
import { getMatchSoundVolume } from '~/lib/battle-system';
import { triggerHitstop } from '~/lib/animation-strategies';
import Franuka05aFrame from '~/components/frames/franuka-05a-frame';

/** Heat-scaled glow color for the cascade combo popup — hotter as the chain grows. */
function getComboGlow(combo: number): string {
  if (combo >= 5) return 'rgba(255, 60, 160, 0.95)'; // hot pink
  if (combo === 4) return 'rgba(255, 80, 40, 0.95)'; // red-orange
  if (combo === 3) return 'rgba(255, 140, 30, 0.95)'; // orange
  return 'rgba(255, 200, 60, 0.9)'; // gold (x2)
}

function OrbComponent({ orb, isSelected, isInvalidSwap, isNew, isExploding, onSelect }: OrbComponentProps) {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (orb.isHighlighted) {
      // Show particle explosion
      setShowParticles(true);

      // Start disappearing animation after a short delay
      const timer = setTimeout(() => {
        setIsDisappearing(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsDisappearing(false);
      setShowParticles(false);
    }
  }, [orb.isHighlighted]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        `orb-${orb.type}`,
        'relative mx-2 h-6 w-6 rounded-full transition-all duration-200 sm:h-8 sm:w-8 md:h-11 md:w-11 xl:h-8 xl:w-8 2xl:h-14 2xl:w-14',
        'cursor-pointer border-2 sm:border-3',
        'hover:scale-110 active:scale-95',
        ORB_TYPE_CLASSES[orb.type],
        isSelected && 'scale-110 animate-pulse ring-4 ring-white',
        // Orbs caught in a bomb blast play the explosion animation instead of the normal ping
        isExploding && 'orb-exploding',
        orb.isHighlighted && !isExploding && [ORB_GLOW_CLASSES[orb.type], 'animate-ping'],
        // Wildcard bomb orbs get a distinct dark sheen and a pulsing white ring
        orb.isBomb && !isExploding && 'animate-pulse ring-2 ring-white/90 brightness-75',
        isDisappearing && !isExploding && 'scale-0 rotate-180 opacity-0',
        isInvalidSwap && 'shake ring-4 ring-red-500',
        isNew && 'fall-in',
      )}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      {/* Shine effect */}
      <div className="absolute top-0.5 left-0.5 h-2 w-2 rounded-full bg-white/40 blur-sm" />

      {/* Pixel border effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}
      />

      {/* Wildcard bomb marker */}
      {orb.isBomb && !isExploding && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs leading-none sm:text-sm 2xl:text-lg"
          aria-hidden="true"
        >
          💣
        </span>
      )}

      {/* Bomb blast burst — fiery shrapnel flung outward, plus a center flash */}
      {isExploding && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-sm leading-none sm:text-base 2xl:text-xl" aria-hidden="true">
            💥
          </span>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-orange-400 shadow-[0_0_8px_rgba(255,140,0,0.9)]"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-26px)`,
                animationDelay: `${i * 25}ms`,
                animationDuration: '500ms',
              }}
            />
          ))}
        </div>
      )}

      {/* Particle explosion effect (normal line matches) */}
      {showParticles && !isExploding && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn('absolute h-2 w-2 animate-ping rounded-full', ORB_TYPE_CLASSES[orb.type])}
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-20px)`,
                animationDelay: `${i * 50}ms`,
                animationDuration: '600ms',
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}

interface Match3BoardProps {
  isBattlePaused: boolean;
}

export function Match3Board({ isBattlePaused }: Match3BoardProps) {
  const board = useAtomValue(boardAtom);
  const selectedOrb = useAtomValue(selectedOrbAtom);
  const party = useAtomValue(partyAtom);
  const selectOrb = useSetAtom(selectOrbAtom);
  const swapOrbs = useSetAtom(swapOrbsAtom);
  const damageEnemy = useSetAtom(damageEnemyAtom);
  const healParty = useSetAtom(healPartyAtom);
  const removeMatchedOrbs = useSetAtom(removeMatchedOrbsAtom);
  const reduceSkillCooldown = useSetAtom(reduceSkillCooldownAtom);
  const incrementTurn = useSetAtom(incrementTurnAtom);
  const addScore = useSetAtom(addScoreAtom);
  const recordMaxCombo = useSetAtom(recordMaxComboAtom);
  const addGuard = useSetAtom(addGuardAtom);
  const setBattleState = useSetAtom(battleStateAtom);
  const pendingVictory = useAtomValue(pendingVictoryAtom);
  const commitPendingVictory = useSetAtom(commitPendingVictoryAtom);
  const [highlightedMatches, setHighlightedMatches] = useState<Set<string>>(new Set());
  const [explodingOrbs, setExplodingOrbs] = useState<Set<string>>(new Set());
  // Combo multiplier currently shown in the cascade popup (0 = hidden, >=2 = visible)
  const [comboPopup, setComboPopup] = useState(0);
  const comboPopupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const comboPopupKeyRef = useRef(0);
  const [invalidSwap, setInvalidSwap] = useState<{
    from: GridPosition;
    to: GridPosition;
  } | null>(null);
  const [isProcessingSwap, setIsProcessingSwap] = useState(false);
  const [newOrbIds, setNewOrbIds] = useState<Set<string>>(new Set());
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBoardRef = useRef<Orb[][]>(board);
  // Cascade depth for the current chain: 0 = initial post-swap match, 1+ = cascades
  const cascadeLevelRef = useRef(0);
  // Bombs spawned so far in the current cascade chain (anti-runaway budget)
  const chainBombsSpawnedRef = useRef(0);

  // Track new orbs for animation
  useEffect(() => {
    const newIds = new Set<string>();
    board.forEach((row, rowIndex) => {
      row.forEach((orb, colIndex) => {
        const prevOrb = previousBoardRef.current[rowIndex]?.[colIndex];
        if (!prevOrb || prevOrb.id !== orb.id) {
          newIds.add(orb.id);
        }
      });
    });

    if (newIds.size > 0) {
      setNewOrbIds(newIds);
      // Clear new orb markers after animation
      setTimeout(() => setNewOrbIds(new Set()), 500);
    }

    previousBoardRef.current = board;
  }, [board]);

  // Check for matches, resolve bomb explosions, and apply combat effects
  useEffect(() => {
    // Wildcard-aware line matches, then expand any matched bombs into 3x3 blasts.
    const lineMatches = findLineMatches(board);
    const matches = expandBombExplosions(board, lineMatches);

    setHighlightedMatches(matches);

    // No matches: the board has settled. Leave the combo popup to fade on its own
    // timer so the final cascade count stays readable for a beat.
    if (matches.size === 0) {
      setExplodingOrbs(new Set());
      // If the killing blow landed mid-chain, the win was deferred so this cascade could
      // finish and fully count toward the rating. Now that it's settled, commit the win.
      if (pendingVictory) commitPendingVictory();
      return;
    }

    // Orbs destroyed by a bomb blast (in the full set but not part of the line itself)
    // get a distinct explosion animation and trigger the explosion sound.
    const exploded = new Set<string>();
    for (const id of matches) {
      if (!lineMatches.has(id)) exploded.add(id);
    }
    setExplodingOrbs(exploded);

    const explosionSound = BOMB_EXPLOSION_SOUND;
    if (exploded.size > 0 && explosionSound) {
      setTimeout(() => {
        soundService.playSound(explosionSound, 0.7, 0.1, 0.1);
      }, 200);
    }

    // The exploded orbs are added to the damage/score count via matches.size.
    const matchSizeBonus = (matches.size - 3) * MATCH_SIZE_BONUS_MULTIPLIER;
    const totalScore = BASE_MATCH_SCORE + matchSizeBonus;
    addScore(totalScore);

    // Clear any existing timer
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
    }

    // A single move can form matches of several colors at once (e.g. 3 yellow + 3 blue).
    // Collect every distinct non-bomb color present in the line matches, preserving
    // first-seen order. Each color independently triggers its character's action.
    const matchedTypes: OrbType[] = [];
    const seenTypes = new Set<OrbType>();
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const orb = board[row][col];
        if (lineMatches.has(orb.id) && !orb.isBomb && !seenTypes.has(orb.type)) {
          seenTypes.add(orb.type);
          matchedTypes.push(orb.type);
        }
      }
    }

    // The primary (first-seen) color drives the party-wide pulse + health-bar flash.
    const primaryMatchedType = matchedTypes[0] ?? null;
    if (primaryMatchedType) {
      setBattleState((prev: BattleState) => ({
        ...prev,
        lastMatchedType: primaryMatchedType,
      }));
    }

    // Cascade combo multiplier: initial match is level 0 (1x), cascades escalate.
    const cascadeLevel = cascadeLevelRef.current;

    // Cascades (level >= 1) show a prominent, lingering combo popup. Each chained
    // cascade bumps the count and refreshes the linger timer + the pop animation.
    if (cascadeLevel >= 1) {
      comboPopupKeyRef.current += 1;
      setComboPopup(cascadeLevel + 1);
      if (comboPopupTimerRef.current) clearTimeout(comboPopupTimerRef.current);
      comboPopupTimerRef.current = setTimeout(() => setComboPopup(0), 1100);
    }

    // A big line match (skill, not explosions) earns a guaranteed wildcard bomb.
    const bombsToSpawn = lineMatches.size >= BOMB_MATCH_SPAWN_THRESHOLD ? 1 : 0;

    // Bomb-spawn budget for this cascade chain: once the first bomb has spawned, the
    // per-orb chance is scaled by CASCADE_BOMB_CHANCE_MULTIPLIER, and the chain can
    // spawn at most MAX_CHAIN_BOMB_SPAWNS.
    const bombChance =
      chainBombsSpawnedRef.current > 0 ? BOMB_REFILL_CHANCE * CASCADE_BOMB_CHANCE_MULTIPLIER : BOMB_REFILL_CHANCE;
    const maxBombs = Math.max(0, MAX_CHAIN_BOMB_SPAWNS - chainBombsSpawnedRef.current);

    // Per-color effects: each matched color's character acts off the full match size.
    // Collect the damage/heal each living character applies, then resolve them together
    // after the highlight delay so the hitstop + match sound fire once for the whole move.
    const pendingEffects: Array<{ amount: number; isHeal: boolean }> = [];
    for (const matchedType of matchedTypes) {
      const matchingCharacter = party.find((char) => char.color === matchedType);
      const isCharacterDead = matchingCharacter ? matchingCharacter.currentHp <= 0 : false;
      const characterPow = matchingCharacter?.stats.pow ?? 0;

      // Each hero applies their own equipment combo bonus on top of the cascade level.
      const equipmentComboBonus = matchingCharacter ? getEquipmentComboBonus(matchingCharacter) : 0;
      const comboMultiplier = calculateComboMultiplier(cascadeLevel, equipmentComboBonus);

      // Gray is neutral (no character, no POW): it trades raw damage for Guard, so its chip
      // damage is scaled down by GRAY_MATCH_DAMAGE_MULTIPLIER.
      const isGrayMatch = matchedType === 'gray';
      const baseTotalDamage = calculateMatchDamage(matches.size, BASE_MATCH_DAMAGE, characterPow, comboMultiplier);
      const totalDamage = isGrayMatch
        ? Math.floor(baseTotalDamage * GRAY_MATCH_DAMAGE_MULTIPLIER)
        : baseTotalDamage;

      // Dead characters perform no action, but gray still charges the party Guard meter.
      if (isCharacterDead) continue;

      // Reduce the matching character's skill cooldown based on orbs matched.
      if (matchingCharacter) {
        reduceSkillCooldown(matchingCharacter.id, matches.size * COOLDOWN_REDUCTION_PER_ORB);
      }

      // Gray orbs charge the party-wide Guard meter instead of a hero's cooldown.
      // Charge scales with match size and the party's SPD-derived Guard Charge Rate.
      if (isGrayMatch) {
        addGuard(matches.size * GUARD_CHARGE_PER_ORB * calculateGuardChargeRate(party));
      }

      // Healer's default action heals the most damaged ally instead of dealing damage.
      pendingEffects.push({ amount: totalDamage, isHeal: matchingCharacter?.class === 'healer' });
    }

    // Show highlight for a moment, then resolve every matched color's effect together.
    setTimeout(() => {
      let didDamage = false;
      for (const effect of pendingEffects) {
        if (effect.isHeal) {
          healParty({ amount: effect.amount, source: 'match' });
        } else {
          damageEnemy(effect.amount);
          didDamage = true;
        }
      }

      if (pendingEffects.length > 0) {
        // Freeze-frame once on the moment damage lands (skip on heal-only moves).
        if (didDamage) triggerHitstop();
        soundService.playSound(SoundNames.match, getMatchSoundVolume(matches.size), 0.1, 0.03);
      } else {
        // No living character acted - play a muted/different sound to indicate "empty" match.
        // Lower volume (0.4x) and higher pitch variance (0.15 instead of 0.03).
        soundService.playSound(SoundNames.match, getMatchSoundVolume(matches.size) * 0.4, 0.1, 0.15);
      }
    }, 200);

    // Advance the cascade chain so the next refill-driven match scores higher.
    cascadeLevelRef.current = cascadeLevel + 1;
    // Track the deepest chain this battle for the victory rating (chain length = level + 1).
    recordMaxCombo(cascadeLevel + 1);

    // Remove matched orbs after animation - this will trigger a new board state
    // which will cause this effect to run again and check for new (cascade) matches
    processingTimerRef.current = setTimeout(() => {
      const spawned = removeMatchedOrbs(matches, bombsToSpawn, bombChance, maxBombs);
      chainBombsSpawnedRef.current += spawned;
    }, 600);

    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, [board, damageEnemy, removeMatchedOrbs]);

  const handleOrbClick = (row: number, col: number) => {
    // Don't allow clicks while processing a swap, paused, or during the post-kill combo finish.
    if (isProcessingSwap || isBattlePaused === true || pendingVictory) return;

    if (!selectedOrb) {
      // First selection
      selectOrb({ row, col });
    } else {
      // Second selection - check if adjacent
      const rowDiff = Math.abs(selectedOrb.row - row);
      const colDiff = Math.abs(selectedOrb.col - col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Adjacent - attempt swap
        setIsProcessingSwap(true);
        const wasValid = swapOrbs(selectedOrb, { row, col });

        if (wasValid) {
          // Valid swap - a fresh player action starts a new cascade chain
          cascadeLevelRef.current = 0;
          chainBombsSpawnedRef.current = 0;
          incrementTurn();
          // processing flag will be cleared when matches are processed
          setIsProcessingSwap(false);
        } else {
          // Invalid swap - show shake animation and keep selection
          setInvalidSwap({ from: selectedOrb, to: { row, col } });

          // Clear invalid swap state and allow new clicks after animation
          setTimeout(() => {
            setInvalidSwap(null);
            setIsProcessingSwap(false);
            // Keep the first orb selected so user can try again
          }, 600);
        }
      } else {
        // Not adjacent - select new orb
        selectOrb({ row, col });
      }
    }
  };

  // Determine which orb colors belong to dead characters
  const deadColorClasses = party
    .filter((char) => char.currentHp <= 0 && char.color !== 'gray')
    .map((char) => `dead-${char.color}`);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center">
      <div className="match-badge-slot">
        {highlightedMatches.size > 0 && (
          <div className={cn('combo-pop match-badge pixel-font', highlightedMatches.size >= 5 && 'match-badge--big')}>
            <span className="match-badge__count">{highlightedMatches.size}x</span>
            <span className="match-badge__label">MATCH</span>
          </div>
        )}
      </div>

      {/* Board container */}
      <div className={cn('match3BoardContainer', deadColorClasses, pendingVictory && 'pointer-events-none')}>
        <Franuka05aFrame>
          {/* Board grid */}
          <div className="flex flex-col justify-around gap-2 p-2 sm:p-3 md:p-4">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-row sm:gap-1.5 md:gap-2 lg:gap-1 xl:gap-0 2xl:gap-1">
                {row.map((orb) => (
                  <OrbComponent
                    key={orb.id}
                    orb={{
                      ...orb,
                      isHighlighted: highlightedMatches.has(orb.id),
                    }}
                    isSelected={selectedOrb?.row === orb.row && selectedOrb?.col === orb.col}
                    isInvalidSwap={
                      invalidSwap !== null &&
                      ((invalidSwap.from.row === orb.row && invalidSwap.from.col === orb.col) ||
                        (invalidSwap.to.row === orb.row && invalidSwap.to.col === orb.col))
                    }
                    isNew={newOrbIds.has(orb.id)}
                    isExploding={explodingOrbs.has(orb.id)}
                    onSelect={() => handleOrbClick(orb.row, orb.col)}
                  />
                ))}
              </div>
            ))}
          </div>
        </Franuka05aFrame>
      </div>

      {/* Cascade combo popup — prominent, lingering, overlaid on the board */}
      {comboPopup >= 2 && (
        <div className="pointer-events-none absolute top-[16%] left-1/2 z-20 -translate-x-1/2">
          <div
            key={comboPopupKeyRef.current}
            className="combo-pop combo-popup"
            style={{ '--combo-glow': getComboGlow(comboPopup) } as CSSProperties}
          >
            <span className="combo-popup__label">COMBO</span>
            <span className="combo-popup__count">×{comboPopup}</span>
          </div>
        </div>
      )}
    </div>
  );
}
