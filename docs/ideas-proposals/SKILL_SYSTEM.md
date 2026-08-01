# Skill System — Actives & Passives

> Split "skill" into two explicit kinds: **Active skills** (the Ultimates we already have — charge
> over time, one selected per hero, fire on click) and **Passive skills** (new — always-on
> modifiers unlocked along a short linear track per hero). Give every skill a real icon from the
> Indigolay pack, and move all skill management into the pause menu.

**Status: implemented.** Data lives in `src/constants/skills/` (one file per character); passive aggregation in `src/lib/skill-system.ts`.

**Verdict: viable in stages.** Phase 1 (icons) is pure presentation and ships on its own. Phase 2
(passives) adds no new battle systems — every effect is a number folded into math that already
exists, resolved **once at battle start**, exactly the way equipment bonuses already are.

Design intent: **passives are build choices, not stat padding.** Each one moves a lever the player
can already feel — cascade scaling, Guard charge, Guard bleed, stagger push, Ultimate charge speed.
Nothing is a hidden `+2 POW`.

Related: [`ENEMY_STAGGER.md`](./ENEMY_STAGGER.md) (the `staggerPushMultiplier` hook),
[`../GUARD_METER_PLAN.md`](../GUARD_METER_PLAN.md) (the Guard hooks),
[`../RPG_SYSTEM.md`](../RPG_SYSTEM.md) (POW/VIT/SPD).

---

## 1. Goals & non-goals

**Goals**

- **Surface the icon pack.** 271 icons across four class sheets are already built, preloaded, and
  rendered by a working `IndigolaySkillIcon`. Right now not one of them is used by a skill.
- **Add passives** that create distinguishable builds without lengthening a 30–50s battle.
- **Give the crafting economy a sink.** Metals currently only buy equipment.
- **Rehome skill management** out of the town Skills Trainer, which is being removed.

**Non-goals** — deferred deliberately, each with its reason:

| Deferred | Why |
| :--- | :--- |
| Branching skill trees, respec | Prerequisite edges, reachability validation, and a respec flow the save format has no room for. A 2–3h game can't pay that back. |
| Timed buffs/debuffs (`vitResist = 1.0 for 6s`) | There is **no status-effect system**. Building one is its own project. |
| Reactive triggers (`at <20% HP, once per battle`) | Needs per-battle trigger state plus an HP-threshold watcher. |
| Effects reading mid-battle state (`when Guard is full…`) | Breaks the resolve-once model in §6 — see the note there. |
| RNG passives (`25% chance to…`) | Dungeon remixes and 5-star ratings want reproducible battles, and it makes `rpg-calculations.ts` tests probabilistic. |
| Per-colour board-logic changes (bomb caps per orb type) | Touches the anti-runaway caps in `src/constants/battle.ts` that exist specifically to stop cascade blowouts. |

Every deferred item is *additive later*. Nothing here forecloses them.

---

## 2. Why linear tiers, and why not the obvious alternatives

**A branching tree is the wrong shape for this codebase.** Skills today are a flat registry keyed
by id (`SKILL_REGISTRY`) with `unlockLevel` as the only gate. A linear track is a two-field
addition to that. A tree needs prerequisite edges, cycle/reachability validation, and respec —
none of which `CharacterData` or the save format currently supports.

**Definitions must not live inside the character.** An obvious-looking schema is:

```ts
// ✗ Do not do this
export interface CharacterData {
  skillTiers: [SkillTier, SkillTier, SkillTier]; // name, description, iconPath, unlocked
}
```

`CharacterData` is persisted in the party slice and deep-copied into the frozen battle snapshot
(`src/lib/battle-system.ts:84`). Embedding names, descriptions, and icon paths in saved state means
**every balance edit is invisible to existing saves**. The codebase already solved this: characters
store `unlockedSkillIds: string[]`, definitions live in `src/constants/skills.ts`. Passives follow
the same split.

**Passive lookups must not leak into `rpg-calculations.ts`.** Another tempting shape:

```ts
// ✗ Do not do this
export function getPartyCascadeBonus(party: CharacterData[]): number {
  const rogue = party.find((c) => c.class === 'rogue');
  return rogue?.skillTiers[0].unlocked ? CASCADE_BONUS + 0.05 : CASCADE_BONUS;
}
```

