# Skill Roster — every Active and Passive, per character

> The content half of the skill system: **4 Active skills (Tier 0–3) and 4 Passive skills
> (Tier 1–4) for each of the four heroes**, 32 in total, every one matched to a specific verified
> icon from the Indigolay pack.

**Status: proposal.** Architecture lives in [`SKILL_SYSTEM.md`](./SKILL_SYSTEM.md) — the
Active/Passive split, the closed `PassiveModifiers` key set, resolve-once-at-battle-start, and the
pause-menu Skills tab. **This document supersedes its §5** and widens its `tier: 1 | 2 | 3` to
`0 | 1 | 2 | 3` for actives and `1 | 2 | 3 | 4` for passives.

Design intent: **actives are sidegrades, not a ladder.** A later unlock is not strictly better — it
trades charge speed for damage, or single-target burst for spread. The player picks what suits the
fight, not the highest number.

---

## 1. The EXP curve these gates assume — **implemented**

The gates below assume a ~3 hour run ending around **level 30**. The original curve could not
deliver that, so it was replaced as a separate change. Recorded here because every level gate in
this document is calibrated against it.

**What was wrong.** `getExpThresholdForLevel` was `Math.floor(Math.exp(level))`, and
`calculateLevelUpsForParty` awards the **full** battle EXP to *every* party member — it is not split
(`battle-rewards-screen.tsx:403`). Against a ~120 EXP world-00 fight that meant:

| Target level | 5 | 10 | 17 | 24 | 30 |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Cumulative EXP | 83 | 12.8 K | 1.4 ×10⁷ | 1.5 ×10¹⁰ | 6.2 ×10¹² |
| Battles @ 120 EXP | <1 | 107 | 117 K | 1.3 ×10⁸ | **5.2 ×10¹⁰** |

Levels 2–5 all landed inside the **first battle**, and past level 10 the curve detonated. No
`expReward` value fixes that — the exponent was the problem.

**What replaced it.** Tunables in `src/constants/progression.ts`; both curves are a matched pair.

```ts
export const EXP_BASE = 12;            // getExpThresholdForLevel = floor(EXP_BASE * level ** EXP_CURVE_POWER)
export const EXP_CURVE_POWER = 1.5;
export const ENEMY_EXP_PER_HP = 1 / 8; // calculateEnemyExpReward = round(maxHp * PER_HP + FLAT)
export const ENEMY_EXP_FLAT = 12;
```

Enemy EXP is now **derived from max HP** rather than hand-authored. Durability is the honest proxy
for what a fight costs the player — there is no defense stat, so time-to-kill tracks HP directly.
The old hand-picked values had a 68 HP Swamp Frog at 30 EXP against a 400 HP Moss Golem at 60,
making trash nearly 3× the EXP per second; deriving from HP makes that inversion impossible.
World-00 now reads `MOSS_GOLEM` **62** and `SWAMP_FROG` **21** — a golem-plus-two-frogs fight is
**104 EXP**.

Resulting pacing, with EXP per battle scaling from ~100 early to ~450 by level 30:

| Level | 4 | 7 | 10 | 14 | 17 | 21 | 24 | 30 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Cumulative EXP | 107 | 513 | 1 330 | 3 206 | 5 299 | 9 122 | 12 837 | **22 671** |
| Cumulative battles | 0.9 | 3.6 | 7.9 | 16.1 | 23.9 | 36.1 | 46.6 | **70.6** |

**≈ 71 battles to level 30** — about 3 hours at ~2.5 min per battle cycle including rewards, map
movement, and menus. A level-up lands every 2–3 battles on average.

---

## 2. Tiers and unlock gates

Both kinds are tiered, and the numbering carries meaning: **tier 0 is what you start with.**

- **Actives — Tier 0…3.** Tier 0 is the class's default Ultimate: unlocked at level 1, free, and the
  `selectedSkillId` a new character begins with. It guarantees **no hero ever has an empty active
  slot**. Tiers 1–3 are alternatives the player may swap into that one slot.
