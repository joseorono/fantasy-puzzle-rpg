# TODO List

Base Systems:

- [x] Audio/Sound System: Ported from old game by Edd, Jose, and Carlos. Extended upon by Jose.
- [x] Loader System: Ported from old game by Edd, Jose, and Carlos. Adapted by Jose.
- [x] Dialogue system: RPG Maker and Visual Novel style. Done by Jose.
- [x] Resources System: resources for purchasing and crafting, including coins. Done by Jose
- [x] Party System: Basic party functionality. Done by Jose.
- [x] Town system (Item Shop and Inn): 3-in-1. They are basically the same code-wise, and could use the same Store slice and everything. Item Shop, Blacksmith, and Inn. (Andreina and Jose)
  - [x] Item selling: a Sell tab in the Item Shop (consumables → coins at half value, min 1). (Jose)
  - [x] Blacksmith "Modify" tab: upgrade gear one rarity tier, or salvage it for materials. (Jose)
- [x] Level-up/progression system. (Jose and Edd)
  - [x] Hold-to-allocate stat buttons: press-and-hold +/− with accelerating auto-repeat. (Jose)
- [x] Map system: with menus for each map node, and different nodes. Similar to the Fire Emblem The Sacred Stones (GBA) map, the Pokemon Emerald (GBA) fly map, or the Mario World (SNES) map. (WIP - Mauricio)
- [ ] Battle system: Detailed elsewhere. (WIP by the whole Team)
  - [x] Party Guard meter: gray orbs charge a shared meter that blocks incoming damage. (Jose)
  - [x] Cascade combo multiplier: chained cascades scale damage on a diminishing curve. (Jose)
  - [x] Bomb special tiles: spawn from matches, clear a 3×3, with chain limiting. (Jose)
  - [x] Enemy attack timers + telegraph: radial countdown / "incoming" UI. (Jose)
  - [x] Hitstop: brief impact freeze for game feel. (Jose)
  - [x] Skill-name title-sign ribbons. (Jose)
  - [x] Party HP persists across battles. (Jose)
  - [x] Enemy stagger ("flinch"): every hit nudges the enemy's next attack back, VIT-resisted and hard-capped per cycle so it can never stunlock. (Jose)
  - [x] Post-battle arcade star rating: 1–5 stars scored from clear time, HP remaining, max combo, match score, and items used, with rank flavor. (Jose)
  - [x] Rating → loot multiplier: better ratings scale money + resources (not items/XP) on the rewards screen. (Jose)

Second-Order Systems:

- [x] Inventory system: Will be implemented alongside the Town system. Requires: Zustand store. Done by Jose.
  - [x] Per-instance equipment rarity: stacks keyed by item + rolled rarity. (Jose)
- [x] Crafting system: Will be implemented alongside the Town system. Requires: Zustand store, partially implemented Town system. Finished by Jose.
  - [x] Rarity rolled on craft, with a hidden pity counter (bad-luck protection). (Jose)
  - [x] Equipment upgrade: bump an item up one rarity tier (tier-scaled cost). (Jose)
  - [x] Equipment salvage: scrap gear for half its material bars. (Jose)
- [x] Equipment Rarity system: per-instance tiers (Common→Legendary), stat multipliers, weighted rolls with per-enemy bias, color-coded across all item UI. Done by Jose.
- [x] Dungeon System. Requires: Properly integrated Map, Town, Battle, and Level-up/progression systems.
- [ ] Save data: not included until we have a clear idea of the data we'll need. Requires: Most of the base systems.
