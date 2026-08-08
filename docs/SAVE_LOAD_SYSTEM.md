# Save / Load System

Four save slots backed by localStorage: three the player writes from the Save menu, plus
an autosave the game writes at major progress beats. All pure logic lives in
`src/lib/save-game.ts` and is unit-tested; the UI is one reusable component pair shared by
the pause menu and the title screen.

This supersedes the "Technical (Save Management)" proposal in `INITIAL_GOOGLE_DOC.md`,
which predates the current 8-slice store. That proposal put an array of three `SaveData`
objects in a single atom; we use **one nullable atom per slot, each on its own
localStorage key**, so no single key has to hold every save and each slot gets the full
size budget.

## The save envelope

```ts
{ version, savedAt, playtimeMs, currentMapId, state: { …7 slices } }
```

Defined and validated in `src/types/save-game.ts`. `savedAt` is epoch milliseconds, never
a `Date`, so the file stays plain JSON. A full mid-game save is roughly 4–8 KB.

`state` carries the seven persistent Zustand slices: `resources`, `party`, `inventory`,
`mapProgress`, `floorLootProgress`, `crafting`, `dungeonProgress`.

**The router slice is deliberately not saved.** Its `viewData` holds an `onLeaveCallback`
function and a by-reference `DungeonDefinition`, neither of which survives JSON. That's why
`currentMapId` is denormalized onto the envelope — a load has to know which map to resume
on, and `mapProgress.characterPositions` supplies the tile within it.

Mid-dungeon runs are not resumable: the run lives entirely in Jotai atoms
(`src/stores/dungeon-atoms.ts`) and is discarded on load, by design.

### Versioning and corrupt data

`version` comes from `GAME_STORE_VERSION` (`src/constants/game.ts`). Every read passes
through `migrateSave` before schema validation, and anything unrecognizable — corrupt JSON,
a missing slice, a save from a newer version — resolves to `null`, which simply reads as an
empty slot. Reads never throw. Writes use `saveGameSchema.parse` deliberately: a failure
there is a programmer error, not bad user data.

Zod strips unknown keys, so fields dropped from the game (the old `shopsVisited`) fall out
of old saves automatically.

Derived values are recomputed rather than trusted: `sanitizeLoadedParty` rebuilds `maxHp`
from the VIT formula and clamps `currentHp` into range, so a hand-edited file can't smuggle
in impossible stats.

## Storage layout

| Slot | localStorage key |
| --- | --- |
| `slot-1` / `slot-2` / `slot-3` | `fpg-save-slot-1` … `-3` |
| `autosave` | `fpg-autosave` |

Keys and labels live in `src/constants/storage-keys.ts`; the atoms in
`src/stores/save-atoms.ts` use the existing `createValidatedStorage` helper, which
validates on read and syncs across browser tabs for free.

Audio and accessibility settings stay outside the save file — they're per-device
preferences, not per-slot progress.

## Playtime

Tracked as `basePlaytimeMsAtom` (what previous sessions banked) plus `sessionStartedAtAtom`
(when this session began). The live total is only computed at save time, via
`computePlaytimeMs`, so nothing ticks or re-renders. `formatPlaytime` renders `H:MM:SS`
with unbounded hours.

## Hooks and store entry points

`src/hooks/use-save-game.ts` exposes two hooks, split on purpose:

- **`useSaveGameActions()`** — `saveToSlot`, `autosave`, `loadSlot`, `deleteSlot`,
  `newGame`. Reads every atom imperatively through the Jotai store, so it creates no
  subscriptions and its functions keep a stable identity. Gameplay components that only
  autosave use this and never re-render when a slot changes.
- **`useSaveSlots()`** — the four slot values plus `mostRecentSlotId`. Subscribes; used
  only by menus that display slots.

Two store-level functions in `src/stores/game-store.ts`:

- `hydrateGameFromSave(save)` — overwrites the seven slices in one `setState`, leaving the
  router alone.
- `resetGameState()` — a true new game, router included, cloning the shared starting
  constants so the store never freezes the module-level originals.

`loadSlot` sequences these carefully: clear the dungeon run, hydrate, restart the playtime
clock, navigate to the saved map, then flip `isGameStartedAtom` last so a load launched
from the title screen swaps into gameplay already hydrated.

> Slices no longer define their own top-level `reset`. Every slice is spread into one store
> object, so same-named keys collided and only the last survived — `resetGameState` replaces
> them. `BaseSlice` types `reset` as `never` to keep the footgun from coming back.

## Autosave triggers

Four explicit call sites, all at points where progress is already committed:

1. **Battle rewards claimed** — `battle-rewards-screen.tsx`, once loot, EXP and level-ups
   have all applied.
2. **Dungeon completed** — `dungeon-view.tsx`, right after `markDungeonCompleted`.
3. **Town entered** — `tile-map.tsx`, on the town node.
4. **Town exited** — `town-hub.tsx`, so shop purchases, inn heals and crafts are banked.

`tile-map.tsx` mirrors the live character position into the store on every tile step.
Before this, the position was only written on unmount, so any save taken while the map was
open recorded a stale tile.

## UI

`src/components/save-load/` holds both pieces, styled in `src/styles/save-load.css` on the
same palette as `.equipment-list`:

- **`SaveSlotCard`** — party class icons with levels, timestamp, coins/gold, map name and
  playtime; a dashed "empty" state; a delete button on filled manual slots. Selection uses
  the shared `ToffecBeigeCornersWrapper` brackets, so keyboard and pointer highlighting
  match every other menu.
- **`SaveLoadMenu`** — `mode="save" | "load"`, keyboard navigation via
  `useKeyboardSelection`, and `useConfirm()` danger dialogs for overwrite, delete, and
  loading over unsaved progress.

Hosts:

- Pause menu Save/Load tabs (`src/components/pause-menu/tabs/`), now full participants in
  the keyboard zone system. The pause menu is unavailable in town, which the town-entry and
  town-exit autosaves cover.
- Title screen (`start-menu-modal.tsx`): the Load Game entry opens the real menu, and a
  **Continue** button appears whenever any slot is filled, loading the most recent one.
  Loads from the title skip the confirmation — there's no run to lose.

**Start Game now genuinely resets.** The defeat path returns to the title without clearing
progression, so previously a "new" game silently continued the old one.

## Tests

`src/lib/save-game.test.ts` (23 tests) covers envelope construction and JSON round-trip,
unknown-key stripping, schema rejection of corrupt payloads, the migration hook, summary
derivation, playtime math and formatting, most-recent-slot selection, and party
sanitization. `src/lib/storage.test.ts` (7 tests) covers the previously untested
localStorage helpers.
