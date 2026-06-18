# Feature Ideas & Gaps Analysis

A brainstorm of fun features that expand on our existing systems, paired with an honest
assessment of where the current implementations fall short. This is a vision/discussion
doc — nothing here is committed work. It's grounded in the code as it exists today, so each
idea points at the real files and seams where it would plug in.

> Companion to the per-system proposals in [`docs/ideas-proposals/`](./ideas-proposals)
> and the build status in [`docs/SYSTEMS_TODO.md`](./SYSTEMS_TODO.md).

---

## TL;DR — The Three Biggest Gaps

Before the fun stuff, three foundational holes are worth calling out because almost every
other feature leans on them:

1. **No save/load.** All progress lives in the in-memory Zustand store (`src/stores/game-store.ts`)
   and is lost on refresh. `SYSTEMS_TODO.md` flags this deliberately ("not included until we
   have a clear idea of the data we'll need"). We now have that clarity — the data model is
   stable. This is the single highest-leverage thing we could add.
2. **No status-effect / element layer in combat.** Skills hit for raw numbers and resolve
   instantly. There's no poison, stun, burn, buff/debuff, or elemental matchup — even though
   we already ship the icon art for it. This is the biggest *fun* gap in the core loop.
3. **The match-3 board is "solved."** Matching is functional but flat: no cascades combo
   bonus, no special tiles, no board hazards. The puzzle half of "puzzle RPG" is the least
   developed half.

Everything below expands on these and the rest of the systems.

---

## 1. Combat & Match-3 Board

### What's lacking
- **Cascades don't reward you.** When refilled orbs form new matches they deal damage, but
  there's no escalating combo multiplier. `BattleState` has no `cascadeCount`. Big chain
  reactions feel the same as a lucky single match.
- **No status effects or elements.** `CharacterData`/`EnemyData` have no `activeEffects` field;
  skills in `src/constants/skills.ts` only carry damage multipliers + flat bonuses. We already
  have ice/fire/lightning/poison icon assets sitting unused.
- ~~**Gray orbs are dead weight.** Five orb types (`src/constants/game.ts`) but gray does nothing
  — no block-breaking, no charge, no penalty.~~ **Resolved:** gray now charges the party Guard meter
  (and deals tuned-down chip damage). See [GUARD_METER_PLAN.md](./GUARD_METER_PLAN.md).
- **Skills resolve instantly with no animation beat.** A 650ms color flash (skill burst overlay)
  is the whole payoff for a level-6 ultimate. No telegraph, no impact.
- **Enemies are HP sponges.** Attack on a timer, target random living member, die at 0 HP.
  No phases, no telegraphed big attacks, no mechanics to play around.

### Fun features to add
- **Combo / cascade meter.** Track `cascadeCount` in `battle-atoms.ts`; each chained cascade
  bumps a damage multiplier and shows an escalating "COMBO x3!" callout (we already render a
  "5x MATCH!" indicator — same UI pattern). Rewards setting up big boards.
- **Special tiles.** Match 5 to spawn a **bomb orb** (clears a 3×3), match in an L/T shape to
  spawn a **line-clear orb**. We already have `clearBoardRowAtom` / `clearBoardColumnAtom` atoms
  and `row-clear`/`column-clear` consumables — the clearing logic exists; this just spawns it
  organically from play.
- **Status effects system.** New `src/lib/status-system.ts` + an `activeEffects: StatusEffect[]`
  field on entities. Tick effects inside the existing `tickSkillCooldownsAtom` loop. Starter set:
  Poison (DoT), Burn (DoT), Stun (skip next enemy attack), Shield (absorb), Haste/Slow (cooldown
  mods). Surface them as small icons next to HP bars.
- **Elemental matchups.** Tag skills and enemies with an element; apply a multiplier in
  `calculateDamage()`. Match the puzzle to the boss — e.g. an ice golem takes extra from the
  Mage's fire skill. Turns enemy variety into strategy instead of bigger numbers.
- **Board hazards.** Enemy attacks that "freeze" a column of orbs for N turns or drop junk
  (gray) orbs — giving enemies a way to disrupt the *puzzle*, not just chip HP.
- **Boss phases.** Add a `phases: { hpThreshold, onEnter }[]` field to `EnemyData`; check it in
  `damageEnemyAtom`. A boss that enrages at 50% HP, or summons adds, makes encounters memorable.
- **Active block / defend.** Let a held orb-type or a tapped party member brace for an incoming
  telegraphed hit — a reason to watch the enemy attack timer instead of mashing matches.

---

## 2. Progression, Skills & Characters

### What's lacking
- **No skill tree.** Skills are a flat per-class unlock list keyed on `unlockLevel`
  (`src/constants/skills.ts`). No branches, no choices, no build identity.
- **No passives or perks.** Stats map 1:1 to mechanics. No crit, dodge, lifesteal, block —
  every character of a class plays identically.
- **Fixed 4-person party.** `INITIAL_PARTY` is hardcoded (`src/constants/party.ts`). No
  recruitment, no bench, no swapping, no character creation.
- **No respec.** Level-up stat allocation (`src/views/level-up-view.tsx`) is permanent. One
  misclick is forever, which discourages experimentation.
- **Equipment is stats-only.** `equipment-system.ts` is solid but every item is just ±POW/VIT/SPD.
  No affixes, no set bonuses, no on-hit effects, no rarity.

### Fun features to add
- **Skill trees per class.** Reframe the existing `unlockLevel` list as a branching tree with
  skill points earned on level-up. The level-up screen already spends points — extend that flow.
  Pairs naturally with respec.
- **Passive perks.** A small `passives: PassiveId[]` on `CharacterData`, resolved in
  `rpg-calculations.ts`: Crit Chance (SPD-scaled), Lifesteal, Thorns, First-Match-Bonus. Cheap to
  add, huge for build variety.
- **Party recruitment & bench.** Convert `INITIAL_PARTY` into a roster the player draws 4 from.
  Recruit new heroes from map nodes / dialogue. Enables a 5th orb color = a 5th class.
- **Stat respec at the Inn or a new NPC.** Reuse the level-up allocation UI; charge gold/gems.
- **Equipment affixes & rarity.** Layer random affixes (`+5% crit`, `+10 fire dmg`, `on-match:
  heal 2`) and Common→Legendary tiers onto the existing item model. Makes loot exciting instead
  of "+1 to a number."
- **Class-defining ultimate skill** unlocked at a high level — a screen-clearing payoff that
  gives long-term progression a destination.

---

## 3. Economy, Loot & Crafting

### What's lacking
- **Loot is guaranteed resources only.** Enemy loot tables (`src/constants/enemies/world-00/`)
  drop fixed coins — `LootTable` supports `equipableItems`/`consumableItems` with probabilities,
  but nothing populates them. No drop excitement.
- **No item selling.** The store (`src/components/town/item-store.tsx`) only buys. Excess gear is
  worthless.
- **No rarity / no chests.** Treasure nodes exist as a type but there's no chest-opening moment.
- **Crafting is bar-exchange only.** The blacksmith melts/exchanges currency and crafts from a
  flat-fee recipe; no recipes that consume *loot* into gear.

### Fun features to add
- **Probabilistic drops + rarity.** Actually fill those `equipableItems` arrays with weighted
  drops. Add a rarity tier to items and color-code them everywhere they render.
- **Treasure chests with a reveal moment.** The `Treasure` node already exists
  (`src/constants/maps/map-00/nodes.ts`); give it a satisfying open animation + reward modal.
  `docs/ideas-proposals/loot-system.md` already sketches this.
- **Sell / pawn at the store.** Mirror the existing buy flow to sell back at a reduced rate —
  drains the inventory of junk and feeds the economy loop.
- **Crafting recipes from materials.** Recipes that consume dropped materials + currency to forge
  better-than-buyable gear. Extends the blacksmith without a new screen.
- **A daily/restocking merchant** with rotating rare stock — a reason to return to town.
- **Gambling mini-game** at a tavern (slots / dice) for a coin sink with upside.

---

## 4. Map, Exploration & Content

### What's lacking
- **One real map.** `map-00` is built; `map-01` exists but is unused. The world is a single screen.
- **No quests.** Nodes are freeform; nothing tracks objectives. No quest slice, no quest log.
- **All nodes visible, static encounters.** No fog-of-war, no branching, no dynamic spawns.
- **No dungeon system.** The `Dungeon` node type exists but is a stub; `SYSTEMS_TODO.md` lists it
  as not-yet-built.
- **No fast travel / checkpoints.** You walk the whole map every time.

### Fun features to add
- **Quest system.** A `quests` slice + quest-log UI. Hook objectives into existing events we
  already fire: `completeNode()`, battle wins, `collectFloorLoot()`, dialogue completion. Highest
  content-per-effort win on the map side.
- **The Dungeon run.** A series of escalating encounters with between-floor choices (heal / loot /
  risk), persisting per-floor state — uses Map + Battle + Rewards systems we already have. Think
  Slay-the-Spire-lite. This is the marquee content feature.
- **Multiple linked maps / a world map.** Wire `map-01` in and let town-hub exits travel between
  regions, gated by progress.
- **Fog-of-war & hidden nodes** to reward exploration; **fast-travel** between cleared towns.
- **Roaming NPCs / random events** on the map for texture and surprise.

---

## 5. Story, Dialogue & Onboarding

### What's lacking
- **Linear dialogue, no choices.** `DialogueLine` plays straight through; the `emotion` field is
  defined but unused. No branching, no player agency, no state checks.
- **No tutorial.** Default view is `debug`; new players get no guided intro to matching, skills,
  or stats. All mechanics are available at once.
- **No narrative spine.** Dialogue isn't tied to quests or progression.

### Fun features to add
- **Branching dialogue + choices.** Extend `DialogueLine` with optional `choices` that branch the
  scene and can set flags. Foundation for quests, recruitment, and reactivity. Sketched further in
  `docs/DIALOGUE_SYSTEM.md`'s gaps.
- **Wire up the `emotion` field** to swap portraits — cheap expressiveness from data we already
  carry.
- **A tutorial first encounter** — a scripted easy battle that teaches matching → damage →
  cooldown → skill, using existing dialogue + battle systems. Pairs with the "intrinsic
  progression" idea in `docs/ideas-proposals/progression.md`.
- **Story flags & reactive NPCs** so dialogue checks game state (level, items, completed nodes).

---

## 6. Systems, Polish & Quality-of-Life

### What's lacking
- **No save system** (covered in TL;DR — the big one).
- **No settings menu.** Volume lives only in `sound-service.ts` localStorage; there's no UI panel,
  no key rebinding, no accessibility options.
- **No music, only SFX.** The sound service supports a music channel but we ship no looping tracks
  or dynamic/battle music.
- **No accessibility pass.** No colorblind-safe orb palette (critical for a *color*-matching game!),
  no reduced-motion, no text scaling, no screen-reader labels.

### Fun features to add
- **Save/load with slots + autosave.** Add a persistence layer over Zustand (its `persist`
  middleware), serializing party, inventory, resources, map-progress, and floor-loot slices. Unlocks
  longer play sessions and everything that depends on continuity. **Start here.**
- **A real settings menu** — extract the volume controls, add key rebinding and the accessibility
  options below.
- **Colorblind mode** — add a shape/symbol overlay to orbs so matches aren't color-only. Quick win,
  big inclusivity payoff for a match-3.
- **Battle & ambient music** with simple state-based switching (explore / battle / boss) and ducking
  under dialogue — the sound service already has the channels.
- **Reduced-motion toggle** for the particle/screen-shake effects.
- **New Game+** once save exists — carry stats/gear into a harder run.

---

## Suggested Priority (rough effort → impact)

| Priority | Feature | Why | Effort |
|---|---|---|---|
| 🥇 | **Save/load (slots + autosave)** | Unblocks every long-form feature; data model is now stable | Medium |
| 🥇 | **Status effects + cascade combos** | Biggest fun-per-effort upgrade to the core loop | Medium |
| 🥈 | **Quest system** | Turns the existing map into directed content; reuses events we already fire | Medium |
| 🥈 | **Colorblind orb shapes + settings menu** | Accessibility + low-risk polish | Low |
| 🥈 | **Loot drops + rarity + treasure chests** | Makes combat rewards exciting; tables already support it | Low–Medium |
| 🥉 | **Dungeon run system** | Marquee replayable content; needs the systems above first | High |
| 🥉 | **Skill trees + passives + respec** | Build variety and long-term depth | Medium–High |
| 🥉 | **Branching dialogue + tutorial** | Narrative spine and better onboarding | Medium |

> Rule of thumb: land **save/load** and the **status-effect/combo** combat layer first — they
> have the most downstream features depending on them.

---

*Generated as a discussion starter. Pick the threads that excite the team; each section names the
files and existing seams so any of these can be scoped into a real proposal under
`docs/ideas-proposals/`.*
