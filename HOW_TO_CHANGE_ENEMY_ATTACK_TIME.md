# How to Change Enemy Attack Time

## 📍 Location

To change the enemy attack interval, modify the `attackInterval` property in the **initial enemy setup**.

### File: `src/stores/battle-store.ts`

**Line 80** (approximately)

```typescript
// Initial enemy setup
const initialEnemy: Enemy = {
  id: 'moss-golem',
  name: 'Moss Golem',
  type: 'golem',
  maxHp: 300,
  currentHp: 300,
  sprite: '🗿',
  attackInterval: 4000, // ← CHANGE THIS VALUE (in milliseconds)
  attackDamage: 25,
};
```

## ⏱️ Time Values

The `attackInterval` is in **milliseconds**:

- `1000` = 1 second
- `2000` = 2 seconds
- `3000` = 3 seconds
- `4000` = 4 seconds (current)
- `5000` = 5 seconds
- `8000` = 8 seconds (original)
- `10000` = 10 seconds

## 🔧 What Happens When You Change It

When you modify `attackInterval`, the following automatically update:

1. **Attack Timer** - Enemy attacks at the new interval
2. **Countdown Display** - Header shows correct countdown
3. **Game Balance** - Affects difficulty (shorter = harder)

## 💡 Example Changes

### Make it Easier (Slower Attacks)
```typescript
attackInterval: 6000, // 6 seconds between attacks
```

### Make it Harder (Faster Attacks)
```typescript
attackInterval: 3000, // 3 seconds between attacks
```

### Boss Battle (Very Fast)
```typescript
attackInterval: 2000, // 2 seconds between attacks
```

## ⚠️ Important Notes

1. **Don't go below 1000ms** - The UI needs time to show animations
2. **The countdown resets automatically** - No need to change anything else
3. **Damage stays the same** - To change damage, modify `attackDamage` instead

## 🎮 Related Settings

In the same file, you can also change:

```typescript
const initialEnemy: Enemy = {
  // ... other properties
  attackInterval: 4000,  // How often enemy attacks
  attackDamage: 25,      // How much damage per attack
  maxHp: 300,            // Enemy's total health
  // ... other properties
};
```

## 🧪 Testing Different Values

Recommended intervals for different difficulty levels:

| Difficulty | Interval | Time Between Attacks |
|-----------|----------|---------------------|
| Easy      | 8000     | 8 seconds          |
| Normal    | 5000     | 5 seconds          |
| Hard      | 4000     | 4 seconds (current)|
| Expert    | 3000     | 3 seconds          |
| Nightmare | 2000     | 2 seconds          |

---

**That's it!** Just change the one number and the entire attack system updates automatically. 🎯
