# Dungeon System — Synthesis Design

> A reconciliation of the two proposals — [`dungeon-system-ideas-claude.md`](./dungeon-system-ideas-claude.md)
> (Claude) and [`dungeon-system-ideas-agy.md`](./dungeon-system-ideas-agy.md) (Antigravity/Gemini) —
> plus the user's clarifications. Raw source conversation: [`og-plan.md`](./og-plan.md).
> **Status: design/plan only — nothing here is implemented yet.**

## Context

A **linear, deterministic dungeon system** (Sengoku Rance-style). Each dungeon is an authored
constant: an ordered list of **floors**, and **each floor is an ordered sequence of optional
events** — `dialogue`, `combat`, `chest`, in any combination. A floor may be a chest with no
battle, a single conversation, or `dialogue → combat → chest`; all events are optional.

There is **no traversable tilemap**. The run is driven through one dedicated PC screen (a vertical
floor track over an atmospheric background). The first clear plays story dialogue; replays skip it
for farming (`skipStory`). Dungeons are repeatable infinitely.

The system is **self-contained — it does not use the map system** (no `mapProgress`, no map node,
no changes to `tile-map.tsx`). It is a thin **controller + dispatcher + one new view** that wires
together the existing combat, dialogue, loot, rewards, and pause-menu systems.

### CLAUDE.md adherence

- Files `kebab-case`; types in `src/types/`; components PascalCase, `function` keyword, props as
  destructured interfaces. **No enums** — discriminated string-literal unions. **No memoization**
  (React Compiler). Pure logic in `src/lib/` with JSDoc + co-located `*.test.ts`. Zustand slice for
  state. Pixel/complex styles in `src/styles/*.css` via `index.css`; reuse existing UI primitives.
  **Warm parchment palette, compact, no bright `#ffd700`/Fisher-Price colors.**

## Resolved conflicts (Claude vs Antigravity → decision)

| Topic | Claude | Antigravity | **Decision** |
| --- | --- | --- | --- |
| Floor structure | one event/floor (+ pre/post dialogue) | **`events: DungeonEvent[]` per floor** | **Antigravity** — floor = ordered sequence of optional events (user-confirmed) |
| Event payload | inline objects | string IDs + registries | **Inline, as named `const`s referenced by variable** — typed objects, no registry/lookup boilerplate, shared by JS reference |
| Combat reference | encounter (multi-enemy) | single `enemyId` | **Encounter (multi-enemy)** — real fights have several enemies |
| Party HP | unspecified | persistent + wipe resets run | **Persistent attrition; no auto-heal; player manages between floors** |
| Between-floor recovery | — | — | **Reuse existing global `<PauseMenu />`** (Items + Equip tabs) via a "Manage Party" button |
| Resume on reload | in-memory (v1) | persist run | **In-memory v1** — reload restarts at Floor 1 |
| Completion tracking | own slice | own slice (`completedDungeons`) | **Own `dungeon-run` slice** — not `mapProgress` |
| Per-floor background | yes | yes | **Yes** — floor override → dungeon default |
| Combat background sync | — | pass `bgImage` into battle | **Adopt** — combat panels match the dungeon/floor art |
| Dialogue trigger | inline `<DialogueScene>` overlay | `goToDialogue` route | **Inline overlay** — `goToDialogue` doesn't exist; the inline overlay is the real mechanism |

---

## 1. Architecture

| Role | Implementation |
| --- | --- |
| Dungeon Manager | `DungeonView` (`src/views/dungeon-view.tsx`) + `dungeon-run` Zustand slice |
| Completion / farming flag | `completedDungeons` in the `dungeon-run` slice (self-contained) |
| Event Dispatcher | per-event state machine in `DungeonView`, backed by pure helpers in `src/lib/dungeon-system.ts` |
| Navigation UI | split-pane PC screen: floor track + atmospheric background |
| Combat / Dialogue / Loot / Rewards | existing systems, reused unchanged where possible |
| Between-floor party management | existing global `<PauseMenu />` (Items/Equip), opened via `usePauseMenu()` |

