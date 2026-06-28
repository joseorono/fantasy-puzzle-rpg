# Dungeon System — Synthesis Addendum (Kimi)

This is a review of [`dungeon-system-synthesis.md`](./dungeon-system-synthesis.md) (Claude/Gemini synthesis) against the current codebase and `CLAUDE.md`. The original plan is architecturally sound; the notes below are clarifications, corrections, and small implementation details to watch during execution.

## Overall verdict

**Adopt with minor adjustments.** The Jotai-run + Zustand-completion-only approach, the floor/event sequence, and the reuse of existing combat/dialogue/loot systems all fit the project. The main changes are: (1) the battle background override is not already implemented, (2) the defeat path must reset the dungeon Jotai atoms, and (3) the loot extraction should be a pure delta function.

## 1. CLAUDE.md alignment — good, one watch item

- **No enums** ✅ Uses string-literal unions.
- **No memoization** ✅ Uses Jotai and local state.
- **Zustand slices** ✅ `dungeon-progress.ts` is a minimal slice.
- **Pure logic in `src/lib/` with tests** ✅.
- **Jotai for battles only** ⚠️ The plan extends Jotai to dungeon-run state. This is acceptable because the run state is transient and battle-like (it survives view unmounting during combat), but document the exception in the file so it doesn't become a pattern.

## 2. Routing and combat round-trip — confirmed

The round-trip works as described:

`@c:\Github\fantasy-puzzle-rpg\src\lib\routing.ts:173-194` `goToBattleRewards` preserves `previousView`, so `goBack()` from the rewards/level-up chain returns to the dungeon. `DungeonView` unmounts during combat, but module-level Jotai atoms survive, so resuming via `dungeonPhaseAtom === 'awaiting-battle'` is correct.

## 3. Battle background override — NOT already implemented

The plan states: "combat panels in `src/views/battle-screen.tsx` (~lines 103–125) check `battleData?.bgImage` before the fallback". This is **not true yet**:

```@c:\Github\fantasy-puzzle-rpg\src\views\battle-screen.tsx:103-125
backgroundImage: 'url(/assets/bg/battle/simple_battle_background.jpg)',
```

The plan needs to add this change explicitly. Recommended approach:

```tsx
const battleData = useViewData('battle-demo');
const bgImage = battleData?.bgImage ?? '/assets/bg/battle/simple_battle_background.jpg';
```

and apply `bgImage` to both `.partySection` and `.enemySection`.

## 4. Defeat path must reset dungeon run atoms

`@c:\Github\fantasy-puzzle-rpg\src\components\battle\battle-over-modal.tsx:27-39` currently does:

```typescript
fullyHealParty();
resetBattle();
resetRouter();
setGameStarted(false);
```

It does **not** reset the dungeon Jotai atoms. If the player re-enters the dungeon, the stale `currentFloorIndexAtom` / `currentEventIndexAtom` will still be there. Add a reset in `startDungeonRunAtom` (which should overwrite all run atoms on every entry) and/or add a `resetDungeonRunAtom` call in the defeat path. The cleanest fix is making `startDungeonRunAtom` fully authoritative — it should reset all dungeon atoms before seeding them.

## 5. Party management — confirmed available

- `usePartyActions().setParty` exists: `@c:\Github\fantasy-puzzle-rpg\src\stores\slices\party.types.ts:17`
- `healPartyMember` exists: `@c:\Github\fantasy-puzzle-rpg\src\lib\party-system.ts:114-118`
- `isPartyFullyHealed` exists: `@c:\Github\fantasy-puzzle-rpg\src\lib\party-system.ts:21-23`
- The pause menu is **not** disabled for a future `dungeon` view: `@c:\Github\fantasy-puzzle-rpg\src\hooks\use-pause-menu.ts:10`. Do **not** add `'dungeon'` to `DISABLED_VIEWS`.

## 6. Rest helper — new function needed

The plan's `healAllByMaxHpPercent(party, healPercent, revivePercent?)` cannot be built directly on the existing `healAndReviveAllPartyMembers` because that helper takes a flat heal amount for every member. The new function must compute per-member percentages:

