# Enemy Poise & Stagger — Gap Analysis

Status checklist for the enemy **Flinch → Poise → Break** system. `[x]` = shipped and verified in code,
`[ ]` = missing. Each section ends with implementation notes so this doubles as the build plan.

## 1. Summary

What ships today is a **Flinch** mechanic: every hit on an enemy nudges its next attack back a little
(VIT-resisted, hard-capped at 12% of the interval per cycle so the enemy *always* fires). The docs and
code call this "stagger", and a "STAGGER!" callout pops when the per-cycle *flinch cap* is reached.

What is missing is the actual **Poise** layer: a per-enemy `poise` multiplier, a posture-damage pool
that fills from orb hits and active skills, and a **Break** that *cancels* the pending attack, opens a
vulnerable window, and then re-arms with anti-stunlock guards (post-break immunity + escalating max
poise, capped at 150% of the original).

Design decisions locked in:

- `poise?: number` on `EnemyData`, default `1`, **multiplier on incoming poise damage** (same pattern as
  `guardBreak?`). `0.5` = stoic / armored, `2` = glass jaw. Pool size is derived, not authored.
- Break = **cancel the pending attack + vulnerable stagger window** (bonus HP damage), then a fresh cycle.
- Anti-stunlock = **immunity window after recovery + escalating max poise**, never above
  **150% of the original max poise**.
- Lone hits (orbs *and* active skills) keep **delaying** the attack and moving the radial ring — the
  existing Flinch stays as-is underneath Poise.
- Every tunable is a named constant in `src/constants/battle.ts` (new "Enemy Poise / Break" block).

## 2. Terminology

| Term | Meaning | Status |
|---|---|---|
| **Flinch** | Per-hit push-back of the enemy's next attack timer. Capped per cycle. | ✅ shipped (currently named "stagger" in code/docs) |
| **Poise** | The enemy's posture pool. The `poise` stat is a multiplier on incoming poise damage. | ⬜ missing |
| **Break / Stagger** | Pool depleted → pending attack cancelled → enemy vulnerable for a window → fresh cycle. | ⬜ missing |

Rename note: once Poise lands, the shipped mechanic should be referred to as **Flinch** everywhere
(constants can keep their `STAGGER_*` names to avoid churn, but the docs and the callout must
disambiguate — see §G and §J).

## 3. Checklist by system

### A. Flinch delay on lone hits (orbs + skills)

- [x] Per-hit push formula `calculateStaggerPushMs(damage, enemyMaxHp, vit, interval)` —
      `src/lib/rpg-calculations.ts:415`.
- [x] Per-cycle anti-stunlock cap `clampStaggerToCycleBudget(pushMs, interval, usedMs)` — `rpg-calculations.ts:438`.
- [x] Multi-hit batching (one multi-color match = one event, every color pushes) `resolveStaggerHits` —
      `rpg-calculations.ts:471`, returns `{ appliedMs, maxedFlinch }`.
- [x] Tunables `BASE_STAGGER_FRACTION` (0.10), `MAX_STAGGER_FRACTION_PER_CYCLE` (0.12), `STAGGER_REF_FRACTION`
      (0.15), `STAGGER_VIT_DIVISOR` (8), `SKILL_STAGGER_MULTIPLIER` (2.5) — `src/constants/battle.ts:12–51`.
- [x] Orb hits reach the flinch via `damageEnemyAtom({ hits })` → `lastDamage` — `src/stores/battle-atoms.ts:199`.
- [x] Active-skill hits reach the flinch via `activateSkillAtom` → `lastDamage` with `source: 'skill'`
      (single `enemyId` or `enemyIds[]` for all-enemy skills) — `battle-atoms.ts:655`.
- [x] Timer push: the stagger effect in `src/hooks/use-enemy-attack-timers.ts:251–307` extends `releaseAtRef`
      and the self-rescheduling shot re-defers itself on wake (`fireShot`, `:184–200`).
- [x] Radial ring steps back by `push / interval` via `resolveCountdownRingAnchor` — `src/lib/battle-system.ts:83`;
      invariant tested in `src/lib/battle-setup.test.ts:204`.
- [x] Ring shake on each applied flinch (`staggerPulse` → `ring-shake-sm` / `ring-shake-lg`) —
      `src/components/battle/battle-top-bar.tsx:58–70`.