`rpg-calculations.ts` is pure math over primitives, with both a test file and a bench file. This
couples it to party composition and hardcoded class strings, and it re-scans the party inside hot
paths. **The correct precedent already exists in this repo:** `getEquipmentComboBonus(character)`
lives in `equipment-system.ts` and feeds a plain number into
`calculateComboMultiplier(cascadeLevel, equipmentComboBonus)`. Passives aggregate the same way.

---

## 3. Vocabulary: two kinds of skill

The whole design depends on keeping these apart. Use these words everywhere, in code and UI.

|  | **Active skill** ("Ultimate") | **Passive skill** |
| :--- | :--- | :--- |
| Exists today | Yes | No — new |
| Behaviour | Charges over time, fires on click | Always on |
| How many | **One selected** per hero, from those unlocked | **All unlocked ones** apply at once |
| Type | `SkillDefinition` | `PassiveSkillDefinition` |
| Registry | `SKILL_REGISTRY` | `PASSIVE_REGISTRY` |
| Character state | `unlockedSkillIds` + `selectedSkillId` | `unlockedPassiveIds` |
| Tiers | **0–3** (tier 0 = the free default, equipped from level 1) | **1–4** (a hero starts with none) |
| Unlock gate | Level **and** resources: L1 / 7 / 14 / 21 (tier 0 free) | Level **and** resources: L4 / 10 / 17 / 24 |

Reaching a level only makes a skill *purchasable* — every unlock beyond tier 0 costs resources
at the Skills tab (`ACTIVE_TIER_COSTS` / `PASSIVE_TIER_COSTS` in `src/constants/skills/tiers.ts`);
nothing is granted free on level-up. Tier 0 is what guarantees no hero ever has an empty active
slot, and `DEFAULT_SKILL_BY_CLASS`
becomes *derived* from each class's tier-0 entry rather than hand-maintained. Gate levels are
calibrated against the EXP curve — see [`SKILL_ROSTER.md`](./SKILL_ROSTER.md) §1–§2.

`SkillDefinition` is **not renamed**. It is already precisely the active-skill shape, and it is
referenced across ~15 files including eight test/bench fixtures. Renaming buys nothing but churn —
this table is the documentation instead.

---

## 4. Data model

### 4.1 Icons

Each class maps to exactly one Indigolay sheet, so a skill only needs a grid position:

```ts
// src/constants/skill-icons.ts
export const CLASS_SKILL_SHEET: Record<CharacterClass, SkillSheetSlug> = {
  warrior: 'warrior-berserker',
  rogue: 'archer-assassin',
  mage: 'mage-sorcerer',
  healer: 'priest-paladin',
};
```

```ts
// src/types/skills.ts
/** Grid position on the owning class's Indigolay sheet. */
export type SkillIconPosition = GridPosition;
```

`SkillDefinition` gains two fields: `icon: SkillIconPosition` and `tier: 0 | 1 | 2 | 3` (see §3 —
tier 0 is the class default). A thin `<SkillIcon class={...} position={...} disabled={...} />`
wrapper picks the right sheet component so callers never touch slugs.

Valid position ranges, from `SKILL_SHEETS`:

| Class | Sheet | Grid | Icons |
| :--- | :--- | :--- | ---: |
| warrior | `warrior-berserker` | 10 × 6 | 57 |
| rogue | `archer-assassin` | 10 × 9 | 84 |
| mage | `mage-sorcerer` | 10 × 8 | 74 |
| healer | `priest-paladin` | 10 × 6 | 56 |

Positions are picked by eye — extend `src/views/skill-debug.tsx` into a contact sheet to choose
them, rather than guessing indices.

### 4.2 Passive modifiers

A **closed set** of modifier keys, each mapping to exactly one hook in §7. This is the core
constraint of the design: **adding a passive is a data edit, not a code edit.**

Modifiers split by what they act on. Some belong to one hero and affect that hero's own actions;
others act on genuinely shared systems (the party Guard meter, the shared item cooldown).

