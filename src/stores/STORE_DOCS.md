# Game Store

The game store is built with Zustand and uses a slice-based architecture for modularity.

## Architecture

- **Zustand (`src/stores/game-store.ts`)**: Primary global store managing the 8 core slices.
- **Jotai (`src/stores/battle-atoms.ts`, `dungeon-atoms.ts`, `pause-menu-atoms.ts`)**: Ephemeral combat, dungeon run, and pause menu UI state.
- **DevTools Integration**: Redux DevTools support for debugging (dev mode only).
- **Persistence**: Explicit save slots (3 manual + autosave), not middleware — see `docs/SAVE_LOAD_SYSTEM.md`.
- **Immer Middleware**: Simplified state updates with draft mutations.
- **Type-Safe**: Full TypeScript support with slice-specific interfaces.
- **Performance**: Direct imports and focused selector hooks.

## Store Slices

```
src/stores/
├── slices/
│   ├── resources.ts / resources.types.ts           # Currency & material bars (coins, gold, silver, iron, copper)
│   ├── party.ts / party.types.ts                   # Hero party members, current HP, stats, and unlocked skill IDs
│   ├── inventory.ts / inventory.types.ts           # Equipment and consumable items, rarity-keyed stacks
│   ├── router.ts / router.types.ts                 # Type-safe view router and navigation history
│   ├── map-progress.ts / map-progress.types.ts     # Completed nodes and character map positions
│   ├── floor-loot-progress.ts / .types.ts          # Floor loot pickup collection state
│   ├── crafting.ts / crafting.types.ts             # Crafting pity counters and bad-luck protection
│   └── dungeon-progress.ts / .types.ts             # Dungeon completion records and replay tracking
├── game-store.ts                                   # Main Zustand store assembly
├── battle-atoms.ts                                 # Jotai atoms for combat & match-3 board
├── dungeon-atoms.ts                                # Jotai atoms for active dungeon runs
├── pause-menu-atoms.ts                             # Jotai atoms for pause menu tabs & audio settings
└── save-atoms.ts                                   # Jotai atoms for save slots & indicator
```

## Usage

### Reading Store State with Custom Hooks

```typescript
import {
  useResources,
  useParty,
  useInventory,
  useCurrentView,
  useRouterActions,
} from '~/stores/game-store';

function MyComponent() {
  const resources = useResources();
  const party = useParty();
  const { items } = useInventory();
  const currentView = useCurrentView();
  const { goToTownHub, goToBattleDemo } = useRouterActions();

  return (
    <div>
      <p>Coins: {resources.coins}</p>
      <p>Party Size: {party.length}</p>
      <button onClick={() => goToBattleDemo({ enemyId: 'moss-golem' })}>
        Battle
      </button>
    </div>
  );
}
```

### Pure Functions for Business Logic

State updates and validation should use pure helper functions from `src/lib/`:

```typescript
import { canAfford, deductCost } from '~/lib/resources';
import { useResources, useResourceActions } from '~/stores/game-store';

function ShopPurchaseButton({ cost }: { cost: Resources }) {
  const resources = useResources();
  const { reduceResources } = useResourceActions();

  const handleBuy = () => {
    if (canAfford(resources, cost)) {
      reduceResources(cost);
      // Process item grant...
    }
  };

  return (
    <button onClick={handleBuy} disabled={!canAfford(resources, cost)}>
      Buy
    </button>
  );
}
```

## Middleware & Reset Rules

### DevTools
- Enabled only in development mode.
- Actions use descriptive names with slice prefixes (e.g., `'resources/addCoins'`, `'party/updateHp'`).

### Persistence & Save Hydration
Progress is serialized across the 7 persistent gameplay slices (router is excluded because it contains callback refs).
- `hydrateGameFromSave(save)` — Overwrites slices in one atomic `setState`.
- `resetGameState()` — Clean new game reset cloning initial constants.

### Immer
- Reducers directly mutate draft state safely.
- Produce immutable updates without manual spreading.

### No Per-Slice Reset
Slices are spread into one store object, so a top-level `reset()` in individual slices would collide. Whole-game resets must go through `resetGameState()` in `src/stores/game-store.ts`.

