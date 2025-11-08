# Routing Quick Reference

## Import

```typescript
import { useRouterActions, useCurrentView, useViewData } from '~/stores/game-store';
```

## Navigate to Views

```typescript
const {
  goToTownHub,
  goToBattle,
  goToMap,
  goToStore,
  goToInn,
  goToDialogue,
  goToLevelUp,
  goToInventory,
  goToDebug,
  goBack,
  goBackTo,
} = useRouterActions();

// Town Hub
goToTownHub({
  innCost: { coins: 10, gold: 0, silver: 0, bronze: 0, copper: 0 },
  itemsForSell: ['potion'],
});

// Battle (required data)
goToBattle({
  enemyId: 'moss-golem',
  location: 'Forest',
  canFlee: true,
});

// Map
goToMap({
  currentLocation: 'Town',
  availableLocations: ['Forest', 'Cave'],
});

// Store (required data)
goToStore({
  itemsForSale: ['potion', 'sword'],
  shopkeeper: 'merchant-npc',
});

// Inn (required data)
goToInn({
  cost: { coins: 10, gold: 0, silver: 0, bronze: 0, copper: 0 },
  innkeeper: 'innkeeper-npc',
});

// Dialogue (required data)
goToDialogue({
  sceneId: 'intro-scene',
  onComplete: () => console.log('Dialogue finished'),
});

// Level Up (required data)
goToLevelUp({
  characterId: 'warrior',
});

// Inventory
goToInventory();

// Debug
goToDebug();

// Go back
goBack();

// Go back to specific view
goBackTo('town-hub');
```

## Read Router State

```typescript
// Current view
const currentView = useCurrentView();

// Full router state
const router = useRouterState();
// router.currentView
// router.previousView
// router.history
// router.viewData

// View-specific data
const battleData = useViewData('battle');
// battleData?.enemyId
// battleData?.location
// battleData?.canFlee
```

## Common Patterns

### Pre-Navigation Setup

```typescript
const { goToBattle, setViewData } = useRouterActions();

const prepareBattle = async () => {
  // Load data
  const enemy = await loadEnemy('dragon');
  
  // Navigate with data
  goToBattle({
    enemyId: enemy.id,
    location: 'Castle',
    canFlee: false,
  });
};
```

### Conditional Navigation

```typescript
const { goToBattle, goToTownHub } = useRouterActions();
const resources = useResources();

const tryStartBattle = () => {
  if (resources.coins >= 10) {
    goToBattle({ enemyId: 'boss', location: 'Tower', canFlee: false });
  } else {
    goToTownHub();
  }
};
```

### Navigation Chain

```typescript
const { goToDialogue, goToBattle, goToTownHub } = useRouterActions();

const startQuest = () => {
  goToDialogue({
    sceneId: 'quest-intro',
    onComplete: () => {
      goToBattle({
        enemyId: 'quest-boss',
        location: 'Dungeon',
        canFlee: false,
      });
    },
  });
};
```

## View Types

```typescript
type ViewType =
  | 'town-hub'
  | 'battle'
  | 'map'
  | 'store'
  | 'inn'
  | 'dialogue'
  | 'level-up'
  | 'inventory'
  | 'debug';
```

## Notes

- ✅ All navigation is type-safe
- ✅ State persists to localStorage
- ✅ History automatically tracked
- ✅ URL bar never changes
- ✅ Can run async code before navigation
- ⚠️ Some views require data (battle, store, inn, dialogue, level-up)
