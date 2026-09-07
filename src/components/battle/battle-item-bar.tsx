import { useState, useRef, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useInventory, useInventoryActions } from '~/stores/game-store';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import {
  healPartyAtom,
  clearBoardRowAtom,
  clearBoardColumnAtom,
  fillPartyUltimateAtom,
  recordItemUsedAtom,
  gameStatusAtom,
  partyAtom,
} from '~/stores/battle-atoms';
import { ConsumableItems } from '~/constants/inventory';
import { getItemQuantity } from '~/lib/inventory';
import { calculateItemCooldownInMs } from '~/lib/rpg-calculations';
import { getPartyPassiveModifiers } from '~/lib/skill-system';
import { BOARD_ROWS, BOARD_COLS } from '~/constants/board';
import { ITEM_COOLDOWN_LABEL_TICK_MS } from '~/constants/battle';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import type { ConsumableItemData } from '~/types';

interface BattleItemBarProps {
  isBattlePaused: boolean;
}

// The consumable registry is static, so the battle-usable subset is resolved once at module load
// rather than refiltered on every render of the bar.
const BATTLE_ITEMS = ConsumableItems.filter((item) => item.usableInBattle && item.action);

export function BattleItemBar({ isBattlePaused }: BattleItemBarProps) {
  const inventory = useInventory();
  const inventoryActions = useInventoryActions();
  const gameStatus = useAtomValue(gameStatusAtom);
  const party = useAtomValue(partyAtom);
  const healParty = useSetAtom(healPartyAtom);
  const clearRow = useSetAtom(clearBoardRowAtom);
  const clearColumn = useSetAtom(clearBoardColumnAtom);
  const fillUltimate = useSetAtom(fillPartyUltimateAtom);
  const recordItemUsed = useSetAtom(recordItemUsedAtom);

  const cooldownDuration = calculateItemCooldownInMs(party, getPartyPassiveModifiers(party).itemCooldownSpdBonus);

  // 0 while items are ready, otherwise the absolute timestamp the shared cooldown ends at.
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const secondsLeftRef = useRef(0);

  const isOnCooldown = cooldownEndsAt > 0;

  /**
   * The sweeping wedge is drawn by CSS, so React is left with only two jobs: move the "Ns" label
   * when the whole second changes, and retire the overlay when the cooldown ends. The label is
   * polled rather than scheduled on second boundaries so a throttled tab can't desync it, and
   * guarded against repeat values so the poll itself never causes a render.
   */
  useEffect(() => {
    if (cooldownEndsAt === 0) return;

    function syncLabel() {
      const next = Math.max(1, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      if (next === secondsLeftRef.current) return;
      secondsLeftRef.current = next;
      setSecondsLeft(next);
    }

    syncLabel();
    const label = setInterval(syncLabel, ITEM_COOLDOWN_LABEL_TICK_MS);
    const finish = setTimeout(() => setCooldownEndsAt(0), Math.max(0, cooldownEndsAt - Date.now()));

    return () => {
      clearInterval(label);
      clearTimeout(finish);
    };
  }, [cooldownEndsAt]);

  const handleUseItem = (item: ConsumableItemData) => {
    if (gameStatus !== 'playing' || isBattlePaused === true || isOnCooldown) return;

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
    // Count this consumption for the victory rating (items used is a penalty).
    recordItemUsed();

    // Start shared cooldown
    setCooldownEndsAt(Date.now() + cooldownDuration);
  };

  return (
    <div id="battle-item-bar" className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
      {BATTLE_ITEMS.map((item) => {
        const quantity = getItemQuantity(inventory, item.id);
        const isEmpty = quantity <= 0;
        const isDisabled = isEmpty || gameStatus !== 'playing' || isBattlePaused === true || isOnCooldown;

        return (
          <ToffecBeigeCornersWrapper key={item.id}>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => handleUseItem(item)}
                  disabled={isDisabled}
                  className={`battle-item-slot relative flex flex-col items-center justify-center overflow-hidden rounded px-2 py-1 transition-all sm:px-3 sm:py-1.5 ${
                    isEmpty || gameStatus !== 'playing' || isBattlePaused === true
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

              {/* Cooldown pie overlay & countdown text */}
              {isOnCooldown && !isEmpty && (
                <>
                  <div
                    key={cooldownEndsAt}
                    className="battle-item-cooldown-pie motion-exempt pointer-events-none absolute inset-0 rounded"
                    style={{ animationDuration: `${cooldownDuration}ms` }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center pixel-font text-[10px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                    {secondsLeft}s
                  </div>
                </>
              )}
            </button>
              </TooltipTrigger>
              <TooltipContent className="battle-item-tooltip">{item.name}: {item.description}</TooltipContent>
            </Tooltip>
          </ToffecBeigeCornersWrapper>
        );
      })}
    </div>
  );
}
