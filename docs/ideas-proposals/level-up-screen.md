Let's call the View component the LevelUpView.

# Performance & Caching

If we need to worry about performance for this, we have messed up big time.

That said, we'll need to make the CharacterData a prop for a bunch of these calculations, so it makes sense to keep basic stuff that doesn't change in the View component.

# Derived Stats

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