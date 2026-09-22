import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import {
  boardAtom,
  selectedOrbAtom,
  selectOrbAtom,
  swapOrbsAtom,
  damageEnemyAtom,
  healPartyAtom,
  removeMatchedOrbsAtom,
  partyAtom,
  deadOrbColorClassesAtom,
  incrementTurnAtom,
  applyMatchResolutionAtom,
  pendingVictoryAtom,
  commitPendingVictoryAtom,
  armedLineClearAtom,
  pendingLineClearAtom,
  fireLineClearAtom,
  lastLineClearAtom,
} from '~/stores/battle-atoms';
import type { Orb } from '~/types/battle';
import type { GridPosition } from '~/types/geometry';
import type { OrbType } from '~/types/rpg-elements';
import type { OrbComponentProps } from '~/types/components';
import { findLineMatches, expandBombExplosions, hasAnyLineMatch, swapContainsPosition } from '~/lib/match-3';
import { useBoardHint } from '~/hooks/use-board-hint';
import { resolveMatchGroups, type MatchEffect } from '~/lib/match-resolution';
import { getLineOrbIds, getSweepDelays, groupOrbsByColor, resolveLineClearOrbs } from '~/lib/line-clear';
import { BASE_MATCH_SCORE, MATCH_SIZE_BONUS_MULTIPLIER } from '~/constants/party';
import {
  BOMB_MATCH_SPAWN_THRESHOLD,
  BOMB_REFILL_CHANCE,
  CASCADE_BOMB_CHANCE_MULTIPLIER,
  MAX_CHAIN_BOMB_SPAWNS,
  MIN_MATCH_LENGTH,
} from '~/constants/board';
import {
  LINE_CLEAR_DAMAGE_MULTIPLIER,
  LINE_CLEAR_ORB_STAGGER_MS,
  LINE_CLEAR_SWEEP_MS,
  MATCH_REMOVE_DELAY_MS,
  MATCH_RESOLVE_DELAY_MS,
} from '~/constants/battle';
import { cn } from '~/lib/utils';
import { ORB_TYPE_CLASSES, ORB_GLOW_CLASSES, ORB_HINT_CLASSES } from '~/constants/ui';
import { soundService } from '~/services/sound-service';
import { SoundNames, BOMB_EXPLOSION_SOUND, LINE_CLEAR_SOUND, LINE_CLEAR_SOUND_VOLUME } from '~/constants/audio';
import { getMatchSoundVolume } from '~/lib/battle-system';
import { triggerHitstop } from '~/lib/animation-strategies';
import Franuka05aFrame from '~/components/frames/franuka-05a-frame';
import { LineClearSweep, type LineClearSweepEvent } from '~/components/battle/line-clear-sweep';

/** Heat-scaled glow color for the cascade combo popup — hotter as the chain grows. */
function getComboGlow(combo: number): string {
  if (combo >= 5) return 'rgba(255, 60, 160, 0.95)'; // hot pink
  if (combo === 4) return 'rgba(255, 80, 40, 0.95)'; // red-orange
  if (combo === 3) return 'rgba(255, 140, 30, 0.95)'; // orange
  return 'rgba(255, 200, 60, 0.9)'; // gold (x2)
}