- **Passives — Tier 1…4.** No tier 0 — a character starts with none. Passives are **not equipped**:
  unlocking one turns it on permanently, and every unlocked passive applies at once.

| | Tier 0 | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Actives** — level-gated, free | **L1** | L7 | L14 | L21 | — |
| **Passives** — level **and** resources | — | L4 | L10 | L17 | L24 |

Interleaved against the curve in §1, unlocks land at roughly these battle counts:

| Battle | 0 | 1 | 4 | 8 | 16 | 24 | 36 | 47 | 71 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Unlock | A‑T0 | P‑T1 | A‑T1 | P‑T2 | A‑T2 | P‑T3 | A‑T3 | P‑T4 | *end* |

Something new every few battles for the first two-thirds of the run, with the last unlock at L24 —
comfortably before a level-30 finish, so the final stretch is played with a complete build rather
than still assembling one. The tier-1 passive arriving in battle 1 is intentional: its **resource**
cost, not its level, is what actually gates it.

`DEFAULT_SKILL_BY_CLASS` should be **derived** from the tier-0 entry of each class's active list,
not hand-maintained. Two hand-written lists that must agree is exactly the drift
[`SKILL_SYSTEM.md`](./SKILL_SYSTEM.md) §2 warns about.

---

## 3. How icons are addressed

`scripts/build-skill-icon-spritesheets.py` packs `sorted(list_pngs(...))` at `cols = 10`, placing
icon `i` at `x = (i % 10) * size`, `y = (i // 10) * size`. The source pack zero-pads its indices
(`_01_` … `_84_`), so **lexical order is numeric order** and the pack's own 1-based number maps
straight to a grid cell:

```
row = (packIndex - 1) / 10   (integer division)
col = (packIndex - 1) % 10
```

`UI_SkillIcon_WR_52_ReleasePower.png` is therefore *always* `{ row: 5, col: 1 }`.

Every pick below has been **visually reviewed against the rendered sheets** — not just
index-verified. Where a filename's art didn't match its skill's job (a flaming flail standing in
for the starter party heal), the pick was swapped, so the table is safe to trust on both counts.

**Never hand-write `{row, col}` pairs.** Define a helper and reference icons by their pack number,
so every pick is auditable against its filename at a glance:

```ts
// src/constants/skills/icons.ts
/** Pack index (1-based, as in the source filename) → grid cell on the class sheet. */
export function packIcon(packIndex: number): SkillIconPosition {
  return { row: Math.floor((packIndex - 1) / 10), col: (packIndex - 1) % 10 };
}

export const CLASS_SKILL_SHEET: Record<CharacterClass, SkillSheetSlug> = {
  warrior: 'warrior-berserker',
  rogue: 'archer-assassin',   // ← not an obvious name match
  mage: 'mage-sorcerer',
  healer: 'priest-paladin',   // ← not an obvious name match
};
```

| Class | Sheet | Grid | Icons | Max `packIcon` |
| :--- | :--- | :--- | ---: | ---: |
| warrior | `warrior-berserker` | 10 × 6 | 57 | 57 |
| rogue | `archer-assassin` | 10 × 9 | 84 | 84 |
| mage | `mage-sorcerer` | 10 × 8 | 74 | 74 |
| healer | `priest-paladin` | 10 × 6 | 56 | 56 |

**Sub-archetype selection rule.** Each sheet ships two archetypes blended together. Within them:
the **Warrior takes the Berserker-flavoured icons** (blood, fire, whirlwind, raw force) rather than
the knightly ones, and the **Healer takes the Paladin-flavoured icons** (light, judgment, aura,
sanctuary) rather than the nature-priest ones. Rogue and Mage draw freely across their sheets'
sub-themes for variety.

Source of truth for picking new icons:
`<OneDrive>/Documents/assets/indigolay-mega/PixelSkillIconsBookUI_PNG_v1.0/SkillIcon/01_Normal/102/`

---

## 4. File layout

