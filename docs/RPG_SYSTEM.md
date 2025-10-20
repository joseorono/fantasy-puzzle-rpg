# RPG System Documentation

## Overview
The game now features a comprehensive RPG stat system that affects combat, HP, and cooldowns. Characters and enemies have three core stats that modify their performance.

## Core Stats

### Power (POW)
**Effect**: Increases damage output
- **Formula**: `damage = baseDamage * (1 + POW/100)`
- **Example**: 20 POW = 20% damage increase
- **Applies to**:
  - Character match-3 damage
  - Enemy attack damage

### Vitality (VIT)
**Effect**: Increases maximum HP
- **Formula**: `maxHP = baseHP + (VIT * multiplier)`
- **Default multiplier**: 5 HP per VIT point
- **Example**: 20 VIT = +100 HP
- **Applies to**:
  - Character HP pool contribution
  - Enemy HP

### Speed (SPD)
**Effect**: Reduces cooldowns and attack intervals
- **Formula**: `actualTime = baseTime / (1 + SPD/100)`
- **Example**: 20 SPD = 16.7% faster (1.2x speed)
- **Applies to**:
  - Character skill cooldowns
  - Enemy attack intervals

## Character Stats

### Warrior (Blue)
- **POW**: 15 - Moderate damage
- **VIT**: 20 - High HP (150 total)
- **SPD**: 5 - Slow cooldown
- **Role**: Tank with high survivability
- **Base HP**: 50 + (20 * 5) = **150 HP**
- **Cooldown**: 3 seconds → **2.86s** with SPD

### Rogue (Green)
- **POW**: 20 - High damage
- **VIT**: 10 - Low HP (90 total)
- **SPD**: 25 - Very fast cooldown
- **Role**: Glass cannon with fast abilities
- **Base HP**: 40 + (10 * 5) = **90 HP**
- **Cooldown**: 2 seconds → **1.6s** with SPD

### Mage (Purple)
- **POW**: 25 - Highest damage
- **VIT**: 8 - Lowest HP (75 total)
- **SPD**: 10 - Moderate cooldown
- **Role**: High burst damage, fragile
- **Base HP**: 35 + (8 * 5) = **75 HP**
- **Cooldown**: 4 seconds → **3.64s** with SPD

### Healer (Yellow)
- **POW**: 10 - Low damage
- **VIT**: 18 - Good HP (135 total)
- **SPD**: 12 - Moderate-fast cooldown
- **Role**: Support with decent survivability
- **Base HP**: 45 + (18 * 5) = **135 HP**
- **Cooldown**: 3 seconds → **2.68s** with SPD

**Total Party HP**: 450 HP

## Enemy Stats

### Moss Golem
- **POW**: 10 - Moderate damage
- **VIT**: 50 - Very high HP (300 total)
- **SPD**: 0 - No speed bonus
- **Base HP**: 50 + (50 * 5) = **300 HP**
- **Base Damage**: 20 → **22 damage** with POW
- **Attack Interval**: 4000ms (no SPD modifier)

## Damage Calculations

### Match-3 Damage
```typescript
baseDamage = 10
comboMultiplier = matchSize >= 5 ? 2 : 1
damage = baseDamage * comboMultiplier * (1 + POW/100)
```

**Examples**:
- 3-match, 0 POW: 10 damage
- 3-match, 20 POW: 12 damage
- 5-match, 0 POW: 20 damage
- 5-match, 25 POW: 25 damage

### Enemy Attack Damage
```typescript
baseDamage = 20
actualDamage = 20 * (1 + 10/100) = 22 damage
```

## RPG Calculation Functions

Located in `src/lib/rpg-calculations.ts`:

### HP Functions
- `calculateMaxHp(baseHp, vit, multiplier)` - Calculate max HP from VIT
- `calculatePartyMaxHp(party)` - Total party max HP
- `calculatePartyCurrentHp(party)` - Total party current HP
- `calculatePartyHpPercentage(party)` - Party HP as percentage (uses `calculatePercentage` from math module)

### Damage Functions
- `calculateDamage(baseDamage, pow)` - Apply POW modifier to damage
- `calculateCharacterDamage(character, baseDamage)` - Character damage with POW
- `calculateEnemyDamage(enemy)` - Enemy damage with POW
- `calculateMatchDamage(matchSize, baseDamage, pow)` - Match-3 damage with combos

### Speed Functions
- `calculateAttackInterval(baseInterval, spd)` - Attack interval with SPD
- `calculateCooldown(baseCooldown, spd)` - Cooldown with SPD
- `calculateCooldownFillRate(baseCooldown, spd)` - Fill rate per second
- `calculateEnemyAttackInterval(enemy)` - Enemy attack timing
- `calculateCharacterCooldown(character)` - Character skill cooldown

### Utility Functions
- `createCoreStats(pow, vit, spd)` - Create stats object
- `validateStats(stats)` - Validate stats are non-negative

## Configuration Constants

Located in `src/constants/game.ts`:

```typescript
VIT_HP_MULTIPLIER = 5      // HP per VIT point
BASE_MATCH_DAMAGE = 10     // Base damage for matches
```

## Type Definitions

All type definitions are located in `src/types/rpg-elements.ts`.

**Key Types:**
- `BaseStats` - Core entity stats including id, name, HP, and RPG stats (POW, VIT, SPD)
- `CharacterData` - Extends BaseStats with character-specific properties (class, color, cooldowns)
- `EnemyData` - Extends BaseStats with enemy-specific properties (type, sprite, attack data)
- `OrbType` - Union type for orb colors
- `CharacterClass` - Union type for character classes

Refer to the source file for the complete and up-to-date type definitions.

## Balance Notes

### Party Composition
- **Total HP**: 450 (up from 390)
- **Average POW**: 17.5
- **Damage Range**: 11-13 per 3-match (depending on character)
- **Fastest Cooldown**: Rogue at 1.6s
- **Slowest Cooldown**: Mage at 3.64s

### Enemy Balance
- **HP**: 300 (same as before)
- **Damage**: 22 (up from 20 base)
- **Attack Interval**: 4 seconds (unchanged)
- **Time to defeat party**: ~20 attacks (80 seconds)
- **Matches needed to win**: 15-30 depending on combos and character POW

### Stat Scaling
- **POW**: Linear scaling, 1% damage per point
- **VIT**: Linear scaling, 5 HP per point
- **SPD**: Diminishing returns (hyperbolic), more effective at lower values

## Future Enhancements

### Leveling System (Not Yet Implemented)
- Experience points and level progression
- Stat growth on level up
- Skill unlocks and upgrades
- See `src/lib/leveling-system.ts` for planned features
