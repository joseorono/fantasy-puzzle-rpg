import { useState, useRef, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useInventory, useInventoryActions } from '~/stores/game-store';
import {
  healPartyAtom,
  clearBoardRowAtom,
  clearBoardColumnAtom,
  gameStatusAtom,
  partyAtom,
} from '~/stores/battle-atoms';
import { ConsumableItems } from '~/constants/inventory';
import { getItemQuantity } from '~/lib/inventory';
import { calculateItemCooldownInMs } from '~/lib/rpg-calculations';
import { BOARD_ROWS, BOARD_COLS } from '~/constants/game';
import type { ConsumableItemData } from '~/types';

export function BattleItemBar() {
  const inventory = useInventory();
  const inventoryActions = useInventoryActions();
  const gameStatus = useAtomValue(gameStatusAtom);
  const party = useAtomValue(partyAtom);
  const healParty = useSetAtom(healPartyAtom);
  const clearRow = useSetAtom(clearBoardRowAtom);
  const clearColumn = useSetAtom(clearBoardColumnAtom);

  const cooldownDuration = calculateItemCooldownInMs(party);

  const [cooldownProgress, setCooldownProgress] = useState(1); // 1 = ready, 0 = just started
  const cooldownEndRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const animateCooldown = useCallback(() => {
    const now = Date.now();
    const end = cooldownEndRef.current;
    const remaining = end - now;

    if (remaining <= 0) {
      setCooldownProgress(1);
      return;
    }

    const progress = 1 - remaining / cooldownDuration;
    setCooldownProgress(progress);
    rafRef.current = requestAnimationFrame(animateCooldown);
  }, [cooldownDuration]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isOnCooldown = cooldownProgress < 1;

  const battleItems = ConsumableItems.filter((item) => item.usableInBattle && item.action);

  const handleUseItem = (item: ConsumableItemData) => {
    if (gameStatus !== 'playing' || isOnCooldown) return;

    const quantity = getItemQuantity(inventory, item.id);
    if (quantity <= 0 || !item.action) return;

    switch (item.action.type) {
      case 'heal':
        healParty(item.action.amount);
        break;
      case 'clear-row':
        clearRow(Math.floor(Math.random() * BOARD_ROWS));
        break;
      case 'clear-column':
        clearColumn(Math.floor(Math.random() * BOARD_COLS));
        break;
    }

    inventoryActions.removeItem(item.id);

    // Start shared cooldown
    cooldownEndRef.current = Date.now() + cooldownDuration;
    setCooldownProgress(0);
    rafRef.current = requestAnimationFrame(animateCooldown);
  };

  // Angle in degrees for the transparent (revealed) portion
  const revealAngle = cooldownProgress * 360;

  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
      {battleItems.map((item) => {
        const quantity = getItemQuantity(inventory, item.id);
        const isEmpty = quantity <= 0;
        const isDisabled = isEmpty || gameStatus !== 'playing' || isOnCooldown;

        return (
          <button
            key={item.id}
            onClick={() => handleUseItem(item)}
            disabled={isDisabled}
            title={`${item.name}: ${item.description}`}
            className={`relative flex flex-col items-center justify-center overflow-hidden rounded border-2 px-2 py-1 transition-all sm:px-3 sm:py-1.5 ${
              isEmpty || gameStatus !== 'playing'
                ? 'cursor-not-allowed border-gray-700 bg-gray-800/50 opacity-40'
                : 'cursor-pointer border-amber-600 bg-gradient-to-b from-amber-900/80 to-amber-950/90 hover:border-amber-400 hover:from-amber-800/80 hover:to-amber-900/90 active:scale-95'
            }`}
          >
            <span className="text-lg sm:text-xl">{item.icon}</span>
            <span
              className={`pixel-font text-[10px] font-bold sm:text-xs ${isEmpty ? 'text-gray-500' : 'text-amber-200'}`}
            >
              {quantity}
            </span>

            {/* Cooldown pie overlay */}
            {isOnCooldown && !isEmpty && (
              <div
                className="pointer-events-none absolute inset-0 rounded"
                style={{
                  background: `conic-gradient(from 0deg, transparent ${revealAngle}deg, rgba(0, 0, 0, 0.65) ${revealAngle}deg)`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
