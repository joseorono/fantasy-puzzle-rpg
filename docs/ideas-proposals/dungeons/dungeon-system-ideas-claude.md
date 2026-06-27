# Linear Dungeon System — Design & Implementation Plan

> Source design (raw conversation): [`og-plan.md`](./og-plan.md)
> Status: **Plan only** — nothing in this document is implemented yet.

## Context

We want a **linear, deterministic dungeon system** (Sengoku Rance-style) for the match-3 RPG.

A dungeon is authored as a **JSON/TS constant**: an ordered list of **floors**, each floor an
**event** (combat / chest / story dialogue) with optional pre- and post-dialogue. The dungeon is
presented as a **vertical floor list over a static background image** — there is **no traversable
tilemap** (our map artist is unavailable, and dungeons must be pure data). First clear plays story;
replays skip dialogue (`skipStory`) for farming. Dungeons are repeatable infinitely.

This is cheap because every sub-system already exists — the dungeon layer is a **thin controller +
dispatcher + one new view** wiring together the existing combat, dialogue, loot, and rewards
systems.

### Design constraints (from the user)

- **Do NOT use the map system.** No dependency on the `mapProgress` slice, no `Dungeon` map node,
  no changes to `tile-map.tsx`. The dungeon system is fully self-contained and tracks its own
  first-clear completion. Entry points (town, menu, debug) just call `goToDungeon({ dungeonId })`.
- **Backgrounds:** the dungeon defines a default `backgroundImage`, and **each floor may optionally
  override it** (`floor.backgroundImage ?? dungeon.backgroundImage`).
- Combat-floor rewards **reuse the existing `battle-rewards` view** (loot → exp → level-up).
- Deliverable scope is **types + manager + wiring**; the user authors the actual dungeon constants.
- Active-run state is **in-memory** (Zustand slice); reloading mid-dungeon restarts from floor 1.

### CLAUDE.md adherence

- Files `kebab-case`; types in `src/types/` / co-located `*.types.ts`; components PascalCase.
- **No enums** — `DungeonFloorEvent` is a discriminated string-literal union; lookups use maps.
- **No memoization** (`React.memo`/`useMemo`/`useCallback`) — React Compiler handles it.
- Functional components with the `function` keyword; props as interfaces, destructured.
- Pure logic in `src/lib/` with **JSDoc** + co-located `*.test.ts`; Zustand slice for state.
- Styling: complex/pixel styles in `src/styles/*.css` imported via `index.css`; reuse existing UI
  primitives. **Warm parchment palette, compact, no bright `#ffd700`/Fisher-Price colors.**

---

## Architecture (og-plan component → our stack)

| og-plan component | Our implementation |
| --- | --- |
| Dungeon Manager (controller) | `DungeonView` (`src/views/dungeon-view.tsx`) + `dungeon-run` Zustand slice (active-run state) |
| Global State Tracker | `completedDungeons` map **inside the `dungeon-run` slice** (drives `skipStory`) — *not* `mapProgress` |
| Event Dispatcher | Pure helpers in `src/lib/dungeon-system.ts` mapping a floor's event to the right system |
| Navigation UI (PC) | `DungeonView` — floor-list side panel over a static background; reuses `ToffecButton`, `FrostyRpgIcon`, bitmap fonts |
| Combat screen | Existing `setupBattleAtom` + `goToBattleDemo` (unchanged) |
| Dialogue engine | Existing inline `<DialogueScene scene onComplete>` overlay |
| Loot system | Combat loot via existing rewards flow; chest loot via an extracted grant helper |

---

## 1. Types — `src/types/dungeon.ts` (new)

Reuses the existing `EncounterDefinition` (the canonical combat-encounter shape) and `LootTable`
types — importing a type creates no runtime coupling to the map system.

```ts
import type { EncounterDefinition } from '~/types/map-node';
import type { LootTable } from '~/types/loot';

/**
 * The action a floor resolves to. Discriminated union on `type` (no enums) so the
 * dispatcher can switch over it exhaustively.
 *  - combat → match-3 battle; loot/exp flow through battle-rewards.
 *  - chest  → grants `loot` directly (no fight) + loot popup.
 *  - story  → pure narrative beat, no action.
 */
export type DungeonFloorEvent =
  | { type: 'combat'; encounter: EncounterDefinition }
  | { type: 'chest'; loot: LootTable }
  | { type: 'story' };

/** A single floor; floors play in array order. */
export interface DungeonFloor {
  id: string;                  // unique-within-dungeon; reused as the battle encounter id
  name: string;                // "Floor 1", "B2 — The Crypt"
  event: DungeonFloorEvent;
  preDialogue?: string;        // scene key, played before the event (first clear only)
  postDialogue?: string;       // scene key, played after the event resolves (first clear only)
  isBoss?: boolean;            // last floor by convention
  backgroundImage?: string;    // optional per-floor override; falls back to the dungeon default
}

/** A complete dungeon authored as a constant. Self-contained; no map-system dependency. */
export interface DungeonDefinition {
  id: string;                  // unique; also the completion-tracking key
  name: string;
  backgroundImage: string;     // default static art (path under /public); floors may override
  floors: DungeonFloor[];      // ordered, played from index 0
}
```