function OrbComponent({
  orb,
  isSelected,
  isHighlighted,
  isInvalidSwap,
  isHint,
  isNew,
  isExploding,
  lineClearDelayMs,
  isAimed,
  isDimmed,
  onSelect,
  onHover,
}: OrbComponentProps) {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  // A line clear pops the orb on its own staggered timer instead of the match ping/disappear.
  const isLineClearing = lineClearDelayMs !== null;

  useEffect(() => {
    if (isHighlighted && !isLineClearing) {
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
  }, [isHighlighted, isLineClearing]);

  return (
    <button
      onClick={() => onSelect(orb.row, orb.col)}
      onPointerEnter={() => onHover(orb.row, orb.col)}
      className={cn(
        `orb-${orb.type}`,
        'relative mx-2 h-6 w-6 rounded-full transition-all duration-200 sm:h-8 sm:w-8 md:h-11 md:w-11 xl:h-8 xl:w-8 2xl:h-14 2xl:w-14',
        'cursor-pointer border-2 sm:border-3',
        'hover:scale-110 active:scale-95',
        ORB_TYPE_CLASSES[orb.type],
        // Aim mode: the line under the cursor lights up, everything else recedes.
        isAimed && 'scale-110 ring-4 ring-amber-300 brightness-125',
        isDimmed && 'opacity-40 brightness-75',
        isSelected && 'scale-110 animate-pulse ring-4 ring-white',
        // Orbs caught in a bomb blast play the explosion animation instead of the normal ping
        isExploding && 'orb-exploding',
        // Orbs on a cleared line flash and pop in the streak's wake (delay set inline below)
        isLineClearing && !isExploding && 'orb-line-clearing',
        isHighlighted && !isExploding && !isLineClearing && [ORB_GLOW_CLASSES[orb.type], 'animate-ping'],
        // Wildcard bomb orbs get a distinct dark sheen and a pulsing white ring
        orb.isBomb && !isExploding && !isLineClearing && 'animate-pulse ring-2 ring-white/90 brightness-75',
        // Idle hint: muted ring on both orbs of a legal swap; the selection ring always wins
        isHint && !isSelected && !isHighlighted && !isExploding && ORB_HINT_CLASSES,
        isDisappearing && !isExploding && 'scale-0 rotate-180 opacity-0',
        isInvalidSwap && 'shake ring-4 ring-red-500',
        isNew && 'fall-in',
      )}
      style={{
        imageRendering: 'pixelated',
        animationDelay: isLineClearing && !isExploding ? `${lineClearDelayMs}ms` : undefined,
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
  const deadColorClasses = useAtomValue(deadOrbColorClassesAtom);
  const store = useStore();
  const selectOrb = useSetAtom(selectOrbAtom);
  const swapOrbs = useSetAtom(swapOrbsAtom);
  const damageEnemy = useSetAtom(damageEnemyAtom);
  const healParty = useSetAtom(healPartyAtom);
  const removeMatchedOrbs = useSetAtom(removeMatchedOrbsAtom);
  const incrementTurn = useSetAtom(incrementTurnAtom);
  const applyMatchResolution = useSetAtom(applyMatchResolutionAtom);
  const pendingVictory = useAtomValue(pendingVictoryAtom);
  const commitPendingVictory = useSetAtom(commitPendingVictoryAtom);
  const armedLineClear = useAtomValue(armedLineClearAtom);
  const fireLineClear = useSetAtom(fireLineClearAtom);
  const pendingLineClear = useAtomValue(pendingLineClearAtom);
  const setPendingLineClear = useSetAtom(pendingLineClearAtom);
  const setLastLineClear = useSetAtom(lastLineClearAtom);
  // Line under the cursor while a line-clear item is armed (a row or a column index).
  const [aimIndex, setAimIndex] = useState<number | null>(null);
  // The streak currently crossing the board (also jolts the board); null once the line is gone.
  const [sweep, setSweep] = useState<LineClearSweepEvent | null>(null);
  // Per-orb pop delay for the line being cleared, following the streak.
  const [lineClearDelays, setLineClearDelays] = useState<Map<string, number>>(new Map());
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
  // Timers for a resolving line clear, kept apart from the cascade's own so neither cancels the other.
  const lineClearTimersRef = useRef<NodeJS.Timeout[]>([]);
  const hintMove = useBoardHint(board, !isProcessingSwap && !isBattlePaused && !pendingVictory && !armedLineClear);

  /**
   * Lands a resolved move: every damaging colour goes out as one batched hit so a single
   * `lastDamage` event carries them all, heals are applied per healer, and the freeze-frame and
   * match SFX fire once for the whole move. Shared by ordinary matches and line clears.
   */
  function landMatchEffects(effects: MatchEffect[], cascadeLevel: number, orbCount: number) {
    const hits = effects
      .filter((effect) => !effect.isHeal)
      .map((effect) => ({ amount: effect.amount, characterId: effect.characterId }));
    const didDamage = hits.length > 0;

    for (const effect of effects) {
      if (effect.isHeal) healParty({ amount: effect.amount, source: 'match' });
    }
    if (didDamage) damageEnemy({ hits, cascadeLevel });

    if (effects.length > 0) {
      // Freeze-frame once on the moment damage lands (skip on heal-only moves).
      if (didDamage) triggerHitstop();
      soundService.playSound(SoundNames.match, getMatchSoundVolume(orbCount), 0.1, 0.03);
    } else {
      // No living character acted - play a muted/different sound to indicate "empty" match.
      // Lower volume (0.4x) and higher pitch variance (0.15 instead of 0.03).
      soundService.playSound(SoundNames.match, getMatchSoundVolume(orbCount) * 0.4, 0.1, 0.15);
    }
  }

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
    // Read the party on demand rather than subscribing: the board must not re-render on every
    // cooldown tick, and the live value here is never staler than a render-time closure would be.
    const party = store.get(partyAtom);
    // Wildcard-aware line matches, then expand any matched bombs into 3x3 blasts.
    const lineMatches = findLineMatches(board);
    const matches = expandBombExplosions(board, lineMatches);

    setHighlightedMatches(matches);

    // No matches: the board has settled. Leave the combo popup to fade on its own
    // timer so the final cascade count stays readable for a beat.
    if (matches.size === 0) {
      setExplodingOrbs(new Set());
      // Cascade chain is fully settled — unlock clicks for the next player move.
      setIsProcessingSwap(false);
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
    const { effects, cooldownReductions, guardGain } = resolveMatchGroups(
      matchedTypes.map((type) => ({ type, matchSize: matches.size })),
      party,
      cascadeLevel,
    );

    // Score, pulse colour, cooldowns, Guard and the deepest chain this battle (chain length =
    // level + 1) land in one state write instead of five (see applyMatchResolutionAtom).
    applyMatchResolution({
      scoreDelta: totalScore,
      primaryMatchedType,
      cooldownReductions,
      guardGain,
      combo: cascadeLevel + 1,
    });

    // Show highlight for a moment, then resolve every matched color's effect together.
    setTimeout(() => landMatchEffects(effects, cascadeLevel, matches.size), MATCH_RESOLVE_DELAY_MS);

    // Advance the cascade chain so the next refill-driven match scores higher.
    cascadeLevelRef.current = cascadeLevel + 1;

    // Remove matched orbs after animation - this will trigger a new board state
    // which will cause this effect to run again and check for new (cascade) matches
    processingTimerRef.current = setTimeout(() => {
      const spawned = removeMatchedOrbs(matches, bombsToSpawn, bombChance, maxBombs);
      chainBombsSpawnedRef.current += spawned;
    }, MATCH_REMOVE_DELAY_MS);

    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, [board, damageEnemy, removeMatchedOrbs]);

  /**
   * Resolves a fired line clear once the board is settled. The request only names a line, so the
   * orbs are read here, off the board as it stands — a clear fired mid-cascade waits its turn and
   * then wipes whatever ended up there. Payout mirrors a match: every cleared orb counts for its
   * colour's hero, bombs caught in the line detonate, and the refill cascades as usual.
   */
  useEffect(() => {
    if (!pendingLineClear) return;
    if (isProcessingSwap || isBattlePaused === true || pendingVictory) return;
    // A match is still pending on the board — let that cascade play out first.
    if (hasAnyLineMatch(board)) return;

    const { orientation, index } = pendingLineClear;
    setPendingLineClear(null);

    const lineIds = getLineOrbIds(board, orientation, index);
    if (lineIds.size === 0) return;
    const clearedIds = resolveLineClearOrbs(board, orientation, index);

    // Orbs beyond the line itself were taken by a bomb blast; they get the explosion animation.
    const exploded = new Set<string>();
    for (const id of clearedIds) {
      if (!lineIds.has(id)) exploded.add(id);
    }

    // A line clear is a player action: it locks the board and opens a fresh cascade chain.
    setIsProcessingSwap(true);
    cascadeLevelRef.current = 0;
    chainBombsSpawnedRef.current = 0;
    incrementTurn();
    setAimIndex(null);

    // The streak, the staggered pops along the line, the board jolt, the callout and the swish all
    // start now. Bomb blasts, the match badge and the payout wait for the streak to finish.
    const timestamp = Date.now();
    setLineClearDelays(getSweepDelays(board, lineIds, orientation, LINE_CLEAR_ORB_STAGGER_MS));
    setSweep({ orientation, index, timestamp });
    setLastLineClear({ orientation, timestamp });
    const sweepSound = LINE_CLEAR_SOUND;
    if (sweepSound) soundService.playSound(sweepSound, LINE_CLEAR_SOUND_VOLUME, 0.1, 0.05);

    // Read the party on demand, exactly as the match effect does, so the board never subscribes
    // to it. Cascade level 0: the clear itself is the opening move of its chain.
    const party = store.get(partyAtom);
    const { effects, cooldownReductions, guardGain, primaryMatchedType } = resolveMatchGroups(
      groupOrbsByColor(board, clearedIds),
      party,
      0,
      { damageMultiplier: LINE_CLEAR_DAMAGE_MULTIPLIER },
    );

    applyMatchResolution({
      scoreDelta: BASE_MATCH_SCORE + (clearedIds.size - MIN_MATCH_LENGTH) * MATCH_SIZE_BONUS_MULTIPLIER,
      primaryMatchedType,
      cooldownReductions,
      guardGain,
      combo: 1,
    });

    for (const timer of lineClearTimersRef.current) clearTimeout(timer);
    lineClearTimersRef.current = [
      // The streak has crossed the line: bombs it caught go off, the badge shows the full count,
      // and the damage numbers land with the hitstop and match SFX.
      setTimeout(() => {
        setHighlightedMatches(clearedIds);
        setExplodingOrbs(exploded);
        const explosionSound = BOMB_EXPLOSION_SOUND;
        if (exploded.size > 0 && explosionSound) soundService.playSound(explosionSound, 0.7, 0.1, 0.1);
        landMatchEffects(effects, 0, clearedIds.size);
      }, LINE_CLEAR_SWEEP_MS),
      // Removing the orbs changes the board, which hands control back to the match effect for cascades.
      setTimeout(() => {
        setSweep(null);
        setLineClearDelays(new Map());
        const spawned = removeMatchedOrbs(clearedIds, 0, BOMB_REFILL_CHANCE, MAX_CHAIN_BOMB_SPAWNS);
        chainBombsSpawnedRef.current += spawned;
      }, MATCH_REMOVE_DELAY_MS),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLineClear, isProcessingSwap, isBattlePaused, pendingVictory, board]);

  // Drop any in-flight line-clear timers on unmount so a leave mid-resolution can't fire into a dead board.
  useEffect(() => {
    const timers = lineClearTimersRef;
    return () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    };
  }, []);

  const handleOrbHover = (row: number, col: number) => {
    if (!armedLineClear) return;
    setAimIndex(armedLineClear.orientation === 'row' ? row : col);
  };

  const handleOrbClick = (row: number, col: number) => {
    // Don't allow clicks while processing a swap, paused, or during the post-kill combo finish.
    if (isProcessingSwap || isBattlePaused === true || pendingVictory) return;

    // Aiming a line-clear item: the click picks the line instead of selecting an orb.
    if (armedLineClear) {
      fireLineClear({
        itemId: armedLineClear.itemId,
        orientation: armedLineClear.orientation,
        index: armedLineClear.orientation === 'row' ? row : col,
      });
      setAimIndex(null);
      return;
    }

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
          // Keep isProcessingSwap=true during the entire cascade chain.
          // Clearing it here lets clicks through while orbs are still pending
          // removal (600ms timer), causing a race where a second swap cancels
          // the first cascade's timer and orbs are never removed.
          // The settle branch of the board effect clears this flag instead.
        } else {
          // Invalid swap - show shake animation and keep selection
          setInvalidSwap({ from: selectedOrb, to: { row, col } });

          // Unlock clicks immediately so the player can retry without delay.
          // Only the shake animation cleanup stays inside the timeout.
          setIsProcessingSwap(false);
          setTimeout(() => {
            setInvalidSwap(null);
            // Keep the first orb selected so user can try again
          }, 600);
        }
      } else {
        // Not adjacent - select new orb
        selectOrb({ row, col });
      }
    }
  };

  // The aimed line only reads as aimed while an item is actually armed: disarming (Escape, a pause,
  // the fire itself) must not leave the board dimmed around a stale hover.
  const aimedLine = armedLineClear ? aimIndex : null;

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
      <div
        className={cn(
          'match3BoardContainer',
          deadColorClasses,
          pendingVictory && 'pointer-events-none',
          armedLineClear && 'cursor-crosshair',
          sweep && 'board-shake',
        )}
        onPointerLeave={() => setAimIndex(null)}
      >
        <Franuka05aFrame>
          {/* Board grid */}
          <div className="relative flex flex-col justify-around gap-2 p-2 sm:p-3 md:p-4">
            <LineClearSweep sweep={sweep} />
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-row sm:gap-1.5 md:gap-2 lg:gap-1 xl:gap-0 2xl:gap-1">
                {row.map((orb) => {
                  const isAimed =
                    aimedLine !== null && (armedLineClear?.orientation === 'row' ? orb.row : orb.col) === aimedLine;

                  return (
                    <OrbComponent
                      key={orb.id}
                      orb={orb}
                      isHighlighted={highlightedMatches.has(orb.id)}
                      isSelected={selectedOrb?.row === orb.row && selectedOrb?.col === orb.col}
                      isInvalidSwap={invalidSwap !== null && swapContainsPosition(invalidSwap, orb.row, orb.col)}
                      isHint={hintMove !== null && swapContainsPosition(hintMove, orb.row, orb.col)}
                      isNew={newOrbIds.has(orb.id)}
                      isExploding={explodingOrbs.has(orb.id)}
                      lineClearDelayMs={lineClearDelays.get(orb.id) ?? null}
                      isAimed={isAimed}
                      isDimmed={aimedLine !== null && !isAimed}
                      onSelect={handleOrbClick}
                      onHover={handleOrbHover}
                    />
                  );
                })}
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
