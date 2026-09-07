# Feature Ideas & Gaps Analysis

A brainstorm of fun features that expand on our existing systems, paired with an honest
assessment of where the current implementations fall short. This is a vision/discussion
doc — nothing here is committed work. It's grounded in the code as it exists today, so each
idea points at the real files and seams where it would plug in.

> Companion to the per-system proposals in [`docs/ideas-proposals/`](./ideas-proposals)
> and the build status in [`docs/SYSTEMS_TODO.md`](./SYSTEMS_TODO.md).

---

### TL;DR — State of the Core Gaps

Several foundational pillars have landed:

1. ~~**No save/load.**~~ **Resolved:** 4-slot persistence (3 manual + 1 autosave) backed by
   isolated localStorage keys, Zod schema validation, migration hooks, disk save indicator badge,
   and browser close/reload protection (`docs/SAVE_LOAD_SYSTEM.md`).
2. ~~**The match-3 board is "solved."**~~ **Resolved:** Cascades combo multiplier, wildcard bomb
   special tiles (3×3 blasts), the party Guard defense meter, and the enemy stagger/flinch system
   have significantly deepened the puzzle loop.
3. ~~**No passives or skill choices.**~~ **Resolved:** Full active (Ultimates) and passive skill
   system across 4 tiers per class, Indigolay icon sprite sheets, and the pause-menu Skills tab
   (`docs/ideas-proposals/SKILL_SYSTEM.md`).
4. ~~**No dungeon system.**~~ **Resolved:** Multi-floor dungeon exploration with authored and
   procedurally randomized runs, room choices, and completion rewards.
5. **Remaining high-leverage fun gap: No status-effect / element layer in combat.** Skills hit for raw
   numbers and resolve instantly. There's no poison, stun, burn, buff/debuff, or elemental matchup —
   even though we ship the icon art for it.

Everything below expands on these and the rest of the systems.

---

## 1. Combat & Match-3 Board

### What's lacking
- ~~**Cascades don't reward you.**~~ **Resolved:** `calculateComboMultiplier` scales damage on a
  diminishing curve per cascade level with glowing combo popups.
- **No status effects or elements.** `CharacterData`/`EnemyData` have no `activeEffects` field;
  skills in `src/constants/skills/` carry damage multipliers and passive hooks. We already
  have ice/fire/lightning/poison icon assets sitting unused.
- ~~**Gray orbs are dead weight.**~~ **Resolved:** gray now charges the party Guard meter
  (and deals tuned-down chip damage). See [GUARD_METER_PLAN.md](./GUARD_METER_PLAN.md).
- **Skills resolve instantly with no animation beat.** A 650ms color flash (skill burst overlay)
  is the payoff for an ultimate. No complex animation sequencing.
- **Enemies are HP sponges.** Attack on a timer, target random living member, die at 0 HP.
  No multi-phase transformations or summons.

### Fun features to add
- [x] **Combo / cascade meter.** Track cascade depth; each chained cascade bumps a damage
  multiplier and shows an escalating "COMBO ×N" callout.
- [x] **Special tiles.** Match 5+ or line matches to spawn **wildcard bomb orbs** (clear a 3×3
  with chain reaction support and cascade spawn throttling).
- [ ] **Status effects system.** New `src/lib/status-system.ts` + an `activeEffects: StatusEffect[]`
  field on entities. Tick effects inside the existing `tickSkillCooldownsAtom` loop. Starter set:
  Poison (DoT), Burn (DoT), Stun (skip next enemy attack), Shield (absorb), Haste/Slow (cooldown
  mods). Surface them as small icons next to HP bars.
- [ ] **Elemental matchups.** Tag skills and enemies with an element; apply a multiplier in
  `calculateDamage()`. Match the puzzle to the boss — e.g. an ice golem takes extra from the
  Mage's fire skill. Turns enemy variety into strategy instead of bigger numbers.
- [ ] **Board hazards.** Enemy attacks that "freeze" a column of orbs for N turns or drop junk
  (gray) orbs — giving enemies a way to disrupt the *puzzle*, not just chip HP.
- [ ] **Boss phases.** Add a `phases: { hpThreshold, onEnter }[]` field to `EnemyData`; check it in
  `damageEnemyAtom`. A boss that enrages at 50% HP, or summons adds, makes encounters memorable.
- [ ] **Active block / defend.** Let a held orb-type or a tapped party member brace for an incoming
  telegraphed hit — a reason to watch the enemy attack timer instead of mashing matches.

---

## 2. Progression, Skills & Characters

### What's lacking
- **Fixed 4-person party.** `INITIAL_PARTY` is hardcoded (`src/constants/party.ts`). No
  recruitment, no bench, no swapping, no character creation.
- **No respec.** Level-up stat allocation (`src/views/level-up-view.tsx`) is permanent. One
  misclick is forever, which discourages experimentation.
- **Equipment is stats-only.** `equipment-system.ts` is solid with rarity tiers, but items are
  currently ±POW/VIT/SPD without custom on-hit or triggered affixes.

### Fun features to add
- [x] **Skill system (Actives & Passives).** 4 Active skill tiers (tier 0 default + 3 unlockables)
  and 4 Passive skill tiers per class with closed-set modifiers (cascade bonus, stagger push,
  guard charge rate, item cooldown, skill damage).
