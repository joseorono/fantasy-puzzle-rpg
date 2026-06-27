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
floor track over an atmospheric background). The first clear plays story dialogue and chests;
replays (`isReplay`) skip **both dialogue and chests** and chain combats only, for farming.
Dungeons are repeatable infinitely.

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
| Between-floor recovery | — | — | **Manage Party** (existing global `<PauseMenu />`, Items + Equip) **+ free Rest** (once/floor) |
| Run-state storage | Zustand slice | Zustand slice | **Jotai atoms** (transient) — the store is written **only once, on completion** |
| Replay skip flag | derived in slice | derived in dispatcher | **Passed via router** (`DungeonViewData.isReplay`), computed at entry |
| Resume on reload | in-memory (v1) | persist run | **In-memory v1** — reload restarts at Floor 1 |
| Completion tracking | own slice | own slice (`completedDungeons`) | **Minimal `dungeon-progress` Zustand slice** (`completedDungeons` only) — not `mapProgress` |
| Per-floor background | yes | yes | **Yes** — floor override → dungeon default |
| Combat background sync | — | pass `bgImage` into battle | **Adopt** — combat panels match the dungeon/floor art |
| Dialogue trigger | inline `<DialogueScene>` overlay | `goToDialogue` route | **Inline overlay** — `goToDialogue` doesn't exist; the inline overlay is the real mechanism |

---

## 1. Architecture

| Role | Implementation |
| --- | --- |
| Dungeon Manager | `DungeonView` (`src/views/dungeon-view.tsx`) + Jotai run atoms (`src/stores/dungeon-atoms.ts`) |
| Transient run state | **Jotai atoms** (floor/event index, phase, replay, rest) — ephemeral, never persisted |
| Completion tracking | minimal Zustand `dungeon-progress` slice (`completedDungeons`); the **only** store write |
| Replay flag | `DungeonViewData.isReplay`, computed at entry from `isDungeonCompleted` |
| Event Dispatcher | per-event state machine in `DungeonView`, backed by pure helpers in `src/lib/dungeon-system.ts` |
| Navigation UI | split-pane PC screen: floor track + atmospheric background |
| Combat / Dialogue / Loot / Rewards | existing systems, reused unchanged where possible |
| Between-floor party management | existing global `<PauseMenu />` (Items/Equip) + free **Rest** (once/floor) |

### High-level flow

```
Entry surface (town / quest board / debug)
  -> isReplay = isDungeonCompleted(dungeonId)        // Zustand READ
  -> goToDungeon({ dungeonId, isReplay })
  -> DungeonView: step through floors[].events[] in order (run state in Jotai)
       dialogue -> inline <DialogueScene> overlay      (skipped when isReplay)
       combat   -> setupBattle + goToBattleDemo -> battle -> battle-rewards -> goBack() -> resume
       chest    -> grantLootTable + loot popup          (skipped when isReplay)
       (between floors: optional free Rest once per floor; or Leave Dungeon -> confirm
        -> resetDungeonRunAtom + goBack, run progress lost)
  -> last floor cleared -> markDungeonCompleted   // the ONE Zustand write -> "Leave" -> goBack()
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
  | { type: 'dialogue'; scene: DialogueScene }            // inline overlay; skipped on replays
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

## 3. Run state (Jotai) + completion (minimal Zustand)

The store is written **only once per run — on completion**. Everything else is transient.

### 3a. Transient run state — `src/stores/dungeon-atoms.ts` (new, Jotai)

Module-level Jotai atoms (mirrors `src/stores/battle-atoms.ts`): they survive `DungeonView`
unmounting during the `battle`/`battle-rewards` views and are **never persisted**, so reloading
restarts the run (in-memory v1). Tracks **both** floor and event index (events resume mid-floor
after a combat round-trip).

```ts
export type DungeonPhase =
  | 'browsing' | 'pre-dialogue' | 'awaiting-battle' | 'post-dialogue' | 'complete';

export const activeDungeonIdAtom  = atom<string | null>(null);
export const currentFloorIndexAtom = atom(0);
export const currentEventIndexAtom = atom(0);   // resume point within the floor's events[]
export const dungeonPhaseAtom      = atom<DungeonPhase>('browsing');
export const isReplayAtom          = atom(false); // seeded from DungeonViewData.isReplay on mount
export const hasRestedOnFloorAtom  = atom(false); // one free Rest per floor