Split the current single `src/constants/skills.ts` into a folder — one file per character, as the
data is per-character and will keep growing.

```
src/constants/skills/
  index.ts      Assembles SKILL_REGISTRY, PASSIVE_REGISTRY, SKILLS_BY_CLASS,
                PASSIVES_BY_CLASS, DEFAULT_SKILL_BY_CLASS, BASE_SKILL_DAMAGE
  icons.ts      packIcon() + CLASS_SKILL_SHEET
  warrior.ts    WARRIOR_ACTIVES + WARRIOR_PASSIVES
  rogue.ts
  mage.ts
  healer.ts
```

`index.ts` **must preserve the current public surface** (`SKILL_REGISTRY`,
`DEFAULT_SKILL_BY_CLASS`, `SKILLS_BY_CLASS`, `BASE_SKILL_DAMAGE`) so the existing
`~/constants/skills` importers keep working untouched — this is a folder split, not an API change.

Each character file declares a local `ICON` map named after the source PNGs, so definitions read
semantically instead of numerically:

```ts
// src/constants/skills/warrior.ts
const ICON = {
  smash: packIcon(7),            // WR_07_Smash
  whirlwind: packIcon(33),       // WR_33_Whirlwind
  sharpBlow: packIcon(10),       // WR_10_SharpBlow
  overwhelm: packIcon(54),       // WR_54_Overwhelm
  ironSkin: packIcon(18),        // WR_18_IronSkin
  bloodRoar: packIcon(15),       // WR_15_BloodRoar
  indomitableWill: packIcon(50), // WR_50_IndomitableWill
  releasePower: packIcon(52),    // WR_52_ReleasePower
} satisfies Record<string, SkillIconPosition>;
```

---

## 5. 🛡️ Warrior — Berserker

**Blue orbs · `maxCooldown` 30 s.** The most-fired Ultimate in the party after the Rogue, so its
tier-0 can afford to be plain. Identity: raw force and staying power. Passives feed the Guard meter
and stagger, but through berserker imagery — iron skin and roaring, not shields and parries.

### Actives

| Tier | Lv | Name | Icon | Target | Dmg × | Flat | Charge × |
| ---: | ---: | :--- | :--- | :--- | ---: | ---: | ---: |
| 0 | 1 | **Smash** | `packIcon(7)` · `WR_07_Smash` · r0c6 | enemy | 3 | 10 | 1.0 |
| 1 | 7 | **Whirlwind** | `packIcon(33)` · `WR_33_Whirlwind` · r3c2 | allEnemy | 2 | 0 | 1.4 |
| 2 | 14 | **Sharp Blow** | `packIcon(10)` · `WR_10_SharpBlow` · r0c9 | enemy | 1.5 | 5 | **0.7** |
| 3 | 21 | **Overwhelm** | `packIcon(54)` · `WR_54_Overwhelm` · r5c3 | enemy | 4 | 20 | 1.6 |

*Sharp Blow is the fast, cheap sidegrade — a golden fist strike whose name promises exactly what it
does. (An earlier draft called it "Bleed", which wrongly implied a damage-over-time system.)*

### Passives

| Tier | Lv | Name | Icon | Modifiers |
| ---: | ---: | :--- | :--- | :--- |
| 1 | 4 | **Iron Skin** | `packIcon(18)` · `WR_18_IronSkin` · r1c7 | `guardDecayResistanceMultiplier: 0.88` |
| 2 | 10 | **Blood Roar** | `packIcon(15)` · `WR_15_BloodRoar` · r1c4 | `staggerPushMultiplier: 1.5` |
| 3 | 17 | **Indomitable Will** | `packIcon(50)` · `WR_50_IndomitableWill` · r4c9 | `guardChargeRateBonus: 0.15` |
| 4 | 24 | **Unleash Power** | `packIcon(52)` · `WR_52_ReleasePower` · r5c1 | `skillDamageMultiplier: 1.2`, `skillGuardRestore: 15` |

---

## 6. 🏹 Rogue — Archer / Assassin

