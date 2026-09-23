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
- **Large Matches**: 5+ match size shows multiplier effects
- **Interactions**: Click to select, click adjacent orb to swap

### 🎯 Game Mechanics
- **Health Bars**: Party collective health and enemy health with pixel borders
- **Skill Cooldowns**: Visual cooldown bars below each character
- **Skill Ready**: Glowing animation when skills are ready to use
- **Turn Counter**: Displayed in header
- **Score Tracking**: Real-time score display

### 🛠️ Tech Stack
- **React 19** with TypeScript (strict mode), React Compiler
- **Tailwind CSS 4** for styling; CSS in `src/styles/` for pixel art and complex effects
- **Jotai** for battle/combat state exclusively (Zustand covers everything else)
- **Radix UI** primitives (slider, tooltip) restyled pixel-art via `components/ui/8bit/`
- **Lucide React** for icons
- **Press Start 2P** font (see `src/index.css`)

## File Structure
```
src/
├── components/
│   └── battle/
│       ├── enemy-display.tsx          # Enemy panel — supports multiple enemies, targeting
│       ├── party-display.tsx          # Party sprites, HP, skill cooldowns
│       ├── match3-board.tsx           # Match-3 game board
│       ├── battle-top-bar.tsx         # Turn/score/mode header (incl. "SPARRING" in training mode)
│       ├── battle-hp-bar.tsx          # Shared HP bar (party + enemy)
│       ├── enemy-poise-bar.tsx        # Thin enemy poise (posture) bar under the HP bar
│       ├── battle-item-bar.tsx        # Consumable battle items, SPD-scaled shared cooldown
│       ├── battle-callout.tsx         # Combo/reshuffle/preemptive-strike callouts ("Flinched!" / "Staggered!" live in enemy-display)
│       ├── battle-over-modal.tsx      # Victory/defeat modal
│       ├── battle-pause-overlay.tsx   # Pause overlay (includes Leave button in training mode)
│       ├── battle-rating-screen.tsx   # Arcade star-rating screen
│       ├── damage-number.tsx          # Floating damage indicators
│       ├── skill-activation-effect.tsx / skill-burst-overlay.tsx  # Ultimate skill VFX
│       ├── preemptive-strike-indicator.tsx / board-reshuffle-indicator.tsx
│       └── training-dummy-readout.tsx # Total damage/DPS readout, sparring mode only
├── stores/
│   └── battle-atoms.ts                # Jotai atoms for battle state (see STORE_DOCS.md)
├── types/
│   ├── rpg-elements.ts                # Core RPG types (characters, enemies, orbs)
│   ├── battle.ts                      # Battle-specific types
│   ├── components.ts                  # Component prop types
│   └── index.ts                       # Type re-exports
├── constants/
│   ├── board.ts                       # Board size, orb types, match/bomb rules
│   ├── party.ts                       # INITIAL_PARTY, damage/scoring/leveling constants
│   ├── enemies/                       # Enemy definitions, by world (e.g. `world-00/`)
│   ├── training-grounds.ts            # Training dummy enemy, respec costs
│   └── ui.ts                          # Orb color/glow classes, HP threshold colors
├── views/
│   └── battle-screen.tsx              # Main battle screen layout
└── styles/
    ├── battle-layout.css / battle-elements.css / battle-top-bar.css
    └── battle-over-modal.css / battle-rating-screen.css / battle-rewards-screen.css
```

## State Management
Battle state lives entirely in Jotai (`src/stores/battle-atoms.ts`), backed by a single `battleStateAtom: BattleState`. Representative atoms (see `battle-atoms.ts` and `src/stores/STORE_DOCS.md` for the full list):
- `battleStateAtom` - Main battle state
- `partyAtom` / `enemiesAtom` - Party and enemies (`enemies` is an array — battles support multiple simultaneous enemies)
- `selectedEnemyIdAtom` / `selectEnemyAtom` - Targeting the active enemy
- `boardAtom` / `selectedOrbAtom` / `selectOrbAtom` / `swapOrbsAtom` - Match-3 board and orb interaction
- `guardAtom` / `addGuardAtom` / `tickGuardDecayAtom` - Party Guard meter
- `damagePartyAtom` / `damageEnemyAtom` / `healPartyAtom` - Damage/heal resolution
- `gameStatusAtom` / `pendingVictoryAtom` / `resetBattleAtom` / `abandonBattleAtom` - Battle lifecycle (`BattleStatus`: `'playing' | 'won' | 'lost' | 'abandoned'`)
- `battleModeAtom` / `isTrainingBattleAtom` / `totalDamageDealtAtom` - Standard vs. training/sparring mode (see below)
- `setupBattleAtom` - Initializes a battle, `mode: 'standard' | 'training'`
- `lastDamageAtom` / `lastMatchedTypeAtom` / `lastSkillActivationAtom` - Last-event data driving callouts/VFX
- `maxComboAtom` / `itemsUsedAtom` / `ultimateSkillsUsedAtom` / `enemiesBrokenAtom` / `battleStartedAtAtom` - Victory-rating inputs (`enemiesBrokenAtom` sums the per-enemy poise `breakCount`)