- [x] Hero passives scale the push: `staggerPushMultiplier` (warrior/rogue, 1.5 → 2.0) —
      `src/constants/skills/warrior.ts:138`, `rogue.ts:138`, folded in `src/lib/skill-system.ts:408`.
- [x] Tests — `src/lib/rpg-calculations.test.ts:405–528`.
- [ ] Flinch must be **skipped while the enemy is broken** (there is no pending attack to push). Lands in
      the stagger effect of `use-enemy-attack-timers.ts` (early `continue` when `isEnemyStaggered`).

**Implementation notes.** Nothing to rebuild here. Note that the flinch budget (`staggerUsedRef`) is a
`useRef` Map that resets on every `startCycle` and on hook rebuild — invisible to state, UI and tests.
That is fine for a cosmetic nudge, but **Poise must not follow this pattern** (see §C).

### B. `poise` stat on enemies

- [ ] `poise?: number` on `EnemyData` — `src/types/rpg-elements.ts:59`, next to `guardBreak?` with the same
      JSDoc shape: default 1; `0.5` = stoic, `2` = glass jaw.
- [ ] Author values in `src/constants/enemies/world-00/index.ts`: `MOSS_GOLEM` ≈ `0.5` (stone, hard to
      stagger), `SWAMP_FROG` ≈ `1.6` (squishy).
- [ ] `TRAINING_DUMMY` (`src/constants/enemies/training.ts`) — decide (see §J).
- [ ] `EXP_PINATA_FROGS` (`src/constants/enemies/debug.ts`) spreads `SWAMP_FROG`, so it inherits — verify.
- [ ] Optional: show `poise` on `training-dummy-readout.tsx` for tuning.

**Implementation notes.** Optional field with a `?? 1` fallback everywhere it's read, so no enemy
definition *has* to change. Instancing is plain object spread (`createBattleState`,
`dungeon-randomizer.ts:95`), so the field carries through untouched.

### C. Poise pool & posture-damage accumulation

- [ ] Per-enemy poise state lives in **Jotai `BattleState`** (`src/types/battle.ts:42`), not in refs:
      `enemyPoise: Record<enemyId, EnemyPoiseState>` with
      `{ current, max, originalMax, breakCount, staggeredUntil, immuneUntil }`.
- [ ] Initialised in `createBattleState` (`src/lib/battle-system.ts:103`) from the instanced enemies;
      reset naturally on `setupBattleAtom` / `resetBattleAtom`.
- [ ] New pure module `src/lib/poise-system.ts` (JSDoc on every export):
  - `calculateMaxPoise(enemy)` — `maxHp × POISE_POOL_HP_FRACTION`.
  - `calculatePoiseDamage(hit, enemy)` — `hit.amount × (enemy.poise ?? 1) × hit.multiplier`.
  - `applyPoiseHits(state, hits, now)` → `{ next, didBreak }` — batches a multi-color match like
    `resolveStaggerHits` does; no-op while staggered or immune.
  - `resolveEscalatedMaxPoise(originalMax, breakCount)` — with the 150% cap (see §E).
  - `isEnemyStaggered(state, now)`, `isPoiseImmune(state, now)`.
- [ ] Poise damage reuses the existing `StaggerHit { amount, multiplier }` shape so the hit → multiplier
      plumbing (attacker passives, skill bonus) is shared with Flinch.
- [ ] Apply poise in the **same state write** as HP damage so state never disagrees:
      `damageEnemyAtom` (`battle-atoms.ts:199`) and both enemy branches of `activateSkillAtom`
      (`battle-atoms.ts:684–718`).
- [ ] Optional: slow regen / decay of accumulated poise damage when not hit, driven by the existing
      100 ms `battleTickAtom` (`battle-atoms.ts:622`) — `POISE_REGEN_PER_SECOND`, default off. Decide in §J.

**Implementation notes.** Keeping the pool in `BattleState` is what makes the bar (§G) and the tests (§H)
possible, and it means a mid-battle hook rebuild (an enemy dies → `rosterSignature` changes) can't wipe
it the way it wipes the flinch budget today. Poise damage is *derived from HP damage* — the same
number that already flows through `lastDamage.hits` — so orbs and skills feed it with zero new
plumbing on the board side.

### D. Break: cancel attack + vulnerable window

