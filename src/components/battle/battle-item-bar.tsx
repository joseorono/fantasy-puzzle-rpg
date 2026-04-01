import { useState, useRef, useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useInventory, useInventoryActions } from '~/stores/game-store';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import {
  healPartyAtom,
  clearBoardRowAtom,
  clearBoardColumnAtom,
  fillPartyUltimateAtom,
  gameStatusAtom,
  partyAtom,
} from '~/stores/battle-atoms';
import { ConsumableItems } from '~/constants/inventory';
import { getItemQuantity } from '~/lib/inventory';
import { calculateItemCooldownInMs } from '~/lib/rpg-calculations';
import { BOARD_ROWS, BOARD_COLS } from '~/constants/game';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import type { ConsumableItemData } from '~/types';

export function BattleItemBar() {
  const inventory = useInventory();
  const inventoryActions = useInventoryActions();
  const gameStatus = useAtomValue(gameStatusAtom);
  const party = useAtomValue(partyAtom);
  const healParty = useSetAtom(healPartyAtom);
  const clearRow = useSetAtom(clearBoardRowAtom);
  const clearColumn = useSetAtom(clearBoardColumnAtom);
  const fillUltimate = useSetAtom(fillPartyUltimateAtom);

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
        healParty({ amount: item.action.amount, source: 'potion' });
        break;
      case 'clear-row':
        clearRow(Math.floor(Math.random() * BOARD_ROWS));
        break;
      case 'clear-column':
        clearColumn(Math.floor(Math.random() * BOARD_COLS));
        break;
      case 'fill-ultimate':
        fillUltimate(item.action.amount);
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
    <div id="battle-item-bar" className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
      {battleItems.map((item) => {
        const quantity = getItemQuantity(inventory, item.id);
        const isEmpty = quantity <= 0;
        const isDisabled = isEmpty || gameStatus !== 'playing' || isOnCooldown;

        return (
          <ToffecBeigeCornersWrapper key={item.id}>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => handleUseItem(item)}
                  disabled={isDisabled}
                  className={`battle-item-slot relative flex flex-col items-center justify-center overflow-hidden rounded w-12 lg:w-18 lg:h-18 xl:w-14 xl:h-16 2xl:w-20 2xl:h-20 px-2 py-1 transition-all sm:px-3 sm:py-1.5 ${
                    isEmpty || gameStatus !== 'playing'
                      ? 'cursor-not-allowed opacity-40'
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                  }`}
                >
              {item.iconName ? (
                <FrostyRpgIcon name={item.iconName} size={32} />
              ) : (
                <span className="text-lg sm:text-xl">{item.icon}</span>
              )}
              <div className={isEmpty ? 'opacity-50' : ''}>
                <NarikWoodBitFont text={String(quantity)} size={1} />
              </div>

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
              </TooltipTrigger>
              <TooltipContent>{item.name}: {item.description}</TooltipContent>
            </Tooltip>
          </ToffecBeigeCornersWrapper>
        );
      })}
    </div>
  );
}
