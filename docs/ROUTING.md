# Routing System

A store-based routing system for the game that provides full control over navigation without relying on URL changes.

## Architecture

### Files Structure

```
/src/types/routing.ts          - Type definitions for views and routing
/src/constants/routing.ts      - Initial state and constants
/src/lib/routing.ts            - Pure functions for navigation logic
/src/stores/slices/router.ts   - Router slice implementation
/src/stores/slices/router.types.ts - Router slice types
```

## Available Views

- `town-hub` - Main town hub (contains blacksmith, inn, and item Shop as sub-locations)
- `battle-demo` - Match-3 battle screen
- `battle-rewards` - Post-battle rewards and EXP distribution screen
- `dungeon` - Multi-floor dungeon exploration view
- `map` - Overworld map; `mapId` in the view data selects which one from `MAP_REGISTRY`
- `dialogue-demo` - Dialogue test/demo view
- `debug` - Debug & feature testing dashboard

## Usage

### Basic Navigation

```typescript
import { useRouterActions } from '~/stores/game-store';

function MyComponent() {
  const { goToBattleDemo, goToTownHub, goBack } = useRouterActions();

  // Navigate to battle demo with data
  const startBattle = () => {
    goToBattleDemo({
      enemyId: 'moss-golem',
      location: 'Forest',
      canFlee: true,
    });
  };

  // Navigate to town hub (data is required)
  const returnToTown = () => {
    goToTownHub({
      innCost: { coins: 10, gold: 0, silver: 0, bronze: 0, copper: 0 },
      itemsForSell: ['potion'],
      onLeaveCallback: () => {},
    });
  };

  // Go back to previous view
  const handleBack = () => {
    goBack();
  };
}
```

### Reading Router State

```typescript
import { useCurrentView, useRouterState, useViewData } from '~/stores/game-store';

function MyComponent() {
  // Get current view
  const currentView = useCurrentView();

  // Get full router state
  const router = useRouterState();
  console.log(router.currentView);
  console.log(router.history); // [{ view, data }, …] oldest first — goBack() pops the last one

  // Get view-specific data
  const battleData = useViewData('battle-demo');
  console.log(battleData?.enemyId);
}
```

### Pre-Navigation Setup

The system allows you to run code before transitioning:

```typescript
const { goToBattleDemo, setViewData } = useRouterActions();

// Option 1: Set data first, then navigate
const prepareBattle = async () => {
  // Run async setup
  await loadEnemyData();

  // Set data
  setViewData('battle-demo', {
    enemyId: 'dragon',
    location: 'Castle',
    canFlee: false,
  });

  // Navigate
  goToBattleDemo({
    enemyId: 'dragon',
    location: 'Castle',
    canFlee: false,
  });
};

// Option 2: Just pass data during navigation
const quickBattle = () => {
  goToBattleDemo({
    enemyId: 'slime',
    location: 'Field',
    canFlee: true,
  });
};
```

### Transition Before Navigating

Cover transitions (`useViewTransitions` in `src/hooks/use-view-transitions.ts`) play a global animation that
ends fully opaque and resolve on its configured `duration` (`ANIMATION_CONFIG` in
`src/constants/animation-system.ts`). Navigate in the continuation so the route change lands under the cover;
the destination hard-cuts in. Lock the caller's input for the wait (the map pauses movement, the dungeon
flips to `awaiting-battle`, the training grounds latch a ref). Under reduced motion they resolve immediately.

```typescript
const { enterBattle, enterTown } = useViewTransitions();

setupBattle({ enemies, party });
await enterBattle(); // random pick from BATTLE_TRANSITION_ANIMATIONS, never the same twice in a row
goToBattleDemo({ enemyId, location });
```

## Navigation Methods

### Specific View Navigation

Each view has a dedicated type-safe method:

