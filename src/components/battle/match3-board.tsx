import { useAtomValue, useSetAtom } from 'jotai';
import { useState, useEffect, useRef } from 'react';
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
} from '~/stores/battle-atoms';
import type { Orb, BattleState } from '~/types/battle';
import type { OrbType } from '~/types/rpg-elements';
import type { OrbComponentProps } from '~/types/components';
import { calculateMatchDamage } from '~/lib/rpg-calculations';
import { BASE_MATCH_DAMAGE } from '~/constants/game';
import { COOLDOWN_REDUCTION_PER_ORB } from '~/constants/skills';
import { cn } from '~/lib/utils';
import { ORB_TYPE_CLASSES, ORB_GLOW_CLASSES } from '~/constants/ui';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
function OrbComponent({ orb, isSelected, isInvalidSwap, isNew, onSelect }: OrbComponentProps) {
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
        'relative mx-2 h-6 w-6 rounded-full transition-all duration-200 sm:h-8 sm:w-8 md:h-11 md:w-11',
        'cursor-pointer border-2 sm:border-3',
        'hover:scale-110 active:scale-95',
        ORB_TYPE_CLASSES[orb.type],
        isSelected && 'scale-110 animate-pulse ring-4 ring-white',
        orb.isHighlighted && [ORB_GLOW_CLASSES[orb.type], 'animate-ping'],
        isDisappearing && 'scale-0 rotate-180 opacity-0',
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

      {/* Particle explosion effect */}
      {showParticles && (
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

export function Match3Board() {
  const board = useAtomValue(boardAtom);
  const selectedOrb = useAtomValue(selectedOrbAtom);
  const party = useAtomValue(partyAtom);
  const selectOrb = useSetAtom(selectOrbAtom);
  const swapOrbs = useSetAtom(swapOrbsAtom);
  const damageEnemy = useSetAtom(damageEnemyAtom);
  const healParty = useSetAtom(healPartyAtom);
  const removeMatchedOrbs = useSetAtom(removeMatchedOrbsAtom);
  const reduceSkillCooldown = useSetAtom(reduceSkillCooldownAtom);
  const setBattleState = useSetAtom(battleStateAtom);
  const [highlightedMatches, setHighlightedMatches] = useState<Set<string>>(new Set());
  const [invalidSwap, setInvalidSwap] = useState<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null>(null);
  const [isProcessingSwap, setIsProcessingSwap] = useState(false);
  const [newOrbIds, setNewOrbIds] = useState<Set<string>>(new Set());
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBoardRef = useRef<Orb[][]>(board);

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

  // Check for matches (simplified - just for visual demo)
  useEffect(() => {
    const matches = new Set<string>();

    // Check horizontal matches
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length - 2; col++) {
        const orbType = board[row][col].type;
        if (board[row][col + 1].type === orbType && board[row][col + 2].type === orbType) {
          matches.add(board[row][col].id);
          matches.add(board[row][col + 1].id);
          matches.add(board[row][col + 2].id);

          // Check for 4 and 5 matches
          if (col < board[row].length - 3 && board[row][col + 3].type === orbType) {
            matches.add(board[row][col + 3].id);
          }
          if (col < board[row].length - 4 && board[row][col + 4].type === orbType) {
            matches.add(board[row][col + 4].id);
          }
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < board[0].length; col++) {
      for (let row = 0; row < board.length - 2; row++) {
        const orbType = board[row][col].type;
        if (board[row + 1][col].type === orbType && board[row + 2][col].type === orbType) {
          matches.add(board[row][col].id);
          matches.add(board[row + 1][col].id);
          matches.add(board[row + 2][col].id);

          // Check for 4 and 5 matches
          if (row < board.length - 3 && board[row + 3][col].type === orbType) {
            matches.add(board[row + 3][col].id);
          }
          if (row < board.length - 4 && board[row + 4][col].type === orbType) {
            matches.add(board[row + 4][col].id);
          }
        }
      }
    }

    setHighlightedMatches(matches);

    // Deal damage and remove orbs when matches are found
    if (matches.size > 0) {
      // Clear any existing timer
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }

      // Determine the matched type (get type from first matched orb)
      let matchedType: OrbType | null = null;
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
          if (matches.has(board[row][col].id)) {
            matchedType = board[row][col].type;
            break;
          }
        }
        if (matchedType) break;
      }

      // Update battle state with matched type
      if (matchedType) {
        setBattleState((prev: BattleState) => ({
          ...prev,
          lastMatchedType: matchedType,
        }));
      }

      // Find the character that matches this orb type to apply their POW bonus
      const matchingCharacter = matchedType ? party.find((char) => char.color === matchedType) : null;
      const characterPow = matchingCharacter?.stats.pow ?? 0;

      // Calculate damage using RPG system (includes combo multiplier and POW bonus)
      const totalDamage = calculateMatchDamage(matches.size, BASE_MATCH_DAMAGE, characterPow);

      // Reduce the matching character's skill cooldown based on orbs matched
      if (matchingCharacter) {
        const cooldownReduction = matches.size * COOLDOWN_REDUCTION_PER_ORB;
        reduceSkillCooldown(matchingCharacter.id, cooldownReduction);
      }

      // Show highlight for a moment, then apply effect
      setTimeout(() => {
        // Healer's default action heals the most damaged ally instead of dealing damage
        if (matchingCharacter?.class === 'healer') {
          healParty(totalDamage);
        } else {
          damageEnemy(totalDamage);
        }
        soundService.playSound(SoundNames.match, 1, 0.1, 0.03);
      }, 200);

      // Remove matched orbs after animation - this will trigger a new board state
      // which will cause this effect to run again and check for new matches
      processingTimerRef.current = setTimeout(() => {
        removeMatchedOrbs(matches);
      }, 600);
    }

    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, [board, damageEnemy, removeMatchedOrbs]);

  const handleOrbClick = (row: number, col: number) => {
    // Don't allow clicks while processing a swap
    if (isProcessingSwap) return;

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
          // Valid swap - processing flag will be cleared when matches are processed
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

  return (
    <div className="flex flex-1 justify-center">
      {/* Board container with pixel art border */}
      <div className="relative rounded-lg border-2 border-amber-700 bg-gradient-to-b from-amber-900/40 to-amber-950/60 p-2 sm:border-3 sm:p-3 md:p-4">
        {/* Decorative corners */}
        <div className="absolute -top-2 -left-2 h-4 w-4 border-2 border-amber-400 bg-amber-600" />
        <div className="absolute -top-2 -right-2 h-4 w-4 border-2 border-amber-400 bg-amber-600" />
        <div className="absolute -bottom-2 -left-2 h-4 w-4 border-2 border-amber-400 bg-amber-600" />
        <div className="absolute -right-2 -bottom-2 h-4 w-4 border-2 border-amber-400 bg-amber-600" />

        {/* Board grid */}
        <div className="flex flex-col justify-around gap-2">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-row sm:gap-1.5 md:gap-2">
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
                  onSelect={() => handleOrbClick(orb.row, orb.col)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Match indicator */}
      {highlightedMatches.size > 0 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce rounded-lg border-2 border-amber-400 bg-amber-600 px-2 py-1 text-sm font-bold text-white sm:-top-10 sm:px-3 sm:py-1.5 sm:text-base">
          {highlightedMatches.size >= 5 ? '5x COMBO!' : `${highlightedMatches.size} MATCH!`}
        </div>
      )}
    </div>
  );
}