Dungeon dialogue scenes are referenced by string key and resolved from a per-dungeon registry,
mirroring `MAP_00_DIALOGUE_SCENES` (`src/constants/maps/map-00/dialogue.ts`):
`Record<string, DialogueScene>`.

---

## 2. Run-state slice — `src/stores/slices/dungeon-run.ts` (+ `.types.ts`) (new)

A slice is required (not local `useState`) because `DungeonView` **unmounts** while the separate
`battle` / `battle-rewards` views run, then remounts on return. The slice also owns completion
tracking, keeping the system independent of `mapProgress`. Follows the existing slice pattern
(immer `set`, `actions.<sliceName>`, registered in `game-store.ts`).

```ts
// dungeon-run.types.ts
export type DungeonPhase =
  | 'browsing'         // viewing the floor list, no event in progress
  | 'pre-dialogue'     // playing the floor's pre-event dialogue
  | 'awaiting-battle'  // navigated out to the battle view; awaiting victory return
  | 'post-dialogue'    // playing the floor's post-event dialogue
  | 'complete';        // final floor resolved; dungeon cleared

export interface DungeonRunState {
  activeDungeonId: string | null;
  currentFloorIndex: number;
  phase: DungeonPhase;
  skipStory: boolean;                        // set from completedDungeons at run start
  completedDungeons: Record<string, boolean>; // self-contained, NOT mapProgress
}

export interface DungeonRunActions {
  startDungeon: (dungeonId: string, skipStory: boolean) => void;
  setDungeonPhase: (phase: DungeonPhase) => void;
  advanceDungeonFloor: () => void;            // index++, phase → 'browsing'
  markDungeonCompleted: (dungeonId: string) => void;
  exitDungeon: () => void;                    // clear active run; keep completedDungeons
}
```

`isDungeonCompleted(dungeonId)` is read off `completedDungeons` (selector hook), used by entry
points to pass `skipStory` into `startDungeon`.

---

## 3. Dispatcher / lifecycle — `src/lib/dungeon-system.ts` (new, JSDoc + `.test.ts`)

Pure, testable helpers:

- `getDungeonById(id): DungeonDefinition | undefined` — registry lookup.
- `getFloor(dungeon, index): DungeonFloor | undefined`.
- `isLastFloor(dungeon, index): boolean`.
- `shouldPlayDialogue(skipStory, sceneKey?): boolean` → `!skipStory && !!sceneKey`.
- `getFloorBackground(dungeon, floor): string` → `floor.backgroundImage ?? dungeon.backgroundImage`.

Floor **lifecycle** drives the `phase` machine inside `DungeonView`:

1. **Select floor** — player clicks the current unlocked floor button.
2. **Pre-event** — if `shouldPlayDialogue(skipStory, floor.preDialogue)` → render `<DialogueScene>`
   overlay; `onComplete` → Action. Else straight to Action.
3. **Action** by `floor.event.type`:
   - `combat`: `setupBattle({ enemies: encounter.enemies, party })` then
     `goToBattleDemo({ enemyId: floor.id, location: dungeonId })`; set `phase = 'awaiting-battle'`.
     The existing win flow runs `battle → battle-rewards → goBack()`. `goToBattleRewards` preserves
     the pre-battle `previousView` (= `dungeon`), so `goBack()` lands back on `DungeonView`.
     **Defeat resets the router to the start menu**, so re-entry while `phase === 'awaiting-battle'`
     reliably means victory.
   - `chest`: grant loot directly (§5), show loot popup, then Post-event.
   - `story`: no action; straight to Post-event.
4. **Post-event** — if `shouldPlayDialogue(skipStory, floor.postDialogue)` → `<DialogueScene>`;
   `onComplete` → Resolve.