```ts
// src/types/skills.ts

/** Applies to the owning character's own actions. */
export interface CharacterPassiveModifiers {
  /** Additive into CASCADE_DAMAGE_BONUS_PER_LEVEL — steeper cascade ramp. */
  cascadeBonus: number;
  /** Multiplies this character's match-3 damage. */
  matchDamageMultiplier: number;
  /** Multiplies this character's Ultimate damage/healing. */
  skillDamageMultiplier: number;
  /** Multiplies this character's Ultimate charge time. <1 charges faster. */
  skillCooldownMultiplier: number;
  /** Flat Guard added when this character's Ultimate fires. */
  skillGuardRestore: number;
  /** Multiplies stagger push from this character's hits. */
  staggerPushMultiplier: number;
}

/** Applies to party-wide shared systems. */
export interface PartyPassiveModifiers {
  /** Additive onto the Guard charge multiplier. */
  guardChargeRateBonus: number;
  /** Multiplies Guard decay. <1 bleeds slower. */
  guardDecayResistanceMultiplier: number;
  /** Flat effective SPD, for the shared item cooldown only. */
  itemCooldownSpdBonus: number;
}
```

Both are **total** records with neutral identity values (`0` for additive, `1` for multiplicative),
so consumers never write `?? 1`. Definitions supply `Partial<>` and are merged onto the identity.

**Combining rule:** additive keys sum; multiplicative keys multiply. Two `skillDamageMultiplier`
passives at `1.15` and `1.25` yield `1.4375`, not `1.40`. State this in the registry's JSDoc — it
is the one place stacking can surprise you.

### 4.3 Passive definitions

```ts
export interface PassiveSkillDefinition {
  /** Stable unique key, e.g. `warrior-t1-bulwark`. */
  id: string;
  class: CharacterClass;
  /** Position on the class's 4-node track. Tier N requires tier N-1. */
  tier: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  icon: SkillIconPosition;
  /** Character level required before this tier can be bought. */
  unlockLevel: number;
  /** Price at the pause-menu Skills tab. */
  cost: Resources;
  modifiers: Partial<CharacterPassiveModifiers & PartyPassiveModifiers>;
}
```

`CharacterData` gains one field: `unlockedPassiveIds: string[]`, mirroring `unlockedSkillIds`. Read
it as `?? []` at every access point so existing saves migrate silently. Passives are never
*selected* — unlocking arms one permanently — so there is no passive analogue of `selectedSkillId`.

---

## 5. Proposed content

**Superseded — the full roster lives in [`SKILL_ROSTER.md`](./SKILL_ROSTER.md).**

That document defines all 32 skills (4 actives, tiers 0–3, and 4 passives, tiers 1–4, per class),
each matched to a verified Indigolay icon via its `packIcon(n)` addressing scheme, plus the
per-tier resource costs, cross-class stacking analysis, and the migration table from the current
nine skills. Every passive there is expressible in §4.2's key set and resolvable from party state
alone — the constraints §6 depends on.

---

## 6. Resolution: computed once, at battle start

Every passive is deterministic and none change mid-fight, so the whole set collapses into flat
records built when the battle is created. **This is the treatment equipment already gets:**
`createBattleState` calls `getPartyWithEffectiveStats(party)` (`src/lib/battle-system.ts:77`) to
bake equipment bonuses into the snapshot's stats rather than re-deriving them per frame.

Passives follow that precedent exactly:

- **Stat-type effects** (`pow`/`vit`/`spd`), if any are added later, fold into the existing
  effective-stats pass — **zero call sites change** for those.
- **Per-character modifiers** bake onto the snapshot character as `char.passives`, alongside the
  already-baked `char.stats`.
- **Party-wide modifiers** aggregate into a new `BattleState.passives` field.

Both come from one new pure function in `src/lib/skill-system.ts`:

```ts
export function resolvePartyPassives(party: CharacterData[]): {
  party: PartyPassiveModifiers;
  byCharacter: Record<string, CharacterPassiveModifiers>;
};
```

Consumers then read a plain number off the snapshot. No per-tick registry lookups and no
`party.find(...)` in hot paths — which matters: `match3-board.tsx` runs its damage path on every
cascade step, and `battle-atoms.ts` ticks Guard decay every 100 ms
(`BATTLE_TICK_INTERVAL_MS`).