- [ ] On depletion (`current − poiseDamage ≤ 0`, not staggered, not immune): set
      `staggeredUntil = now + POISE_BREAK_STAGGER_DURATION_MS`, `breakCount++`, `max = resolveEscalatedMaxPoise(…)`,
      `current = max`, and publish `lastPoiseBreak: { enemyId, timestamp }` on `BattleState` (mirrors
      `lastMaxFlinch`, `src/types/battle.ts:108`).
- [ ] **Cancel the pending attack** in `use-enemy-attack-timers.ts`: subscribe to `lastPoiseBreak`,
      `clearTimeout` that enemy's shot, delete its `releaseAtRef` / `cycleStartRef` / `staggerUsedRef`
      entries, and schedule recovery after the stagger duration (`endEnemyStaggerAtom` + `startCycle(id)`) —
      same shape as the standby branch at `:212–220`.
- [ ] **Vulnerable window**: while `isEnemyStaggered`, HP hits are multiplied by
      `(1 + POISE_BREAK_DAMAGE_BONUS)` at the same spot the preemptive bonus is applied
      (`damageEnemyAtom` `:213–216`) — and the equivalent added to `activateSkillAtom`, which has no
      bonus hook today.
- [ ] Recovery re-opens a **full fresh cycle** (`startCycle`), so the ring visibly restarts from full.
- [ ] Break on a dead enemy is impossible (HP write and poise write are the same transaction; the
      skill path sets `gameStatus: 'won'` directly at `battle-atoms.ts:700/717` — the break effect must
      bail when `currentHp <= 0` or `gameStatus !== 'playing'`).
- [ ] Standby enemies (`standbyEnemyIds`) — poise accumulates but no break fires until the first attack
      cycle (decision in §J).

**Implementation notes.** The hook is already structured around absolute release timestamps and a
self-rescheduling `setTimeout` per enemy; a break is just "drop the release, wait, then `startCycle`".
The stagger duration should be a hook-owned timeout like standby, with `staggeredUntil` in state as the
source of truth so a rebuild can resume the remaining window instead of restarting it.

### E. Anti-stunlock: immunity + escalation (150% cap)

- [ ] **Immunity**: on recovery set `immuneUntil = recoveredAt + POISE_BREAK_IMMUNITY_MS`; poise damage is
      ignored (HP damage and Flinch still apply) while `now < immuneUntil`.
- [ ] **Escalation**: `max = min(originalMax × (1 + breakCount × POISE_MAX_GROWTH_PER_BREAK), originalMax × POISE_MAX_GROWTH_CAP)`
      with `POISE_MAX_GROWTH_CAP = 1.5` — the pool grows 100% → 125% → 150% → **150% (hard cap)**.
- [ ] State the two caps are independent in `COMBAT_SYSTEM.md`: `MAX_STAGGER_FRACTION_PER_CYCLE` still
      bounds Flinch per cycle; poise immunity + escalation bound Breaks per battle.
- [ ] Optional visual: bar outline / tick mark showing the escalated max vs. original (see §G).

**Implementation notes.** Both guards are pure functions of `EnemyPoiseState` + `now`, so they belong in
`poise-system.ts` and get unit-tested there. `breakCount` never resets mid-battle; `originalMax` is
captured once in `createBattleState`.

### F. Attack-timer / radial-ring integration

- [x] Ring steps back on Flinch (`resolveCountdownRingAnchor`, `EnemyAttackTimer.elapsedMs`).
- [x] Ring shakes on Flinch (`EnemyAttackTimer.staggerPulse`).
- [ ] `EnemyAttackTimer` (`use-enemy-attack-timers.ts:21`) gains `isStaggered: boolean` (+ the window's
      `durationMs` / `elapsedMs` so the ring can *count down the stagger* instead of the attack).
- [ ] `timerListsMatch` (`:52–71`) compares the new field(s) — it is the memo that keeps `BattleTopBar`
      from re-rendering, so a missed field means a stale ring.
- [ ] `RadialCountdown` `tone` cva variant (`src/components/ui-custom/radial-countdown.tsx:12`) gains a
      `'broken'` tone; `BattleTopBar` swaps the `Swords` icon for a broken/dazed glyph while staggered.
- [ ] Recovery: a new `cycleKey` so the ring remounts and replays from full.