### High-level flow

```
Entry surface (town / quest board / debug)
  -> goToDungeon({ dungeonId })
  -> DungeonView: step through floors[].events[] in order
       dialogue -> inline <DialogueScene> overlay (skipped when skipStory)
       combat   -> setupBattle + goToBattleDemo -> battle -> battle-rewards -> goBack() -> resume
       chest    -> grantLootTable + loot popup
  -> last floor cleared -> markDungeonCompleted -> "Leave" -> goBack()
```

## 2. Types — `src/types/dungeon.ts` (new)

Payloads are **typed objects referenced by `const`** (no string IDs, no registry). In JS an object
value is a reference, so authoring `const CRYPT_INTRO = {…}` and using it as `scene: CRYPT_INTRO`
shares one instance — type-safe, reusable, no lookup layer. Treat referenced consts as immutable
(battle already clones via `createBattleState`; enemy templates are spread like `{...SWAMP_FROG}`).

```ts
import type { EncounterDefinition } from '~/types/map-node';
import type { DialogueScene } from '~/types/dialogue';
import type { LootTable } from '~/types/loot';

/** One event in a floor's ordered sequence. Discriminated union on `type` (no enums). */
export type DungeonEvent =
  | { type: 'dialogue'; scene: DialogueScene }            // inline overlay; skipped when skipStory
  | { type: 'combat';   encounter: EncounterDefinition }  // multi-enemy fight
  | { type: 'chest';    loot: LootTable };                // granted directly + popup

/** A floor: an ordered, arbitrary, all-optional sequence of events. */
export interface DungeonFloor {
  id: string;
  name: string;                 // "Floor 1", "B2 — The Crypt"
  events: DungeonEvent[];       // may be [chest] only, [dialogue, combat, chest], etc.
  isBoss?: boolean;
  backgroundImage?: string;     // optional per-floor override
}

/** A complete dungeon authored as a constant. Self-contained; no map dependency. */
export interface DungeonDefinition {
  id: string;                   // also the completion-tracking key
  name: string;
  backgroundImage: string;      // default art; floors may override
  floors: DungeonFloor[];       // played in order from index 0
}
```

## 3. Run-state slice — `src/stores/slices/dungeon-run.ts` (+ `.types.ts`) (new)

Required because `DungeonView` unmounts during the separate `battle`/`battle-rewards` views.
Tracks **both** floor and event index (events resume mid-floor after a combat round-trip).
Follows the existing slice pattern (immer `set`, `actions.<sliceName>`, registered in
`game-store.ts`).

```ts
export type DungeonPhase =
  | 'browsing' | 'pre-dialogue' | 'awaiting-battle' | 'post-dialogue' | 'complete';

export interface DungeonRunState {
  activeDungeonId: string | null;
  currentFloorIndex: number;
  currentEventIndex: number;                  // resume point within the floor's events[]
  phase: DungeonPhase;
  skipStory: boolean;                         // set from completedDungeons at run start
  completedDungeons: Record<string, boolean>; // self-contained, NOT mapProgress
}

export interface DungeonRunActions {
  startDungeon: (dungeonId: string, skipStory: boolean) => void;
  setDungeonPhase: (phase: DungeonPhase) => void;
  advanceEvent: () => void;                   // event index++ (or roll to next floor)
  advanceFloor: () => void;                   // floor index++, event index → 0
  markDungeonCompleted: (dungeonId: string) => void;
  exitDungeon: () => void;                    // clear active run; keep completedDungeons
}
```

Register in `game-store.ts`; export `useDungeonRunState` / `useDungeonRunActions`.
`isDungeonCompleted(id)` reads `completedDungeons` for the `skipStory` decision at entry.

## 4. Dispatcher / lifecycle — `src/lib/dungeon-system.ts` (new, JSDoc + `.test.ts`)

Pure, testable helpers:

