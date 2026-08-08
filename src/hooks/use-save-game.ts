import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import { DEFAULT_MAP_ID } from '~/constants/maps';
import { SAVE_SLOT_IDS, type SaveSlotId } from '~/constants/storage-keys';
import { buildSaveData, computePlaytimeMs, pickMostRecentSlot } from '~/lib/save-game';
import { isGameStartedAtom } from '~/stores/app-atoms';
import { resetDungeonRunAtom } from '~/stores/dungeon-atoms';
import { hydrateGameFromSave, resetGameState, useGameStore } from '~/stores/game-store';
import { basePlaytimeMsAtom, saveSlotAtoms, sessionStartedAtAtom } from '~/stores/save-atoms';
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
 * Save-slot orchestration shared by the pause menu, the title screen and the autosave
 * call sites: it owns the four slot atoms, the playtime clock, and the store/router
 * sequencing a load needs.
 */
export function useSaveGame() {
  const [slot1, setSlot1] = useAtom(saveSlotAtoms['slot-1']);
  const [slot2, setSlot2] = useAtom(saveSlotAtoms['slot-2']);
  const [slot3, setSlot3] = useAtom(saveSlotAtoms['slot-3']);
  const [autosaveSlot, setAutosaveSlot] = useAtom(saveSlotAtoms.autosave);

  const basePlaytimeMs = useAtomValue(basePlaytimeMsAtom);
  const setBasePlaytimeMs = useSetAtom(basePlaytimeMsAtom);
  const sessionStartedAt = useAtomValue(sessionStartedAtAtom);
  const setSessionStartedAt = useSetAtom(sessionStartedAtAtom);
  const resetDungeonRun = useSetAtom(resetDungeonRunAtom);
  const setIsGameStarted = useSetAtom(isGameStartedAtom);

  const slots: Record<SaveSlotId, SaveGame | null> = {
    'slot-1': slot1,
    'slot-2': slot2,
    'slot-3': slot3,
    autosave: autosaveSlot,
  };

  const setters: Record<SaveSlotId, (save: SaveGame | typeof RESET) => void> = {
    'slot-1': setSlot1,
    'slot-2': setSlot2,
    'slot-3': setSlot3,
    autosave: setAutosaveSlot,
  };

  /** Snapshots the current game into a slot, overwriting whatever was there. */
  function saveToSlot(slotId: SaveSlotId): void {
    const { router } = useGameStore.getState();
    setters[slotId](
      buildSaveData({
        state: readPersistentState(),
        currentMapId: router.viewData.map?.mapId ?? DEFAULT_MAP_ID,
        playtimeMs: computePlaytimeMs(basePlaytimeMs, sessionStartedAt, Date.now()),
      }),
    );
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
    const save = slots[slotId];
    if (!save) return;

    resetDungeonRun();
    hydrateGameFromSave(save);
    setBasePlaytimeMs(save.playtimeMs);
    setSessionStartedAt(Date.now());
    useGameStore.getState().actions.router.goToMap({ mapId: save.currentMapId });
    setIsGameStarted(true);
  }

  /** Empties a slot, removing its localStorage key entirely. */
  function deleteSlot(slotId: SaveSlotId): void {
    setters[slotId](RESET);
  }

  /** Wipes progress back to a fresh game and restarts the playtime clock. */
  function newGame(): void {
    resetDungeonRun();
    resetGameState();
    setBasePlaytimeMs(0);
    setSessionStartedAt(Date.now());
  }

  return {
    slots,
    saveToSlot,
    autosave,
    loadSlot,
    deleteSlot,
    newGame,
    /** Slot the title screen's Continue button loads; null when nothing is saved. */
    mostRecentSlotId: pickMostRecentSlot(SAVE_SLOT_IDS.map((slotId) => ({ slotId, save: slots[slotId] }))),
  };
}