**Implementation notes.** Reuse the standby pattern exactly: standby already renders a different tone
(`gold`), icon (`Eye`) and `cycleKey` (`standby-<id>`) for a "not attacking yet" state. Stagger is the
same shape with a different reason.

### G. UI & feedback

- [ ] **Poise bar** under the enemy HP bar in `src/components/battle/enemy-display.tsx`. `BattleHpBar`
      (`battle-hp-bar.tsx:19`) already takes `thresholdColors`, so it can be reused with a poise palette;
      warm parchment / amber, no bright yellow. Optionally mark the escalated max.
- [ ] **Staggered sprite state**: tint/tilt class in `src/styles/animations.css` with a
      `src/styles/reduced-motion.css` fallback; cleared on recovery.
- [ ] **Callout**: repurpose the existing "STAGGER!" pop (`enemy-display.tsx:57–63`, `:133–140`, driven by
      `lastMaxFlinchAtom`) for the real Break, driven by `lastPoiseBreak`. Demote the flinch-cap event to
      ring shake only (drop the text) so two different things aren't both labelled "STAGGER!". Decision in §J.
- [ ] **Break SFX** through `SoundService` — new `SoundNames` entry in `src/constants/audio.ts`.
- [ ] **Recovery cue** (subtle: sprite un-tints, ring returns to `danger`, optional short SFX).
- [ ] Vulnerable-window damage numbers use the `critical` style already used for skill hits
      (`enemy-display.tsx:116–130`).

**Implementation notes.** All per-enemy feedback already lives in `EnemySprite`; the ring lives in
`BattleTopBar`. No new overlay host is needed.

### H. Tests

- [ ] `src/lib/poise-system.test.ts`: `calculateMaxPoise` scales with `maxHp`; `poise` multiplier direction
      (0.5 halves, 2 doubles); break fires exactly once per depletion; no accumulation while staggered or
      immune; escalation sequence 100% → 125% → 150% → 150% (cap holds for `breakCount ≥ 2`); batched
      multi-hit resolves in order (mirror of the `resolveStaggerHits` regression test).
- [ ] `src/lib/battle-atoms.test.ts`: `damageEnemyAtom` and `activateSkillAtom` update `enemyPoise` in the
      same write as HP; vulnerable-window bonus applied to both paths; `lastPoiseBreak` published; no break
      on a killing blow.
- [ ] `src/lib/battle-setup.test.ts`: `createBattleState` seeds `enemyPoise` for every enemy with
      `current === max === originalMax` and `breakCount === 0`.
- [ ] Stretch: first-ever test for `useEnemyAttackTimers` — break clears the shot timer and recovery
      re-arms a full cycle. There is no hook test today.

### I. Docs to update

- [ ] `docs/COMBAT_SYSTEM.md:51–66` — split "Enemy Stagger (Flinch) System" into **Flinch** and
      **Poise / Break**, with the formulas from §5 and both anti-stunlock caps.
- [ ] `docs/RPG_SYSTEM.md:30` — VIT "stagger resistance" → "flinch resistance"; note `poise` is a separate
      per-enemy stat, not derived from VIT.
- [ ] `docs/BATTLE_SCREEN.md:59,119,140` — component map (poise bar, callout wording), `BattleState`
      fields (`enemyPoise`, `lastPoiseBreak`), feature list.
- [ ] `docs/REMAINING_WORK.md:14` — the "telegraphed wind-ups / interrupt" item is partially covered by
      Break; reword.