**Green orbs · `maxCooldown` 20 s — the shortest in the party.** Its Ultimate comes around often, so
its numbers are the lowest and its tier-3 is the party's cheapest AoE. Identity: tempo. Icons span
archery, hunting, and shadow.

### Actives

| Tier | Lv | Name | Icon | Target | Dmg × | Flat | Charge × |
| ---: | ---: | :--- | :--- | :--- | ---: | ---: | ---: |
| 0 | 1 | **Aimed Shot** | `packIcon(1)` · `AC_01_AimedShot` · r0c0 | enemy | 1 | 30 | 1.0 |
| 1 | 7 | **Multishot** | `packIcon(2)` · `AC_02_Multishot` · r0c1 | allEnemy | 1 | 10 | 1.2 |
| 2 | 14 | **Shadow Strike** | `packIcon(52)` · `AC_52_ShadowStrike` · r5c1 | enemy | 1.5 | 10 | **0.7** |
| 3 | 21 | **Arrow Storm** | `packIcon(30)` · `AC_30_ArrowStorm` · r2c9 | allEnemy | 2 | 10 | 1.5 |

### Passives

| Tier | Lv | Name | Icon | Modifiers |
| ---: | ---: | :--- | :--- | :--- |
| 1 | 4 | **Hawk Eye** | `packIcon(6)` · `AC_06_HawkEye` · r0c5 | `cascadeBonus: 0.05` |
| 2 | 10 | **Wolf's Howl** | `packIcon(15)` · `AC_15_WolfsHowl` · r1c4 | `staggerPushMultiplier: 1.5` |
| 3 | 17 | **Backstab** | `packIcon(53)` · `AC_53_Backstab` · r5c2 | `matchDamageMultiplier: 1.12` |
| 4 | 24 | **Shadow Dash** | `packIcon(50)` · `AC_50_ShadowDash` · r4c9 | `skillCooldownMultiplier: 0.85` |

*Wolf's Howl deliberately twins the Warrior's Blood Roar — the game's two `staggerPushMultiplier`
passives are both a beast's cry that makes enemies flinch, one per damage-dealer archetype.*

---

## 7. 🔮 Mage — Sorcerer

**Purple orbs · `maxCooldown` 50 s.** Against a 30–50 s battle that is roughly *one* Ultimate per
fight, which makes the tier-2 fast-charge option the most consequential unlock in the roster — it
is what turns the Mage from a one-shot into a participant. Icons take one spell per element:
fire, lightning, ice, then fire again at cataclysm scale.

### Actives

| Tier | Lv | Name | Icon | Target | Dmg × | Flat | Charge × |
| ---: | ---: | :--- | :--- | :--- | ---: | ---: | ---: |
| 0 | 1 | **Fireball** | `packIcon(1)` · `MG_01_Fireball` · r0c0 | enemy | 5 | 0 | 1.0 |
| 1 | 7 | **Chain Lightning** | `packIcon(22)` · `MG_22_ChainLightning` · r2c1 | allEnemy | 3 | 0 | 1.3 |
| 2 | 14 | **Ice Bolt** | `packIcon(31)` · `MG_31_IceBolt` · r3c0 | enemy | 2.5 | 0 | **0.7** |
| 3 | 21 | **Meteor** | `packIcon(4)` · `MG_04_Meteor` · r0c3 | allEnemy | 4 | 0 | 1.6 |

### Passives

| Tier | Lv | Name | Icon | Modifiers |
| ---: | ---: | :--- | :--- | :--- |
| 1 | 4 | **Focus Boost** | `packIcon(62)` · `MG_62_FocusBoost` · r6c1 | `skillDamageMultiplier: 1.15` |
| 2 | 10 | **Mana Burst** | `packIcon(67)` · `MG_67_ManaBurst` · r6c6 | `matchDamageMultiplier: 1.15` |
| 3 | 17 | **Haste** | `packIcon(45)` · `MG_45_Haste` · r4c4 | `skillCooldownMultiplier: 0.85` |
| 4 | 24 | **Overload** | `packIcon(23)` · `MG_23_Overload` · r2c2 | `skillDamageMultiplier: 1.25`, `skillCooldownMultiplier: 1.15` |

