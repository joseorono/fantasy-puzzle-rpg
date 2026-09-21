# Enemy Poise & Stagger — Gap Analysis

Status checklist for the enemy **Flinch → Poise → Break** system. `[x]` = shipped and verified in code,
`[ ]` = missing. Each section ends with implementation notes so this doubles as the build plan.

> **Phase 1 (done)** — groundwork only, no behaviour change: the Flinch math is extracted into
> `src/lib/flinch-system.ts` with its own test + bench, the shared `weighHitsByAttacker` helper is in
> place (ready for the poise layer to call with its own multiplier), and the flinch-cap callout now
> reads "Flinched!". 898 tests pass. **Phase 2** is the poise pool, Break and UI — §B–§G below.

## 1. Summary

What ships today is a **Flinch** mechanic: every hit on an enemy nudges its next attack back a little
(VIT-resisted, hard-capped at 12% of the interval per cycle so the enemy *always* fires). The docs and
code call this "stagger", and a "STAGGER!" callout pops when the per-cycle *flinch cap* is reached
(that text will become "Flinched!" — see §G).

What is missing is the actual **Poise** layer: a per-enemy `poise` multiplier, a posture-damage pool
that fills from orb hits and active skills, and a **Break** that *cancels* the pending attack, opens a
vulnerable window, and then re-arms with anti-stunlock guards (post-break poise-damage immunity +
escalating max poise, capped at 150% of the original).

Design decisions locked in:

- `poise?: number` on `EnemyData`, default `1`, **multiplier on incoming poise damage** (same pattern as
  `guardBreak?`). `0.5` = stoic / armored, `2` = glass jaw. Pool size is derived, not authored.
- Break = **cancel the pending attack + vulnerable stagger window** (bonus HP damage), then a fresh cycle.
- Anti-stunlock = **poise-damage immunity window after recovery + escalating max poise**, never above
  **150% of the original max poise**. Immunity blocks *poise damage only* — HP damage and Flinch still land.
- **Additive, not a replacement.** Flinch is untouched: every hit (orbs *and* active skills) still
  delays the attack and moves the radial ring exactly as it does today. The *same hit* additionally deals
  poise damage; a Break only happens once enough poise damage has accumulated — combos and hard hits
  are what get you there.
- Logic lives in `src/lib/` as pure modules with their own `*.test.ts` and `*.bench.ts` (§K); the shipped
  Flinch math is extracted into a sibling module the same way.
- Every tunable is a named constant in `src/constants/battle.ts` (new "Enemy Poise / Break" block).

## 2. Terminology

| Term | Meaning | Status |
|---|---|---|
| **Flinch** | Per-hit push-back of the enemy's next attack timer. Capped per cycle. | ✅ shipped (currently named "stagger" in code/docs) |
| **Poise** | The enemy's posture pool. The `poise` stat is a multiplier on incoming poise damage. | ⬜ missing |
| **Break / Stagger** | Pool depleted → pending attack cancelled → enemy vulnerable for a window → fresh cycle. | ⬜ missing |

Naming note: no code identifiers get renamed — the `STAGGER_*` constants, `staggerPushMultiplier`,
`staggerPulse` and `lastMaxFlinch` all stay. The only shipped *text* that changes is the callout: the
flinch-cap pop becomes **"FLINCHED!"** and the new Break pop is **"STAGGERED!"**, so the on-screen
vocabulary matches this doc. Every hit does both: it flinches the timer *and* deals poise damage.

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
- [x] **Extracted** into `src/lib/flinch-system.ts`: `calculateStaggerPushMs`, `clampStaggerToCycleBudget`,
      `StaggerHit`, `StaggerResolution`, `resolveStaggerHits` moved verbatim out of `rpg-calculations.ts`.
      Identifiers unchanged, no re-export shim; the four `STAGGER_*` constant imports moved with them.
- [x] Shared helper `weighHitsByAttacker(hits, party, skillMultiplier, source)` → `StaggerHit[]` in
      `flinch-system.ts:124` — the hit → `{ amount, multiplier }` mapping (attacker `staggerPushMultiplier`
      passive × skill multiplier) that used to sit inline in the hook. Only `source === 'skill'` applies
      `skillMultiplier`, so Poise can pass `POISE_SKILL_MULTIPLIER` to the same helper.
