# Guard Meter — Giving Gray Orbs a Purpose

> Design + implementation notes for the party Guard meter. See also the Guard Meter section of
> [COMBAT_SYSTEM.md](./COMBAT_SYSTEM.md) and Guard Charge Rate in [RPG_SYSTEM.md](./RPG_SYSTEM.md).

## Context

Gray orbs were dead weight (per `FEATURE_IDEAS_AND_GAPS.md`). Of the five orb types, only four map to
party members (blue→Warrior, green→Rogue, purple→Mage, yellow→Healer); matching a color deals damage
**and** charges that hero's skill cooldown. Gray belongs to nobody, so it just dealt weak neutral chip
damage (`pow = 0`), with no cooldown charge and no identity.

This feature turns gray into the party's **defensive resource**. Matching gray now charges a
party-wide **Guard** meter that reduces — and at full, fully blocks — incoming enemy attacks. Combat
previously had *no active defense* beyond the Healer's reactive heal, so this fills a real gap and
gives the player a genuine offense-vs-defense decision on every board.

## Design decisions

- **Gray trades damage for Guard.** Gray still deals chip damage but scaled down by
  `GRAY_MATCH_DAMAGE_MULTIPLIER` (old value noted in a comment), and charges the Guard meter.
- **Mitigation = bar fill %, magnitude-independent.** The bar's fill % *is* the damage-reduction %
  (capped at `MAX_GUARD_REDUCTION = 1`). A full bar fully blocks one attack. Because mitigation and
  drain are both **percentages of the bar**, never absolute HP, the system scales identically whether
  late-game enemies hit for 50 or 5000 — there is no fixed shield value to ever rebalance.
- **`guardBreak` controls drain only.** Each enemy has a `guardBreak` (default 1). It scales only how
  much of the bar a block *drains*, never the mitigation. `2.0` erodes the bar twice as fast (forcing
  more gray-matching to stay shielded); `0.5` barely dents it. A full bar always fully blocks.
- **Anti-hoard decay.** Guard bleeds over time proportional to its fill, so a full bar can't be parked
  indefinitely — blocking a big hit is a *timing* play (charge → block soon). This kills the
  "topped-to-100% = permanent immunity" exploit without punishing a modestly-charged working shield.
- **Charge rate scales with SPD** via a derived stat (Guard Charge Rate) using diminishing (sqrt)
  returns so stacking SPD speeds up defense without trivializing it.
- **Per-battle.** Guard starts at 0 and resets via `createBattleState`.

## Math (`src/lib/rpg-calculations.ts`)

```ts
// fill % is the mitigation %; guardBreak only scales the drain (a fraction of the bar)
reduction   = min(MAX_GUARD_REDUCTION, guard / GUARD_MAX)
damageTaken = round(incoming * (1 - reduction))
drain       = reduction * GUARD_DRAIN_FRACTION * GUARD_MAX * guardBreak
guardAfter  = max(0, guard - drain)

// charge rate: diminishing in the living party's collective SPD
guardChargeRate = 1 + sqrt(livingCollectiveSpd) / GUARD_CHARGE_RATE_DIVISOR

// anti-hoard decay: faster the fuller the bar
guardAfterDt = max(0, guard - GUARD_DECAY_RATE * (guard / GUARD_MAX) * dt)
```

`resolveGuardedDamage` returns `{ damageTaken, guardAfter, wasFullBlock }`. At `GUARD_DRAIN_FRACTION =
0.5`, a full-bar block consumes 50% of the bar at `guardBreak 1` (100→50), 100% at `guardBreak 2`
(100→0), and 25% at `guardBreak 0.5` (100→75) — the same fractions regardless of hit magnitude.

## Tuning constants

| Constant | Location | Default | Meaning |
| --- | --- | --- | --- |
| `GRAY_MATCH_DAMAGE_MULTIPLIER` | `constants/party.ts` | `0.4` | Gray's neutral chip damage (was 1.0) |
| `GUARD_CHARGE_PER_ORB` | `constants/party.ts` | `6` | Base guard per gray orb, before charge rate |
| `GUARD_MAX` | `lib/rpg-calculations.ts` | `100` | Full bar |
| `MAX_GUARD_REDUCTION` | `lib/rpg-calculations.ts` | `1` | Cap on mitigation (1 = full bar fully blocks) |
| `GUARD_DRAIN_FRACTION` | `lib/rpg-calculations.ts` | `0.5` | Fraction of bar a full block drains, ×guardBreak |
| `GUARD_DECAY_RATE` | `lib/rpg-calculations.ts` | `8` | Guard/sec bled at full bar (scales with fill) |
| `GUARD_CHARGE_RATE_DIVISOR` | `lib/rpg-calculations.ts` | `25` | Higher = gentler SPD→charge scaling |
| `GUARD_BAR_GRADIENT` | `constants/ui.ts` | slate | Guard bar fill color |

## Implementation map

- **Math + constants:** `lib/rpg-calculations.ts` (`calculateGuardChargeRate`, `resolveGuardedDamage`,
  `decayGuard`); gray/charge knobs in `constants/party.ts`; bar color in `constants/ui.ts`.
- **State:** `BattleState.guard` + `lastDamage.wasGuarded`/`blocked` in `types/battle.ts`;
  `EnemyData.guardBreak?` in `types/rpg-elements.ts`; `guard: 0` seeded in `lib/battle-system.ts`.
- **Atoms (`stores/battle-atoms.ts`):** `guardAtom`, `guardPercentageAtom`, `addGuardAtom`,
  `tickGuardDecayAtom`; absorption resolved centrally inside `damagePartyAtom` (the single choke point
  for all incoming party damage) using the attacker's `guardBreak`.
- **Charge:** `components/battle/match3-board.tsx` — gray matches charge guard and deal tuned-down
  chip damage.
- **Decay tick:** `views/battle-screen.tsx` — `tickGuardDecay(0.1)` rides the existing cooldown loop.
- **UI:** `components/battle/party-display.tsx` — HEROES label moved left of a compact HP + Guard bar
  stack; `steelArmor` `FrostyRpgIcon` precedes the Guard bar; charge shimmer, full-bar glow, and a
  shatter + "BLOCK!"/"GUARD" popup with a clang SFX. Keyframes in `styles/battle-elements.css`.
- **Showcase:** Moss Golem `guardBreak: 1.75` (heavy slams), Swamp Frog `guardBreak: 0.6` (light taps).

## Verification

- **Unit tests** (`npm run test-cli`): `calculateGuardChargeRate` (monotonic, diminishing, ≥1, ignores
  dead members), `resolveGuardedDamage` (boundary cases + magnitude-independence at 25 and 2500),
  `decayGuard` (fill-proportional, floors at 0); `battle-setup` asserts `guard` resets to 0.
- **Manual** (`npm run dev`):
  1. Match gray → Guard charges (icon pops, shimmer); higher-SPD party charges faster.
  2. Enemy attacks at partial guard → reduced damage (≈ fill %), bar drains proportionally.
  3. Charge to full → next hit fully blocked (shatter + "BLOCK!") regardless of enemy.
  4. `guardBreak` only changes drain: a `1.75` golem empties a full bar on the block; a `0.6` frog
     barely dents it.
  5. Gray's chip damage is noticeably lower than before.
  6. Charge to full then stop matching → bar bleeds down (fast near full, slow when low); can't park
     at 100%, but a modest shield persists with light upkeep.
  7. Restart battle → Guard resets to 0.
  8. HEROES HP + Guard bars fit the tight party section across breakpoints (mobile, xl, 2xl).