- `getDungeonById(id): DungeonDefinition | undefined`
- `getFloor(dungeon, floorIndex)` / `getEvent(floor, eventIndex)`
- `isLastEventOfFloor(floor, eventIndex)` / `isLastFloor(dungeon, floorIndex)`
- `shouldPlayDialogue(skipStory): boolean` → `!skipStory`
- `getFloorBackground(dungeon, floor): string` → `floor.backgroundImage ?? dungeon.backgroundImage`

**Per-event loop** (driven in `DungeonView`):

1. Player engages the current floor → process `events[currentEventIndex]`.
2. `dialogue`: if `!skipStory` → render inline `<DialogueScene scene onComplete>`; on complete →
   `advanceEvent()`. If `skipStory` → skip immediately.
3. `combat`: `setupBattle({ enemies: event.encounter.enemies, party })` →
   `goToBattleDemo({ enemyId: floor.id, location: dungeonId, bgImage: resolvedFloorBg })`; set
   `phase = 'awaiting-battle'`. The existing win flow runs `battle → battle-rewards → goBack()`,
   which returns to `DungeonView` because `goToBattleRewards` preserves the pre-battle `previousView`
   (= `dungeon`). On return with `phase === 'awaiting-battle'` → reliably a **win** (defeat resets
   the router to the start menu) → `advanceEvent()`.
4. `chest`: grant loot directly (§7) + popup → `advanceEvent()`.
5. When `currentEventIndex` passes the last event of the floor → `advanceFloor()` (unlock the next
   floor). When the last floor finishes → `markDungeonCompleted(dungeonId)`, `phase = 'complete'`,
   show completion + "Leave" (`goBack()`).

On `DungeonView` mount, read the slice: if `phase === 'awaiting-battle'`, resume at step 3's
post-combat handling (the victory return path).

## 5. Party HP — persistent attrition + player-managed recovery

- **Damage carries across battles within a run** — already the behavior: `syncBattleHp`
  (`src/components/battle/battle-over-modal.tsx`) writes post-battle HP back to the persistent
  party, and the next fight starts from current HP. No new code needed for carry-over.
- **No automatic healing between floors.** The dungeon screen shows a **"Manage Party"** button that
  opens the existing global `<PauseMenu />` via `usePauseMenu().open()`
  (`src/hooks/use-pause-menu.ts`, overlay already mounted in `src/components/game-loader.tsx`).
  There the player swaps **equipment** (Equip tab → `equipItem`/`unequipItem`) and uses **items**
  (Items tab → `usableOutOfBattle` consumables via `healPartyMember` in `src/lib/party-system.ts`).
  Both already work out of battle. Gate the button to between-event/floor moments (not mid-combat).
- **Wipe** = whole-run reset: on defeat, reset the `dungeon-run` slice to Floor 1 and exit the run.
  The existing defeat path (`battle-over-modal.tsx`) already heals the party and returns to the menu.

## 6. Routing & entry (no map-system changes)

- `src/types/routing.ts`: add `'dungeon'` to `ViewType`; add
  `interface DungeonViewData { dungeonId: string }`; add to `ViewDataMap` + the `RouteStatus`
  intersection. Add optional `bgImage?: string` to `BattleViewData`.
- `src/lib/routing.ts`: add `goToDungeon(state, data)` wrapping `prepareNavigation(..., 'dungeon', data)`,
  mirroring `goToBattleDemo`.
- `src/stores/slices/router.ts` (+ `router.types.ts`): expose the `goToDungeon` action.
- `src/game-screen.tsx`: add `case 'dungeon'` → `<DungeonView />`.
- **Entry:** call `goToDungeon({ dungeonId })` from a non-map surface (town hub / quest board /
  debug button). **`tile-map.tsx` and the map node system are untouched.**

## 7. Backgrounds & loot reuse

- **Dungeon background:** `getFloorBackground(dungeon, currentFloor)`. The combat panels in
  `src/views/battle-screen.tsx` (~lines 103–125) check `battleData?.bgImage` before the
  `simple_battle_background.jpg` fallback, so fights match the current dungeon/floor art.
- **Combat loot:** the existing `combineLootFromEnemies` + `battle-rewards-screen.tsx` flow already
  grants XP/items — no new code.