- `goToTownHub(data)` - Navigate to town hub (data required)
- `goToBattleDemo(data)` - Navigate to battle demo (data required)
- `goToMap(data)` - Navigate to a map (`{ mapId }` required)
- `goToDungeon(data)` - Navigate to a dungeon run (data required)
- `goToBattleRewards(data)` - Navigate to battle rewards; from a battle, replaces it in the history
- `goToDialogueDemo(data?)` - Navigate to dialogue demo
- `goToDebug(data?)` - Navigate to debug view

### History Modes

The router keeps a **history stack** of `{ view, data }` snapshots. Every `goToX` takes an optional
second argument, `{ history }`, that says what happens to the view being left:

- `push` (default) — the current view and its data are stacked, so `goBack()` returns to it exactly
  as it was. Round-trips of any depth work by construction, including a view opening itself
  (map → map: `goBack()` lands on the first map with its own `mapId`).
- `replace` — the current view is dropped; the stack is untouched. `goToBattleRewards` applies this
  itself when launched from a battle, so `goBack()` from the rewards skips the finished fight.
- `reset` — the stack is emptied. Used by the save loader: a load is a fresh timeline, and whatever
  the menu was opened over (a dungeon run, a dead battle) must not be reachable.

```typescript
goToMap({ mapId: save.currentMapId }, { history: 'reset' });
```

The stack is capped at `ROUTER_HISTORY_LIMIT` entries (`src/constants/routing.ts`); the oldest are
dropped past it. Real flows are three deep at most.

### Type-Safe Navigation Functions

All navigation goes through type-safe functions in `/src/lib/routing.ts`:

```typescript
import { goToBattleDemo } from '~/lib/routing';

// Pure function approach (used internally by store actions)
const result = goToBattleDemo(currentState, {
  enemyId: 'goblin',
  location: 'Cave',
  canFlee: true,
});
```

### Back Navigation

```typescript
const { goBack, goBackTo } = useRouterActions();

// Go to the previous view, restoring the data it had when the player left it
goBack();

// Unwind to the nearest occurrence of a view in the history, dropping everything above it.
// Fails (with a console warning) when the view was never navigated from — it never jumps.
goBackTo('map');
```

To hide a dead back button, read `canGoBack(state.router)` from `~/lib/routing`.

### Update Data Without Navigation

```typescript
const { setViewData } = useRouterActions();

// Update view data without navigating
setViewData('battle-demo', {
  enemyId: 'updated-enemy',
  location: 'New Location',
  canFlee: false,
});
```

For a view that is stacked rather than on screen, its history snapshot is updated too, so what you
set is what the player finds on `goBack()`.

## Type Safety

All view data is type-safe:

```typescript
// ✅ Type-safe - correct data structure
goToBattleDemo({
  enemyId: 'goblin',
  location: 'Cave',
  canFlee: true,
});

// ❌ Type error - missing required fields
goToBattleDemo({
  enemyId: 'goblin',
  // location and canFlee are missing
});

// ✅ Type-safe view data access
const battleData = useViewData('battle-demo');
if (battleData) {
  console.log(battleData.enemyId); // string
  console.log(battleData.canFlee); // boolean
}

// ✅ Required data with no null checks needed
const townHubData = useViewData('town-hub');
// townHubData is guaranteed to exist from INITIAL_ROUTER_STATE
console.log(townHubData!.innCost);
```

## Adding New Views

1. **Add view type** in `/src/types/routing.ts`:

```typescript
export type ViewType = 'town-hub' | 'battle-demo' | 'my-new-view'; // Add here
```

2. **Add view data interface**:

```typescript
export interface MyNewViewData {
  someProperty: string;
  anotherProperty: number;
}

export interface ViewDataMap {
  'town-hub': TownHubViewData;
  'battle-demo': BattleViewData;
  'my-new-view': MyNewViewData; // Add here
}
```

3. **Add type-safe navigation function** in `/src/lib/routing.ts`:

```typescript
export function goToMyNewView(
  currentState: RouterState,
  data: ViewDataMap['my-new-view'],
  options?: NavigationOptions,
): NavigationResult {
  return prepareNavigation(currentState, 'my-new-view', data, options);
}
```

4. **Add navigation method** in `/src/stores/slices/router.types.ts`:

```typescript
export interface RouterSlice {
  actions: {
    router: {
      // ... existing methods
      goToMyNewView: (data: ViewDataMap['my-new-view'], options?: NavigationOptions) => void;
    };
  };
}
```

5. **Implement method** in `/src/stores/slices/router.ts`:

```typescript
import {
  goToMyNewView as libGoToMyNewView,
  // ... other imports
} from '~/lib/routing';

goToMyNewView: (data, options) =>
  commit((state) => libGoToMyNewView(state.router, data, options), 'Navigation failed'),
```

(`commit` is the slice-local helper that applies a `NavigationResult` or warns.)

6. **Add case in GameScreen** (`/src/game-screen.tsx`):

```typescript
case 'my-new-view':
  const myNewViewData = useViewData('my-new-view');
  return <MyNewView data={myNewViewData!} />;
```

## Pure Functions

The routing logic is separated into pure functions in `/src/lib/routing.ts`:

**Core Functions:**

- `canNavigate()` - Validate navigation
- `prepareNavigation(currentState, targetView, viewData?, options?)` - Prepare navigation (push / replace / reset)
- `prepareGoBack(currentState)` - Pop the history, restoring the previous view's data
- `prepareGoBackTo(currentState, targetView)` - Unwind to the nearest occurrence of a view
- `prepareSetViewData(currentState, view, data)` - Update view data (and its snapshot, if stacked)
- `getViewData(state, view)` - Get view data
- `canGoBack(state)` - Whether the history has anything to pop

**Type-Safe Navigation Functions** (all take `options?: NavigationOptions` last):

- `goToTownHub(currentState, data)` - Navigate to town hub
- `goToBattleDemo(currentState, data)` - Navigate to battle demo
- `goToMap(currentState, data)` - Navigate to a map
- `goToDungeon(currentState, data)` - Navigate to a dungeon run
- `goToBattleRewards(currentState, data)` - Navigate to rewards; replaces a battle it is launched from
- `goToDialogueDemo(currentState, data?)` - Navigate to dialogue demo
- `goToDebug(currentState, data?)` - Navigate to debug

These functions are testable and don't mutate state directly.

## Persistence

The router is **not** saved. View data holds callbacks and map/dungeon definition references that
can't be serialized, and a load always resumes on the saved map with an empty history
(`loadSlot` in `src/hooks/use-save-game.ts`).

## Configuration

- `DEFAULT_VIEW` - Initial view on game start (currently `'debug'`)

Configurable in `/src/constants/routing.ts`.

## Example: Complex Navigation Flow

```typescript
function QuestSystem() {
  const { goToBattleDemo, goToDialogueDemo, goToTownHub } = useRouterActions();

  const startQuest = async () => {
    // 1. Show dialogue demo
    goToDialogueDemo();
  };

  const startBattle = () => {
    // 2. Go to battle
    goToBattleDemo({
      enemyId: 'quest-boss',
      location: 'Quest Dungeon',
      canFlee: false,
    });
  };

  const returnToTown = () => {
    // 3. Return to town with required data
    goToTownHub({
      innCost: { coins: 10, gold: 0, silver: 0, bronze: 0, copper: 0 },
      itemsForSell: ['potion'],
      onLeaveCallback: () => {},
    });
  };

  return (
    <button onClick={startQuest}>Start Quest</button>
  );
}
```

## Notes

- URL bar remains unchanged during navigation
- All navigation is controlled through the store
- Full history stack of `{ view, data }` snapshots; `goBack()` restores the previous view exactly
- View data persists across navigation
- Type-safe navigation prevents runtime errors
- `goBackTo()` unwinds; it never jumps to a view that isn't in the history