// write-atoms: startDungeonRunAtom(dungeonId, isReplay), advanceEventAtom,
// advanceFloorAtom (resets event index + hasRestedOnFloor), resetDungeonRunAtom
```

### 3b. Completion — `src/stores/slices/dungeon-progress.ts` (+ `.types.ts`) (new, Zustand)

A tiny slice holding only the persisted completion flags. `markDungeonCompleted` is the **single
store write** of a run, fired once when the last floor's last event resolves.

```ts
export interface DungeonProgressState { completedDungeons: Record<string, boolean>; }
export interface DungeonProgressActions {
  markDungeonCompleted: (dungeonId: string) => void;
  isDungeonCompleted: (dungeonId: string) => boolean;
}
```

Register in `game-store.ts`; export `useDungeonProgressState` / `useDungeonProgressActions`.
The entry surface calls `isDungeonCompleted(id)` to compute `isReplay` (see §6).

## 4. Dispatcher / lifecycle — `src/lib/dungeon-system.ts` (new, JSDoc + `.test.ts`)

Pure, testable helpers:

- `getDungeonById(id): DungeonDefinition | undefined`
- `getFloor(dungeon, floorIndex)` / `getEvent(floor, eventIndex)`
- `isLastEventOfFloor(floor, eventIndex)` / `isLastFloor(dungeon, floorIndex)`
- `shouldRunEvent(event, isReplay): boolean` → on replays, **only `combat` runs** (returns `false`
  for `dialogue` and `chest`); on a first clear everything runs.
- `getFloorBackground(dungeon, floor): string` → `floor.backgroundImage ?? dungeon.backgroundImage`

**Per-event loop** (driven in `DungeonView`):

1. Player engages the current floor → process `events[currentEventIndex]`. If
   `!shouldRunEvent(event, isReplay)` → `advanceEvent()` immediately (replay skip).
2. `dialogue`: render inline `<DialogueScene scene onComplete>`; on complete → `advanceEvent()`.
3. `combat`: `setupBattle({ enemies: event.encounter.enemies, party })` →
   `goToBattleDemo({ enemyId: floor.id, location: dungeonId, bgImage: resolvedFloorBg })`; set
   `dungeonPhaseAtom = 'awaiting-battle'`. The existing win flow runs
   `battle → battle-rewards → goBack()`, which returns to `DungeonView` because `goToBattleRewards`
   preserves the pre-battle `previousView` (= `dungeon`). On return with
   `dungeonPhaseAtom === 'awaiting-battle'` → reliably a **win** (defeat resets the router to the
   start menu) → `advanceEvent()`.
4. `chest`: grant loot directly (§7) + popup → `advanceEvent()`.
5. When `currentEventIndexAtom` passes the last event of the floor → `advanceFloorAtom` (unlock the
   next floor, reset `hasRestedOnFloorAtom`). When the last floor finishes →
   `markDungeonCompleted(dungeonId)` (**the one store write**), `dungeonPhaseAtom = 'complete'`,
   show completion + "Leave" (`goBack()`).

On `DungeonView` mount, read the atoms: if `dungeonPhaseAtom === 'awaiting-battle'`, resume at
step 3's post-combat handling (the victory return path).

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
- **Free Rest — once per floor.** A **"Rest"** button heals each *living* member by
  `DUNGEON_REST_HEAL_PERCENT` (10%, see §11) of their max HP and **revives** any downed hero with
  **1 HP**. On click:
  `partyActions.setParty(healAllByMaxHpPercent(party, DUNGEON_REST_HEAL_PERCENT))`,
  play `SoundNames.shimmeringSuccessShorter`, set `hasRestedOnFloorAtom = true`. Disabled once used
  on the current floor (reset on floor advance) or when the whole party is already at full HP.
  - New pure helper in `src/lib/party-system.ts` (+ `party-system.test.ts`):
    `healAllByMaxHpPercent(party, healPercent, revivePercent?)` — living members gain
    `ceil(maxHp * healPercent)`, clamped to `maxHp` via `additionWithMax`; dead members are revived
    to `ceil(maxHp * revivePercent)` when `revivePercent` is provided, otherwise to **1 HP**.
    Mirrors the existing `healAndReviveAllPartyMembers`, but percentage-based. Rest calls it with
    `revivePercent` left undefined (→ 1 HP revives).
- **Wipe** = whole-run reset: on defeat, `resetDungeonRunAtom` (back to Floor 1) and exit the run.
  The existing defeat path (`battle-over-modal.tsx`) already heals the party and returns to the menu.

## 6. Routing & entry (no map-system changes)

- `src/types/routing.ts`: add `'dungeon'` to `ViewType`; add
  `interface DungeonViewData { dungeonId: string; isReplay: boolean }`; add to `ViewDataMap` + the
  `RouteStatus` intersection. Add optional `bgImage?: string` to `BattleViewData`.
- `src/lib/routing.ts`: add `goToDungeon(state, data)` wrapping `prepareNavigation(..., 'dungeon', data)`,
  mirroring `goToBattleDemo`.
- `src/stores/slices/router.ts` (+ `router.types.ts`): expose the `goToDungeon` action.
- `src/game-screen.tsx`: add `case 'dungeon'` → `<DungeonView />`.
- **Entry:** compute `isReplay = isDungeonCompleted(dungeonId)` (Zustand read), then call
  `goToDungeon({ dungeonId, isReplay })` from a non-map surface (town hub / quest board / debug
  button). `DungeonView` seeds `isReplayAtom` from `isReplay` on mount. **`tile-map.tsx` and the map
  node system are untouched.**

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
| [ Manage Party ]   [ Rest (once/floor) ]      [ Leave Dungeon ]       |
+-----------------------------------------------------------------------+
```