- [x] Importers repointed: `use-enemy-attack-timers.ts` (now calls `weighHitsByAttacker` instead of its
      inline `.map`, dropping its `getCharacterPassiveModifiers` import), `rpg-calculations.test.ts`,
      `rpg-calculations.bench.ts`.
- [x] Tests moved to `src/lib/flinch-system.test.ts` (14 moved, assertions unchanged, + 6 new for
      `weighHitsByAttacker`); benches moved to `src/lib/flinch-system.bench.ts` (+ `resolveStaggerHits`
      1-hit/4-hit and `weighHitsByAttacker`, now on shared `BENCH_OPTIONS`).
- [ ] While an enemy is broken there is no pending attack, so the push is a natural no-op — add an early
      `continue` for staggered ids in the stagger effect of `use-enemy-attack-timers.ts` so it doesn't touch a
      release timestamp that no longer exists. Flinch resumes unchanged on recovery.

**Implementation notes.** The Flinch *behaviour* does not change; the extraction is a file move so the two
systems sit side by side with the same test/bench discipline. Note that the flinch budget (`staggerUsedRef`)
is a `useRef` Map that resets on every `startCycle` and on hook rebuild — invisible to state, UI and tests.
That is fine for a cosmetic nudge, but **Poise must not follow this pattern** (see §C).

### B. `poise` stat on enemies

- [ ] `poise?: number` on `EnemyData` — `src/types/rpg-elements.ts:59`, next to `guardBreak?` with the same
      JSDoc shape: default 1; `0.5` = stoic, `2` = glass jaw.
- [ ] Author values in `src/constants/enemies/world-00/index.ts`: `MOSS_GOLEM` ≈ `0.5` (stone, hard to
      stagger), `SWAMP_FROG` ≈ `1.6` (squishy).
- [ ] `TRAINING_DUMMY` (`src/constants/enemies/training.ts`) — `1`.
- [ ] `EXP_PINATA_FROGS` (`src/constants/enemies/debug.ts`) spreads `SWAMP_FROG`, so it inherits — verify.
- [ ] Optional: show `poise` on `training-dummy-readout.tsx` for tuning.

**Implementation notes.** Optional field with a `?? 1` fallback everywhere it's read, so no enemy
definition *has* to change. Instancing is plain object spread (`createBattleState`,
`dungeon-randomizer.ts:95`), so the field carries through untouched.

### C. Poise pool & posture-damage accumulation

- [ ] Per-enemy poise state lives in **Jotai `BattleState`** (`src/types/battle.ts:42`), not in refs:
      `enemyPoise: Record<enemyId, EnemyPoiseState>`.
- [ ] `EnemyPoiseState` (defined in `poise-system.ts`):
      ```ts
      interface EnemyPoiseState {
        current: number;            // remaining poise; hits subtract from it
        max: number;                // current (possibly escalated) max
        originalMax: number;        // captured at battle start; the 150% cap is relative to this
        breakCount: number;         // never resets mid-battle
        staggerRemainingMs: number; // > 0 = broken (attack cancelled, vulnerable). Ticked down by battleTick.
        immuneRemainingMs: number;  // > 0 = poise damage ignored. Ticked down by battleTick.
      }
      ```
- [ ] Initialised in `createBattleState` (`src/lib/battle-system.ts:103`) via `createEnemyPoiseState(enemy)`
      for each instanced enemy; reset naturally on `setupBattleAtom` / `resetBattleAtom`.
