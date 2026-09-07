import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { useInventory, useParty, useInventoryActions, usePartyActions } from '~/stores/game-store';
import { ConsumableItems, EquipmentItems } from '~/constants/inventory';
import { filterInventoryByType, getItemQuantity } from '~/lib/inventory';
import { getHealableMembers, getDeadMembers, healPartyMember } from '~/lib/party-system';
import { cn } from '~/lib/utils';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import type { BaseItemData } from '~/types/inventory';
import type { RarityTier } from '~/constants/rarity';
import { getScaledEquipmentStats } from '~/lib/equipment-system';
import { getRarityColor, getRarityLabel } from '~/lib/rarity';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { PauseMenuResourcesBar } from '~/components/pause-menu/pause-menu-resources-bar';
import { NarikHeading } from '~/components/typography/narik-heading';
import { IndigolayTab } from '~/components/ui-custom/indigolay-tab';
import type { ConsumableItemData, EquipmentItemData } from '~/types';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

type ItemCategory = 'consumable' | 'equipment' | 'key';

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'consumable', label: 'Consumable' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'key', label: 'Key' },
];

const ALL_ITEMS: BaseItemData[] = [...ConsumableItems, ...EquipmentItems];

/**
 * Stable selection key for an inventory stack. Equipment of the same id but
 * different rarity are separate stacks, so rarity is part of the key.
 */
function stackKey(itemId: string, rarity?: RarityTier): string {
  return `${itemId}::${rarity ?? ''}`;
}

interface PauseMenuItemsProps {
  /**
   * The content zone owns the keyboard — arrows/Enter act on this pane. Note there is
   * no `onExitToSidebar` here: ←→ are spent cycling categories, so backing out of this
   * tab is Escape/Backspace only (handled by the pause overlay).
   */
  keyboardActive?: boolean;
}

