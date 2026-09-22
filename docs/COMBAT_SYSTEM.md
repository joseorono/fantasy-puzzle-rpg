# Combat System Documentation

## Overview
The battle screen now features a fully functional combat system with enemy attacks, win/lose conditions, and visual feedback.

## Combat Mechanics

### Enemy Attack System
- **Attack Interval**: Enemy attacks every **4 seconds**
- **Attack Damage**: 25 HP per attack (distributed across all living party members)
- **Visual Timer**: Red pulsing countdown timer in the header shows "ATTACK IN: Xs"
- **Auto-pause**: Timer stops when game is over (won/lost)
- **Stagger / Flinch**: Player hits delay the enemy's next attack timer up to a hard-capped limit per attack cycle (see [Enemy Stagger System](#enemy-stagger-flinch-system)).


### Player Attack System
- **Match-3 Damage**: Making matches deals damage to the enemy
  - **3-4 Match**: 10 damage
  - **5+ Match**: 20 damage (2x multiplier with "5x MATCH!" indicator)
- **Damage Numbers**: Animated floating damage numbers appear when damage is dealt
  - Red numbers for enemy damage
  - Orange numbers for party damage
- **Cascade Combos**: Chained cascades (matches from refilled orbs) multiply damage on a
  diminishing square-root curve — `min(MAX_COMBO_MULTIPLIER, 1 + (CASCADE_DAMAGE_BONUS_PER_LEVEL +
  equipmentComboBonus) × √cascadeLevel)` (`src/lib/rpg-calculations.ts`). Rises fast early, then
  flattens, and is hard-capped at `MAX_COMBO_MULTIPLIER` (2.0×) so deep chains stay flashy without
  speedrunning a battle. The chain (and its combo level) resets on each new player swap.
- **Bomb chains (anti-runaway)**: Matching a wildcard bomb still triggers a 3×3 blast and can chain,
  but bomb spawning is bounded per cascade chain: after the first bomb spawns in a chain the per-orb
  refill chance is multiplied by `CASCADE_BOMB_CHANCE_MULTIPLIER` (0.75), and a chain spawns at most
  `MAX_CHAIN_BOMB_SPAWNS` (3) bombs total (`src/constants/board.ts`). So bomb cascades can't self-feed
  into runaway x8 combos.
- **Orb Removal**: Matched orbs disappear with animation and new orbs fall from the top
  - Glow effect on matched orbs (400ms)
  - Scale-down and fade-out animation (200ms)
  - New random orbs spawn at the top to refill the board
- **Always playable**: every refill runs through `ensurePlayableBoard` (`src/lib/board-generation.ts`). If the
  board has no match and no legal swap, only the freshly spawned orbs are re-drawn (up to `MAX_SPAWN_REROLLS`);
  if that still fails the board is reshuffled — same colors, bombs stay put, moved orbs replay their fall-in —
  and a "No moves! Reshuffle!" callout fires (`lastReshuffle`). Refills never avoid matches, so cascades are
  unchanged.
- **Hint**: once a settled board sits idle for `BOARD_HINT_DELAY_MS` (`src/constants/battle.ts`), `useBoardHint`
  highlights one legal swap from `findPossibleMove` — both orbs get a muted pulsing ring (`ORB_HINT_CLASSES`,
  `src/constants/ui.ts`), distinct from the white selection ring. Selecting an orb keeps the hint; the next valid
  swap, a pause, or the post-kill combo finish clears it.
- **Opening board**: `createOpeningBoard` deals a random board and keeps it only if it has at most
  `OPENING_MAX_MATCHES` (2) pre-made runs, none of bomb-spawning length (`OPENING_MAX_RUN_LENGTH`), and a legal
  move or a match — a small free opening cascade stays possible, a runaway one does not. All board knobs live in
  `src/constants/board.ts`.

