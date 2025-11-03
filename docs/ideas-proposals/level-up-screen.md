Let's call the View component the LevelUpView.

A level up screen for a Simple RPG with only 3 stats: Power, Vitality, Speed.


# Performance & Caching

If we need to worry about performance for this, we have messed up big time.

That said, we'll need to make the CharacterData a prop for a bunch of these calculations, so it makes sense to keep basic stuff that doesn't change in the View component.

# Layout:

- **Overall Structure**
  - Three-column grid: Left Status & Derived, Center Character, Right Allocation.
  - Header ribbon shows “Level Up” and remaining points; footer line shows a contextual help text saying "Allocate points to increase your stats".

- **Left Column — Status & Derived**
  - **Identity**: name, class icon, level badge.
  - **Progress**: EXP bar to next level with numeric values.
  - **HP**: current/max with a horizontal bar.
  - **Derived (live preview from current + pending allocations)**
    - Max HP: integer value; small +Δ chip when VIT changes.
    - Skill Cooldown Fill Rate: fills/sec from `calculateCooldownFillRate()`; show to 2 decimals.
    - Skill Cooldown Fill Time: seconds from `calculateCooldown()`; show to 2 decimals (lower is better).
    - Attack Power or Healing Power: integer from `calculateDamage()` baseline; show “Healing Power” only for healer.
  - All values update in real time when POW/VIT/SPD are adjusted on the right.

- **Center Column — Character**
  - Large character sprite.
  - Stat chips: POW | VIT | SPD showing current values and inline +Δ when pending.
  - If there are pending changes: small banner “Confirm to apply” with Reset hint.

- **Right Column — Stat Allocation**
  - **Points**: “Points: X” counter.
  - **Stats List (POW, VIT, SPD)** — one row per stat:
    - Label with brief hint: POW increases damage; VIT increases max HP; SPD reduces cooldowns/intervals.
    - Value group: base → preview (e.g., 20 → 23) with +Δ chip.
    - Meter indicating current vs preview within a reserved width to avoid layout shift.
    - Controls: [-] [+] buttons; disable [+] when no points remain and [-] at session minimum.
  - Actions: Confirm (apply) and Reset (revert); Cancel/Back if leaving without applying.


# Derived Stats

- Max HP, calculated by: calculateMaxHp().
- Skill Cooldown Fill Rate, calculated by: calculateCooldownFillRate().
- Skill Cooldown Fill Time (Seconds), calculated by: calculateCooldown().
- Attack Power/Healing Power, calculated by: calculateDamage().
  - These are technically the same stat, but we should Show Healing Power exclusively for the healer using class as condition.

# Files

We have the following files:

- /src/lib/rpg-calculations.ts
- /src/lib/leveling-system.ts

We could create the following:

- /src/components/level-up-screen/derived-stats-display.tsx
  - This component would display the derived stats of the character. It need only receive the CharacterData as a prop, since CoreRPGStats doesn't include the multiplier values.
- /src/components/views/level-up-screen.tsx
  - This component would display the level up screen. It need only receive the CharacterData as a prop, since CoreRPGStats doesn't include the multiplier values.
  - The main purpose of this view is visualizing the character's stats increases, and collecting the user's input for the stat allocation.
  - I think we could get away with NOT using Atoms for this, so that initialization is simpler and React Compiler can do its job.
- The Controls to allocate points to stats could also be a component that receives a CallBack so that we can handle the stat allocation in the parent component. I haven't decided yet.