> **Accepted consequence.** Resolving once means a passive keeps working after its owner is KO'd,
> unlike `calculateGuardChargeRate`, which sums living members only. This is the price of the
> one-pass model, and it's worth paying: it's simpler, deterministic, unit-testable, cheap, and it
> avoids a death-spiral where your build evaporates exactly when you're losing. If it plays badly,
> recomputing from living members each tick is a one-function change.

> **Consequence for design.** Any effect that reads mid-battle state — *"when Guard is full…"*,
> *"scales with current Guard fill"*, *"below 20% HP"* — cannot be a number baked into the
> snapshot. Those belong in §1's deferred list, not in the tier table. This is a structural limit,
> not a budget one.

---

## 7. Integration points

Nine hooks, all of which already take a plain number or are trivially adapted.

| Modifier | Consumer | Note |
| :--- | :--- | :--- |
| `cascadeBonus` | `match3-board.tsx:332–338` | Add to `getEquipmentComboBonus(matchingCharacter)` before it reaches `calculateComboMultiplier`. |
| `matchDamageMultiplier` | `match3-board.tsx:338` | Applied to `calculateMatchDamage`'s result. |
| `staggerPushMultiplier` | `use-enemy-attack-timers.ts:229–231` | Scale `calculateStaggerPushMs` **before** `clampStaggerToCycleBudget` — the anti-stunlock cap stays authoritative. |
| `skillDamageMultiplier` | `activateSkillAtom`, `battle-atoms.ts:510` | Applied to `calculateSkillDamage`'s result. |
| `skillGuardRestore` | `activateSkillAtom`, `battle-atoms.ts:585` | Add to `guard` in the same `set`, clamped to `GUARD_MAX`. |
| `skillCooldownMultiplier` | `resolveCharacterCooldown`, `skill-system.ts:116` | Third factor beside SPD and the active skill's own `cooldownMultiplier`. |
| `guardChargeRateBonus` | `match3-board.tsx:354` | Add to `calculateGuardChargeRate(party)`'s result. |
| `guardDecayResistanceMultiplier` | `battle-atoms.ts:478` | Multiply `calculateGuardDecayResistance(party)`'s result. |
| `itemCooldownSpdBonus` | `battle-item-bar.tsx:38` | Also thread through `derived-stats-display.tsx` so the level-up preview stays honest. |

**Balance safety.** Every hook lands *inside* an existing clamp: `MAX_COMBO_MULTIPLIER` (2.0),
`MAX_STAGGER_FRACTION_PER_CYCLE` (0.12), `GUARD_MAX` (100), `MAX_GUARD_REDUCTION`. No proposed
passive raises or removes a cap. That is deliberate — the anti-runaway constants in
`src/constants/battle.ts` are documented as the whole safety story for cascades and stunlock, and
passives are not permitted to reach past them.

---

## 8. UI — a Skills tab in the pause menu

**Superseded — the full UI design lives in [`SKILL_MENU_UI.md`](./SKILL_MENU_UI.md).**

In one paragraph: a new `'skills'` pause-menu tab (roster on the left, per-character Active and
Passive slot rows plus a detail panel on the right), styled after the IndigoLay skill-book preview
using the pack's slot frames and panel art, with equip/unlock actions, explicit resource costs in
the detail panel, and the whole tab honouring the `isInBattle` lock — per §6, the battle snapshot
is frozen at battle start, so a mid-battle purchase would silently not apply. The old inline
`SkillSelector` in the Equip tab is superseded by the new tab and gets removed with it.

---

## 9. Removals & the redundancy this fixes

Delete `src/components/town/skill-store.tsx`, its branch in `town-hub.tsx:95`, and the
`'skill-trainer'` entry in `src/constants/town-backgrounds.ts`.

Worth recording *why* losing it costs nothing: **the trainer is already vestigial.**
`battle-rewards-screen.tsx:173` auto-unlocks every skill with `unlockLevel <= level`, for free, via
`getNewlyUnlockableSkills`. The trainer sells those same skills for gold, and `isSkillUnlocked`
filters each one out of its offerings the moment you level past it. Its only live window is the gap
before you'd have got the skill free anyway.

The two-kind split resolves this cleanly:

- **Active skills** stay level-gated and free. They're the character's identity, not a purchase.
- **Passive skills** cost resources *and* levels. That's where the build choice and the economy
  sink live.

---

## 10. Implementation phases

Each phase is independently shippable. Content source of truth:
[`SKILL_ROSTER.md`](./SKILL_ROSTER.md); UI source of truth:
[`SKILL_MENU_UI.md`](./SKILL_MENU_UI.md) — whose §9 revises this ordering to **UI before engine**
(acceptable because passive modifiers are additive; the tab can ship with passives visible and
unlockable before their combat hookups land).

**Phase 1 — icons only. No mechanics change.**
`icon` on `SkillDefinition`, the `CLASS_SKILL_SHEET` map, a `SkillIcon` wrapper, positions picked
for the nine existing skills. Render them in `skill-selector.tsx`, `pause-menu-stats.tsx`,
`party-display.tsx`, and `skill-unlock-overlay.tsx` — replacing `CHARACTER_ICONS[class]`, which
currently gives all three Warrior skills the same glyph. This alone delivers the visual goal.

**Phase 2 — passives, engine side.**
Types, `PASSIVE_REGISTRY`, `resolvePartyPassives`, `char.passives` + `BattleState.passives` in
`createBattleState`, and the nine hookups in §7. Unit tests in `skill-system.test.ts`: identity
values with nothing unlocked, additive vs. multiplicative stacking, and a clamp test per capped
hook proving no passive can breach `MAX_COMBO_MULTIPLIER` or
`MAX_STAGGER_FRACTION_PER_CYCLE`.

**Phase 3 — the Skills tab.**
The tab, moving `SkillSelector`, and a `useUnlockPassive` hook mirroring
`src/hooks/use-unlock-skill.ts` (validate → `reduceResources` → party action → `showOverlay` →
sound). Reuse `canAfford` from `~/lib/resources`.

**Phase 4 — cleanup.**
Delete the town trainer per §9. Extend `src/views/skill-debug.tsx` into an icon contact sheet and a
passive-toggle harness.

---

## 11. Tunables

All values live in `src/constants/skills.ts` alongside `BASE_SKILL_DAMAGE`, per house convention.

| Constant | Effect of raising it |
| :--- | :--- |
| `PASSIVE_TIER_LEVELS` | Pushes all three unlock gates later; slows how fast builds come online. |
| `PASSIVE_TIER_COSTS` | Makes passives a heavier drain on the crafting economy. |
| `modifiers.cascadeBonus` | Steeper cascade ramp. Saturates against `MAX_COMBO_MULTIPLIER`. |
| `modifiers.matchDamageMultiplier` | Flat throughput on that hero's matches. **Uncapped — the bluntest knob here.** |
| `modifiers.skillDamageMultiplier` | Bigger Ultimates. Uncapped; watch it against boss HP pools. |
| `modifiers.skillCooldownMultiplier` | Below 1 charges faster. Compounds with SPD and the active skill's own `cooldownMultiplier`. |
| `modifiers.skillGuardRestore` | More Guard per Ultimate. Clamped to `GUARD_MAX`. |
| `modifiers.staggerPushMultiplier` | Reaches the per-cycle stagger cap sooner. Cannot exceed it. |
| `modifiers.guardChargeRateBonus` | Gray matches build Guard faster. |
| `modifiers.guardDecayResistanceMultiplier` | Below 1 bleeds slower. Stacks with party VIT. |
| `modifiers.itemCooldownSpdBonus` | Shorter shared item cooldown; diminishing, since it feeds an SPD curve. |

---

## 12. Open questions

1. **Do passives survive their owner's KO?** §6 says yes, for simplicity. Worth a playtest — a
   Warrior dying and the party's Guard suddenly bleeding out may actually read *better* as drama.
2. **Should passives be visible in battle?** A row of small icons under each portrait would sell
   the build, but the battle HUD is already dense.
3. **Is `matchDamageMultiplier` too blunt?** It's the only uncapped, always-on throughput knob. If
   it dominates playtests, cut it and give Mage tier 2 a cascade or crit-shaped effect instead.
4. **Do tiers need a preview?** The level-up screen already previews derived stats
   (`derived-stats-display.tsx`). Showing the same before/after for a pending unlock would reuse
   that component wholesale.