### Enemy Stagger (Flinch) System
- **Mechanic**: Player hits push back the targeted enemy's next attack timer by a small delay.
- **Push Formula**: `pushMs = interval × BASE_STAGGER_FRACTION × damageRatio × vitResist`
  - `damageRatio = min(1, damage / (enemyMaxHp × STAGGER_REF_FRACTION))` — scaled by hit intensity relative to 15% of max HP (`STAGGER_REF_FRACTION` = 0.15).
  - `vitResist = 1 / (1 + √max(0, VIT) / STAGGER_VIT_DIVISOR)` — diminishing resistance curve (`STAGGER_VIT_DIVISOR` = 8). High VIT enemies flinch less.
  - `BASE_STAGGER_FRACTION` = 0.10 (10% base delay multiplier).
  - Skill (ultimate) hits multiply their raw push by `SKILL_STAGGER_MULTIPLIER` (2.5) before the clamp, so one ultimate maxes the flinch on most enemies.
- **Multi-hit batching**: A multi-color match lands as one `damageEnemy({ hits })` call; every color's hit contributes its own push (with its own hero's passive multiplier) via `resolveStaggerHits`, clamped in order against the shared budget.
- **Anti-Stunlock Hard Cap**:
  - The total accumulated stagger per attack cycle is capped at `MAX_STAGGER_FRACTION_PER_CYCLE` (12% of the enemy's attack interval).
  - Guarantees an enemy will always fire within `interval × (1 + 0.12)` of its previous attack regardless of hit rate.
  - The budget resets to 0 whenever the enemy fires its attack.
- **Visual Feedback**:
  - **Countdown Ring Nudge**: The timer ring (`RadialCountdown`) reads as time remaining until the attack, anchored by `resolveCountdownRingAnchor` (`src/lib/battle-system.ts`), so a push of `p` ms steps the fill back by `p / interval` wherever it lands in the cycle. The ring fill is exempt from the hitstop freeze so it stays in sync with the real release time.
  - **"Flinched!" Callout**: Pop of warm-amber "Flinched!" text over the enemy sprite when a hit reaches the per-cycle cap.
- **Implementation**: Pure formulas in `src/lib/flinch-system.ts` (`calculateStaggerPushMs`, `clampStaggerToCycleBudget`, `resolveStaggerHits`, `weighHitsByAttacker`), timers in `src/hooks/use-enemy-attack-timers.ts`, and tunables in `src/constants/battle.ts`.

### Enemy Poise / Break System
Builds **on top of** Flinch — the same hit does both. Full design and checklist: [ENEMY_POISE_STAGGER.md](./ENEMY_POISE_STAGGER.md).
- **Poise pool**: every enemy has a posture pool `maxPoise = maxHp × POISE_POOL_HP_FRACTION` (0.4). Each hit deals `poiseDamage = amount × (enemy.poise ?? 1) × hitMultiplier`, where `hitMultiplier` is the attacker's `staggerPushMultiplier` passive × `POISE_SKILL_MULTIPLIER` (2.0) for ultimates — the same `weighHitsByAttacker` the flinch uses, with its own skill constant. Hit amounts already carry the match-size and cascade multipliers, so combos and hard hits fill the pool faster by construction (`POISE_CASCADE_BONUS_PER_LEVEL` adds an optional extra, off by default).
- **`poise` stat** (`EnemyData.poise`, default 1): a multiplier on incoming poise damage. `0.5` = stoic (Moss Golem), `1.6` = squishy (Swamp Frog).
- **Break**: when the pool empties the enemy is **Staggered** for `POISE_BREAK_STAGGER_DURATION_MS` (2.5 s): its pending attack is **cancelled** (the attack-timer hook drops the cycle), it takes `× (1 + POISE_BREAK_DAMAGE_BONUS)` (+50%) HP damage — read from the pre-hit state, so the breaking hit itself gets no bonus — and the countdown ring turns neutral with a `ShieldOff` icon and counts the window down. Recovery opens a fresh full attack cycle.
- **Anti-stunlock**: after recovery the enemy is **immune to poise damage** for `POISE_BREAK_IMMUNITY_MS` (2 s) — HP damage and Flinch still land — and its max poise escalates by `POISE_MAX_GROWTH_PER_BREAK` (25%) of the original per Break, hard-capped at `POISE_MAX_GROWTH_CAP` (150%). These caps are independent of the Flinch cap: `MAX_STAGGER_FRACTION_PER_CYCLE` bounds Flinch per attack cycle, immunity + escalation bound Breaks per battle.
- **Rules**: no poise damage on a killing blow; a standby (observing) target's pool still moves but cannot Break until it starts attacking; Breaks work in Training mode (the windows are battle-state counters ticked by `battleTickAtom`, not hook timers).
- **Visual Feedback**: a thin poise bar under the enemy HP bar (`enemy-poise-bar.tsx`) with three phases — amber fill = poise left; on a Break a pale fill *drains* over the vulnerable window; on recovery a muted fill *rebuilds* over the immunity window, so ignored hits read as "not yet" — dimmed while the enemy is on standby, with a tick mark at the original max once escalated. Plus a larger "Staggered!" callout (`POISE_BREAK_CALLOUT_DURATION_MS`), a washed-out swaying sprite (`.enemy-staggered`), the neutral ring, and a Break SFX (`POISE_BREAK_SOUND`).
- **Implementation**: Pure math in `src/lib/poise-system.ts` (`applyPoiseHits`, `tickEnemyPoise`, `resolveVulnerableHits`, `resolveEscalatedMaxPoise`…), state in `BattleState.enemyPoise` / `lastPoiseBreak`, applied by `damageEnemyAtom` / `activateSkillAtom` and ticked by `battleTickAtom` (`src/stores/battle-atoms.ts`), attack cancel in `src/hooks/use-enemy-attack-timers.ts` via `staggeredEnemySignatureAtom`, tunables in `src/constants/battle.ts`.

### Line-clear items (Row Clear / Column Clear)
Two battle consumables wipe a whole line of the board and **pay out like a match**. Full design and
checklist: [LINE_CLEAR_ITEMS.md](./LINE_CLEAR_ITEMS.md).

- **Targeting**: left-clicking the item **arms** it (`armedLineClearAtom`); the board then highlights the
  row/column under the cursor and the next board click fires it. **Right-click fires immediately** at the
  line `pickBestLine` scores highest (bombs `LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT` = 3 > a living hero's colour
  = 1 > gray `LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT` = 0.5 > a dead hero's colour = 0; ties broken at random).
  Escape, a pause, a win/loss, or clicking the slot again disarms. On touch, a tap fires on that line.
- **Deferred resolution**: firing only files a request (`pendingLineClearAtom`) naming the *line*, never the
  orb ids. The board resolves it once it has settled, so a clear fired mid-cascade wipes whatever ended up
  there. One request at a time — `fireLineClearAtom` refuses a second, so one cooldown buys one clear.
- **Payout**: the cleared orbs (plus anything taken by a bomb blast — bombs in the line detonate and
  chain, via `expandBombExplosions`) are grouped by colour with `groupOrbsByColor`, and each group is
  resolved by the same `resolveMatchGroups` a match uses. So every living hero acts off **their own
  colour's count**: damage (or a heal, for the healer), cooldown relief, and gray charges Guard. Damage
  runs through `damageEnemyAtom`, so flinch, poise and the preemptive bonus all apply. Amounts are scaled
  by `LINE_CLEAR_DAMAGE_MULTIPLIER` (1.0) — the power knob, since a 4-colour line pays out like four
  matches at once.
- **Cascades**: the clear is the opening move of a fresh chain (cascade level 0, `combo: 1`, so it can't
  inflate `maxCombo`), increments `turn`, and the refill cascades normally from there.
- **Cost**: Row Clear 300 coins (6 orbs), Column Clear 400 (8 orbs — `BOARD_ROWS` is 8 to `BOARD_COLS`' 6,
  so a column is worth ~33% more). Both share the SPD-scaled item cooldown with every other battle item
  and both count as an item used against the victory rating.
- **Presentation**: a streak (`LineClearSweep`) crosses the line over `LINE_CLEAR_SWEEP_MS` while the orbs
  on it flash and pop one slot at a time (`getSweepDelays`, `LINE_CLEAR_ORB_STAGGER_MS`), the board jolts
  (`board-shake`) and `LINE_CLEAR_SOUND` plays. When the streak finishes, bombs it caught blast, the match
  badge shows the full count and the damage lands with the usual hitstop and match SFX. A centered
  "ROW CLEAR!" / "COLUMN CLEAR!" callout (`LineClearIndicator`, driven by `lastLineClearAtom`) fires as
  the clear resolves. The items are drawn by their own pixel mini-board icons through `ItemIcon`.
- **Implementation**: pure helpers in `src/lib/line-clear.ts` and `src/lib/match-resolution.ts` (each with
  its own test), state in `armedLineClearAtom` / `pendingLineClearAtom` / `lastItemFiredAtom` /
  `lastLineClearAtom` and `fireLineClearAtom` (`src/stores/battle-atoms.ts` — deliberately outside
  `BattleState`, so aiming never touches the battle or the save), resolution in `match3-board.tsx`, arming
  and auto-aim in `battle-item-bar.tsx`, tunables in `src/constants/battle.ts` and `src/constants/audio.ts`.

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
- **Reset**: Automatically resets to 4 seconds after each attack
- **Interval**: Configurable via `enemy.attackInterval` (default: 4000ms)

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
// Combat-related atoms:
- gameStatusAtom: BattleStatus ('playing' | 'won' | 'lost')
- lastDamageAtom: { amount, target: ActionTarget, timestamp, characterId? }
- lastMatchedTypeAtom: OrbType | null
- damagePartyAtom: Action to damage party (targets random living hero)
- damageEnemyAtom: Action to damage enemy
- removeMatchedOrbsAtom: Action to remove matched orbs and refill board
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
   - Match size multiplier for 5+ matches

3. **Battle Store** (`src/stores/battle-store.ts`)
   - Game status tracking
   - Damage system implementation
   - Win/lose detection
   - Enhanced reset functionality

### Type Definitions

All type definitions are located in the source files:

- **RPG Types**: See `src/types/rpg-elements.ts`
  - `BaseStats` - Core stats (id, name, HP, POW, VIT, SPD)
  - `CharacterData` - Character-specific data
  - `EnemyData` - Enemy-specific data
  - `OrbType` - Orb color types
  - `CharacterClass` - Character classes

- **Battle Types**: See `src/types/battle.ts`
  - `BattleState` - Complete battle state
  - `Orb` - Individual orb data
  - `BattleStatus` - Game status ('playing' | 'won' | 'lost')
  - `ActionTarget` - Damage target ('party' | 'enemy')

For detailed RPG stat system documentation, see [RPG_SYSTEM.md](./RPG_SYSTEM.md).

## Gameplay Flow

1. **Battle Start**
   - Party at full HP (390 total: Warrior 120, Rogue 90, Mage 80, Healer 100)
   - Enemy at full HP (300)
   - 4-second attack timer begins

2. **During Battle**
   - Player makes matches to damage enemy
   - Enemy attacks every 4 seconds (targets random living hero)
   - Health bars update in real-time with color-coded feedback
   - Damage numbers show feedback
   - Matched orbs trigger particle effects and gravity animations
   - Health bar pulses when matching orbs of character colors

3. **Battle End**
   - When enemy HP = 0: Victory modal appears
   - When party HP = 0: Defeat modal appears
   - Attack timer stops
   - Player can click "NEW GAME" to restart

### Training mode (sparring)

The Training Grounds launches a reward-free fight against `TRAINING_DUMMY` (`src/constants/enemies/training.ts`) with `setupBattleAtom({ ..., mode: 'training' })`. `BattleState.mode` is `'standard'` for every other fight. In training mode:

- The dummy has unreachable HP and never attacks: `createBattleState` skips enemy standby (no preemptive bonus), and `useEnemyAttackTimers` runs no loop, so the top bar reads **SPARRING**.
- `TrainingDummyReadout` replaces the enemy HP bar with total damage, DPS, and active time. `BattleState.totalDamageDealt` is tracked in every battle (matches and skills); the readout's clock is local and starts on the first hit.
- Items work but are not removed from the inventory; skills work as normal.
- The pause overlay gains a **Leave** button. Leaving sets `gameStatus: 'abandoned'` (`abandonBattleAtom`) and calls `goBack()`. Nothing is banked: party HP is only synced on victory and no rewards screen opens. `TownHubViewData.initialLocation` returns the player to the Training Grounds.

## Balance Notes

### Current Stats
- **Party Total HP**: 390 (Warrior: 120, Rogue: 90, Mage: 80, Healer: 100)
- **Enemy HP**: 300
- **Enemy Attack**: 25 damage every 4 seconds (targets random living hero)
- **Player Damage**: 10-20 per match

### Time to Defeat
- **Without healing**: ~16 enemy attacks to lose (64 seconds)
- **To win**: Need 15-30 matches depending on match size and character POW
- **Average battle**: 30-50 seconds

### Orb Type System
- Each character is associated with an orb type (color)
- Matching orbs of a character's type provides visual feedback
- Health bar changes color based on last matched type
- Gray orbs are neutral: they deal reduced chip damage and charge the party-wide **Guard** meter (see below)

### Guard Meter
The party shares a **Guard** meter (`BattleState.guard`, `0..GUARD_MAX`) — its own defensive resource,
charged by matching gray orbs. Math lives in `src/lib/rpg-calculations.ts`; balance constants in
`src/constants/battle.ts` (mitigation/drain/decay/charge rate) and `src/constants/party.ts`
(gray damage, per-orb charge).

Three independent stats/levers move the meter, so none of them alone trivializes defense:
**SPD** charges it faster, **VIT** makes it last longer, and the enemy's **`guardBreak`** decides how
much a block costs.

- **Charging:** matching gray adds `matchSize × GUARD_CHARGE_PER_ORB × guardChargeRate`, where the
  SPD-derived `calculateGuardChargeRate(party)` scales charge with the living party's collective SPD
  on a diminishing (sqrt) curve. Gray's enemy chip damage is scaled by `GRAY_MATCH_DAMAGE_MULTIPLIER`.
- **Mitigation (percentage-based, scales to any damage):** an incoming hit is reduced by the bar's
  **fill %** (capped at `MAX_GUARD_REDUCTION`). A full bar fully blocks one attack. Resolved centrally
  in `damagePartyAtom` via `resolveGuardedDamage(incoming, guard, guardBreak)`.
- **`guardBreak` (per enemy, default 1):** scales only how much of the bar each block *drains* — `2.0`
  erodes it twice as fast (forces more gray-matching to stay shielded), `0.5` barely dents it. It does
  **not** weaken mitigation, so a full bar always fully blocks.
- **Anti-hoard decay:** Guard bleeds over time proportional to its fill (`decayGuard`, ticked in the
  battle screen's cooldown loop), so a full bar can't be parked — blocking a big hit is a timing play.
  The bleed is scaled by `calculateGuardDecayResistance(party) = 1 / (1 + livingVit / GUARD_DECAY_VIT_DIVISOR)`,
  a diminishing (hyperbolic) curve in the living party's collective VIT that stays in `(0, 1]` — VIT
  makes the shield last but can never freeze it. Because both this and the charge rate count only
  *living* members, a party that is losing people charges slower **and** bleeds faster.
  Decay is proportional to fill, so it only approaches zero asymptotically; anything under
  `GUARD_MIN_THRESHOLD` snaps to exactly 0 so an empty bar stops ticking.
- **Feedback:** the Guard bar (steelArmor icon, below the HEROES HP bar) shimmers while charging, glows
  when full, and shatters with a "BLOCK!"/"GUARD" popup + clang when it mitigates a hit.

## Future Enhancements
- Status effects (Poison, Burn, Stun, Shield)
- Elemental matchups (Fire, Ice, Lightning)
- Critical hits and damage variance
- Boss phases with special mechanics (enrage thresholds, summons)
- Board hazards (frozen orbs, enemy counter-hazards)
- Class-specific character attack SFX & animations