- **Chest loot:** extract the granting logic currently inlined in `handleNodeOpenChest`
  (`src/components/map/tile-map.tsx:462–523`: `rollLootTableRarities` → `randomBool` gating →
  `additionWithMax` / `addResources` + inventory/resource actions) into a reusable
  `grantLootTable(loot, rarityBias)` in `src/lib/loot.ts`; the dungeon chest event calls it.
  Reuse `src/components/map/loot-notification.tsx` for the popup.

## 8. UI — `src/views/dungeon-view.tsx` + `src/styles/dungeon.css`

```
+-----------------------------------------------------------------------+
| DUNGEON: <name>                              [ PARTY HP: 235 / 390 ]   |
+----------------------------+------------------------------------------+
| [F5] BOSS: Lich King   ( ) |                                          |
| [F4] Chest of Shadows  [ ] |        ATMOSPHERIC BACKGROUND            |
| [F3] Skeletons         (x) |   (floor override -> dungeon default)    |
| [F2] Conversation      (x) |------------------------------------------|
| [F1] Vanguard Gate     (x) | Floor 4 — <description>                  |
|                            | [ Enter Battle / Open Chest / Continue ] |
+----------------------------+------------------------------------------+
| [ Manage Party ]                              [ Retreat to Town ]      |
+-----------------------------------------------------------------------+
```

- **Left:** vertical floor track — states: completed (`index < currentFloorIndex`), current
  (`=== currentFloorIndex`, pulse/highlight), locked (`>`).
- **Right:** atmospheric background + current-floor name/description + the contextual action button.
- **Header:** party HP (reuse `PauseMenuPartyBar` or a compact HP read from `useParty`).
- **Footer:** **Manage Party** (`usePauseMenu().open()`) and **Retreat to Town** (`goBack()`).
- Inline overlays like the map: `<DialogueScene>` for dialogue events, loot popup for chests.
- Reuse `ToffecButton`, `FrostyRpgIcon`, `NarikWoodBitFont`; styles in `src/styles/dungeon.css`
  imported via `index.css`. Warm parchment palette, compact. No memoization.

## 9. Files

**New:** `src/types/dungeon.ts`, `src/stores/slices/dungeon-run.ts` (+ `.types.ts`),
`src/lib/dungeon-system.ts` (+ `.test.ts`), `src/views/dungeon-view.tsx`, `src/styles/dungeon.css`.

**Modified:** `src/types/routing.ts`, `src/lib/routing.ts`, `src/stores/slices/router.ts`
(+ `router.types.ts`), `src/stores/game-store.ts`, `src/game-screen.tsx`,
`src/views/battle-screen.tsx` (bg override), `src/lib/loot.ts` (extract `grantLootTable`),
`src/index.css`. **`tile-map.tsx` and the map system are untouched.**

**User-authored (out of scope):** concrete `DungeonDefinition` constants under
`src/constants/dungeons/`, composed from named encounter/scene/loot `const`s.

## 10. Verification

1. `npm run test-cli` — unit tests for `src/lib/dungeon-system.ts` (`getEvent`,
   `isLastEventOfFloor`, `isLastFloor`, `getFloorBackground`, dispatcher branching).
2. Manual (`npm run dev`): author a throwaway dungeon — Floor 1 `[dialogue, combat]`, Floor 2
   `[chest]` (no battle), Floor 3 boss `[dialogue, combat, chest]` — reusing `SWAMP_FROG`/
   `MOSS_GOLEM` + an existing chest `LootTable`; enter via a debug button:
   - **First clear:** events play in order across floors; the chest-only floor works without a
     battle; combat uses the dungeon background; HP carries between fights; **Manage Party**
     heals/re-equips between floors; the boss floor marks the dungeon complete.
   - **Replay (skipStory):** dialogue events are skipped; combat/chest chain straight through.
   - **Wipe:** lose a fight → the run resets to Floor 1, the party is healed, and the player returns
     to the entry surface.
   - Per-floor `backgroundImage` overrides render; `goBack()` returns to the entry surface.
