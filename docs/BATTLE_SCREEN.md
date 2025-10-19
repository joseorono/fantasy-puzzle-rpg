# Match-3 RPG Battle Screen

## Overview
A cozy fantasy Match-3 RPG battle screen with pixel art aesthetics inspired by Stardew Valley, Fields of Mistria, and Katana Zero.

## Features

### 🎮 Split-View Layout
- **Top Half**: Enemy display with Moss Golem and party health bar
- **Bottom Half**: Four chibi-style party members with skill cooldowns
- **Center**: Interactive Match-3 game board

### 🎨 Visual Design
- **Aesthetic**: Cozy fantasy with detailed pixel art style
- **Color Scheme**: Vibrant, warm colors with magical atmosphere
- **UI Elements**: Sharp, clean vector overlays with blocky pixel fonts
- **Effects**: Retro screen scanlines, glowing orbs, animated backgrounds

### 👥 Party Characters
Each character is color-coded to match their orbs:
- **Warrior** (Blue) - Sword icon, high HP
- **Rogue** (Green) - Lightning icon, fast cooldown
- **Mage** (Purple) - Sparkles icon, powerful abilities
- **Healer** (Yellow) - Heart icon, support skills

### 🔮 Match-3 Board
- **Orb Types**: Blue, Green, Purple, Yellow, and Gray (neutral)
- **Board Size**: 8x6 grid
- **Match Detection**: Automatic highlighting of 3+ matches
- **Special Combos**: 5-match combos show multiplier effects
- **Interactions**: Click to select, click adjacent orb to swap

### 🎯 Game Mechanics
- **Health Bars**: Party collective health and enemy health with pixel borders
- **Skill Cooldowns**: Visual cooldown bars below each character
- **Skill Ready**: Glowing animation when skills are ready to use
- **Turn Counter**: Displayed in header
- **Score Tracking**: Real-time score display

### 🛠️ Tech Stack
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Jotai** for state management
- **8bitcn** UI components (custom pixel art buttons)
- **Lucide React** for icons
- **Press Start 2P** font from Google Fonts

## File Structure
```
src/
├── components/
│   └── battle/
│       ├── enemy-display.tsx      # Top half - enemy and party health
│       ├── party-display.tsx      # Bottom half - party sprites
│       ├── match3-board.tsx       # Match-3 game board
│       ├── game-over-modal.tsx    # Victory/defeat modal
│       └── damage-number.tsx      # Floating damage indicators
├── stores/
│   └── battle-store.ts            # Jotai atoms for battle state
├── types/
│   ├── rpg-elements.ts            # Core RPG types (characters, enemies, orbs)
│   ├── battle.ts                  # Battle-specific types
│   ├── components.ts              # Component prop types
│   └── index.ts                   # Type re-exports
├── constants/
│   ├── game.ts                    # Game configuration and initial data
│   └── ui.ts                      # UI styling constants
├── views/
│   └── battle-screen.tsx          # Main battle screen layout
└── styles/
    └── pixel-font.css             # Pixel art styling (now in index.css)
```

## State Management
Using Jotai atoms for reactive state:
- `battleStateAtom` - Main battle state
- `partyAtom` - Party characters (CharacterData[])
- `enemyAtom` - Enemy data (EnemyData)
- `boardAtom` - Match-3 board (Orb[][])
- `selectedOrbAtom` - Currently selected orb
- `selectOrbAtom` - Action to select an orb
- `swapOrbsAtom` - Action to swap orbs
- `damagePartyAtom` - Action to damage party
- `damageEnemyAtom` - Action to damage enemy
- `resetBattleAtom` - Reset battle state
- `gameStatusAtom` - Game status ('playing' | 'won' | 'lost')
- `lastDamageAtom` - Last damage dealt
- `lastMatchedTypeAtom` - Last matched orb type

## Type System

### Core RPG Types (`rpg-elements.ts`)
- `OrbType` - Orb type identifiers ('blue' | 'green' | 'purple' | 'yellow' | 'gray')
- `CharacterClass` - Character classes ('warrior' | 'rogue' | 'mage' | 'healer')
- `BaseStats` - Shared stats for characters and enemies (id, name, HP)
- `CharacterData` - Character-specific stats (extends BaseStats)
- `EnemyData` - Enemy-specific stats (extends BaseStats)

### Battle Types (`battle.ts`)
- `ActionTarget` - Target of actions ('party' | 'enemy')
- `Orb` - Match-3 orb data (id, type, position)
- `Match` - Match detection result
- `BattleStatus` - Battle state ('playing' | 'won' | 'lost')
- `BattleState` - Complete battle state

## Customization
- Modify `INITIAL_PARTY` in `constants/game.ts` to change party composition
- Adjust `INITIAL_ENEMY` to change enemy stats
- Update `BOARD_ROWS` and `BOARD_COLS` to change board size
- Customize `ORB_TYPES` array to add/remove orb types
- Update styling in `constants/ui.ts` for colors and effects

## Implemented Features
✅ Damage calculation and combat system
✅ Orb falling/gravity animations
✅ Particle effects for matches
✅ Win/lose conditions
✅ Game over modal with restart
✅ Enemy attack timer
✅ Floating damage numbers
✅ Health bar animations

## Future Enhancements
- Actual pixel art sprites for characters and enemies
- Sound effects and background music
- Character-specific special abilities
- Healing mechanics
- Multiple enemy types with different attack patterns
- Level progression and difficulty scaling
- Equipment and stat upgrades
- Save/load game state