- [ ] `docs/ideas-proposals/ORTHOGONAL_FEATURES.md:65–76` (#3) and `docs/FEATURE_IDEAS_AND_GAPS.md:29` —
      mark the interrupt half as shipped once it is.

### J. Related bugs & open decisions

Bugs the Break path will inherit:

- [ ] **Pause doesn't shift the release timestamp.** `releaseAtRef` is absolute `performance.now()`; the
      pause branch only clears timeouts (`use-enemy-attack-timers.ts:153–158`), so on resume
      `delay = max(0, release − now)` (`:177`) can be 0 and the enemy fires instantly while the CSS ring
      was frozen. `staggeredUntil` / `immuneUntil` will have the same problem. Fix once (shift all
      timestamps by the paused duration) or store *remaining* ms on pause.
- [ ] **Skill kills bypass `pendingVictory`** (`activateSkillAtom` sets `gameStatus: 'won'` at
      `battle-atoms.ts:700/717`, `pendingVictory: false` at `:759`) while match kills defer. The break
      effect must never re-arm a timer on an enemy that died in the same write.

Decisions to make before building:

- [ ] Does `staggerPushMultiplier` (warrior/rogue passives) also scale **poise damage**? *Recommend yes* —
      keeps those passives relevant; update the copy in `src/components/skills/passive-descriptions.ts:42`.
- [ ] Separate `POISE_SKILL_MULTIPLIER` or reuse `SKILL_STAGGER_MULTIPLIER` (2.5)? *Recommend separate* —
      different tuning axis (an ultimate that maxes the flinch shouldn't automatically break).
- [ ] Standby enemies: accumulate poise but no Break until the first attack cycle? *Recommend yes* —
      there is nothing to cancel yet, and the preemptive bonus already rewards hitting them.
- [ ] Training dummy: never breaks (no attack to cancel) vs. breaks anyway so the feedback can be tuned in
      the Training Grounds. *Recommend: breaks anyway, readout shows the pool.*
- [ ] Repurpose the "STAGGER!" callout for Break and drop the text on the flinch cap (see §G).
- [ ] `POISE_REGEN_PER_SECOND` on or off at launch. *Recommend off* — escalation + immunity already stop
      chain-breaks; add regen only if long fights feel like a guaranteed break.

## 4. Proposed constants

New block in `src/constants/battle.ts` (`// ─── Enemy Poise / Break ───`), each with JSDoc. Defaults
are starting points for playtesting, not final values.

| Constant | Default | Purpose |
|---|---|---|
| `POISE_POOL_HP_FRACTION` | `0.4` | `maxPoise = maxHp × this` — a poise-1 enemy breaks after ~40% of its HP in posture damage |
| `POISE_SKILL_MULTIPLIER` | `2.0` | Active-skill hits deal this × poise damage (separate from `SKILL_STAGGER_MULTIPLIER`) |
| `POISE_BREAK_STAGGER_DURATION_MS` | `2500` | Attack cancelled and enemy vulnerable for this long |
| `POISE_BREAK_DAMAGE_BONUS` | `0.5` | +50% HP damage while staggered (mirrors `PREEMPTIVE_STRIKE_DAMAGE_BONUS`) |
| `POISE_BREAK_IMMUNITY_MS` | `2000` | Poise damage ignored after recovery |
| `POISE_MAX_GROWTH_PER_BREAK` | `0.25` | Each Break raises max poise by this fraction of the *original* max |
| `POISE_MAX_GROWTH_CAP` | `1.5` | Max poise never exceeds **150%** of the original — hard cap |
| `POISE_REGEN_PER_SECOND` | `0` | Optional decay of accumulated poise damage when not hit (fraction of max per second); `0` = off |

Existing Flinch constants stay as they are (`BASE_STAGGER_FRACTION`, `MAX_STAGGER_FRACTION_PER_CYCLE`,
`STAGGER_REF_FRACTION`, `STAGGER_VIT_DIVISOR`, `SKILL_STAGGER_MULTIPLIER`).

## 5. Formulas

```
maxPoise(enemy)          = maxHp × POISE_POOL_HP_FRACTION
poiseDamage(hit, enemy)  = hit.amount × (enemy.poise ?? 1) × hit.multiplier
                           hit.multiplier = passive staggerPushMultiplier × (POISE_SKILL_MULTIPLIER if source === 'skill')
break                    when current − poiseDamage ≤ 0  AND  not staggered  AND  not immune
escalatedMax(breakCount) = min(originalMax × (1 + breakCount × POISE_MAX_GROWTH_PER_BREAK),
                               originalMax × POISE_MAX_GROWTH_CAP)          // ≤ 150% of original, always
on break                 staggeredUntil = now + POISE_BREAK_STAGGER_DURATION_MS
                         breakCount += 1;  max = escalatedMax(breakCount);  current = max
on recovery              immuneUntil = now + POISE_BREAK_IMMUNITY_MS;  startCycle(enemy)
vulnerable HP damage     = damage × (1 + POISE_BREAK_DAMAGE_BONUS)   while staggered
flinch                   unchanged (see COMBAT_SYSTEM.md) and skipped while staggered
```