### Training / sparring mode
`BattleMode` (`'standard' | 'training'`) drives a reward-free bout against `TRAINING_DUMMY` (`src/constants/enemies/training.ts`): no enemy standby/attacks, no item consumption, and the fight is leavable via `abandonBattleAtom`. `totalDamageDealtAtom` and `training-dummy-readout.tsx` replace the enemy HP bar with a damage/DPS/active-time readout.

## Type System

### Core RPG Types (`rpg-elements.ts`)
- `OrbType` - Orb type identifiers (`'blue' | 'green' | 'purple' | 'yellow' | 'gray'`)
- `CharacterClass` - Character classes (`'warrior' | 'rogue' | 'mage' | 'healer'`)
- `BaseStats` - Shared stats (id, name, HP, `stats: CoreRPGStats`, `vitHpMultiplier`)
- `CharacterData` - Character-specific stats (extends `BaseStats`): level/EXP, equipped weapon/armor + rarity, unlocked skills/passives, skill cooldowns
- `EnemyData` - Enemy-specific stats (extends `BaseStats`): sprite, attack interval/damage, loot table, EXP reward, optional `guardBreak` and `rarityBias`

### Battle Types (`battle.ts`)
- `ActionTarget` - Target of actions (`'party' | 'enemy'`)
- `Orb` - Match-3 orb data (id, type, position, optional `isBomb` wildcard)
- `Match` - Match detection result (orbs, type, count, multiplier)
- `BattleStatus` - `'playing' | 'won' | 'lost' | 'abandoned'`
- `BattleMode` - `'standard' | 'training'`
- `BattleState` - Complete battle state: party, `enemies[]`, `selectedEnemyId`, board, guard, per-enemy poise pools (`enemyPoise`), combo/rating tracking (`maxCombo`, `itemsUsed`, `ultimateSkillsUsed`, `totalDamageDealt`, `startedAt`), and event fields for callouts (`lastPreemptiveStrike`, `lastReshuffle`, `lastMaxFlinch`, `lastPoiseBreak`, `lastSkillActivation`)

## Customization
- Modify `INITIAL_PARTY` in `constants/party.ts` to change party composition
- Add/edit enemies under `constants/enemies/` (organized by world, e.g. `world-00/`)
- Update `BOARD_ROWS`, `BOARD_COLS`, and `ORB_TYPES` in `constants/board.ts` to change board size/orb set
- Tune bomb/cascade rules (`BOMB_MATCH_SPAWN_THRESHOLD`, `BOMB_REFILL_CHANCE`, etc.) in `constants/board.ts`
- Update styling in `constants/ui.ts` for orb colors/glow and HP threshold colors

## Implemented Features
✅ Damage calculation and combat system
✅ Orb falling/gravity animations
✅ Particle effects for matches
✅ Win/lose conditions
✅ Game over modal with restart & dungeon return
✅ Enemy attack timers with radial countdown and telegraphs
✅ Floating damage numbers
✅ Health bar animations
✅ Party Guard defense meter (gray orb charge + block mitigation)
✅ Cascade combo damage multiplier & visual callouts
✅ Wildcard bomb special tiles with 3×3 explosions & chain detonation
✅ Enemy stagger / flinch delay mechanic with anti-stunlock budget
✅ Enemy poise pool & Break (attack cancelled, vulnerable window, immunity + capped escalation)
✅ Active hero skills (Ultimates) with burst overlays & cooldowns
✅ Consumable battle item bar with SPD-scaled shared cooldown
✅ Hitstop freeze-frame on impact
✅ Arcade victory star rating (1–5 stars) and rating-scaled loot bonus
✅ Background battle music and sound effects
✅ Multi-enemy battles with per-enemy targeting and standby delays
✅ Training Grounds sparring mode (reward-free, leavable fight vs. a training dummy)

## Future Enhancements
- Animated pixel art character & enemy attack sprites
- Status effects (Poison, Burn, Stun, Shield)
- Elemental damage matchups
- Boss encounter phases and dynamic transformations
