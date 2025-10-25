# Game Store

The game store is built with Zustand and uses a slice-based architecture for modularity.

## Features

- **DevTools Integration**: Redux DevTools support for debugging (dev mode only)
- **Persistence**: Automatic state persistence to localStorage with versioning
- **Immer Middleware**: Simplified state updates with draft mutations
- **Type-Safe**: Full TypeScript support with proper interfaces
- **Performance**: No barrel exports - direct imports for optimal TypeScript performance

## Usage

### Basic Usage

```typescript
import { useGameStore, useGold, useMoneyActions } from '~/stores/game-store';

function MyComponent() {
  // Get specific value with selector
  const gold = useGold();
  
  // Get all money actions
  const { addGold, removeGold, setGold } = useMoneyActions();
  
  return (
    <div>
      <p>Gold: {gold}</p>
      <button onClick={() => addGold(10)}>Add 10 Gold</button>
      <button onClick={() => removeGold(5)}>Remove 5 Gold</button>
    </div>
  );
}
```

### Using Pure Functions

```typescript
import { canAfford, deductCost } from '~/lib/money';
import { useMoneyState, useMoneyActions } from '~/stores/game-store';

function ShopItem({ cost }: { cost: { gold: number } }) {
  const money = useMoneyState();
  const { setGold } = useMoneyActions();
  
  const affordable = canAfford(money, cost);
  
  const handlePurchase = () => {
    if (affordable) {
      const newResources = deductCost(money, cost);
      setGold(newResources.gold);
      // Process purchase...
    }
  };
  
  return (
    <button 
      onClick={handlePurchase} 
      disabled={!affordable}
    >
      Buy ({cost.gold} gold)
    </button>
  );
}
```

### Accessing the Full Store

```typescript
import { useGameStore } from '~/stores/game-store';

function AnyComponent() {
  // Access any part of the store
  const store = useGameStore();
  
  // Use specific selectors for better performance
  const gold = useGameStore(state => state.money.gold);
}
```

## Store Structure

```
stores/
├── slices/
│   ├── money.ts          # Money slice implementation
│   └── money.types.ts    # Money slice types
├── game-store.ts         # Main store with middleware
└── README.md             # This file
```

### Current Slices

- **Money Slice** (`slices/money.ts`): Manages the game's currency (gold)

### Adding New Slices

1. Create type definitions in `slices/your-slice.types.ts`
2. Implement the slice in `slices/your-slice.ts`
3. Add the slice to `GameStore` type in `game-store.ts`
4. Merge the slice in the store creator

Example:

```typescript
// slices/your-slice.types.ts
import type { BaseSlice } from '../types';

export interface YourSlice extends BaseSlice {
  yourState: YourState;
  actions: {
    yourActions: YourActions;
  };
}

// slices/your-slice.ts
import type { YourSlice } from './your-slice.types';
import { INITIAL_YOUR_STATE } from '../../constants/your-slice';

export const createYourSlice = (set: any): YourSlice => ({
  yourState: INITIAL_YOUR_STATE,
  actions: {
    yourActions: {
      someAction: () => set((state: YourSlice) => {
        // mutate state with immer
        state.yourState.someValue = newValue;
      }, false, 'your/someAction'),
    },
  },
});

// game-store.ts
import type { YourSlice } from './slices/your-slice.types';
import { createYourSlice } from './slices/your-slice';

export type GameStore = MoneySlice & YourSlice;

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...createMoneySlice(set),
        ...createYourSlice(set),
      })),
      // ... config
    )
  )
);
```

## Middleware

### DevTools

- Enabled only in development mode
- Each action includes a descriptive name for debugging (e.g., `'money/addGold'`)

### Persist

- **Version**: 1 (increment when making breaking changes to state structure)
- **Storage**: localStorage
- **Key**: `fantasy-puzzle-rpg-store`
- State is automatically rehydrated on app load

### Immer

- Allows direct mutation of draft state in reducers
- Simplifies complex nested state updates
- Automatically produces immutable updates

## Best Practices

1. **Use Selectors**: Create custom selector hooks for commonly accessed state
2. **Keep Logic Pure**: Business logic should be in `/lib` as pure functions
3. **Action Naming**: Use descriptive action names with slice prefix (e.g., `'money/addGold'`)
4. **Validation**: Always validate inputs in actions (e.g., `validateGoldAmount`)
5. **Reset Methods**: Include `reset()` in slices for cleanup/testing