5. **Resolve & advance** — `advanceDungeonFloor()` unlocks the next floor. If `isLastFloor` →
   `markDungeonCompleted(dungeonId)`, set `phase = 'complete'`, show completion + "Leave"
   (`goBack()`).

On `DungeonView` mount, read the slice: if `phase === 'awaiting-battle'`, resume at **Post-event**
(the victory return path).

---

## 4. Routing wiring (no map-system changes)

- `src/types/routing.ts`: add `'dungeon'` to `ViewType`; add `interface DungeonViewData { dungeonId: string }`;
  add to `ViewDataMap` and the `RouteStatus` intersection.
- `src/lib/routing.ts`: add `goToDungeon(currentState, data)` wrapping
  `prepareNavigation(..., 'dungeon', data)`, mirroring `goToBattleDemo`.
- `src/stores/slices/router.ts` (+ `router.types.ts`): expose the `goToDungeon` action.
- `src/stores/game-store.ts`: register the `dungeon-run` slice + export selector hooks
  (`useDungeonRunState`, `useDungeonRunActions`).
- `src/game-screen.tsx`: add `case 'dungeon'` → `<DungeonView />`.
- **Entry point:** trigger `goToDungeon({ dungeonId })` from a non-map surface (town hub button,
  debug view, or a future overworld menu). For testing, a debug-view button is enough.
  **No edits to `tile-map.tsx` / the map node system.**

---

## 5. Loot reuse cleanup — `src/lib/loot.ts`

Chest-floor loot needs the same grant logic currently **inlined** in `handleNodeOpenChest`
(`tile-map.tsx:462–523`: `rollLootTableRarities` → `randomBool` gating → `additionWithMax` /
`addResources` + inventory/resource actions). Extract a reusable helper, e.g.
`grantLootTable(loot, rarityBias)`, and have the dungeon chest floor call it. (Optionally refactor
the map chest handler to call it too — pure cleanup, behavior identical.) Combat-floor loot needs
no new code — `combineLootFromEnemies` + the rewards screen already handle it. Reuse
`loot-notification.tsx` for the chest popup.

---

## 6. UI / view — `src/views/dungeon-view.tsx` + `src/styles/dungeon.css`

- Background = `getFloorBackground(dungeon, currentFloor)` (per-floor override, dungeon default
  fallback). An opaque/semi-transparent **side panel** lists floors top-to-bottom.
- Floor buttons show three clear states: **completed** (`index < currentFloorIndex`), **current**
  (`=== currentFloorIndex`, highlight/pulse), **locked** (`>`).
- Inline overlays like the map: `<DialogueScene>` for pre/post dialogue; loot popup for chests.
- Reuse `ToffecButton`, `FrostyRpgIcon`, `NarikWoodBitFont`; CSS in `src/styles/dungeon.css`
  imported via `index.css`. Warm parchment palette, compact.

---

## Files summary

**New:** `src/types/dungeon.ts`, `src/stores/slices/dungeon-run.ts` (+ `.types.ts`),
`src/lib/dungeon-system.ts` (+ `.test.ts`), `src/views/dungeon-view.tsx`, `src/styles/dungeon.css`.

**Modified:** `src/types/routing.ts`, `src/lib/routing.ts`, `src/stores/slices/router.ts`
(+ `router.types.ts`), `src/stores/game-store.ts`, `src/game-screen.tsx`, `src/index.css`,
and optionally `src/lib/loot.ts` (extract `grantLootTable`). **`tile-map.tsx` is untouched.**

**User-authored (out of scope):** concrete `DungeonDefinition` constants under
`src/constants/dungeons/` and their dialogue-scene registries.

---

## Verification

1. `npm run test-cli` — unit tests for `src/lib/dungeon-system.ts` (`getFloor`, `isLastFloor`,
   `shouldPlayDialogue`, `getFloorBackground`, dispatcher branching).
2. Manual (`npm run dev`): author a tiny throwaway `DungeonDefinition` (combat → chest → boss,
   reusing `SWAMP_FROG`/`MOSS_GOLEM` + an existing chest `LootTable`), enter via a debug button:
   - **First clear**: pre-dialogue → battle → rewards → post-dialogue → next floor unlocks; chest
     floor grants loot + popup; boss floor marks the dungeon complete; per-floor background
     overrides render.
   - **Replay (skipStory)**: re-enter the completed dungeon → all dialogue skipped; floors chain
     straight through combat/loot.
   - **Defeat**: lose a floor battle → router resets to start menu (run abandoned), as today.
   - `goBack()` from the dungeon returns to the entry surface.
