
Check the Design Doc for more general info about the game.

# Stats:

The characters and enemies could have some rudimentary stats like:

Power (POW) for the potency of their actions (both sides could use the same formulas)
Vitality (VIT)
Effects:
Characters: increase their contribution to the Party’s HP pool
Enemy: Determines their HP
Speed (SPD)
Effects:
Enemy: Determines their attack intervals
Characters: Increase how much their Skill Cooldown Bar fills each second (or maybe changes its interval?)

We’d need to have functions in the /lib folder to calculate the cooldown and stuff like that, and calculate the party’s collective HP, plus all the normal RPG stuff like Damage Calculation.

# What was already implemented in the Demo:

The demo already has a basic Combat System, with starting stats for the player and enemies, and a basic Damage Calculation system.

We can build upon that and improve it later. We might want to discuss the
formulas used, take a look at the Damage Calculation system of other RPGs, maybe base it on some simple TTRPG system.

# The Level Up Screen:
- Like that derived values are displayed in the Level Up Screen in Elden Ring, even if it looks a bit convoluted. Our system is much simpler without too many derived values, so this shouldn't be a problem for us.
- I like that the Level Up Screen in Elden Ring and SMTV allows you to
allocate some points.
- SMTV has natural/automatic progression in addition to your point allocation, which we could implement to make the characters more distinct.
- I like that you can go past 99 in SMTV, and that the bar only
goes to 99, but once you go past 99, it just displays the number and
the bar is replaced with a flowing bar that's always full and has a
"flowing" animation, like you're overflowing with power.

# Leveling System Math:

We'll probably need FromSoft style soft caps, because if
1 Power always adds 5 Damage, a 100 Power build is 10 times stronger than a 10 Power build, leading to broken scaling.

Souls games solve this with Soft Caps like: (I made them up, we could
fine tune them and make it more gradual with a range that grants +4, etc)

From 1 to 40 (or similar), a point in Power adds +5 Damage.
From 41 to 60, a point in Power only adds +3 Damage.
From 61 to 99, a point in Power only adds +1 Damage.

# A Half-Baked Idea of how to implement natural stat progression:

We could implement a system where the player's stats increase automatically as they level up.

For that, and to add variety, we could have an object like:

```typescript
let warriorPotentialStatPoints = {
    pow: 30,
    vit: 30,
    spd: 10
}
```

And then, when the player levels up, we could have a function that
returns a array of stat names (based on how much we have to allocate for that level), and we can use that to determine which to increase.
We just need to make sure to decrease the potential stat points as we level up.

I think the SMT games do something like that because not 2 demons have the same stat growth at a given level.

This system means:
- From a technical standpoint, this probably would link the remaining potential stat points to the CharacterData interface (depends on implementation).
- The player's stats will increase automatically as they level up based on their class' potential stat points.
- The early game will be somewhat variable, but the late game will be more consistent.
- I think this adds a little bit of variety to the game, but it's not a big deal.
- You'll almost always have a build that fits your class.



