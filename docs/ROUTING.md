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
- `battle-demo` - Battle demo screen
- `map-demo` - Map demo
- `dialogue-demo` - Dialogue demo
- `level-up` - Level up screen
- `inventory` - Inventory management
- `debug` - Debug/test view

## Usage

### Basic Navigation

```typescript
import { useRouterActions } from '~/stores/game-store';

function MyComponent() {
  const { goToBattle, goToTownHub, goBack } = useRouterActions();

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
  console.log(router.previousView);

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

## Navigation Methods

### Specific View Navigation

Each view has a dedicated type-safe method:

- `goToTownHub(data)` - Navigate to town hub (data required)
- `goToBattleDemo(data)` - Navigate to battle demo (data required)
- `goToMapDemo(data?)` - Navigate to map demo
- `goToDialogueDemo(data?)` - Navigate to dialogue demo
- `goToLevelUp(data)` - Navigate to level up (data required)
- `goToInventory(data?)` - Navigate to inventory
- `goToDebug(data?)` - Navigate to debug view

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

// Go to previous view (recommended)
goBack();

// Jump directly to a specific view (use with caution)
// WARNING: Can cause illogical navigation flows
// Prefer direct navigation functions instead
goBackTo('town-hub');
```

### Update Data Without Navigation

```typescript
const { setViewData } = useRouterActions();

// Update view data without navigating
setViewData('battle', {
  enemyId: 'updated-enemy',
  location: 'New Location',
  canFlee: false,
});
```

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
export type ViewType =
  | 'town-hub'
  | 'battle-demo'
  | 'my-new-view'; // Add here
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
  data: ViewDataMap['my-new-view']
): NavigationResult {
  return prepareNavigation(currentState, 'my-new-view', data);
}
```

4. **Add navigation method** in `/src/stores/slices/router.types.ts`:

```typescript
export interface RouterSlice {
  actions: {
    router: {
      // ... existing methods
      goToMyNewView: (data: ViewDataMap['my-new-view']) => void;
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

goToMyNewView: (data) => {
  set((state: RouterSlice) => {
    const result = libGoToMyNewView(state.router, data);
    if (result.success && result.nextState) {
      state.router = result.nextState;
    } else {
      console.warn(`Navigation failed: ${result.error}`);
    }
  });
},
```

6. **Add case in GameScreen** (`/src/game-screen.tsx`):

```typescript
case 'my-new-view':
  const myNewViewData = useViewData('my-new-view');
  return <MyNewView data={myNewViewData!} />;
```

## Pure Functions

The routing logic is separated into pure functions in `/src/lib/routing.ts`:

**Core Functions:**
- `canNavigate(currentState, targetView)` - Validate navigation
- `prepareNavigation(currentState, targetView, viewData)` - Prepare navigation
- `prepareGoBack(currentState)` - Prepare back navigation
- `prepareGoBackTo(currentState, targetView)` - Jump to specific view (use with caution)
- `prepareSetViewData(currentState, view, data)` - Update view data
- `getViewData(state, view)` - Get view data
- `canGoBack(state)` - Check if can go back

**Type-Safe Navigation Functions:**
- `goToTownHub(currentState, data)` - Navigate to town hub
- `goToBattleDemo(currentState, data)` - Navigate to battle demo
- `goToMapDemo(currentState, data?)` - Navigate to map demo
- `goToDialogueDemo(currentState, data?)` - Navigate to dialogue demo
- `goToLevelUp(currentState, data)` - Navigate to level up
- `goToInventory(currentState, data?)` - Navigate to inventory
- `goToDebug(currentState, data?)` - Navigate to debug

These functions are testable and don't mutate state directly.

## Persistence

Router state is automatically persisted to localStorage along with other game state. Navigation history and view data will be restored on page reload.

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
- Only tracks `previousView` (no full history array)
- View data persists across navigation
- Type-safe navigation prevents runtime errors
- `goBackTo()` should be used sparingly - prefer direct navigation functions
