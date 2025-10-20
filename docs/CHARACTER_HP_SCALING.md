# Character HP Scaling System

## Overview
Each character and enemy now has their own `vitHpMultiplier` value, which determines how much HP they gain per VIT point. This creates distinct class identities and allows for more strategic gameplay.

## HP Calculation Formula
```
maxHP = baseHP + (VIT × vitHpMultiplier)
```

## Character HP Scaling

### Warrior (Blue) - Tank
- **Base HP**: 50
- **VIT**: 20
- **vitHpMultiplier**: 6 (Highest - Tanky)
- **Total HP**: 50 + (20 × 6) = **170 HP**
- **Role**: Frontline tank with highest survivability
- **Identity**: Gains the most HP per VIT point

### Healer (Yellow) - Balanced Support
- **Base HP**: 45
- **VIT**: 18
- **vitHpMultiplier**: 5 (Moderate - Balanced)
- **Total HP**: 45 + (18 × 5) = **135 HP**
- **Role**: Support with decent survivability
- **Identity**: Standard HP scaling

### Rogue (Green) - Glass Cannon
- **Base HP**: 40
- **VIT**: 10
- **vitHpMultiplier**: 3 (Lowest - Fragile)
- **Total HP**: 40 + (10 × 3) = **70 HP**
- **Role**: High damage, low survivability
- **Identity**: Gains the least HP per VIT point

### Mage (Purple) - Burst Damage
- **Base HP**: 35
- **VIT**: 8
- **vitHpMultiplier**: 4 (Low - Fragile)
- **Total HP**: 35 + (8 × 4) = **67 HP**
- **Role**: Highest damage, very fragile
- **Identity**: Low HP scaling for a glass cannon

## Party Total HP
**Total**: 170 + 135 + 70 + 67 = **442 HP**

## Enemy HP Scaling

### Moss Golem
- **Base HP**: 50
- **VIT**: 50
- **vitHpMultiplier**: 5 (Standard)
- **Total HP**: 50 + (50 × 5) = **300 HP**

## Class Identity Through HP Scaling

### High Survivability (6x multiplier)
- **Warrior**: Built to take hits
- Best for players who want a defensive playstyle
- Each VIT point is worth 20% more HP than standard

### Balanced (5x multiplier)
- **Healer**: Standard HP scaling
- **Enemies**: Most enemies use this as baseline
- Reference point for "normal" HP growth

### Low Survivability (4x multiplier)
- **Mage**: Fragile spellcaster
- High risk, high reward
- Each VIT point is worth 20% less HP than standard

### Very Low Survivability (3x multiplier)
- **Rogue**: Extreme glass cannon
- Highest damage, lowest HP
- Each VIT point is worth 40% less HP than standard
- Requires careful positioning and play

## Strategic Implications

### Leveling Up
When characters gain VIT through leveling:
- **Warrior** gains 6 HP per VIT point
- **Healer** gains 5 HP per VIT point
- **Mage** gains 4 HP per VIT point
- **Rogue** gains 3 HP per VIT point

This means investing in VIT is most effective on Warriors and least effective on Rogues.

### Equipment Design
Future equipment that grants +VIT will have different value per class:
- +10 VIT on Warrior = +60 HP
- +10 VIT on Healer = +50 HP
- +10 VIT on Mage = +40 HP
- +10 VIT on Rogue = +30 HP

### Enemy Variety
Different enemy types can have different multipliers:
- **Tanks/Bosses**: 6-7x multiplier (very tanky)
- **Standard enemies**: 5x multiplier (balanced)
- **Speed enemies**: 3-4x multiplier (fragile but fast)

## Comparison to Previous System

### Before (Global VIT_HP_MULTIPLIER = 5)
- Warrior: 50 + (20 × 5) = 150 HP
- Rogue: 40 + (10 × 5) = 90 HP
- Mage: 35 + (8 × 5) = 75 HP
- Healer: 45 + (18 × 5) = 135 HP
- **Total**: 450 HP

### After (Per-Character Multipliers)
- Warrior: 50 + (20 × 6) = 170 HP (+20 HP)
- Rogue: 40 + (10 × 3) = 70 HP (-20 HP)
- Mage: 35 + (8 × 4) = 67 HP (-8 HP)
- Healer: 45 + (18 × 5) = 135 HP (same)
- **Total**: 442 HP (-8 HP overall)

### Impact
- **Warrior** is now significantly tankier (+13% HP)
- **Rogue** is now more fragile (-22% HP) - emphasizes glass cannon role
- **Mage** is slightly more fragile (-11% HP)
- **Healer** unchanged - remains the balanced support
- **Overall party** slightly less HP but with clearer class identities

## Implementation Details

### Type Definition
```typescript
interface BaseStats {
  vitHpMultiplier: number; // HP gained per VIT point
  // ... other stats
}
```

### Calculation Function
```typescript
// Generic calculation
calculateMaxHp(baseHp, vit, vitMultiplier)

// Entity-specific calculation
calculateEntityMaxHp(entity) // Uses entity.vitHpMultiplier
```

### Location
- Type: `src/types/rpg-elements.ts`
- Constants: `src/constants/game.ts`
- Calculations: `src/lib/rpg-calculations.ts`
