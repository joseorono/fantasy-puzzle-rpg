# Combat System Documentation

## Overview
The battle screen now features a fully functional combat system with enemy attacks, win/lose conditions, and visual feedback.

## Combat Mechanics

### Enemy Attack System
- **Attack Interval**: Enemy attacks every **4 seconds**
- **Attack Damage**: 25 HP per attack (distributed across all living party members)
- **Visual Timer**: Red pulsing countdown timer in the header shows "ATTACK IN: Xs"
- **Auto-pause**: Timer stops when game is over (won/lost)

### Player Attack System
- **Match-3 Damage**: Making matches deals damage to the enemy
  - **3-4 Match**: 10 damage
  - **5+ Match**: 20 damage (2x multiplier with "5x COMBO!" indicator)
- **Damage Numbers**: Animated floating damage numbers appear when damage is dealt
  - Red numbers for enemy damage
  - Orange numbers for party damage
- **Orb Removal**: Matched orbs disappear with animation and new orbs fall from the top
  - Glow effect on matched orbs (400ms)
  - Scale-down and fade-out animation (200ms)
  - Gravity effect: remaining orbs fall down
  - New random orbs spawn at the top to refill the board

### Win/Lose Conditions

#### Victory (Won)
- Triggered when enemy HP reaches 0
- Shows golden victory modal with trophy icon
- Message: "VICTORY! You defeated the enemy!"
- Celebratory particle effects

#### Defeat (Lost)
- Triggered when party collective HP reaches 0
- Shows red defeat modal with skull icon
- Message: "DEFEAT! Your party was defeated!"
- Dark, somber presentation

### Game Over Modal
- **Appearance**: Full-screen overlay with pixel art styled modal
- **Features**:
  - Large animated icon (trophy for win, skull for loss)
  - Bold pixel font title
  - Encouraging/commiserating message
  - "NEW GAME" button to restart the battle
- **Restart**: Clicking "NEW GAME" resets:
  - All party members to full HP
  - Enemy to full HP
  - New randomized Match-3 board
  - Turn counter to 1
  - Score to 0
  - Attack timer restarts

## Visual Feedback

### Damage Numbers
- **Location**: Float up from the center of the target (enemy or party section)
- **Animation**: 1-second float-up animation with fade out
- **Styling**: Large pixel font with heavy shadow for readability
- **Color Coding**:
  - Enemy damage: Red (#EF4444)
  - Party damage: Orange (#F97316)

### Attack Timer
- **Display**: Header shows countdown in seconds
- **Styling**: Red background with pulsing animation
- **Icon**: Crossed swords icon
- **Reset**: Automatically resets to 8 seconds after each attack

### Health Bars
- **Party Health**: Collective health bar at top of enemy section
  - Green when >50%
  - Yellow when 25-50%
  - Red when <25%
- **Enemy Health**: Large health bar below enemy sprite
  - Red gradient with segmented appearance
  - Shows current/max HP numbers

## Technical Implementation

### State Management (Jotai Atoms)
```typescript
// New atoms added:
- gameStatusAtom: 'playing' | 'won' | 'lost'
- lastDamageAtom: { amount, target, timestamp }
- damagePartyAtom: Action to damage party
- damageEnemyAtom: Action to damage enemy
```

### Components Added
1. **GameOverModal** (`src/components/battle/game-over-modal.tsx`)
   - Victory/defeat screen with restart option
   
2. **DamageNumber** (`src/components/battle/damage-number.tsx`)
   - Animated floating damage indicators

### Updated Components
1. **BattleScreen** (`src/views/battle-screen.tsx`)
   - Enemy attack timer with useEffect hooks
   - Countdown display in header
   - Game over modal integration
   - Damage number overlays

2. **Match3Board** (`src/components/battle/match3-board.tsx`)
   - Damage calculation on matches
   - Combo multiplier for 5+ matches

3. **Battle Store** (`src/stores/battle-store.ts`)
   - Game status tracking
   - Damage system implementation
   - Win/lose detection
   - Enhanced reset functionality

### Type Updates
```typescript
// Enemy interface now includes:
interface Enemy {
  attackInterval?: number;  // 8000ms
  attackDamage?: number;    // 25 HP
}

// BattleState interface now includes:
interface BattleState {
  gameStatus: 'playing' | 'won' | 'lost';
  lastDamage: { amount, target, timestamp } | null;
}
```

## Gameplay Flow

1. **Battle Start**
   - Party at full HP (410 total)
   - Enemy at full HP (300)
   - 8-second attack timer begins

2. **During Battle**
   - Player makes matches to damage enemy
   - Enemy attacks every 8 seconds
   - Health bars update in real-time
   - Damage numbers show feedback

3. **Battle End**
   - When enemy HP = 0: Victory modal appears
   - When party HP = 0: Defeat modal appears
   - Attack timer stops
   - Player can click "NEW GAME" to restart

## Balance Notes

### Current Stats
- **Party Total HP**: 410 (Warrior: 120, Rogue: 90, Mage: 80, Healer: 100)
- **Enemy HP**: 300
- **Enemy Attack**: 25 damage every 8 seconds
- **Player Damage**: 10-20 per match

### Time to Defeat
- **Without healing**: ~16-17 enemy attacks to lose (64-68 seconds)
- **To win**: Need 15-30 matches depending on combos
- **Average battle**: 40-60 seconds

## Future Enhancements
- Character-specific abilities when skills are ready
- Healing orbs that restore party HP
- Critical hits and damage variance
- Multiple enemy types with different patterns
- Boss battles with special mechanics
- Difficulty levels
- Sound effects for attacks and victories
