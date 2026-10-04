import { useEffect, useRef, useState } from 'react';
import { useInventory, useParty, useInventoryActions, usePartyActions } from '~/stores/game-store';
import { ConsumableItems, EquipmentItems } from '~/constants/inventory';
import { DEFAULT_RARITY } from '~/constants/rarity';
import {
  filterInventoryByType,
  getConsumableUsability,
  sortInventoryForDisplay,
  type InventoryItem,
} from '~/lib/inventory';
import { applyHealItem, canReceiveHealing } from '~/lib/party-system';
import { countEquippedInstances } from '~/lib/equipment-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { PauseMenuResourcesBar } from '~/components/pause-menu/pause-menu-resources-bar';
import { PauseMenuTabHeader } from '~/components/pause-menu/pause-menu-tab-header';
import { PauseMenuItemRow } from '~/components/pause-menu/pause-menu-item-row';
import { PauseMenuItemDetail, type ItemUseState } from '~/components/pause-menu/pause-menu-item-detail';
import { PauseMenuItemTargetPicker } from '~/components/pause-menu/pause-menu-item-target-picker';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import { IndigolayTab, IndigolayTabs } from '~/components/ui-custom/indigolay-tab';
import type { BaseItemData, ConsumableItemData, ItemTypes } from '~/types/inventory';

interface ItemCategoryDef {
  id: ItemTypes;
  label: string;
  emptyTitle: string;
  emptyHint: string;
}

const CATEGORIES: ItemCategoryDef[] = [
  {
    id: 'consumable',
    label: 'Consumable',
    emptyTitle: 'Your pack is empty',
    emptyHint: 'Potions are sold at the town shop.',
  },
  {
    id: 'equipment',
    label: 'Equipment',
    emptyTitle: 'No gear in your pack',
    emptyHint: 'The blacksmith can forge some.',
  },
  { id: 'key', label: 'Key', emptyTitle: 'No key items yet', emptyHint: 'Story items you find are kept here.' },
];

const ALL_ITEMS: BaseItemData[] = [...ConsumableItems, ...EquipmentItems];
const ITEMS_BY_ID = new Map(ALL_ITEMS.map((item) => [item.id, item]));

/**
 * Stable selection key for an inventory stack. Equipment of the same id but
 * different rarity are separate stacks, so rarity is part of the key.
 */
function stackKey(stack: InventoryItem): string {
  return `${stack.itemId}::${stack.rarity ?? ''}`;
}

/** HP a consumable restores when used from the menu, or `null` when it can't be used here. */
function getFieldHealAmount(item: BaseItemData): number | null {
  if (item.type !== 'consumable') return null;
  const consumable = item as ConsumableItemData;
  const usability = getConsumableUsability(consumable);
  if (usability !== 'anywhere' && usability !== 'field') return null;
  return consumable.action?.type === 'heal' ? consumable.action.amount : null;
}

/** Whether the card shows Use for this item, and why it's disabled when it is. */
function getItemUseState(item: BaseItemData, hasHealTarget: boolean): ItemUseState {
  if (item.type !== 'consumable') return { kind: 'hidden' };
  const usability = getConsumableUsability(item as ConsumableItemData);
  if (usability !== 'anywhere' && usability !== 'field') return { kind: 'hidden' };
  if (getFieldHealAmount(item) === null) return { kind: 'disabled', reason: "Can't be used from the menu" };
  if (!hasHealTarget) return { kind: 'disabled', reason: 'Party is at full HP' };
  return { kind: 'enabled' };
}

interface PauseMenuItemsProps {
  /**
   * The content zone owns the keyboard — arrows/Enter act on this pane. Note there is
   * no `onExitToSidebar` here: ←→ are spent cycling categories, so backing out of this
   * tab is Escape/Backspace only (handled by the pause overlay, or by the target picker
   * while it is open).
   */
  keyboardActive?: boolean;
}

