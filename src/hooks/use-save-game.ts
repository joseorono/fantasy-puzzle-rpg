import { useAtomValue, useStore } from 'jotai';
import { RESET } from 'jotai/utils';
import { DEFAULT_MAP_ID } from '~/constants/maps';
import { SAVE_SLOT_IDS, type SaveSlotId } from '~/constants/storage-keys';
import { buildSaveData, computePlaytimeMs, pickMostRecentSlot } from '~/lib/save-game';
import { isGameStartedAtom } from '~/stores/app-atoms';
import { resetDungeonRunAtom } from '~/stores/dungeon-atoms';
import { hydrateGameFromSave, resetGameState, useGameStore } from '~/stores/game-store';
import { basePlaytimeMsAtom, saveIndicatorAtom, saveSlotAtoms, sessionStartedAtAtom } from '~/stores/save-atoms';
import type { SaveGame, SaveGameState } from '~/types/save-game';

/**
 * Reads the persistent slices out of the Zustand store, leaving the router behind.
 * The router holds callbacks and map-definition references that can't be serialized,
 * and loads always resume on the map anyway.
 */
function readPersistentState(): SaveGameState {
  const { resources, party, inventory, mapProgress, floorLootProgress, crafting, dungeonProgress } =
    useGameStore.getState();
  return { resources, party, inventory, mapProgress, floorLootProgress, crafting, dungeonProgress };
}

/**
 * Save-slot commands: writing, loading, deleting and starting over.
 *
 * Deliberately subscription-free — every atom is read imperatively through the Jotai
 * store, so the returned functions keep a stable identity and a gameplay component
 * that only ever autosaves doesn't re-render when a slot changes. Components that
 * need to *display* slots use `useSaveSlots` instead.
 */
export function useSaveGameActions() {
  const store = useStore();

  /** Snapshots the current game into a slot, overwriting whatever was there. */
  function saveToSlot(slotId: SaveSlotId): void {
    const { router } = useGameStore.getState();
    store.set(
      saveSlotAtoms[slotId],
      buildSaveData({
        state: readPersistentState(),
        currentMapId: router.viewData.map?.mapId ?? DEFAULT_MAP_ID,
        playtimeMs: computePlaytimeMs(store.get(basePlaytimeMsAtom), store.get(sessionStartedAtAtom), Date.now()),
      }),
    );
    // Flashed here rather than in `autosave()` so manual saves get the badge too, and the
    // slot id is what decides the wording.
    store.set(saveIndicatorAtom, (prev) => ({ id: (prev?.id ?? 0) + 1, isAutosave: slotId === 'autosave' }));
  }

  /** Writes the autosave slot. Called at major progress beats, never by the player. */
  function autosave(): void {
    saveToSlot('autosave');
  }

  /**
   * Restores a slot and puts the player back on the map where they saved.
   *
   * Order matters: the in-memory dungeon run is cleared first so a stale run can't be
   * resumed after the store changes underneath it, and `isGameStarted` flips last so a
   * load launched from the title screen swaps to gameplay already hydrated.
   */
  function loadSlot(slotId: SaveSlotId): void {
    const save = store.get(saveSlotAtoms[slotId]);
    if (!save) return;

    store.set(resetDungeonRunAtom);
    hydrateGameFromSave(save);
    store.set(basePlaytimeMsAtom, save.playtimeMs);
    store.set(sessionStartedAtAtom, Date.now());
    useGameStore.getState().actions.router.goToMap({ mapId: save.currentMapId });
    store.set(isGameStartedAtom, true);
  }

  /** Empties a slot, removing its localStorage key entirely. */
  function deleteSlot(slotId: SaveSlotId): void {
    store.set(saveSlotAtoms[slotId], RESET);
  }

  /** Wipes progress back to a fresh game and restarts the playtime clock. */
  function newGame(): void {
    store.set(resetDungeonRunAtom);
    resetGameState();
    store.set(basePlaytimeMsAtom, 0);
    store.set(sessionStartedAtAtom, Date.now());
  }

  return { saveToSlot, autosave, loadSlot, deleteSlot, newGame };
}

/**
 * Live contents of the four save slots, for menus that render them. Subscribes, so
 * a save or delete repaints the list immediately.
 */
export function useSaveSlots() {
  const slots: Record<SaveSlotId, SaveGame | null> = {
    'slot-1': useAtomValue(saveSlotAtoms['slot-1']),
    'slot-2': useAtomValue(saveSlotAtoms['slot-2']),
    'slot-3': useAtomValue(saveSlotAtoms['slot-3']),
    autosave: useAtomValue(saveSlotAtoms.autosave),
  };

  return {
    slots,
    /** Slot the title screen's Continue button loads; null when nothing is saved. */
    mostRecentSlotId: pickMostRecentSlot(SAVE_SLOT_IDS.map((slotId) => ({ slotId, save: slots[slotId] }))),
  };
}