- [ ] New pure module `src/lib/poise-system.ts` (JSDoc on every export):
  - `createEnemyPoiseState(enemy)` — `max = current = originalMax = calculateMaxPoise(enemy)`, counters 0.
  - `calculateMaxPoise(enemy)` — `maxHp × POISE_POOL_HP_FRACTION`.
  - `calculatePoiseDamage(amount, poiseMultiplier, hitMultiplier, cascadeLevel = 0)` —
    `amount × poise × hitMultiplier × (1 + cascadeLevel × POISE_CASCADE_BONUS_PER_LEVEL)`.
  - `resolveEscalatedMaxPoise(originalMax, breakCount)` — with the 150% cap (see §E).
  - `isEnemyStaggered(state)` — `staggerRemainingMs > 0`; `isPoiseImmune(state)` — `immuneRemainingMs > 0`.
  - `applyPoiseHits(state, hits: StaggerHit[], poiseMultiplier, cascadeLevel = 0)` → `{ next, didBreak }` —
    batches a multi-color match in order like `resolveStaggerHits`; returns the **same reference** while
    staggered or immune; on depletion: `breakCount + 1`, `max = escalated`, `current = max`,
    `staggerRemainingMs = POISE_BREAK_STAGGER_DURATION_MS`.
  - `tickEnemyPoise(record, deltaSeconds)` — decrements both counters; when stagger reaches 0 sets
    `immuneRemainingMs = POISE_BREAK_IMMUNITY_MS`; applies regen if `POISE_REGEN_PER_SECOND > 0`; returns
    the **same reference** when nothing changed (matches `battleTickAtom`'s early-return pattern).
  - `resolveVulnerableHits(hits, isStaggered)` — `× (1 + POISE_BREAK_DAMAGE_BONUS)`, rounded; mirror of the
    preemptive map in `damageEnemyAtom:213–216`.
- [ ] Poise damage reuses the `StaggerHit { amount, multiplier }` shape and `weighHitsByAttacker` from
      `flinch-system.ts`, called with `POISE_SKILL_MULTIPLIER` instead of `SKILL_STAGGER_MULTIPLIER`.
- [ ] Combos and hard hits fill the pool by construction: `hit.amount` already carries the match-size
      multiplier (`calculateMatchMultiplier`, `rpg-calculations.ts:183`) and the cascade multiplier
      (`calculateComboMultiplier`, `:172`, tuned by `CASCADE_DAMAGE_BONUS_PER_LEVEL` / `MAX_COMBO_MULTIPLIER`),
      so a 5-match at cascade 3 pushes poise far harder than a lone 3-match. Optional
      `POISE_CASCADE_BONUS_PER_LEVEL` (default 0 = off) if combos should fill poise *faster than* they
      deal HP damage — the `{ hits }` payload gains an optional `cascadeLevel` from `cascadeLevelRef` in
      `match3-board.tsx:394–397`.
- [ ] Apply poise in the **same state write** as HP damage so state never disagrees:
      `damageEnemyAtom` (`battle-atoms.ts:199`) and both enemy branches of `activateSkillAtom`
      (`battle-atoms.ts:684–718`). Skipped on a killing blow and on standby targets (`standbyEnemyIds`).
- [ ] `battleTickAtom` (`battle-atoms.ts:622`) calls `tickEnemyPoise` and folds the result into its existing
      "nothing changed → return" check, so an idle poise record never causes a write.
- [ ] Selectors: `enemyPoiseAtom` (record), `lastPoiseBreakAtom`, and `staggeredEnemySignatureAtom` — a
      **string** (`ids with staggerRemainingMs > 0`, joined by `|`) so it compares by value and only changes on
      a break or a recovery, never per tick (same trick as the hook's `rosterSignature`).
- [ ] `src/lib/poise-system.test.ts` and `src/lib/poise-system.bench.ts` (see §H, §K).

**Implementation notes.** The stagger and immunity windows are **remaining-ms counters ticked by
`battleTickAtom`**, not absolute timestamps. The tick loop (`battle-screen.tsx:88–96`) is gated on
`isBattlePaused`, so both windows are pause-safe by construction — unlike the hook's absolute `releaseAtRef`
(§J). They also work in training mode, where the attack-timer hook returns early, and they are pure and
testable without fake timers. `battleTickAtom` already writes state every 100 ms, so the only rule is that
`tickEnemyPoise` hands back the same reference when idle.

### D. Break: cancel attack + vulnerable window

- [ ] On depletion (inside `applyPoiseHits`): `breakCount + 1`, `max = resolveEscalatedMaxPoise(…)`,
      `current = max`, `staggerRemainingMs = POISE_BREAK_STAGGER_DURATION_MS`. The atom publishes
      `lastPoiseBreak: { enemyId, timestamp }` on `BattleState` (mirrors `lastMaxFlinch`, `src/types/battle.ts:108`).
- [ ] **Cancel the pending attack** in `use-enemy-attack-timers.ts`: subscribe `staggeredEnemySignatureAtom`
      and add it to the main effect's deps. In the roster loop, **before** the standby check, a staggered
      enemy gets its shot `clearTimeout`-ed and its `releaseAtRef` / `cycleStartRef` / `staggerUsedRef` entries
      deleted; ring duration = `POISE_BREAK_STAGGER_DURATION_MS`, ring elapsed = `duration − staggerRemainingMs`;
      `bumpVersion`; `continue`. The rebuild path already preserves running cycles for everyone else (`:229–240`).
- [ ] **No recovery timeout in the hook.** When the tick zeroes the counter the signature changes, the effect
      re-runs, and the existing "no live cycle → `startCycle(id)`" branch (`:238–240`) opens a fresh full cycle.
- [ ] **Vulnerable window**: `isEnemyStaggered` is read from the **pre-hit** state → `resolveVulnerableHits`
      before HP is subtracted, in `damageEnemyAtom` (next to the preemptive map, `:213–216`) and in both enemy
      branches of `activateSkillAtom`, which has no bonus hook today. The hit that *causes* a break never gets
      the bonus.
- [ ] Recovery re-opens a **full fresh cycle** (`startCycle`), so the ring visibly restarts from full.
- [ ] Break on a dead enemy is impossible: HP write and poise write are one transaction, and poise is skipped
      when the resulting HP is `≤ 0`. The skill path sets `gameStatus: 'won'` directly at
      `battle-atoms.ts:700/717`; the hook's main effect already bails when `gameStatus !== 'playing'`.
- [x] Standby enemies (`standbyEnemyIds`) — poise accumulates but no Break fires until the first attack cycle
      (decided, §J).

**Implementation notes.** The hook is already structured around absolute release timestamps and a
self-rescheduling `setTimeout` per enemy; a Break is just "drop the release and skip this enemy while the
signature says it's staggered". State (the tick) owns the window; the hook only reacts to it, the same way
it reacts to `standbyEnemyIds`.

### E. Anti-stunlock: immunity + escalation (150% cap)

- [ ] **Immunity** (poise damage only): when `tickEnemyPoise` brings `staggerRemainingMs` to 0 it sets
      `immuneRemainingMs = POISE_BREAK_IMMUNITY_MS`; while `isPoiseImmune`, `applyPoiseHits` is a no-op.
      **HP damage and the Flinch push still land** — immunity only stops the pool from filling again.
- [ ] **Escalation**: `max = min(originalMax × (1 + breakCount × POISE_MAX_GROWTH_PER_BREAK), originalMax × POISE_MAX_GROWTH_CAP)`
      with `POISE_MAX_GROWTH_CAP = 1.5` — the pool grows 100% → 125% → 150% → **150% (hard cap)**.
- [ ] State the two caps are independent in `COMBAT_SYSTEM.md`: `MAX_STAGGER_FRACTION_PER_CYCLE` still
      bounds Flinch per cycle; poise immunity + escalation bound Breaks per battle.
- [ ] Optional visual: bar outline / tick mark showing the escalated max vs. original (see §G).

**Implementation notes.** Both guards are pure functions of `EnemyPoiseState` (+ `deltaSeconds` for the
tick), so they belong in `poise-system.ts` and get unit-tested there. `breakCount` never resets mid-battle;
`originalMax` is captured once in `createEnemyPoiseState`.

### F. Attack-timer / radial-ring integration

- [x] Ring steps back on Flinch (`resolveCountdownRingAnchor`, `EnemyAttackTimer.elapsedMs`).
- [x] Ring shakes on Flinch (`EnemyAttackTimer.staggerPulse`).
- [ ] `EnemyAttackTimer` (`use-enemy-attack-timers.ts:21`) gains `isStaggered: boolean`; while staggered
      `durationMs = POISE_BREAK_STAGGER_DURATION_MS`, `elapsedMs = duration − staggerRemainingMs`, and
      `cycleKey = \`stagger-${id}-${breakCount}\`` so the ring counts the *stagger window* down instead of the attack.
- [ ] `timerListsMatch` (`:52–71`) compares `isStaggered` — it is the memo that keeps `BattleTopBar`
      from re-rendering, so a missed field means a stale ring.
- [ ] `BattleTopBar`: `tone={timer.isStaggered ? 'neutral' : timer.isStandby ? 'gold' : 'danger'}` — the
      `neutral` tone already exists in `radial-countdown.tsx:12–16`; swap the `Swords` icon for lucide's
      `ShieldOff` while staggered.
- [ ] Recovery: a new `cycleKey` (from `startCycle`'s `bumpVersion`) remounts the ring from full.

**Implementation notes.** Reuse the standby pattern exactly: standby already renders a different tone
(`gold`), icon (`Eye`) and `cycleKey` (`standby-<id>`) for a "not attacking yet" state. Stagger is the
same shape with a different reason.

### G. UI & feedback

- [ ] **Poise bar**: new `src/components/battle/enemy-poise-bar.tsx` under the enemy HP bar in
      `enemy-display.tsx` — thin, no label, fill = `current / max`; empties on Break, refills on recovery;
      colours in `POISE_BAR_CLASSES` (`src/constants/ui.ts`), warm parchment / amber, no bright yellow.
      Optionally mark the escalated max. The training dummy keeps its readout and shows the bar beneath it.
- [ ] **Staggered sprite state**: `enemy-staggered` tint/tilt class on the sprite wrapper while
      `isEnemyStaggered(enemyPoise[enemy.id])` (`src/styles/animations.css`), with a
      `src/styles/reduced-motion.css:27–30` fallback; cleared on recovery (state-driven, so it un-tints when
      the tick zeroes the counter).
- [x] **Flinch callout renamed** (decided, see §J): the shipped flinch-cap pop in `enemy-display.tsx`
      (driven by `lastMaxFlinchAtom`) now reads **"Flinched!"** — text only, same trigger, same animation.
- [ ] **Break callout**: its **own** pop reading **"Staggered!"**, driven by `lastPoiseBreakAtom`, reusing
      the same `EnemySprite` pattern and the `stagger-callout` keyframes (`animations.css:448`) with a
      `stagger-callout--break` modifier (bigger, held for `POISE_BREAK_CALLOUT_DURATION_MS`) so it clearly
      outranks the flinch one.
- [ ] **Break SFX** through `SoundService` — new `SoundNames` entry in `src/constants/audio.ts`, played from
      the `EnemySprite` break effect.
- [ ] **Recovery cue** (subtle: sprite un-tints, ring returns to `danger`, optional short SFX).
- [ ] Vulnerable-window damage numbers use the `critical` style already used for skill hits
      (`enemy-display.tsx:116–130`).

**Implementation notes.** All per-enemy feedback already lives in `EnemySprite`; the ring lives in
`BattleTopBar`. No new overlay host is needed. `EnemySprite` already re-renders on every `lastDamage`, so
subscribing it to `enemyPoiseAtom` adds no new render cadence.

### H. Tests & benches

- [x] `src/lib/flinch-system.test.ts` — the moved `describe('Stagger Calculations')` block passes unchanged;
      `weighHitsByAttacker` covered (no passive → 1x, unknown/missing attacker → 1x, passive scales,
      `skillMultiplier` only on `source: 'skill'`, per-hit attackers keep order, empty batch).
- [x] `src/lib/flinch-system.bench.ts` — moved `calculateStaggerPushMs` / `clampStaggerToCycleBudget` benches
      plus `resolveStaggerHits` (1 hit / 4-hit batch) and `weighHitsByAttacker`, on `BENCH_OPTIONS`.
- [ ] `src/lib/poise-system.test.ts`: `calculateMaxPoise` scales with `maxHp`; `poise` multiplier direction
      (0.5 halves, 2 doubles); a batch resolves in order and breaks exactly once; no accumulation while
      staggered or immune (same reference back); escalation sequence 100% → 125% → 150% → 150% (cap holds
      for `breakCount ≥ 2`); `tickEnemyPoise` counts down, flips stagger → immunity, returns the same
      reference when idle; regen off by default; `createEnemyPoiseState` seeds `current === max === originalMax`.
- [ ] `src/lib/poise-system.bench.ts`: `calculatePoiseDamage`; `applyPoiseHits` (1 hit / 4-hit batch / batch
      that breaks); `resolveEscalatedMaxPoise`; `tickEnemyPoise` with 4 enemies (idle → same reference; 2
      staggered). `BENCH_OPTIONS`.
- [ ] `src/lib/battle-atoms.test.ts` (vanilla `createStore`, existing style): `damageEnemyAtom` and
      `activateSkillAtom` update `enemyPoise` in the same commit as HP; vulnerable-window bonus on both paths;
      the breaking hit gets no bonus; no poise on a killing blow or a standby target; `lastPoiseBreak`
      published once; `battleTickAtom` stays silent (`store.sub` listener) while poise is idle.
- [ ] `src/lib/battle-setup.test.ts`: `createBattleState` seeds `enemyPoise` for every enemy with
      `breakCount === 0` and both counters at 0.
- [ ] Stretch: first-ever test for `useEnemyAttackTimers` — a staggered signature drops the shot timer and
      a cleared signature re-arms a full cycle. There is no hook test today.

### I. Docs to update

- [ ] `docs/COMBAT_SYSTEM.md:51–66` — leave the "Enemy Stagger (Flinch) System" section intact and add a
      **Poise / Break** subsection right after it, with the formulas from §5 and a line stating both
      anti-stunlock caps are independent.
- [ ] `docs/RPG_SYSTEM.md:30` — VIT "stagger resistance" → "flinch resistance"; note `poise` is a separate
      per-enemy stat, not derived from VIT.
- [ ] `docs/BATTLE_SCREEN.md:59,119,140` — component map (poise bar, callout wording), `BattleState`
      fields (`enemyPoise`, `lastPoiseBreak`), feature list.
- [ ] `docs/REMAINING_WORK.md:14` — the "telegraphed wind-ups / interrupt" item is partially covered by
      Break; reword.
- [ ] `docs/ideas-proposals/ORTHOGONAL_FEATURES.md:65–76` (#3) and `docs/FEATURE_IDEAS_AND_GAPS.md:29` —
      mark the interrupt half as shipped once it is.

### J. Related bugs & open decisions

Bugs to be aware of:

- [ ] **Pause doesn't shift the attack release timestamp.** `releaseAtRef` is absolute `performance.now()`;
      the pause branch only clears timeouts (`use-enemy-attack-timers.ts:153–158`), so on resume
      `delay = max(0, release − now)` (`:177`) can be 0 and the enemy fires instantly while the CSS ring
      was frozen. **Poise does not inherit this** — its windows are tick-owned counters and the tick loop
      stops while paused. The bug remains open for the attack timer itself; fix once (shift all timestamps by
      the paused duration) or store *remaining* ms on pause.
- [ ] **Skill kills bypass `pendingVictory`** (`activateSkillAtom` sets `gameStatus: 'won'` at
      `battle-atoms.ts:700/717`, `pendingVictory: false` at `:759`) while match kills defer. Poise is
      skipped on a killing blow, and the hook bails on `gameStatus !== 'playing'`, so no timer can be re-armed
      on an enemy that died in the same write.

Decisions:

- [x] `staggerPushMultiplier` (warrior/rogue passives) also scales **poise damage** — via
      `weighHitsByAttacker`. Update the copy in `src/components/skills/passive-descriptions.ts:42`.
- [x] Separate `POISE_SKILL_MULTIPLIER` (not `SKILL_STAGGER_MULTIPLIER`) — different tuning axis: an ultimate
      that maxes the flinch shouldn't automatically break.
- [x] Standby enemies accumulate poise but cannot Break until their first attack cycle — there is nothing to
      cancel yet, and the preemptive bonus already rewards hitting them.
- [x] Training dummy breaks anyway (tick-owned windows work without the attack hook), so the feedback can be
      tuned in the Training Grounds; the readout shows the pool.
- [x] Callout wording — the existing flinch-cap text becomes "Flinched!", the new Break callout reads
      "Staggered!" (see §G).
- [x] `POISE_REGEN_PER_SECOND` off at launch — escalation + immunity already stop chain-breaks; add regen
      only if long fights feel like a guaranteed break.

### K. Lib layout: files, tests, benches

Pure logic only in `src/lib/`, JSDoc on every export, one `*.test.ts` and one `*.bench.ts` per module
(`BENCH_OPTIONS` from `src/lib/bench-options.ts`; benches are picked up by `vitest.config.ts` →
`src/lib/**/*.bench.ts`, run with `npm run bench-cli`).

| File | Status | Contents |
|---|---|---|
| `src/lib/flinch-system.ts` | [x] done | `calculateStaggerPushMs`, `clampStaggerToCycleBudget`, `StaggerHit`, `StaggerResolution`, `resolveStaggerHits` (moved verbatim) + `AttackerHit`, `weighHitsByAttacker` |
| `src/lib/flinch-system.test.ts` | [x] done | moved `describe('Stagger Calculations')` (14 tests) + `describe('weighHitsByAttacker')` (6 tests) |
| `src/lib/flinch-system.bench.ts` | [x] done | moved stagger benches + `resolveStaggerHits` (1-hit / 4-hit) + `weighHitsByAttacker` (1-hit match / 4-hit skill), on `BENCH_OPTIONS` |
| `src/lib/poise-system.ts` | [ ] new | `EnemyPoiseState`, `createEnemyPoiseState`, `calculateMaxPoise`, `calculatePoiseDamage`, `resolveEscalatedMaxPoise`, `isEnemyStaggered`, `isPoiseImmune`, `applyPoiseHits`, `tickEnemyPoise`, `resolveVulnerableHits` |
| `src/lib/poise-system.test.ts` | [ ] new | see §H |
| `src/lib/poise-system.bench.ts` | [ ] new | see §H |

`rpg-calculations.ts` keeps everything else (HP, damage, cooldown, Guard, thresholds). The three importers of
the moved symbols (`use-enemy-attack-timers.ts`, `rpg-calculations.test.ts`, `rpg-calculations.bench.ts`) are
repointed; nothing is re-exported from the old location.

### L. How Flinch and Poise work together

```
one hit  ──►  lastDamage event (unchanged: amount, hits[], characterId, source)
   │
   ├──► FLINCH   (hook: use-enemy-attack-timers.ts)
   │       weighHitsByAttacker(hits, party, SKILL_STAGGER_MULTIPLIER, source)
   │       → resolveStaggerHits → releaseAtRef += push (capped 12% / cycle) → ring steps back, shakes
   │       skipped only while the enemy is broken (no timer to push)
   │
   └──► POISE    (atom write: damageEnemyAtom / activateSkillAtom, same commit as HP)
           weighHitsByAttacker(hits, party, POISE_SKILL_MULTIPLIER, source)
           → applyPoiseHits → current −= poise damage
           ignored while broken or immune — HP damage and Flinch still land
           current ≤ 0 → BREAK: staggerRemainingMs set, lastPoiseBreak published
                          hook drops the attack cycle; "Staggered!"; vulnerable window (+HP damage)
           battleTick counts the window down → recovery → immuneRemainingMs set → hook opens a fresh cycle
```

- **Shared**: the `StaggerHit { amount, multiplier }` shape and `weighHitsByAttacker` (both in `flinch-system.ts`).
  The same passive (`staggerPushMultiplier`) boosts both; only the skill multiplier differs.
- **Independent caps**: `MAX_STAGGER_FRACTION_PER_CYCLE` bounds Flinch per attack cycle; poise-damage
  immunity + the 150% escalation cap bound Breaks per battle. Neither cap reads the other.
- **Independent timers**: Flinch's per-cycle budget stays a hook `useRef` (cosmetic, resets every cycle);
  poise windows are `BattleState` counters ticked by `battleTickAtom` (pause-safe, training-safe, testable).
- **One event, two consumers**: nothing new is emitted for Flinch. Poise adds exactly one new event
  (`lastPoiseBreak`) and one derived string (`staggeredEnemySignatureAtom`) for the hook to react to.

## 4. Proposed constants

New block in `src/constants/battle.ts` (`// ─── Enemy Poise / Break ───`), each with JSDoc. Defaults
are starting points for playtesting, not final values.

| Constant | Default | Purpose |
|---|---|---|
| `POISE_POOL_HP_FRACTION` | `0.4` | `maxPoise = maxHp × this` — a poise-1 enemy breaks after ~40% of its HP in posture damage |
| `POISE_SKILL_MULTIPLIER` | `2.0` | Active-skill hits deal this × poise damage (separate from `SKILL_STAGGER_MULTIPLIER`) |
| `POISE_BREAK_STAGGER_DURATION_MS` | `2500` | Attack cancelled and enemy vulnerable for this long |
| `POISE_BREAK_DAMAGE_BONUS` | `0.5` | +50% HP damage while staggered (mirrors `PREEMPTIVE_STRIKE_DAMAGE_BONUS`) |
| `POISE_BREAK_IMMUNITY_MS` | `2000` | After recovery, **poise damage** is ignored for this long (HP damage and Flinch unaffected) |
| `POISE_MAX_GROWTH_PER_BREAK` | `0.25` | Each Break raises max poise by this fraction of the *original* max |
| `POISE_MAX_GROWTH_CAP` | `1.5` | Max poise never exceeds **150%** of the original — hard cap |
| `POISE_CASCADE_BONUS_PER_LEVEL` | `0` | Optional extra poise damage per cascade level, on top of what the combo multiplier already adds; `0` = off |
| `POISE_REGEN_PER_SECOND` | `0` | Optional refill of the pool when not hit (fraction of max per second), applied by `tickEnemyPoise`; `0` = off |
| `POISE_BREAK_CALLOUT_DURATION_MS` | `1300` | How long the "Staggered!" callout holds (the flinch one keeps its 900 ms) |

Existing Flinch constants stay as they are (`BASE_STAGGER_FRACTION`, `MAX_STAGGER_FRACTION_PER_CYCLE`,
`STAGGER_REF_FRACTION`, `STAGGER_VIT_DIVISOR`, `SKILL_STAGGER_MULTIPLIER`). UI colours for the poise bar go
in `src/constants/ui.ts` (`POISE_BAR_CLASSES`).

## 5. Formulas

```
on every hit             flinch push (unchanged — see COMBAT_SYSTEM.md)  AND  poiseDamage(hit) — both, always
maxPoise(enemy)          = maxHp × POISE_POOL_HP_FRACTION
poiseDamage(hit, enemy)  = hit.amount × (enemy.poise ?? 1) × hit.multiplier × (1 + cascadeLevel × POISE_CASCADE_BONUS_PER_LEVEL)
                           hit.multiplier = passive staggerPushMultiplier × (POISE_SKILL_MULTIPLIER if source === 'skill')
poise applies            only when not staggered, not immune, not on standby, and the hit doesn't kill
break                    when current − poiseDamage ≤ 0
escalatedMax(breakCount) = min(originalMax × (1 + breakCount × POISE_MAX_GROWTH_PER_BREAK),
                               originalMax × POISE_MAX_GROWTH_CAP)          // ≤ 150% of original, always
on break                 breakCount += 1;  max = escalatedMax(breakCount);  current = max
                         staggerRemainingMs = POISE_BREAK_STAGGER_DURATION_MS;  hook drops the attack cycle
each battleTick          staggerRemainingMs −= Δms;  immuneRemainingMs −= Δms   (only while > 0)
on recovery              (staggerRemainingMs reaches 0)  immuneRemainingMs = POISE_BREAK_IMMUNITY_MS;  hook opens a fresh cycle
while immune             poise damage ignored — HP damage and flinch push still apply
vulnerable HP damage     = damage × (1 + POISE_BREAK_DAMAGE_BONUS)   while staggered (read from pre-hit state)
```