export function PauseMenuItems({ keyboardActive = false }: PauseMenuItemsProps) {
  const inventory = useInventory();
  const party = useParty();
  const inventoryActions = useInventoryActions();
  const partyActions = usePartyActions();
  const [category, setCategory] = useState<ItemTypes>('consumable');
  // The stack the card shows. Survives pointer movement, unlike the keyboard cursor.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // The consumable whose target picker is open, if any.
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const categoryCounts = CATEGORIES.map((cat) => filterInventoryByType(inventory, ALL_ITEMS, cat.id).length);
  const activeCategory = CATEGORIES.find((cat) => cat.id === category) ?? CATEGORIES[0];
  const stacks = sortInventoryForDisplay(filterInventoryByType(inventory, ALL_ITEMS, category), ALL_ITEMS);

  // A stale or missing selection falls back to the first stack, so the card is never blank.
  const inspectedStack = stacks.find((stack) => stackKey(stack) === selectedKey) ?? stacks[0];
  const inspectedKey = inspectedStack ? stackKey(inspectedStack) : null;
  const inspectedItem = inspectedStack ? ITEMS_BY_ID.get(inspectedStack.itemId) : undefined;
  const hasHealTarget = party.some(canReceiveHealing);
  const itemUse: ItemUseState = inspectedItem ? getItemUseState(inspectedItem, hasHealTarget) : { kind: 'hidden' };

  // Derived, so a spent stack closes the picker on its own.
  const pickerStack = pickerItemId ? stacks.find((stack) => stack.itemId === pickerItemId) : undefined;
  const pickerItem = pickerStack ? (ITEMS_BY_ID.get(pickerStack.itemId) as ConsumableItemData | undefined) : undefined;
  const pickerHealAmount = pickerItem ? getFieldHealAmount(pickerItem) : null;
  const isPickerOpen = pickerStack !== undefined && pickerItem !== undefined && pickerHealAmount !== null;

  // ─── Keyboard grid: one row per stack ────────────────────────────────
  // The category tabs are deliberately absent: ←→ cycle them from anywhere in the
  // pane. Use is absent too: Enter on a usable stack opens the target picker directly.
  const gridRows: KeyboardSelectableItem[][] = stacks.map((stack) => [{ id: stackKey(stack) }]);

  const selection = useKeyboardSelection(gridRows, {
    // Every cursor move re-points the card, so the cursor never sits on a row the card isn't showing.
    onMove: (id) => {
      soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
      setSelectedKey(id);
    },
  });

  // Entering the pane reveals the cursor on the inspected stack. Leaving it (Escape/Backspace
  // back to the sidebar) drops the cursor and closes the picker, so a later return is clean.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    if (!keyboardActive) {
      selectionRef.current.clear();
      setPickerItemId(null);
      return;
    }
    if (selectionRef.current.selectedId !== null || inspectedKey === null) return;
    selectionRef.current.select(inspectedKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardActive]);

  // A keyboard category switch wants the cursor on the new list's first stack, but that
  // row doesn't exist until the next render — so the intent is parked here and applied
  // in the effect below. A ref (not just `keyboardActive`) keeps mouse clicks on the
  // category tabs from planting a keyboard cursor.
  const pendingCategoryRevealRef = useRef(false);

  function changeCategory(next: ItemTypes) {
    setCategory(next);
    setSelectedKey(null);
    setPickerItemId(null);
  }

  /** Cycle the category tabs with ←→, revealing the new list's first item. */
  function cycleCategory(step: 1 | -1) {
    const currentIndex = CATEGORIES.findIndex((cat) => cat.id === category);
    const next = CATEGORIES[(currentIndex + step + CATEGORIES.length) % CATEGORIES.length];
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    changeCategory(next.id);
    selection.clear();
    pendingCategoryRevealRef.current = true;
  }

  useEffect(() => {
    if (!pendingCategoryRevealRef.current) return;
    pendingCategoryRevealRef.current = false;
    const first = stacks[0];
    if (first) selectionRef.current.select(stackKey(first));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Keep the keyboard-selected stack visible in the scrolling list.
  useEffect(() => {
    if (!selection.selectedId) return;
    rowRefs.current.get(selection.selectedId)?.scrollIntoView({ block: 'nearest' });
  }, [selection.selectedId]);

  function openPicker(itemId: string) {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    selection.clear();
    setPickerItemId(itemId);
  }

  /** Back to the list. From the keyboard, the cursor returns to the stack being used. */
  function closePicker(viaKeyboard: boolean) {
    setPickerItemId(null);
    if (viaKeyboard && inspectedKey) {
      selection.select(inspectedKey);
      return;
    }
    soundService.playSound(SoundNames.mechanicalClick, 0.35);
  }

  function handleToggleUse() {
    if (isPickerOpen) {
      closePicker(false);
      return;
    }
    if (inspectedItem && itemUse.kind === 'enabled') openPicker(inspectedItem.id);
  }

  /**
   * Drink the picked potion. The picker stays open for the next one, and closes once the
   * stack runs out (re-inspecting a neighbour) or nobody is left to heal.
   */
  function handleApplyItem(memberId: string, viaKeyboard: boolean) {
    if (!isPickerOpen) return;
    const target = party.find((member) => member.id === memberId);
    if (!target || !canReceiveHealing(target)) return;

    const healedParty = applyHealItem(party, memberId, pickerHealAmount);
    partyActions.setParty(healedParty);
    inventoryActions.removeItem(pickerItem.id);
    soundService.playSound(SoundNames.shimmeringSuccessShorter, 0.6);

    const isStackSpent = pickerStack.quantity <= 1;
    if (!isStackSpent && healedParty.some(canReceiveHealing)) return;

    setPickerItemId(null);
    const index = stacks.indexOf(pickerStack);
    const nextStack = isStackSpent ? (stacks[index + 1] ?? stacks[index - 1]) : pickerStack;
    const nextKey = nextStack ? stackKey(nextStack) : null;
    setSelectedKey(nextKey);
    if (viaKeyboard && nextKey) selection.select(nextKey);
  }

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
      // The first press after the mouse cleared the cursor reveals it on the inspected
      // stack rather than jumping to the top of the list.
      if (selection.selectedId === null && inspectedKey) {
        selection.select(inspectedKey);
        return;
      }
      selection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      const key = selection.selectedId ?? inspectedKey;
      const stack = stacks.find((candidate) => stackKey(candidate) === key);
      const item = stack ? ITEMS_BY_ID.get(stack.itemId) : undefined;
      if (item && getItemUseState(item, hasHealTarget).kind === 'enabled') openPicker(item.id);
    }
  }, keyboardActive && !isPickerOpen);

  return (
    <>
      <PauseMenuTabHeader text="Items" hint="Browse your packs — use potions on a hero." />
      <IndigolayTabs className="pause-menu-item-categories">
        {CATEGORIES.map((cat, index) => (
          <IndigolayTab
            key={cat.id}
            size="sm"
            glow={false}
            isActive={category === cat.id}
            className="pause-menu-item-category-tab"
            onClick={() => changeCategory(cat.id)}
          >
            {cat.label}
            <span className="pause-menu-item-category-tab__count">{categoryCounts[index]}</span>
          </IndigolayTab>
        ))}
        {keyboardActive && !isPickerOpen && (
          <KeyHintPill className="pause-menu-inline-hint" items={[{ keys: ['←', '→'], label: 'switch' }]} />
        )}
      </IndigolayTabs>
      <div className="pause-menu-items-layout">
        {isPickerOpen ? (
          <PauseMenuItemTargetPicker
            item={pickerItem}
            healAmount={pickerHealAmount}
            party={party}
            remaining={pickerStack.quantity}
            keyboardActive={keyboardActive}
            onApply={handleApplyItem}
            onClose={closePicker}
          />
        ) : (
          <div className="pause-menu-item-list pixel-scrollbar">
            {stacks.length === 0 && (
              <div className="pause-menu-empty pause-menu-empty--items">
                <span>{activeCategory.emptyTitle}</span>
                <span className="pause-menu-empty__sub">{activeCategory.emptyHint}</span>
              </div>
            )}
            {stacks.map((stack) => {
              const item = ITEMS_BY_ID.get(stack.itemId);
              if (!item) return null;
              const key = stackKey(stack);
              return (
                <PauseMenuItemRow
                  key={key}
                  item={item}
                  stack={stack}
                  equippedCount={
                    item.type === 'equipment'
                      ? countEquippedInstances(party, item.id, stack.rarity ?? DEFAULT_RARITY)
                      : 0
                  }
                  isSelected={key === inspectedKey}
                  isKeyboardCursor={selection.isSelected(key)}
                  onSelect={() => setSelectedKey(key)}
                  rowRef={(el) => {
                    if (el) rowRefs.current.set(key, el);
                    else rowRefs.current.delete(key);
                  }}
                />
              );
            })}
          </div>
        )}
        {inspectedStack && inspectedItem && (
          <PauseMenuItemDetail
            key={inspectedKey}
            item={inspectedItem}
            rarity={inspectedStack.rarity}
            owned={inspectedStack.quantity}
            party={party}
            itemUse={itemUse}
            isPickerOpen={isPickerOpen}
            onToggleUse={handleToggleUse}
          />
        )}
      </div>
      <PauseMenuResourcesBar />
    </>
  );
}
