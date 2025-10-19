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
│       └── match3-board.tsx       # Match-3 game board
├── stores/
│   └── battle-store.ts            # Jotai atoms for battle state
├── types/
│   └── battle.ts                  # TypeScript interfaces
├── views/
│   └── battle-screen.tsx          # Main battle screen layout
└── styles/
    └── pixel-font.css             # Pixel art styling (now in index.css)
```

## State Management
Using Jotai atoms for reactive state:
- `battleStateAtom` - Main battle state
- `partyAtom` - Party characters
- `enemyAtom` - Enemy data
- `boardAtom` - Match-3 board
- `selectedOrbAtom` - Currently selected orb
- `selectOrbAtom` - Action to select an orb
- `swapOrbsAtom` - Action to swap orbs
- `resetBattleAtom` - Reset battle state

## Customization
- Modify `initialParty` in `battle-store.ts` to change party composition
- Adjust `initialEnemy` to change enemy stats
- Update `createInitialBoard()` to change board size
- Customize colors in `characterColors` and `orbColorClasses`

## Future Enhancements
- Actual pixel art sprites for characters and enemies
- Orb falling/gravity animations
- Damage calculation and combat system
- Sound effects and background music
- Particle effects for matches
- Special abilities and power-ups
- Multiple enemy types
- Level progression