export function PauseMenuItems({ keyboardActive = false }: PauseMenuItemsProps) {
  const inventory = useInventory();
  const party = useParty();
  const inventoryActions = useInventoryActions();
  const partyActions = usePartyActions();
  const [category, setCategory] = useState<ItemCategory>('consumable');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const filteredInventory = filterInventoryByType(inventory, ALL_ITEMS, category);

  const selectedInvItem = selectedKey
    ? filteredInventory.find((inv) => stackKey(inv.itemId, inv.rarity) === selectedKey)
    : undefined;
  const selectedItem = selectedInvItem ? (ALL_ITEMS.find((item) => item.id === selectedInvItem.itemId) ?? null) : null;
  const selectedRarity = selectedInvItem?.rarity;
  const selectedIsEquipment = !!selectedItem && 'pow' in selectedItem;
  const selectedScaledStats =
    selectedIsEquipment && selectedItem
      ? getScaledEquipmentStats(selectedItem as EquipmentItemData, selectedRarity)
      : null;

  function getItemData(itemId: string): BaseItemData | undefined {
    return ALL_ITEMS.find((item) => item.id === itemId);
  }

  function isUsableConsumable(item: BaseItemData): item is ConsumableItemData {
    return item.type === 'consumable' && (item as ConsumableItemData).usableOutOfBattle;
  }

  function canUseItem(item: ConsumableItemData): boolean {
    if (!item.action) return false;
    if (item.action.type === 'heal') {
      return getHealableMembers(party).length > 0 || getDeadMembers(party).length > 0;
    }
    return false;
  }

  function handleUseItem(item: ConsumableItemData) {
    if (!item.action || !canUseItem(item)) return;

    if (item.action.type === 'heal') {
      // Prioritize reviving dead members, then heal most damaged living member
      const dead = getDeadMembers(party);
      if (dead.length > 0) {
        const target = dead[0];
        const reviveAmount = 1 + item.action.amount;
        const healed = healPartyMember(party, target.id, reviveAmount);
        partyActions.setParty(healed);
      } else {
        const healable = getHealableMembers(party);
        if (healable.length === 0) return;
        const target = healable[0];
        const healed = healPartyMember(party, target.id, item.action.amount);
        partyActions.setParty(healed);
      }

      inventoryActions.removeItem(item.id);
      soundService.playSound(SoundNames.shimmeringSuccessShorter, 0.6);

      // Deselect if we used the last one
      if (getItemQuantity(inventory, item.id) <= 1) {
        setSelectedKey(null);
      }
    }
  }

  // ─── Keyboard grid: one row per stack, then [Use] ────────────────────
  // The category tabs are deliberately absent: ←→ cycle them from anywhere in the
  // pane, so they're driven by the keys rather than walked to by the cursor.
  const usableItem = selectedItem && isUsableConsumable(selectedItem) ? selectedItem : null;
  const gridRows: KeyboardSelectableItem[][] = [
    ...filteredInventory.map((inv) => [{ id: stackKey(inv.itemId, inv.rarity) }]),
    ...(usableItem ? [[{ id: 'use', disabled: !canUseItem(usableItem) }]] : []),
  ];

  const selection = useKeyboardSelection(gridRows, {
    // The cursor drives the same selection the mouse uses, so the detail panel
    // and the row's `.selected` styling follow it for free.
    onMove: (id) => {
      soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
      if (id !== 'use') setSelectedKey(id);
    },
  });

  // Entering the pane reveals the first stack right away. Leaving it (Escape/Backspace
  // back to the sidebar) drops the cursor, so a later return can't show a stale one.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    if (!keyboardActive) {
      selectionRef.current.clear();
      return;
    }
    if (selectionRef.current.selectedId !== null) return;
    const first = filteredInventory[0];
    if (first) selectionRef.current.select(stackKey(first.itemId, first.rarity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardActive]);

  // A keyboard category switch wants the cursor on the new list's first stack, but that
  // row doesn't exist until the next render — so the intent is parked here and applied
  // in the effect below. A ref (not just `keyboardActive`) keeps mouse clicks on the
  // category tabs from planting a keyboard cursor.
  const pendingCategoryRevealRef = useRef(false);

  /** Cycle the category tabs with ←→, revealing the new list's first item. */
  function cycleCategory(step: 1 | -1) {
    const currentIndex = CATEGORIES.findIndex((cat) => cat.id === category);
    const next = CATEGORIES[(currentIndex + step + CATEGORIES.length) % CATEGORIES.length];
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    setCategory(next.id);
    setSelectedKey(null);
    selection.clear();
    pendingCategoryRevealRef.current = true;
  }

  useEffect(() => {
    if (!pendingCategoryRevealRef.current) return;
    pendingCategoryRevealRef.current = false;
    const first = filteredInventory[0];
    if (first) selectionRef.current.select(stackKey(first.itemId, first.rarity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Keep the keyboard-selected stack visible in the scrolling list.
  useEffect(() => {
    if (!selection.selectedId) return;
    rowRefs.current.get(selection.selectedId)?.scrollIntoView({ block: 'nearest' });
  }, [selection.selectedId]);

  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    if (direction) {
      event.preventDefault();
      // ←→ belong to the category tabs here, so they never back out of the pane —
      // Escape/Backspace do that (see PauseMenuOverlay). ↑↓ walk the list.
      if (direction === 'left' || direction === 'right') {
        cycleCategory(direction === 'right' ? 1 : -1);
        return;
      }
      selection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      const entry = gridRows.flat().find((item) => item.id === selection.selectedId);
      if (!entry || entry.disabled) return;
      if (entry.id === 'use') {
        if (usableItem) handleUseItem(usableItem);
        return;
      }
      // A stack row: Enter steps down to Use when it exists.
      if (usableItem) selection.select('use');
    }
  }, keyboardActive);

  return (
    <>
      <NarikHeading as="h2" text="Items" />
      <div className="pause-menu-item-categories">
        {CATEGORIES.map((cat) => (
          <IndigolayTab
            key={cat.id}
            size="sm"
            glow={false}
            isActive={category === cat.id}
            className="pause-menu-item-category-tab"
            onClick={() => {
              setCategory(cat.id);
              setSelectedKey(null);
            }}
          >
            {cat.label}
          </IndigolayTab>
        ))}
        {keyboardActive && <span className="pause-menu-inline-hint pixel-font">← → switch</span>}
      </div>
      <div className="pause-menu-items-layout">
        <div className="pause-menu-item-list">
          {filteredInventory.length === 0 && <div className="pause-menu-empty">No items</div>}
          {filteredInventory.map((invItem) => {
            const itemData = getItemData(invItem.itemId);
            if (!itemData) return null;
            const key = stackKey(invItem.itemId, invItem.rarity);
            const isEquip = itemData.type === 'equipment';
            return (
              <div
                key={key}
                ref={(el) => {
                  if (el) rowRefs.current.set(key, el);
                  else rowRefs.current.delete(key);
                }}
                className={cn('pause-menu-item-row', selectedKey === key && 'selected')}
                onClick={() => setSelectedKey(key)}
              >
                <span className="pause-menu-item-icon-slot">
                  {itemData.iconName && <FrostyRpgIcon name={itemData.iconName} size={24} />}
                </span>
                <span
                  className="pause-menu-item-name"
                  style={isEquip ? { color: getRarityColor(invItem.rarity) } : undefined}
                >
                  {itemData.name}
                </span>
                <span className="pause-menu-item-qty number-flow-container">
                  x
                  <NumberFlow
                    value={invItem.quantity}
                    format={INTEGER_FORMAT}
                    trend={-1}
                    spinTiming={SNAPPY_SPIN_TIMING}
                    transformTiming={SNAPPY_TRANSFORM_TIMING}
                    opacityTiming={SNAPPY_OPACITY_TIMING}
                  />
                </span>
              </div>
            );
          })}
        </div>
        <div className="pause-menu-item-detail">
          {selectedItem ? (
            <>
              {selectedItem.iconName ? (
                <div className="pause-menu-item-detail-icon">
                  <FrostyRpgIcon name={selectedItem.iconName} size={48} />
                </div>
              ) : (
                'icon' in selectedItem && (
                  <div className="pause-menu-item-detail-icon">{(selectedItem as ConsumableItemData).icon}</div>
                )
              )}
              <div className="pause-menu-item-detail-name">{selectedItem.name}</div>
              {selectedIsEquipment && (
                <div
                  className="pause-menu-item-detail-rarity text-[0.65rem] tracking-wider uppercase"
                  style={{ color: getRarityColor(selectedRarity) }}
                >
                  {getRarityLabel(selectedRarity)}
                </div>
              )}
              <div className="pause-menu-item-detail-desc">{selectedItem.description}</div>
              {selectedScaledStats && (
                <div className="pause-menu-item-detail-stats">
                  {selectedScaledStats.pow !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      POW {selectedScaledStats.pow > 0 ? '+' : ''}
                      {selectedScaledStats.pow}
                    </span>
                  )}
                  {selectedScaledStats.vit !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      VIT {selectedScaledStats.vit > 0 ? '+' : ''}
                      {selectedScaledStats.vit}
                    </span>
                  )}
                  {selectedScaledStats.spd !== 0 && (
                    <span className="pause-menu-item-stat-badge">
                      SPD {selectedScaledStats.spd > 0 ? '+' : ''}
                      {selectedScaledStats.spd}
                    </span>
                  )}
                </div>
              )}
              <div className="pause-menu-item-detail-desc number-flow-container">
                Owned:{' '}
                <NumberFlow
                  value={getItemQuantity(inventory, selectedItem.id, selectedRarity)}
                  format={INTEGER_FORMAT}
                  trend={-1}
                  spinTiming={SNAPPY_SPIN_TIMING}
                  transformTiming={SNAPPY_TRANSFORM_TIMING}
                  opacityTiming={SNAPPY_OPACITY_TIMING}
                />
              </div>
              {isUsableConsumable(selectedItem) && (
                <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('use')}>
                  <button
                    className="pause-menu-use-btn"
                    disabled={!canUseItem(selectedItem)}
                    onClick={() => handleUseItem(selectedItem)}
                  >
                    Use
                  </button>
                </ToffecBeigeCornersWrapper>
              )}
            </>
          ) : (
            <div className="pause-menu-empty">Select an item</div>
          )}
        </div>
      </div>
      <PauseMenuResourcesBar />
    </>
  );
}
