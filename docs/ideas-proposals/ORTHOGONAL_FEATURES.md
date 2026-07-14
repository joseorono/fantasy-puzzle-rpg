# Orthogonal Feature Ideas

Brainstorm of features that make the game **more fun and dynamic** by adding *orthogonal*
game design — features that introduce a **new independent axis of decision-making** rather than
just scaling numbers already in the game. Grouped by **implementation difficulty** and tagged
with **expected performance impact on the real-time battle system**.

> Scope: the overworld/map is intentionally left out (there's no real map yet). Battle,
> party/progression, town/economy, and the built-but-unwired **dungeon** system are all fair game.

---

## Grounding: the decision axes we already have

So we can tell what's *actually* orthogonal, here are the levers the current battle system
already gives the player (from `match-3.ts`, `rpg-calculations.ts`, `battle-atoms.ts`):

- **Match size** — 3/4/5/6+ → 1×…2× multiplier.
- **Cascade depth** — chained matches ramp the combo multiplier (√ curve, cap 2.0).
- **Color priority** — which of the 4 heroes acts (damage / heal / cooldown reduction).
- **Offense vs defense** — color orbs attack; **gray** orbs charge the party **Guard** meter.
- **Skill timing** — cooldowns reduced by matching that hero's color; when to spend.
- **Item timing** — shared, SPD-scaled item cooldown (heal / row-clear / col-clear / energy).
- **Target + preemptive window** — pick the enemy; hit still-"observing" enemies for +25%.
- **Build** — POW/VIT/SPD allocation, equipment (weapon/armor, comboBonus), one active skill.

What's **absent** today (fertile ground): no status effects/buffs/debuffs, only one special
tile (wildcard bomb), enemies do uniform random-target basic hits with no abilities/telegraphs
beyond the opening standby, no ultimate/limit system, no elemental weaknesses, `turn`/`score`
are tracked but vestigial, and dungeon combat bypasses the rewards/level-up flow.

**Rating legend**

- **Effort**: 🟢 Low (1 system, few files) · 🟡 Medium (new subsystem or cross-cutting) · 🔴 High (new pillar / lots of content/UX).
- **Battle perf**: how much it loads the real-time loop (the 100ms cooldown/Guard tick, board match-resolution, and Jotai re-render pressure). Low / Med / High.

---

## TIER 1 — Low effort, high spice (quick wins)

### 1. Enemy elemental weakness / resistance  🟢 · perf: **Low**

Give each enemy a `weakColor` (and optionally `resistColor`). Matching the weak color deals a
bonus multiplier; resisted color is chipped. Optional spicy variant: the weakness **rotates**
every few seconds for live target-reading.

- *Orthogonal axis:* makes **which color you prioritize depend on the enemy**, decoupled from raw match size.
- *Differential:* rewards a diverse party & reading the board; punishes mono-color spam.
- *Touches:* `EnemyData` (`types/rpg-elements.ts`), `damageEnemyAtom` (one lookup), small target-panel indicator.

### 2. Momentum / "Fever" meter  🟢 · perf: **Low**

A streak meter that builds with consecutive matches and fast play and boosts **all** damage;
it **decays or resets when the party takes a hit**. Repurposes the vestigial `score`/`turn`.

- *Orthogonal axis:* a **tempo/aggression** dimension independent of per-match damage.
- *Differential:* aggressive uninterrupted play vs. cautious Guard-tanking become real choices.
- *Touches:* one number in `BattleState`, the existing 100ms tick for decay, a UI bar.

### 3. Telegraphed heavy attacks (mid-battle wind-ups)  🟢–🟡 · perf: **Low–Med**

Extend the existing standby/preemptive concept from *opening only* to *recurring*: enemies
periodically enter a visible "charging" state for N seconds. Enough damage (or a stun)
**interrupts** it; otherwise a big hit lands.

- *Orthogonal axis:* a **race/priority** layer — burst the charger vs. keep tempo.
- *Differential:* elevates burst builds and target-switching skill.
- *Touches:* `use-enemy-attack-timers.ts`, one enemy state field, telegraph UI (standby ring art already exists).
- *See also:* [`ENEMY_STAGGER.md`](./ENEMY_STAGGER.md) — the always-on, low-drama cousin: every hit nudges this same attack timer back (VIT-resisted, hard-capped so it can't stunlock).

### 4. Battle grade → loot/rarity bonus  🟢 · perf: **None** (end-of-battle)

Turn the vestigial `score` into an **S/A/B grade** from speed + max combo + preemptive strikes,
feeding `rarityBias` in `combineLootFromEnemies`.

- *Orthogonal axis:* a **mastery/style** reward layer over the win/lose binary.
- *Differential:* incentivizes optimizing *how* you win; strong replay hook.
- *Touches:* battle-end path, `lib/loot.ts`, `lib/rarity.ts`.

### 5. Unify dungeon combat with the rewards/level-up flow  🟢 · perf: **None**

Not orthogonal by itself, but a **dynamism enabler**: dungeon wins currently skip
loot/EXP/level-up. Routing them through the shared rewards flow (or a batched end-of-run tally)
makes the fully-built dungeon system a real content pillar and a testbed for everything below.

- *Touches:* `dungeon-view.tsx` / `resolveBattleWinAtom`, `battle-rewards-screen.tsx`.

---

## TIER 2 — Medium effort (new subsystems, big depth)

### 6. ⭐ Status Effect Engine (buffs & debuffs) — the keystone  🟡 · perf: **Med**

A generic effect system on **both heroes and enemies**: DoTs (poison/burn), control
(stun/freeze = skip next attack), `vulnerable` (+dmg taken), `attack-up`, `regen`, `shield`.
Effects tick on the **already-present 100ms loop** and are applied by skills, special orbs, or
enemy abilities.

- *Orthogonal axis:* adds a whole **time/state dimension** — the board is no longer stateless between moves.
- *Differential:* unlocks DoT builds, control builds, buff-stacking — huge.
- *Perf note:* per-entity `statuses[]` ticked every 100ms + more re-renders; keep atoms narrow (per-entity) to bound it.
- *Touches:* new `lib/status-system.ts`, `BattleState` (party/enemy gain `statuses[]`), a tick atom, skill defs gain `applyStatus`, status-badge UI.
- **This is the multiplier that makes #3, #8, #14, #15 far cheaper — recommend building it first.**

### 7. New special tiles: blast & color-bomb  🟡 · perf: **Med**

Extend the existing `isBomb`/3×3-detonation/BFS-chain infra: **match-4 → blast orb** (clears a
row or column on match); **match-5 → color orb** (clears all of one color).

- *Orthogonal axis:* **match *shape*** strategy, independent of size.
- *Differential:* setup-and-detonate planning vs. greedy matching.
- *Touches:* `match-3.ts` (creation + detonation reuse bomb path), `Orb` type, board render.

### 8. Hazard / obstacle orbs (enemy-applied)  🟡 · perf: **Med**

Enemies convert board orbs into **stone** (blocks matching until cleared by an adjacent match)
or **cursed** (DoT if not cleared within N moves — ties into the status engine).

- *Orthogonal axis:* **board-state management under pressure**, a reactive/defensive layer.
- *Differential:* punishes tunnel-vision; rewards board awareness.
- *Touches:* `match-3.ts` (new orb flags), an enemy ability, board tick, render.

### 9. Party Ultimate / Limit Break  🟡 · perf: **Low–Med**

The `fill-ultimate` / energy-potion language already implies this. Add a meter (shared or
per-hero) charged by matches and damage taken; unleash a scripted payoff (screen-clear, full
heal, board reshuffle, party buff).

- *Orthogonal axis:* a **bank-vs-spend** resource separate from cooldowns.
- *Differential:* comeback mechanic + burst-timing decisions; distinct per class.
- *Touches:* `battle-atoms.ts` (`fillPartyUltimateAtom` partly exists), activation UI, per-class ultimate defs.

### 10. Hero active board-powers (class identity on the board)  🟡 · perf: **Med**

A second, cost-gated button per hero that **manipulates the board**: Rogue = shuffle, Mage =
convert 3 orbs to a chosen color, Warrior = spawn a bomb, Healer = convert orbs to gray (Guard).

- *Orthogonal axis:* turns each class into a distinct **board-manipulation identity**.
- *Differential:* class choice reshapes *how you make matches*, not just whose damage lands.
- *Touches:* a light skill-style system, board atoms (`clearRow`/`clearColumn`/`createBombOrb` already exist), UI.

### 11. Threat / taunt targeting  🟡 · perf: **Low**

Replace random party targeting with a **threat model**: high-damage heroes draw fire; Warrior
can **taunt** to absorb hits.

- *Orthogonal axis:* a **protect-the-squishy** positioning layer; makes VIT/Guard strategic.
- *Differential:* enables genuine tank play; synergizes with #16.
- *Touches:* `damagePartyAtom` target selection, per-hero threat field, a warrior skill.

### 12. Skill loadout: equip 2 active skills  🟡 · perf: **Low**

Today only one `selectedSkillId` is active. Let heroes slot **two** active skills.

- *Orthogonal axis:* a **build-composition** dimension in the party layer.
- *Differential:* far more class-build variety with existing skill content.
- *Touches:* `selectedSkillId` → array, skill activation UI, `party` slice.

### 13. Charms / accessories (3rd equipment slot) with on-match procs  🟡 · perf: **Low–Med**

Add an accessory slot granting **battle-behavior procs** rather than flat stats: e.g. "5% chance
a match spawns a bomb", "gray matches also heal 2", "first hit each fight is blocked".

- *Orthogonal axis:* ties the **economy/build** layer directly to in-battle behavior.
- *Differential:* proc-build theorycrafting; a strong loot/economy sink.
- *Touches:* `EquipmentSlot` (add `accessory`), equipment defs + effect hooks in the match resolver.

---

## TIER 3 — High effort (new pillars)

### 14. Enemy archetypes with real mechanics  🔴 · perf: **Med–High**

Distinct enemy kits built on #6/#1/#3: **shielded** (needs Guard-break or a specific color),
**armored** (flat reduction vs. small matches), **splitter** (spawns adds on death within
`MAX_ENEMIES_PER_BATTLE`), **enrage timer**, **enemy healer**, **summoner**.

- *Orthogonal axis:* each fight becomes a **distinct puzzle** demanding a different approach.
- *Differential:* the single biggest driver of moment-to-moment variety.
- *Touches:* `EnemyData` ability defs, enemy AI hook, several combat atoms; content-heavy.

### 15. Elemental reaction system  🔴 · perf: **Med**

Layer reactions on #1 + #6: applying two elements triggers a payoff (burn + freeze → shatter
burst, etc.), Genshin-style.

- *Orthogonal axis:* deep **combo/theorycraft** ceiling.
- *Differential:* highest skill ceiling of anything here.
- *Touches:* a reactions table in `status-system`, damage pipeline; heavy on balancing/UX.

### 16. Formation / front–back rows  🔴 · perf: **Low runtime, High UI/model**

Position the party in front/back lines: front takes more hits but hits harder; back is
protected. Skills can reposition.

- *Orthogonal axis:* a **positioning** build axis; pairs with #11 threat.
- *Touches:* party model, `damagePartyAtom` weighting, party/battle UI rework.

### 17. Passive trait / perk board  🔴 · perf: **None** (meta)

A per-character perk tree (distinct from stats and from the `licenses` credits UI): "matches of
5+ pierce armor", "start each battle with 25 Guard", "revive once per battle".

- *Orthogonal axis:* a **long-term progression** layer orthogonal to POW/VIT/SPD.
- *Differential:* durable build identity across a run.
- *Touches:* new progression slice + UI; hooks into combat via passive checks.

### 18. Wave / endless "Horde" battle mode  🔴 · perf: **Low–Med per wave**

A mode of escalating enemy waves with banking rewards and optional per-wave modifiers
("Omens"/"Curses": orbs fall faster, one color disabled, Guard off, +loot). Since there's no
map, attach modifiers to **encounter/dungeon-floor configs**. Doubles as the showcase/testbed
for #6–#15.

- *Orthogonal axis:* an **endurance/resource-management** playstyle + roguelike run variety.
- *Differential:* strong dynamism-per-effort *once the status/ultimate systems exist*.
- *Touches:* new battle-mode orchestration (reuse `setupBattle`), reward accumulation, modifier hooks across systems.

---

## Summary matrix

| # | Feature | Effort | Battle perf | New axis |
|---|---------|--------|-------------|----------|
| 1 | Enemy elemental weakness | 🟢 | Low | color-priority per enemy |
| 2 | Momentum / Fever meter | 🟢 | Low | tempo / aggression |
| 3 | Telegraphed heavy attacks | 🟢🟡 | Low–Med | race / interrupt priority |
| 4 | Battle grade → loot | 🟢 | None | mastery / style |
| 5 | Unify dungeon rewards | 🟢 | None | (enabler) |
| 6 | ⭐ Status effect engine | 🟡 | Med | time / state |
| 7 | Blast & color-bomb tiles | 🟡 | Med | match shape |
| 8 | Hazard / obstacle orbs | 🟡 | Med | board-state management |
| 9 | Party ultimate / limit break | 🟡 | Low–Med | bank vs spend |
| 10 | Hero board-powers | 🟡 | Med | class board identity |
| 11 | Threat / taunt targeting | 🟡 | Low | protect-the-squishy |
| 12 | 2-skill loadout | 🟡 | Low | build composition |
| 13 | Charms w/ on-match procs | 🟡 | Low–Med | economy ↔ battle procs |
| 14 | Enemy archetypes | 🔴 | Med–High | per-fight puzzle |
| 15 | Elemental reactions | 🔴 | Med | combo theorycraft |
| 16 | Formation / rows | 🔴 | Low (UI High) | positioning |
| 17 | Passive perk board | 🔴 | None | long-term progression |
| 18 | Wave / Horde mode | 🔴 | Low–Med | endurance / run variety |

---

## Dependency / build-order note

**Status Effect Engine (#6) is the keystone** — it makes #3 (stun-interrupts), #8 (cursed
orbs), #14 (enemy kits), and #15 (reactions) dramatically cheaper. Standalone quick wins with
no dependencies: **#1, #2, #4, #7, #9**. Suggested first pass for maximum fun-per-effort:
**#1 + #2 + #9** (a spicy combat feel in days), then **#6** to unlock the deep tier.
