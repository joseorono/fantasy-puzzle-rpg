# Level Up Screen Components

This directory contains components for the Level Up Screen feature.

## Components

### `LevelUpView` (`/src/views/level-up-view.tsx`)
Main view component for the level up screen. Displays a three-column layout:
- **Left**: Character info, progress bars (EXP, HP), and derived stats
- **Center**: Character portrait and stat chips showing current/preview values
- **Right**: Stat allocation controls with +/- buttons

**Props:**
- `character: CharacterData` - The character to level up
- `availablePoints: number` - Number of stat points available to allocate
- `onConfirm: (allocatedStats: CoreRPGStats) => void` - Callback when user confirms stat allocation
- `onBack: () => void` - Callback when user exits the screen

### `DerivedStatsDisplay`
Displays calculated stats that are derived from base stats:
- Max HP (from VIT)
- Skill Cooldown Fill Rate (from SPD)
- Skill Cooldown Fill Time (from SPD)
- Attack Power / Healing Power (from POW)

Shows real-time preview with delta indicators when stats are pending allocation.

**Props:**
- `character: CharacterData` - The character data
- `previewStats: { pow, vit, spd }` - Preview stats including pending allocations

## Styling

Styles are defined in `/src/styles/level-up-screen.css` and imported globally via `index.css`.

The design features:
- Dark fantasy theme with golden accents
- Responsive three-column grid layout
- Smooth transitions and hover effects
- Color-coded stats (POW: red, VIT: green, SPD: blue)
- Progress bars and stat meters

## Testing

The level-up screen is tested as part of the battle rewards flow in `BattleRewardsScreen`. Use the "Battle Rewards" button in the debug/router test view to trigger the full rewards flow (items, EXP, then level-ups).

## Dependencies

- `~/lib/rpg-calculations.ts` - For calculating derived stats
- `~/lib/leveling-system.ts` - For level up logic
- `~/types/rpg-elements.ts` - Type definitions

## Usage Example

```tsx
import { LevelUpView } from '~/views/level-up-view';

function MyComponent() {
  const [character, setCharacter] = useState<CharacterData>({...});
  const availablePoints = 5;

  function handleConfirm(allocatedStats: CoreRPGStats) {
    // Apply stats to character
    setCharacter(prev => ({
      ...prev,
      stats: {
        pow: prev.stats.pow + allocatedStats.pow,
        vit: prev.stats.vit + allocatedStats.vit,
        spd: prev.stats.spd + allocatedStats.spd,
      }
    }));
  }

  return (
    <LevelUpView
      character={character}
      availablePoints={availablePoints}
      onConfirm={handleConfirm}
      onBack={() => console.log('Back pressed')}
    />
  );
}
```

## Notes

- The component uses React state for pending allocations (no atoms/global state)
- All calculations are performed in real-time as the user adjusts stats
- The component follows the user's coding rules (function keyword, interfaces, etc.)
- Portrait images are loaded from `/assets/portraits/`
