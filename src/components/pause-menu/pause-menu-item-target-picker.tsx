import { useEffect, useRef } from 'react';
import NumberFlow from '@number-flow/react';
import { chunk, cn } from '~/lib/utils';
import { canReceiveHealing, getHealItemGain } from '~/lib/party-system';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isCancelKey, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { PartyMemberCard } from '~/components/party/party-member-card';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { ItemIcon } from '~/components/sprite-icons/item-icon';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import type { ConsumableItemData } from '~/types/inventory';
import type { CharacterData } from '~/types/rpg-elements';
import {
  SNAPPY_SPIN_TIMING,
  SNAPPY_TRANSFORM_TIMING,
  SNAPPY_OPACITY_TIMING,
  INTEGER_FORMAT,
} from '~/constants/number-flow';

/** Heroes per picker row. The grid CSS is a fixed two columns to match. */
const PICKER_COLUMNS = 2;

interface PauseMenuItemTargetPickerProps {
  item: ConsumableItemData;
  /** HP the item restores (its heal action's amount). */
  healAmount: number;
  party: CharacterData[];
  /** Copies left in the stack being used. */
  remaining: number;
  /** The content zone owns the keyboard. */
  keyboardActive: boolean;
  /** A hero was picked; `viaKeyboard` tells the host whether to keep a keyboard cursor. */
  onApply: (memberId: string, viaKeyboard: boolean) => void;
  /** Back to the item list without using anything. */
  onClose: (viaKeyboard: boolean) => void;
}

/**
 * Who drinks the potion: the party as Inn-style cards with a preview of what each would
 * gain. Heroes at full HP are dimmed and skipped. Stays open between uses; the host closes
 * it when the stack runs out or nobody is left to heal. Escape/Backspace are claimed in the
 * capture phase so they close the picker instead of backing the pause menu out of the pane.
 */
export function PauseMenuItemTargetPicker({
  item,
  healAmount,
  party,
  remaining,
  keyboardActive,
  onApply,
  onClose,
}: PauseMenuItemTargetPickerProps) {
  const gridRows: KeyboardSelectableItem[][] = chunk(party, PICKER_COLUMNS).map((row) =>
    row.map((member) => ({ id: member.id, disabled: !canReceiveHealing(member) })),
  );

  const selection = useKeyboardSelection(gridRows, {
    onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05),
  });

  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const hasRevealedRef = useRef(false);

  // Opening lands the cursor on the first hero who can use the item. When a heal leaves
  // the cursor's hero at full HP, it hops to the next one who can. A cursor the mouse
  // already cleared stays cleared.
  useEffect(() => {
    const cursor = selectionRef.current;
    const current = party.find((member) => member.id === cursor.selectedId);
    if (current && canReceiveHealing(current)) return;
    if (!current && hasRevealedRef.current) return;
    hasRevealedRef.current = true;
    const firstValid = party.find(canReceiveHealing);
    if (firstValid) cursor.select(firstValid.id);
  }, [party]);

  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);
    if (direction) {
      event.preventDefault();
      selection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      const entry = gridRows.flat().find((cell) => cell.id === selection.selectedId);
      if (!entry || entry.disabled) return;
      onApply(entry.id, true);
    }
  }, keyboardActive);

  useWindowKeyDown(
    (event) => {
      if (!isCancelKey(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      onClose(true);
    },
    keyboardActive,
    { capture: true },
  );

  return (
    <div className="pause-menu-item-picker pixel-scrollbar">
      <div className="pause-menu-item-picker__heading">
        <ItemIcon item={item} size={20} />
        <span className="pause-menu-item-picker__title">Use {item.name} on…</span>
        <span className="pause-menu-item-picker__remaining number-flow-container">
          ×
          <NumberFlow
            value={remaining}
            format={INTEGER_FORMAT}
            trend={-1}
            spinTiming={SNAPPY_SPIN_TIMING}
            transformTiming={SNAPPY_TRANSFORM_TIMING}
            opacityTiming={SNAPPY_OPACITY_TIMING}
          />
          &nbsp;left
        </span>
      </div>

      <div className="pause-menu-item-picker__grid">
        {party.map((member) => {
          const isValid = canReceiveHealing(member);
          const isFallen = member.currentHp <= 0;
          const gain = getHealItemGain(member, healAmount);

          return (
            <div
              key={member.id}
              className={cn('pause-menu-item-picker__cell', !isValid && 'pause-menu-item-picker__cell--disabled')}
            >
              <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected(member.id)}>
                <PartyMemberCard
                  member={member}
                  variant="bar"
                  showTooltips={false}
                  onClick={isValid ? () => onApply(member.id, false) : undefined}
                />
              </ToffecBeigeCornersWrapper>
              <div
                className={cn(
                  'pause-menu-item-picker__status',
                  isFallen && 'pause-menu-item-picker__status--revive',
                  !isValid && 'pause-menu-item-picker__status--full',
                )}
              >
                {!isValid ? 'Full HP' : isFallen ? `Revive · +${gain} HP` : `+${gain} HP`}
              </div>
            </div>
          );
        })}
      </div>

      {keyboardActive && (
        <div className="pause-menu-item-picker__hint">
          <KeyHintPill
            size="sm"
            items={[
              { keys: ['Enter'], label: 'use' },
              { keys: ['Esc'], label: 'back' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