*Overload is the roster's one explicit trade-off — a bigger nuke that charges slower. With Focus
Boost it reaches `1.15 × 1.25 = 1.4375×` skill damage at `1.15×` the charge time.*

---

## 8. 📜 Healer — Paladin

**Yellow orbs · `maxCooldown` 60 s — the longest in the party.** Three of the four actives heal;
**Light Judgment is the sole damage option**, offered as a deliberate sacrifice of the party's only
dedicated heal for a turn of pressure. Icons are the Paladin half of the sheet: light, judgment,
aura, sanctuary — no herbs, springs, or fairies.

### Actives

| Tier | Lv | Name | Icon | Target | Dmg × | Flat | Charge × |
| ---: | ---: | :--- | :--- | :--- | ---: | ---: | ---: |
| 0 | 1 | **Heal** | `packIcon(4)` · `PR_04_Heal` · r0c3 | allAlly | 4 | 0 | 1.0 |
| 1 | 7 | **Salvation** | `packIcon(47)` · `PR_47_Salvation` · r4c6 | ally | 6 | 0 | **0.7** |
| 2 | 14 | **Light Judgment** | `packIcon(6)` · `PR_06_LightJudgment` · r0c5 | allEnemy | 2.5 | 10 | 1.3 |
| 3 | 21 | **Resurrection** | `packIcon(49)` · `PR_49_Resurrection` · r4c8 | allAlly | 6 | 0 | 1.5 |

*Tier 0 is plainly named **Heal** on purpose — the classic JRPG starter, marked by the
unmistakable heart-in-a-gold-ring icon. `allAlly` heals the living and revives the dead at half
value (`healAndReviveAllPartyMembers`), which is why the tier-3 is **Resurrection** — its winged
halo icon and its name both state the mechanic. `ally` targets the lowest-HP% living member only.*

### Passives

| Tier | Lv | Name | Icon | Modifiers |
| ---: | ---: | :--- | :--- | :--- |
| 1 | 4 | **Blessing of Courage** | `packIcon(1)` · `PR_01_BlessingOfCourage` · r0c0 | `itemCooldownSpdBonus: 10` |
| 2 | 10 | **Barrier of Light** | `packIcon(12)` · `PR_12_BarrierOfLight` · r1c1 | `skillGuardRestore: 20` |
| 3 | 17 | **Aura of Glory** | `packIcon(22)` · `PR_22_AuraOfGlory` · r2c1 | `guardDecayResistanceMultiplier: 0.9` |
| 4 | 24 | **Beacon of Light** | `packIcon(42)` · `PR_42_BeaconOfLight` · r4c1 | `skillCooldownMultiplier: 0.8` |

---

## 9. Coverage and cross-class stacking

Every key in the closed set is used, and none is used by all four classes:

| Modifier key | Scope | Warrior | Rogue | Mage | Healer |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `cascadeBonus` | per-character | | ✅ | | |
| `matchDamageMultiplier` | per-character | | ✅ | ✅ | |
| `skillDamageMultiplier` | per-character | ✅ | | ✅ | |
| `skillCooldownMultiplier` | per-character | | ✅ | ✅ | ✅ |
| `skillGuardRestore` | per-character | ✅ | | | ✅ |
| `staggerPushMultiplier` | per-character | ✅ | ✅ | | |
| `guardChargeRateBonus` | **party-wide** | ✅ | | | |
| `guardDecayResistanceMultiplier` | **party-wide** | ✅ | | | ✅ |
| `itemCooldownSpdBonus` | **party-wide** | | | | ✅ |

**Where stacking actually happens.** Only the party-wide keys compound across characters. Per
[`SKILL_SYSTEM.md`](./SKILL_SYSTEM.md) §4.2, additive keys sum and multiplicative keys multiply:

- `guardDecayResistanceMultiplier` — Iron Skin `0.88` × Aura of Glory `0.9` = **`0.792`**. With both
  unlocked the Guard meter bleeds ~21 % slower, on top of whatever party VIT contributes.
- Everything else marked *per-character* does **not** compound. Warrior and Rogue both take
  `staggerPushMultiplier: 1.5`, but each scales only its own hits — there is no `2.25×`.

That distinction is the single easiest thing to get wrong when tuning. Keep the Scope column
alongside any value change.

---

## 10. Passive costs

Passives are dual-gated. Given how quickly early levels arrive (§1), **resources are the real
pacing lever** and the level gate is mostly a floor. Costs lean on crafting metals so passives
compete with equipment for the same materials.

| Tier | Level | Cost |
| ---: | ---: | :--- |
| 1 | 4 | 150 coins · 5 iron |
| 2 | 10 | 300 coins · 10 iron · 5 silver |
| 3 | 17 | 500 coins · 10 silver · 5 gold |
| 4 | 24 | 800 coins · 15 silver · 10 gold |

Same cost table for all four classes — per-class pricing would imply one hero's passives are worth
more, which they are not.

---

## 11. Migration from the current nine

Every existing active is reworked. The ids change, so three groups of references need updating.

| Current id | Fate |
| :--- | :--- |
| `warrior-power-strike` | → `warrior-smash` (tier 0) |
| `warrior-cleave` | → `warrior-whirlwind` (tier 1) |
| `warrior-execute` | → `warrior-overwhelm` (tier 3) |
| `rogue-assassinate` | → `rogue-aimed-shot` (tier 0) |
| `rogue-fan-of-knives` | → `rogue-multishot` (tier 1) |
| `mage-arcane-blast` | → `mage-fireball` (tier 0) |
| `mage-chain-lightning` | → `mage-chain-lightning` (tier 1, retuned) |
| `healer-divine-heal` | → `healer-heal` (tier 0) |
| `healer-mending-touch` | → `healer-salvation` (tier 1) |

New this roster: `warrior-sharp-blow`, `rogue-shadow-strike`, `rogue-arrow-storm`, `mage-ice-bolt`,
`mage-meteor`, `healer-light-judgment`, `healer-resurrection`, plus all 16 passives (rogue's
staggering and match-damage passives are `rogue-wolfs-howl` and `rogue-backstab`).

**Call sites to update:**

1. `src/constants/party.ts` — `unlockedSkillIds` and `selectedSkillId` on all four `INITIAL_PARTY`
   members, plus a new `unlockedPassiveIds: []`.
2. `DEFAULT_SKILL_BY_CLASS` — should become derived from the tier-0 entries (§2) rather than
   re-listing ids.
3. **Eight test/bench fixtures** hardcode `'warrior-power-strike'`: `battle-setup.test.ts`,
   `equipment-system.{test,bench}.ts`, `leveling-system.{test,bench}.ts`,
   `party-system.{test,bench}.ts`, `rpg-calculations.{test,bench}.ts`. A shared fixture factory
   would stop the next rename touching eight files.

---

## 12. Open questions

1. **Validate the EXP curve against a real campaign.** `12 × level^1.5` is tuned against an
   *estimated* ~71 battles at ~2.5 min each. Neither the finished battle count nor the `expReward`
   curve across later worlds is settled, so the constants in `src/constants/progression.ts` should
   be re-checked once world-01+ enemies exist. `EXP_BASE` scales the whole game uniformly;
   `EXP_CURVE_POWER` changes its shape and should move in steps of 0.1.
2. **Is the Healer's Light Judgment worth its slot?** Giving up the party's only heal for a turn is
   a steep cost in a fight that runs 30–50 s. It may need to be strictly better damage than the
   Mage's AoE to justify itself, or be moved to tier 3 where the player has other options.
3. **Warrior tier-0 Smash is deliberately plain.** If the opening battles feel dull, the fast-charge
   Sharp Blow may be the better tier 0, moving Smash to tier 2.