- [x] **Pause Menu Skills Tab.** Interactive skill-book UI with Indigolay sprite icons, resource
  costs, and active skill selection.
- [ ] **Party recruitment & bench.** Convert `INITIAL_PARTY` into a roster the player draws 4 from.
  Recruit new heroes from map nodes / dialogue. Enables a 5th orb color = a 5th class.
- [ ] **Stat respec at the Inn or a new NPC.** Reuse the level-up allocation UI; charge gold/gems.
- [x] **Equipment rarity system.** Common→Legendary tiers with stat multipliers, weighted rolls,
  crafting pity counter, and color-coded UI. (Affixes pending).
- [ ] **Equipment affixes.** Layer random affixes (`+5% crit`, `+10 fire dmg`, `on-match: heal 2`)
  onto high-tier equipment instances.

---

## 3. Economy, Loot & Crafting

### What's lacking
- **Loot drop tables not yet fully populated.** `LootTable` supports `equipableItems` and
  `consumableItems` with probabilities, but mostly drops coins/materials.
- **No animated chest opening.** Treasure nodes exist as a type but resolve via instant notifications.

### Fun features to add
- [x] **Probabilistic drops + rarity.** Rarity tiers, color-coding, and roll hooks implemented.
- [ ] **Treasure chests with a reveal moment.** The `Treasure` node already exists; give it a
  satisfying open animation + reward modal.
- [x] **Sell / pawn at the store.** Sell tab in Item Store converts consumables to coins at half value.
- [x] **Blacksmith Modify tab.** Upgrade equipment one rarity tier, or salvage gear for metal bars.
- [x] **Crafting pity counter.** Hidden bad-luck protection scaling rare craft odds.
- [ ] **A daily/restocking merchant** with rotating rare stock — a reason to return to town.
- [ ] **Gambling mini-game** at a tavern (slots / dice) for a coin sink with upside.

---

## 4. Map, Exploration & Content

### What's lacking
- **Single active world map.** `map-00` is built; multi-region navigation is ready for `map-01`.
- **No quests.** Nodes are freeform; nothing tracks objectives. No quest slice, no quest log.
- **Static encounters.** No fog-of-war, no dynamic enemy spawns.

### Fun features to add
- [x] **The Dungeon run.** Multi-floor encounters with between-floor exploration, persisting
  state, and completion rewards (`src/lib/dungeon-system.ts`).
- [ ] **Quest system.** A `quests` slice + quest-log UI. Hook objectives into existing events:
  `completeNode()`, battle wins, `collectFloorLoot()`, dialogue completion.
- [ ] **Multiple linked maps / a world map.** Wire `map-01` in and let town-hub exits travel between
  regions, gated by progress.
- [ ] **Fog-of-war & hidden nodes** to reward exploration; **fast-travel** between cleared towns.
- [ ] **Roaming NPCs / random events** on the map for texture and surprise.

---

## 5. Story, Dialogue & Onboarding

### What's lacking
- **Linear dialogue, no choices.** `DialogueLine` plays straight through; no branching.
- **No tutorial.** Default view is `debug`/title; new players get no guided walkthrough.

### Fun features to add
- [ ] **Branching dialogue + choices.** Extend `DialogueLine` with optional `choices` that branch the
  scene and can set flags. Foundation for quests and reactivity.
- [ ] **Wire up the `emotion` field** to swap portraits from dialogue data.
- [ ] **A tutorial first encounter** — a scripted easy battle that teaches matching → damage →
  cooldown → skill, using existing dialogue + battle systems.

---

## 6. Systems, Polish & Quality-of-Life

### What's lacking
- **No accessibility pass.** No colorblind-safe orb shapes, no text scaling.

### Fun features to add
- [x] **Save/load with 4 slots + autosave.** 3 manual slots + 1 autosave, localStorage persistence,
  Zod validation, migration hooks, disk save indicator, and browser close guard.
- [x] **Pause menu with Options tab.** Master, Music, SFX volume sliders, Mute toggle, and keyboard guide.
- [x] **Battle & ambient music.** `combatMusic` during battles and `startMenuMusic` on the title screen.
- [ ] **Colorblind mode.** Add a shape/symbol overlay to orbs so matches aren't color-only.
- [ ] **Reduced-motion toggle.** For screen-shake and particle effects.
- [ ] **New Game+** — carry stats/gear into a harder run after completing all content.

---

## Suggested Priority (rough effort → impact)

| Priority | Feature | Why | Effort |
|---|---|---|---|
| 🥇 | **Status effects & elemental matchups** | Biggest fun-per-effort upgrade to combat depth | Medium |
| 🥈 | **Quest system** | Turns the map into directed, rewarding content | Medium |
| 🥈 | **Colorblind orb shapes & accessibility** | Inclusivity + low-risk polish for a color-matching game | Low |
| 🥈 | **Animated treasure chest open reveal** | Delivers drop excitement on map treasure nodes | Low–Medium |
| 🥉 | **World map / Multi-region travel (`map-01`)** | Expands the world beyond the first map | Medium |
| 🥉 | **Branching dialogue & tutorial encounter** | Onboarding and narrative spine | Medium |
| 🥉 | **Equipment affixes & stat respec** | Build variety and long-term gear chasing | Medium–High |

---

*Generated as a living progress & ideas doc. Grounded in the codebase with real file references.*
