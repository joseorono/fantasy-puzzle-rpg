The signpost plank exists in `town-hub.tsx` but is a no-op nothing else is wired.

## Feature list

- **Respec a hero** — refund allocated POW/VIT/SPD for a coin cost, then re-spend them.
  Reuses `LevelUpView` (`src/views/level-up-view.tsx`) and `~/lib/leveling-system.ts` almost as-is;
  cost could scale with level or with how many points are being moved.

- **Training dummy** — infinite-HP target that shows a running damage/DPS readout. Best way to feel
  what +5 POW actually does, and it doubles as our own balance-tuning tool. This would have to be the only fight with a back button.

The Training Grounds is the obvious diegetic place to get skills. I won't replace the pause menu skills panel, but I will reuse it.

## What it should *not* be

- Not a second Inn (no healing) and not a second Blacksmith (no gear).
- Not a mandatory stop — everything here should be optional optimization, or the player is forced to
  detour into town between every fight.
- Not a place that hands out loot; the practice modes must be reward-free or the map loop is dead.

## Economy

- What does it charge? Coins.
- A respec should be repeatable but not free — otherwise stats stop being a decision.
- Sparring with the dummy being free is fine as long as it gives nothing.
- Let's make the cost of respec scale with amount of times we have respeced before, which is already tracked in the game state.

## UI / plumbing notes

- We could reuse a lot of elements in the UI. The Inn already has a lot of nice UI for selecting characters.
- Should reuse `TownLocationLayout` (`src/components/town/town-location-layout.tsx`) like the other
  three, so it gets the `.shop-bottom` compact dialogue box, marquee, portrait sidebar and back
  button for free.
- Needs an NPC: a trainer/veteran portrait in `public/assets/portraits/`, plus flavor lines.
- Wiring checklist when we build it (all keyed off the same union, so TS will point at each one):
  - `townLocations` in `src/types/map-node.ts` gains `'training-grounds'`
  - a background list in `SUB_LOCATION_BG_IMAGES` (`src/constants/town-backgrounds.ts`)
  - an entry in `TOWN_HELP_ENTRIES` (`src/constants/town-help.ts`) with a `FrostyRpgIconName`
  - a `case` in the `town-hub.tsx` switch, plus removing `'training-grounds'` from
    `UNIMPLEMENTED_PLANK_IDS` and restoring its `onClick`
  - costs/tunables as named constants under `src/constants/`