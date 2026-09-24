import { useState, useRef, useEffect } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { useInventory, useInventoryActions } from '~/stores/game-store';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import {
  healPartyAtom,
  fillPartyUltimateAtom,
  recordItemUsedAtom,
  gameStatusAtom,
  isTrainingBattleAtom,
  itemCooldownMsAtom,
  armedLineClearAtom,
  fireLineClearAtom,
  lastItemFiredAtom,
  boardAtom,
  partyAtom,
} from '~/stores/battle-atoms';
import { ConsumableItems } from '~/constants/inventory';
import { getItemQuantity } from '~/lib/inventory';
import { pickBestLine } from '~/lib/line-clear';
import { ITEM_COOLDOWN_LABEL_TICK_MS } from '~/constants/battle';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
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
  const isTraining = useAtomValue(isTrainingBattleAtom);
  const healParty = useSetAtom(healPartyAtom);
  const fillUltimate = useSetAtom(fillPartyUltimateAtom);
  const recordItemUsed = useSetAtom(recordItemUsedAtom);
  const armedLineClear = useAtomValue(armedLineClearAtom);
  const setArmedLineClear = useSetAtom(armedLineClearAtom);
  const fireLineClear = useSetAtom(fireLineClearAtom);
  const lastItemFired = useAtomValue(lastItemFiredAtom);
  // The board and party are read on demand: the bar must not re-render on every orb or cooldown tick.
  const store = useStore();

  const cooldownDuration = useAtomValue(itemCooldownMsAtom);

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

  /** Spends one of `itemId`: decrements the stack, counts it for the rating, starts the cooldown. */
  function consumeItem(itemId: string) {
    // Sparring is free: the player practices with what they own and keeps it.
    if (!isTraining) inventoryActions.removeItem(itemId);
    // Count this consumption for the victory rating (items used is a penalty).
    recordItemUsed();

    // Start shared cooldown
    setCooldownEndsAt(Date.now() + cooldownDuration);
  }

  /** Whether `item` can be used at all right now: in stock, battle live, not mid-cooldown. */
  function canUseItem(item: ConsumableItemData): boolean {
    if (gameStatus !== 'playing' || isBattlePaused === true || isOnCooldown) return false;
    return getItemQuantity(inventory, item.id) > 0 && item.action !== undefined;
  }

  /**
   * A line clear is spent when the board actually fires it, which for aim mode happens in the board
   * component. `lastItemFired` is that signal, deduped on its timestamp so a re-render can't
   * double-charge the stack.
   */
  const handledFireRef = useRef(0);
  useEffect(() => {
    if (!lastItemFired || lastItemFired.timestamp === handledFireRef.current) return;
    handledFireRef.current = lastItemFired.timestamp;
    consumeItem(lastItemFired.itemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastItemFired]);

  // Arming is a live aim on a live board: a pause, a loss, or a win drops it.
  useEffect(() => {
    if (gameStatus !== 'playing' || isBattlePaused === true) setArmedLineClear(null);
  }, [gameStatus, isBattlePaused, setArmedLineClear]);

  const handleUseItem = (item: ConsumableItemData) => {
    if (!canUseItem(item) || !item.action) return;

    switch (item.action.type) {
      case 'heal':
        healParty({ amount: item.action.amount, source: 'potion' });
        break;
      case 'fill-ultimate':
        fillUltimate(item.action.amount);
        break;
      case 'clear-line':
        // Aimed, not instant: arm it and let the next board click pick the line. Clicking the
        // slot again puts it away. Nothing is spent until the board fires it.
        setArmedLineClear(
          armedLineClear?.itemId === item.id ? null : { itemId: item.id, orientation: item.action.orientation },
        );
        return;
    }

    consumeItem(item.id);
  };

  /** Right-click skips aiming: the item fires straight at the line worth the most right now. */
  const handleAutoAim = (event: React.MouseEvent, item: ConsumableItemData) => {
    event.preventDefault();
    if (!item.action || item.action.type !== 'clear-line') return;
    if (!canUseItem(item)) return;

    const orientation = item.action.orientation;
    fireLineClear({
      itemId: item.id,
      orientation,
      index: pickBestLine(store.get(boardAtom), orientation, store.get(partyAtom)),
    });
  };

  return (
    <div id="battle-item-bar" className="mt-2 flex items-center justify-center gap-1.5 sm:gap-2">
      {BATTLE_ITEMS.map((item) => {
        const quantity = getItemQuantity(inventory, item.id);
        const isEmpty = quantity <= 0;
        const isDisabled = isEmpty || gameStatus !== 'playing' || isBattlePaused === true || isOnCooldown;
        const lineOrientation = item.action?.type === 'clear-line' ? item.action.orientation : null;
        const isArmed = armedLineClear?.itemId === item.id;

        return (
          <ToffecBeigeCornersWrapper key={item.id}>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => handleUseItem(item)}
                  onContextMenu={(event) => handleAutoAim(event, item)}
                  disabled={isDisabled}
                  className={`battle-item-slot relative flex flex-col items-center justify-center overflow-hidden rounded px-2 py-1 transition-all sm:px-3 sm:py-1.5 ${
                    isEmpty || gameStatus !== 'playing' || isBattlePaused === true
                      ? 'cursor-not-allowed opacity-40'
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                  } ${isArmed ? 'scale-105 ring-2 ring-amber-300' : ''}`}
                >
                  <ItemIcon item={item} size={32} />
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
                      <div className="pixel-font pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                        {secondsLeft}s
                      </div>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent size="compact" className="battle-item-tooltip">
                <span className="battle-item-tooltip__name">{item.name}</span>
                <span className="battle-item-tooltip__desc">{item.description}</span>
                {lineOrientation && (
                  <KeyHintPill
                    size="sm"
                    items={
                      isArmed
                        ? [
                            { keys: ['Click'], label: `Pick ${lineOrientation}` },
                            { keys: ['Esc', 'R-Click'], label: 'Cancel' },
                          ]
                        : [
                            { keys: ['Click'], label: 'Aim' },
                            { keys: ['R-Click'], label: 'Auto-aim' },
                          ]
                    }
                  />
                )}
              </TooltipContent>
            </Tooltip>
          </ToffecBeigeCornersWrapper>
        );
      })}
    </div>
  );
}
