# Routing Quick Reference

## Import

```typescript
import { useRouterActions, useCurrentView, useViewData, useRouterState } from '~/stores/game-store';
```

## Navigate to Views

```typescript
const {
  goToTownHub,
  goToBattleDemo,
  goToMap,
  goToDungeon,
  goToDialogueDemo,
  goToDebug,
  goToBattleRewards,
  goBack,
  goBackTo,
} = useRouterActions();

// Town Hub (data required)
goToTownHub({
  ...DEFAULT_TOWN_HUB_DATA,
  townName: 'Oakvale',
  onLeaveCallback: () => goBack(),
});

// Battle (data required) — put the encounter into the battle atoms first
goToBattleDemo({ enemyId: 'moss-golem', location: 'Forest', bgImage: '/assets/bg/forest.png' });

// Map — `mapId` selects the definition from MAP_REGISTRY
goToMap({ mapId: 'map-00-apprentice-forge' });

// Dungeon run
goToDungeon({ dungeon, isReplay: false });

// Rewards — launched from a battle it replaces the battle in the history
goToBattleRewards({ lootTable, expReward: 120 });

// Demo / debug views
goToDialogueDemo();
goToDebug();

// Back to the previous view, with the data it had when the player left it
goBack();

// Unwind to the nearest occurrence of a view in the history (fails if it isn't there)
goBackTo('map');
```

## History Modes

Every `goToX` accepts an optional second argument that controls what happens to the view being left:

```typescript
goToMap({ mapId }); // push (default): stack the current view so goBack() returns to it
goToMap({ mapId }, { history: 'replace' }); // drop the current view, keep the stack
goToMap({ mapId }, { history: 'reset' }); // empty the stack (loading a save)
```

Round-trips of any depth work by construction: town → battle → `goBack()` → town → `goBack()` → map.
The only two places that need a mode are the save loader (`reset`) and the rewards screen, which
applies `replace` itself when launched from a battle.

## Read Router State

```typescript
// Current view
const currentView = useCurrentView();

// Full router state
const router = useRouterState();
// router.currentView
// router.history   — [{ view, data }, …], oldest first
// router.viewData  — live data per view

// View-specific data
const battleData = useViewData('battle-demo');
// battleData?.enemyId
// battleData?.bgImage
```

## Common Patterns

### Round-trip that reopens where it started

```typescript
// The Training Grounds: tell the hub where to reopen, then leave. The hub's own history
// entry is stacked by goToBattleDemo and restored by the battle's goBack().
setViewData('town-hub', { ...townHubData, initialLocation: 'training-grounds' });
goToBattleDemo({ enemyId: TRAINING_DUMMY.id, location: 'Training Grounds' });
```

### Hide a dead back button

```typescript
import { canGoBack } from '~/lib/routing';

const canLeave = useGameStore((state) => canGoBack(state.router));
<BackButton onClick={canLeave ? goBack : undefined} />;
```

### Update data without navigating

```typescript
const { setViewData } = useRouterActions();
setViewData('town-hub', { ...townHubData, initialLocation: undefined });
// For a view that is stacked (not on screen), its history snapshot is updated too.
```

## View Types

```typescript
type ViewType = 'town-hub' | 'battle-demo' | 'map' | 'dialogue-demo' | 'debug' | 'battle-rewards' | 'dungeon';
```

## Notes

- ✅ All navigation is type-safe
- ✅ Full history stack; `goBack()` restores the previous view's data
- ✅ URL bar never changes
- ✅ Can run async code before navigation
- ⚠️ The router is **not** saved; loads always resume on the map with an empty history
- ⚠️ Some views require data (town-hub, battle-demo, map, dungeon, battle-rewards)
