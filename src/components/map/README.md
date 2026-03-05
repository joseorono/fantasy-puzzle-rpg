# Map System Components

A keyboard-controlled map system with React 19 Compiler optimizations.

## Components

### MapBackground
Renders the static map grid from a `MapData` constant. Since the map data is constant, React Compiler will automatically cache this component and only re-render when the map changes.

**Props:**
- `mapData: MapData` - 2D array of tile types

### MapCharacter
Renders a character sprite that can be moved with keyboard controls.

**Props:**
- `charLocation: CharacterPosition` - Current character position `{ row, col }`
- `mapData: MapData` - Map data for collision detection
- `onMove?: (newPosition: CharacterPosition) => void` - Callback when character moves

**Controls:**
- Arrow Keys or WASD to move
- Automatically prevents movement into non-walkable tiles

## Usage Example

```tsx
import { useState } from 'react';
import type { CharacterPosition, MapData } from '~/types/map';
import { MAP_1 } from '~/constants/maps';
import { MapBackground, MapCharacter } from '~/components/map';

function Map1() {
  const mapData: MapData = MAP_1;
  const [charLocation, setCharLocation] = useState<CharacterPosition>({ row: 0, col: 1 });

  function handleMove(newPosition: CharacterPosition) {
    setCharLocation(newPosition);
    console.log('Character moved to:', newPosition);
  }

  return (
    <div className="relative">
      <MapCharacter charLocation={charLocation} mapData={mapData} onMove={handleMove} />
      <MapBackground mapData={mapData} />
    </div>
  );
}
```

## React 19 Compiler Optimization

Since `MapData` is defined as a `const` with `as const`, the React Compiler will:
1. Detect that the map data never changes
2. Automatically cache the `MapBackground` component
3. Only re-render when absolutely necessary

This means you get optimal performance without manual `useMemo` or `React.memo` calls.

## Tile Types

- **grass** 🌱 - Walkable
- **road** 🟫 - Walkable
- **water** 💧 - Blocked
- **forest** 🌲 - Blocked
- **mountain** ⛰️ - Blocked
- **town** 🏘️ - Walkable
- **battle** ⚔️ - Walkable
- **boss** 👹 - Walkable
- **dungeon** 🏰 - Walkable

## Creating New Maps

Define maps in `src/constants/maps.ts`:

```ts
export const MY_MAP: MapData = [
  [GRASS, ROAD, ROAD, ROAD, TOWN],
  [GRASS, ROAD, GRASS, GRASS, GRASS],
  [GRASS, ROAD, BATTLE, GRASS, GRASS],
  [GRASS, ROAD, ROAD, ROAD, BOSS],
] as const;
```

The `as const` assertion is crucial for React Compiler optimization.
