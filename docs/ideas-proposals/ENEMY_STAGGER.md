# Enemy Stagger (a.k.a. "Flinch")

> A lightweight, **always-on** combat-feel mechanic: hitting an enemy pushes its next attack back
> a little. Scaled by how hard the hit lands, sharply reduced by the enemy's **VIT**, and
> **hard-capped per attack cycle** so you can slow an enemy but *never* stun-lock it.

**Status: implemented** (see [Implementation](#implementation-as-built)). Tuning constants live in
`src/constants/battle.ts`.

**Verdict: viable, cheap, additive.** It gives VIT a second job (today it only feeds HP), makes
hits feel reactive, and rewards focusing a target — without a new state machine or a new game
loop. The no-stunlock guarantee is *provable from the cap*, not just tuned. Battle-perf impact:
**Low** (see [Performance](#performance)).

Design intent for this doc: **subtle juice, not a strategic lever** — the timer nudges, it
doesn't lurch — and **everyone flinches a bit**: VIT shrinks the flinch hard but never removes it.

Related: this is the always-on, low-drama cousin of
[`ORTHOGONAL_FEATURES.md`](./ORTHOGONAL_FEATURES.md) item **#3 "Telegraphed heavy attacks"** (an
*interrupt* on a charged special) — both bite on the same `use-enemy-attack-timers.ts` clock and
could share plumbing.

---

## The idea in one rule

> Every hit on an enemy pushes its **next attack** back by a small delay, scaled by how hard the
> hit is (relative to that enemy's health), reduced by the enemy's VIT, and **clamped so the
> total push-back between two of its attacks can never exceed a fixed fraction of its interval.**

That last clause is the whole safety story: because the per-cycle push-back is capped, an enemy
**always** fires within `interval × (1 + CAP)` of its previous attack — no matter how fast you
match. You buy tempo, you can't buy a permanent lock.

---

## Why it's worth doing

- **Orthogonal axis:** a *tempo/pressure* dimension. Independent of the damage you deal, sustained
  aggression on one target measurably (but boundedly) slows it — a small "keep the heat on it"
  decision layered over the existing color-priority / target-selection choices.
- **Gives VIT identity.** Today VIT only sets max HP (`calculateMaxHp`). Stagger makes VIT also
  mean *poise*: a Moss Golem shrugs off blows and keeps its rhythm; a Swamp Frog visibly flinches.
  Two enemies with the same DPS now *feel* different to fight.
- **Free feedback.** The attack-timer ring visibly jerking backward on a big match is satisfying
  game-feel at almost no cost — it reuses the countdown UI that's already on screen.
- **Composable.** It's a pure push on one timestamp, so it stacks cleanly with a future status
  engine (a "poise-break"/stun status is just an uncapped, timed version of the same push).

---

## How enemy attack timing works today (what we hook into)

- Enemy attacks are driven by **per-enemy `setInterval` timers**, owned solely by
  `src/hooks/use-enemy-attack-timers.ts`. There is **no central RAF/tick loop** for enemy
  attacks. At most 4 enemies (`MAX_ENEMIES_PER_BATTLE`).
- That hook already tracks **absolute release timestamps** (`releaseAtRef: Map<id, number>`,
  `performance.now()`-based) to run the start-of-battle **standby** phase — an enemy "observes"
  for a randomized delay, then starts attacking (`use-enemy-attack-timers.ts:57, 101–110`). This
  is the exact pattern a stagger extends: *push the release timestamp later.*
- The attack loop itself is a **fixed `setInterval`** (`:93–99`). A fixed interval can't be
  delayed after it's scheduled, so the loop must become a **self-rescheduling `setTimeout`** that
  reads the release time each shot (below).
- Player hits register centrally in **`damageEnemyAtom`** (`src/stores/battle-atoms.ts:161`),
  right next to the existing `PREEMPTIVE_STRIKE_DAMAGE_BONUS` conditional — the natural trigger.
  Skill damage goes through `activateSkillAtom` (same file).
- **VIT is read only by `calculateMaxHp`** (`src/lib/rpg-calculations.ts`) — free to reuse.
- The **Guard** system (`resolveGuardedDamage` / `decayGuard` / `calculateGuardChargeRate`,
  `rpg-calculations.ts:~282–355`) is the house template for meter/threshold/decay math and the
  clamped-`sqrt` diminishing-returns curve this design borrows.
- Hit-reaction visuals already exist: `EnemySprite` (`src/components/battle/enemy-display.tsx`)
  recoils/flashes off `lastDamageAtom`, using keyframes `enemy-recoil` / `enemy-recoil-strong`
  (`src/styles/animations.css`, reduced-motion guarded). The countdown ring is `RadialCountdown`,
  keyed on `cycleKey` / `durationMs` (`battle-top-bar.tsx:56`).

---

## The mechanic (formulas)

On each hit against an enemy, compute a push-back in milliseconds:

```
damageRatio = min(1, damage / (enemyMaxHp * STAGGER_REF_FRACTION))   // "how hard", relative to the enemy
vitResist   = 1 / (1 + sqrt(max(0, VIT)) / STAGGER_VIT_DIVISOR)      // diminishing; ∈ (0, 1], never 0
pushMs      = interval * BASE_STAGGER_FRACTION * damageRatio * vitResist
```

- `interval` is the enemy's effective attack interval, `calculateEnemyAttackInterval(enemy)`.
- `damageRatio` uses **max** HP (not current HP) so "hard" is a fixed property of the blow — a
  near-dead enemy isn't suddenly trivial to lock.
- `vitResist` is the diminishing-returns curve (same shape as `calculateGuardChargeRate`), always
  strictly positive, so **every enemy always flinches a little**.

**Anti-stunlock clamp (the load-bearing part).** Keep a per-enemy, per-cycle accumulator
`staggerBudgetUsed[id]`. Each hit may only push up to what's left of the cap this cycle:

```
capMs      = interval * MAX_STAGGER_FRACTION_PER_CYCLE
appliedMs  = min(pushMs, capMs - staggerBudgetUsed[id])   // 0 once the cycle's budget is spent
staggerBudgetUsed[id] += appliedMs
releaseAt[id] += appliedMs
```

The accumulator **resets to 0 every time the enemy attacks**. Therefore, between any two of an
enemy's attacks the total push-back is `≤ capMs`, and:

> **Guarantee:** an enemy always fires within `interval × (1 + MAX_STAGGER_FRACTION_PER_CYCLE)` of
> its previous shot, for *any* hit pattern or rate. No stunlock is possible by construction.

**VIT through two channels (intentional).** VIT reduces stagger *twice*: directly via `vitResist`,
and indirectly because higher VIT → higher `enemyMaxHp` → smaller `damageRatio`. This is deliberate
— it makes tanky enemies feel genuinely unshakeable. If that ever proves too strong, decouple by
referencing a flat constant (or the enemy's own `attackDamage`) instead of `enemyMaxHp` in
`damageRatio`; the rest of the design is unchanged.

### Proposed starting constants

| Constant | Value | Role |
|---|---:|---|
| `BASE_STAGGER_FRACTION` | `0.10` | Scales a full-strength, no-resist hit to ~10% of the interval before the cap. |
| `MAX_STAGGER_FRACTION_PER_CYCLE` | `0.12` | The hard cap — the ~10–15% ceiling. **This is the anti-stunlock knob.** |
| `STAGGER_REF_FRACTION` | `0.15` | A hit for 15% of an enemy's max HP counts as a "full" hard hit (`damageRatio = 1`). |
| `STAGGER_VIT_DIVISOR` | `8` | Steepness of VIT resistance. Larger = VIT matters less. |

> Note on tuning: keep `BASE_STAGGER_FRACTION < MAX_STAGGER_FRACTION_PER_CYCLE` by a healthy
> margin. If base ≥ cap, a single hard hit maxes the cap outright — which kills both the
> multi-hit *accumulation* feel and any VIT differentiation on strong hits (everything just clamps
> to the cap). At `0.10` vs `0.12`, one hard hit lands ~45–60% of the cap, so it takes ~2 hits to
> saturate and VIT visibly changes how fast you get there.

These live in **`src/constants/battle.ts`** (next to `PREEMPTIVE_STRIKE_DAMAGE_BONUS` and the
standby constants), so all stagger tuning sits in one place with the other battle knobs.

---

## Worked examples (real enemies)

Using `MOSS_GOLEM` (VIT 50, maxHP 300, interval 4000 ms, SPD 0) and `SWAMP_FROG`
(VIT 10, maxHP 50, effective interval ≈ 2608 ms). Resistances:

- Golem: `vitResist = 1/(1 + √50/8) = 0.531`
- Frog:  `vitResist = 1/(1 + √10/8) = 0.717`

| Scenario | Golem push | (% of its 4000 ms) | Frog push | (% of its ~2608 ms) |
|---|---:|---:|---:|---:|
| **Strong match, 50 dmg** | 212 ms | 5.3% | 187 ms | 7.2% |
| **Weak match, 12 dmg** | 57 ms | 1.4% | 187 ms | 7.2% |
| **Per-cycle cap (any # of hits)** | **≤ 480 ms** | **≤ 12%** | **≤ 313 ms** | **≤ 12%** |

Read the middle row: the *same* 12-damage tap barely nudges the golem (1.4% — 12 is a sliver of
its 300 HP and its poise is high) but meaningfully flinches the frog (7.2% — 12 is a big chunk of
its 50 HP). Even under a relentless barrage, the golem still attacks at least every 4480 ms and
the frog every ~2921 ms — the fight's rhythm bends but never breaks.

---

## Implementation (as built)

The mechanic itself is contained in the attack-timer hook plus two pure helpers: the hook derives
the stagger from the shared `lastDamage` channel (which already carries the hit `amount` and which
enemy was struck), so the timing needs **no new battle state**. The only added state is one UI
signal — `lastMaxFlinch` — for the "STAGGER!" callout, mirroring the existing `lastPreemptiveStrike`
slot.

1. **Self-rescheduling attack loop.** `src/hooks/use-enemy-attack-timers.ts` now runs each
   attacking enemy on a `setTimeout` anchored to an absolute `releaseAtRef[id]` (same
   `performance.now()` discipline the standby phase already used) instead of a fixed
   `setInterval`. On each wake: if `now < releaseAt`, it was pushed back → **re-defer** for the
   remaining delta; otherwise fire (`damageParty`), reset the per-cycle stagger budget, open a
   fresh cycle (`releaseAt = now + interval`, ring restarted), and reschedule.

2. **Stagger on hit (derived state).** A second effect keyed on `lastDamageAtom` runs once per
   enemy-targeting hit: it computes `calculateStaggerPushMs`, clamps it against the per-cycle
   budget (`clampStaggerToCycleBudget`), extends `releaseAtRef`, and re-anchors the ring. It skips
   still-observing (standby) enemies. The running shot timer re-defers itself on its next wake, so
   staggering never tears the timers down. AoE skills (`enemyIds`) stagger each enemy with its own
   independent budget.

3. **UI feedback.** Two layers:
   - *Ring nudge* — `RadialCountdown` gained an optional `elapsedMs` prop applied as a negative
     `animation-delay`. Because a stagger grows the ring's `durationMs` while `elapsedMs` stays
     fixed to the cycle start, the fill **nudges backward proportionally to the push** (and empties
     at the new release) — an honest flinch rather than a jarring snap-to-full. Wired through
     `battle-top-bar.tsx`. The existing `enemy-recoil` sprite reaction covers the per-hit flinch.
   - *Max-flinch callout* — when a hit pushes a cycle **over its cap** (the moment further hits
     stop delaying the attack), the hook flags `flagMaxFlinchAtom` once per cycle, and the struck
     enemy pops a warm-amber "STAGGER!" float (`enemy-display.tsx` + the `stagger-callout` keyframe
     in `animations.css`, reduced-motion guarded), styled like the per-enemy damage numbers.

4. **Pure helpers + tests.** `calculateStaggerPushMs(damage, enemyMaxHp, vit, interval)` and
   `clampStaggerToCycleBudget(pushMs, interval, usedMs)` live in `rpg-calculations.ts` (JSDoc'd,
   importing the constants from `~/constants/battle`). Covered in `rpg-calculations.test.ts`
   (positive push for any hit, VIT monotonicity, damage→plateau at the reference, and a
   relentless-hits loop proving the per-cycle cap is never exceeded) and benched in
   `rpg-calculations.bench.ts`.

---

## Performance

**Battle-perf impact: Low.** No new loop, no polling, no new per-frame work.

- **Timers:** unchanged count — still one timer per living enemy (≤ 4). `setInterval` → recursive
  `setTimeout` is a wash. The only extra work is at most **one cheap re-defer wake-up per stagger**
  when a push lands mid-cycle, and the per-cycle cap bounds how often that matters.
- **On-hit cost:** the stagger math is a handful of float ops inside `damageEnemyAtom` — an atom
  that already runs on every resolved match. **No new event source.**
- **Re-renders:** hits already re-render the board and every `lastDamageAtom` consumer; the ring
  `cycleKey` bump piggybacks on that render. Pushing `attackReleaseAt` through a ref mirror keeps
  the hot path **off** the roster-rebuild effect (whose deps remain `rosterSignature`-gated), so
  there's no Jotai re-render storm and no timer teardown/rebuild per hit. Worst case is bounded by
  match frequency, which is human-paced.
- **Contrast:** unlike the Status Effect Engine ([`ORTHOGONAL_FEATURES.md`](./ORTHOGONAL_FEATURES.md)
  #6), there is **no** new per-entity array ticked on the 100 ms loop. Stagger is purely
  event-driven off hits that already happen.

---

## Open questions / tuning follow-ups

- **Feel of the cap.** `0.12` is a starting guess; playtest whether ~10% reads as "responsive" or
  ~15% as "chunky but still fair."
- **Double VIT channel.** Ship as-is (tanky = doubly unshakeable) or decouple `damageRatio` from
  `enemyMaxHp` if high-VIT enemies feel *too* immovable.
- **Preemptive-strike interaction.** A preemptive strike is already +25% damage — should it also
  grant a small flat stagger bonus, or is the higher damage (→ higher `damageRatio`) enough?
- **Skill hits.** Confirm big single-target skills should stagger through the same path; AoE
  skills would apply the push per enemy (each with its own capped budget).