- **Left:** vertical floor track — states: completed (`index < currentFloorIndex`), current
  (`=== currentFloorIndex`, pulse/highlight), locked (`>`).
- **Right:** atmospheric background + current-floor name/description + the contextual action button.
- **Header:** party HP (reuse `PauseMenuPartyBar` or a compact HP read from `useParty`).
- **Footer:** **Manage Party** (`usePauseMenu().open()`), **Rest** (free, once per floor — disabled
  after use / when party is full), and **Leave Dungeon** (see below). These are available in the
  between-floor "browsing" phase (including when you return to the floor menu after a battle), not
  mid-combat or mid-dialogue.
- **Leave Dungeon — confirmation required.** Leaving mid-run **discards all run progress** (the run
  lives only in the Jotai atoms — nothing is persisted until completion). So the button opens a
  **confirmation modal**; on **confirm** → `resetDungeonRunAtom` + `goBack()` to the entry surface;
  on **cancel** → stay. Modal open/closed is local `useState` in `DungeonView`.
  - **Out of scope:** the confirmation dialog **component** is the user's to implement. The plan only
    wires the trigger + the confirm/cancel handlers against an assumed contract
    (`isOpen`, `onConfirm`, `onCancel`); until it exists, this can fall back to a placeholder.
- Inline overlays like the map: `<DialogueScene>` for dialogue events, loot popup for chests.
- Reuse `ToffecButton`, `FrostyRpgIcon`, `NarikWoodBitFont`; styles in `src/styles/dungeon.css`
  imported via `index.css`. Warm parchment palette, compact. No memoization.

## 9. Files

**New:** `src/types/dungeon.ts`, `src/stores/dungeon-atoms.ts` (Jotai run state),
`src/stores/slices/dungeon-progress.ts` (+ `.types.ts`), `src/lib/dungeon-system.ts` (+ `.test.ts`),
`src/views/dungeon-view.tsx`, `src/styles/dungeon.css`, `src/constants/dungeon.ts`.

**Modified:** `src/types/routing.ts`, `src/lib/routing.ts`, `src/stores/slices/router.ts`
(+ `router.types.ts`), `src/stores/game-store.ts`, `src/game-screen.tsx`,
`src/views/battle-screen.tsx` (bg override), `src/lib/loot.ts` (extract `grantLootTable`),
`src/lib/party-system.ts` (+ `.test.ts`: `healAllByMaxHpPercent`), `src/index.css`.
**`tile-map.tsx` and the map system are untouched.**

**User-authored (out of scope):** concrete `DungeonDefinition` constants under
`src/constants/dungeons/`, composed from named encounter/scene/loot `const`s; and the **Leave
Dungeon confirmation dialog component** (the plan wires its trigger + confirm/cancel handlers only).

## 10. Verification

1. `npm run test-cli` — unit tests for `src/lib/dungeon-system.ts` (`getEvent`,
   `isLastEventOfFloor`, `isLastFloor`, `getFloorBackground`, `shouldRunEvent` — combat-only on
   replay) and `src/lib/party-system.ts` (`healAllByMaxHpPercent` — heals living by `healPercent`
   clamped to `maxHp`; revives dead to **1 HP** by default, or to `revivePercent` when provided).
2. Manual (`npm run dev`): author a throwaway dungeon — Floor 1 `[dialogue, combat]`, Floor 2
   `[chest]` (no battle), Floor 3 boss `[dialogue, combat, chest]` — reusing `SWAMP_FROG`/
   `MOSS_GOLEM` + an existing chest `LootTable`; enter via a debug button:
   - **First clear:** events play in order across floors; the chest-only floor works without a
     battle; combat uses the dungeon background; HP carries between fights; **Manage Party**
     heals/re-equips between floors; **Rest** heals living heroes ~10% of max HP and revives downed
     heroes with 1 HP, once per floor, with the `shimmeringSuccessShorter` SFX, then disables until
     the next floor; the boss floor marks the dungeon complete.
   - **Replay (`isReplay=true`):** dialogue **and** chest events are skipped; combats chain straight
     through for farming.
   - **Wipe:** lose a fight → `resetDungeonRunAtom` (back to Floor 1), the party is healed, and the
     player returns to the entry surface.
   - **Leave Dungeon:** from the between-floor menu, clicking Leave opens the confirmation modal;
     confirming discards run progress (`resetDungeonRunAtom`) and returns to the entry surface;
     cancelling stays on the current floor with progress intact.
   - Per-floor `backgroundImage` overrides render; `goBack()` returns to the entry surface.
   - **Store discipline:** via Zustand devtools, confirm the only dungeon write during a run is
     `markDungeonCompleted` on the final floor — no per-floor/per-event store writes.

## 11. Tunable constants — `src/constants/dungeon.ts` (new)

```ts
/** Fraction of each living hero's max HP restored by a free between-floor Rest (dead revive with 1 HP; once per floor). */
export const DUNGEON_REST_HEAL_PERCENT = 0.1;
```

Future dungeon-wide tunables live here too.