```ts
export function healAllByMaxHpPercent(
  party: CharacterData[],
  healPercent: number,
  revivePercent?: number,
): CharacterData[] {
  return party.map((member) => {
    if (member.currentHp > 0) {
      const amount = Math.ceil(member.maxHp * healPercent);
      return { ...member, currentHp: additionWithMax(member.currentHp, amount, member.maxHp) };
    }
    if (revivePercent !== undefined && revivePercent > 0) {
      const amount = Math.ceil(member.maxHp * revivePercent);
      return { ...member, currentHp: Math.min(amount, member.maxHp) };
    }
    return { ...member, currentHp: 1 };
  });
}
```

## 7. Chest loot extraction — make it pure

The plan says "extract the granting logic ... into a reusable `grantLootTable(loot, rarityBias)` in `src/lib/loot.ts`". The current tile-map logic: `@c:\Github\fantasy-puzzle-rpg\src\components\map\tile-map.tsx:462-523` mutates the store directly.

For the dungeon, prefer a **pure delta function**:

```ts
export function applyLootTable(
  loot: LootTable,
  inventory: InventoryItem[],
  resources: Resources,
  rarityBias?: number,
): { inventory: InventoryItem[]; resources: Resources; rolledLoot: LootTable } { ... }
```

The caller (dungeon or tile-map) then applies the returned inventory/resources with store actions. This keeps `loot.ts` testable and avoids passing store actions into lib code.

## 8. UI — reuse existing `TitleSign` for floor menu title

The dungeon floor menu should display the current floor name on a large ribbon banner. Use the existing `TitleSign` component (`@c:\Github\fantasy-puzzle-rpg\src\components\title-sign\title-sign.tsx`):

```tsx
<TitleSign variant="large" size="lg" text={currentFloor.name} position="top" />
```

The `large` variant is already styled for prominent headers and uses the warm gold text color by default. No new component needed.

## 9. `BattleViewData` changes

- Add `bgImage?: string` as planned.
- Keep `enemyId: string` as required. The dungeon can pass `enemyId: floor.id` as a display key; the actual encounter comes from `setupBattleAtom`.

## 10. Verification additions

Add these to the manual checklist:

1. **Battle background override**: confirm the dungeon/floor image appears in both party and enemy sections.
2. **Defeat reset**: after losing a dungeon fight, re-enter the dungeon and confirm Floor 1 starts fresh.
3. **Rest edge cases**: disabled when full HP; disabled after one use; reset on floor advance; revives dead to 1 HP.
4. **Store discipline**: with Redux DevTools, confirm the only `dungeon-progress` action is `markDungeonCompleted`.

## 11. File list update

**New files:** `src/types/dungeon.ts`, `src/stores/dungeon-atoms.ts`, `src/stores/slices/dungeon-progress.ts` (+ `.types.ts`), `src/lib/dungeon-system.ts` (+ `.test.ts`), `src/views/dungeon-view.tsx`, `src/styles/dungeon.css`, `src/constants/dungeon.ts`.

**Modified files (add to the list):**
- `src/lib/party-system.ts` (+ `.test.ts`) — add `healAllByMaxHpPercent`
- `src/lib/loot.ts` — add `applyLootTable` (or similar pure grant helper)
- `src/views/battle-screen.tsx` — read `bgImage` from battle view data
- `src/components/battle/battle-over-modal.tsx` — ensure dungeon atoms reset on defeat

**Unchanged (correctly noted):** `tile-map.tsx` and the map system.

## 11. Small questions to resolve before coding

1. Should the dungeon view show its own title bar or reuse the existing `game-loader` chrome? The ASCII mockup implies a dedicated screen; align with the existing `TownHub` pattern.
2. Does the first-time clear chest contain deterministic loot, or should it use `CHEST_RARITY_BIAS` like the map? The plan should specify the bias constant.
3. The "Leave Dungeon" confirmation dialog is out of scope. Should we use a temporary `window.confirm()` fallback in the debug build, or require the user to build the modal first?
