import { useEffect, useRef } from 'react';
import { SoundNames } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { MANUAL_SAVE_SLOT_IDS, SAVE_SLOT_LABELS, type SaveSlotId } from '~/constants/storage-keys';
import { useConfirm } from '~/hooks/use-confirm';
import { useKeyboardSelection } from '~/hooks/use-keyboard-selection';
import { useSaveGameActions, useSaveSlots } from '~/hooks/use-save-game';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { soundService } from '~/services/sound-service';
import { SaveSlotCard } from './save-slot-card';

/** Load offers the autosave first — it's usually the newest thing on disk. */
const LOAD_SLOT_ORDER: readonly SaveSlotId[] = ['autosave', ...MANUAL_SAVE_SLOT_IDS];

interface SaveLoadMenuProps {
  mode: 'save' | 'load';
  /** Host's title (e.g. a NarikHeading), rendered in one bottom-aligned row with the hint. */
  heading?: React.ReactNode;
  /** The hosting surface has handed the keyboard to this pane. */
  keyboardActive?: boolean;
  /** Fired when ← should hand the keyboard back to the host's own nav (the pause sidebar). */
  onExitToSidebar?: () => void;
  /** Confirm before loading — used in-game, where a load discards unsaved progress. */
  confirmLoad?: boolean;
  /** Fired after a successful load, so the host can close itself. */
  onLoaded?: () => void;
}

/**
 * The save/load slot list, shared by the pause menu tabs and the title-screen modal.
 * Save mode writes the three manual slots; load mode restores any slot including the
 * autosave. Destructive actions (overwrite, load-over-progress, delete) all confirm.
 */
export function SaveLoadMenu({
  mode,
  heading,
  keyboardActive = false,
  onExitToSidebar,
  confirmLoad,
  onLoaded,
}: SaveLoadMenuProps) {
  const { slots } = useSaveSlots();
  const { saveToSlot, loadSlot, deleteSlot } = useSaveGameActions();
  const confirm = useConfirm();

  const slotIds = mode === 'save' ? MANUAL_SAVE_SLOT_IDS : LOAD_SLOT_ORDER;

  const selection = useKeyboardSelection(
    slotIds.map((id) => [{ id, disabled: mode === 'load' && slots[id] === null }]),
    { onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05) },
  );

  // Entering the pane reveals the first slot right away (not on the next keypress).
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  useEffect(() => {
    if (keyboardActive && selectionRef.current.selectedId === null) selectionRef.current.move('down');
  }, [keyboardActive]);

  async function handleActivate(slotId: SaveSlotId) {
    if (mode === 'save') {
      if (slots[slotId]) {
        const ok = await confirm({
          title: 'Overwrite Save?',
          message: `${SAVE_SLOT_LABELS[slotId]} already holds a save. It will be replaced.`,
          confirmLabel: 'Overwrite',
          variant: 'danger',
        });
        if (!ok) return;
      }
      saveToSlot(slotId);
      return;
    }

    if (!slots[slotId]) return;

    if (confirmLoad) {
      const ok = await confirm({
        title: 'Load Game?',
        message: 'Any progress since your last save will be lost.',
        confirmLabel: 'Load',
        variant: 'danger',
      });
      if (!ok) return;
    }

    loadSlot(slotId);
    onLoaded?.();
  }

  async function handleDelete(slotId: SaveSlotId) {
    const ok = await confirm({
      title: 'Delete Save?',
      message: `${SAVE_SLOT_LABELS[slotId]} will be erased for good.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    deleteSlot(slotId);
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
  }

  // ↑↓ move the cursor, ← hands the keyboard back to the host from any row, Enter acts.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;

    const direction = getNavDirection(event.key);

    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      selection.move(direction);
      return;
    }

    if (direction === 'left') {
      event.preventDefault();
      // The start-menu host has no sidebar to return to, so it keeps its cursor.
      if (!onExitToSidebar) return;
      selection.clear();
      onExitToSidebar();
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      const selectedId = selection.selectedId as SaveSlotId | null;
      if (selectedId) void handleActivate(selectedId);
    }
  }, keyboardActive);

  return (
    <div className="save-load-menu">
      <div className="save-load-menu__header">
        <span className="save-load-menu__title">{heading}</span>
        <p className="save-load-menu__hint pixel-font">
          {mode === 'save' ? 'Choose a slot to save your progress.' : 'Choose a save to load.'}
        </p>
      </div>
      <div className="save-load-menu__list">
        {slotIds.map((slotId) => (
          <SaveSlotCard
            key={slotId}
            slotId={slotId}
            save={slots[slotId]}
            mode={mode}
            selected={selection.isSelected(slotId)}
            disabled={mode === 'load' && slots[slotId] === null}
            onActivate={() => void handleActivate(slotId)}
            onDelete={slotId === 'autosave' ? undefined : () => void handleDelete(slotId)}
          />
        ))}
      </div>
    </div>
  );
}
