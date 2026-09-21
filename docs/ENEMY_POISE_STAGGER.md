# Enemy Poise & Stagger — Gap Analysis

Status checklist for the enemy **Flinch → Poise → Break** system. `[x]` = shipped and verified in code,
`[ ]` = missing. Each section ends with implementation notes so this doubles as the build plan.

> **Phase 1 (done)** — groundwork only, no behaviour change: the Flinch math is extracted into
> `src/lib/flinch-system.ts` with its own test + bench, the shared `weighHitsByAttacker` helper is in
> place, and the flinch-cap callout reads "Flinched!".
>
> **Phase 2 (done)** — the poise pool, Break and UI (§B–§I): `src/lib/poise-system.ts` + test + bench,
> `BattleState.enemyPoise` / `lastPoiseBreak`, poise applied in `damageEnemyAtom` / `activateSkillAtom`
> and ticked by `battleTickAtom`, the attack cancel in `use-enemy-attack-timers.ts`, the poise bar,
> "Staggered!" callout, sprite tint, neutral ring and Break SFX, plus the sibling docs.
>
> **Phase 3 (done)** — usability polish, §M: the poise bar now tells the whole Break story in three phases
> (drain over the vulnerable window, rebuild over immunity), is dimmed on standby and explains itself on
> hover; sprites stop re-rendering on regen ticks (`enemyPoiseViewAtom`); and the §J pause bug is fixed
> for every attack timer. 990 tests pass across 37 files. Still open: the skill-kill `pendingVictory` note
> in §J, the stretch hook test in §H (no React test environment), and the balance / feel calls listed at
> the end of §M — chiefly that the **Moss Golem may never Break** at `poise` 0.5. **Next:** playtest.

## 1. Summary

The shipped **Flinch** mechanic nudges an enemy's next attack back a little on every hit (VIT-resisted,
hard-capped at 12% of the interval per cycle so the enemy *always* fires). The code calls this
"stagger", and a "Flinched!" callout pops when the per-cycle *flinch cap* is reached.

The **Poise** layer now sits on top of it: a per-enemy `poise` multiplier, a posture-damage pool that
fills from orb hits and active skills, and a **Break** that *cancels* the pending attack, opens a
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
| **Flinch** | Per-hit push-back of the enemy's next attack timer. Capped per cycle. | ✅ shipped (named "stagger" in code identifiers) |
| **Poise** | The enemy's posture pool. The `poise` stat is a multiplier on incoming poise damage. | ✅ shipped (`src/lib/poise-system.ts`) |
| **Break / Stagger** | Pool depleted → pending attack cancelled → enemy vulnerable for a window → fresh cycle. | ✅ shipped |

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
- [x] While an enemy is broken there is no pending attack, so the push is a natural no-op — the flinch effect
      in `use-enemy-attack-timers.ts` now `continue`s for ids in `staggeredIdsRef` (derived from
      `staggeredEnemySignatureAtom`) so it never touches a release timestamp that no longer exists. Flinch
      resumes unchanged on recovery.

**Implementation notes.** The Flinch *behaviour* does not change; the extraction is a file move so the two
systems sit side by side with the same test/bench discipline. Note that the flinch budget (`staggerUsedRef`)
is a `useRef` Map that resets on every `startCycle` and on hook rebuild — invisible to state, UI and tests.
That is fine for a cosmetic nudge, but **Poise must not follow this pattern** (see §C).

### B. `poise` stat on enemies

- [x] `poise?: number` on `EnemyData` — `src/types/rpg-elements.ts:59`, next to `guardBreak?` with the same
      JSDoc shape: default 1; `0.5` = stoic, `2` = glass jaw.
- [x] Author values in `src/constants/enemies/world-00/index.ts`: `MOSS_GOLEM` ≈ `0.5` (stone, hard to
      stagger), `SWAMP_FROG` ≈ `1.6` (squishy).
- [x] `TRAINING_DUMMY` (`src/constants/enemies/training.ts`) — its HP is a `MAX_SAFE_INTEGER` sentinel, so a
      poise of `1` would give it an unbreakable pool. Instead `poise = TRAINING_DUMMY_HP /
      TRAINING_DUMMY_POISE_HP_EQUIVALENT` (400), so it Breaks exactly like a 400-HP enemy would.
- [x] `EXP_PINATA_FROGS` (`src/constants/enemies/debug.ts`) spreads `SWAMP_FROG`, so it inherits `1.6` — verified
      (moot in practice: 1 HP means every hit is a killing blow, which deals no poise damage).
- [x] Optional: `training-dummy-readout.tsx` shows a `POISE` row — `NN%` (with `×breaks` once escalated) or
      `BROKEN` — fed the dummy's state by `EnemySprite`.

**Implementation notes.** Optional field with a `?? 1` fallback everywhere it's read, so no enemy
definition *has* to change. Instancing is plain object spread (`createBattleState`,
`dungeon-randomizer.ts:95`), so the field carries through untouched.

### C. Poise pool & posture-damage accumulation

- [x] Per-enemy poise state lives in **Jotai `BattleState`** (`src/types/battle.ts:42`), not in refs:
      `enemyPoise: Record<enemyId, EnemyPoiseState>`.
- [x] `EnemyPoiseState` (defined in `poise-system.ts`):
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
- [x] Initialised in `createBattleState` (`src/lib/battle-system.ts:103`) via `createEnemyPoiseState(enemy)`
      for each instanced enemy; reset naturally on `setupBattleAtom` / `resetBattleAtom`.
- [x] New pure module `src/lib/poise-system.ts` (JSDoc on every export):
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
- [x] Poise damage reuses the `StaggerHit { amount, multiplier }` shape and `weighHitsByAttacker` from
      `flinch-system.ts`, called with `POISE_SKILL_MULTIPLIER` instead of `SKILL_STAGGER_MULTIPLIER`.
- [x] Combos and hard hits fill the pool by construction: `hit.amount` already carries the match-size
      multiplier (`calculateMatchMultiplier`, `rpg-calculations.ts:183`) and the cascade multiplier
      (`calculateComboMultiplier`, `:172`, tuned by `CASCADE_DAMAGE_BONUS_PER_LEVEL` / `MAX_COMBO_MULTIPLIER`),
      so a 5-match at cascade 3 pushes poise far harder than a lone 3-match. Optional
      `POISE_CASCADE_BONUS_PER_LEVEL` (default 0 = off) if combos should fill poise *faster than* they
      deal HP damage — the `{ hits }` payload gains an optional `cascadeLevel` from `cascadeLevelRef` in
      `match3-board.tsx:394–397`.
- [x] Apply poise in the **same state write** as HP damage so state never disagrees:
      `damageEnemyAtom` and both enemy branches of `activateSkillAtom` (`battle-atoms.ts`). Skipped on a
      killing blow and on standby targets (`standbyEnemyIds`). Poise damage is computed from the **raw**
      hits — the preemptive and vulnerable bonuses are HP-only. An all-enemy skill lands a different
      amount on Broken vs. unbroken targets, so `lastDamage.amountByEnemyId` carries the per-target values
      for the damage popup.
- [x] `battleTickAtom` (`battle-atoms.ts:622`) calls `tickEnemyPoise` and folds the result into its existing
      "nothing changed → return" check, so an idle poise record never causes a write.
- [x] Selectors: `enemyPoiseAtom` (record), `lastPoiseBreakAtom`, `staggeredEnemySignatureAtom` — a
      **string** (`ids with staggerRemainingMs > 0`, joined by `|`, built by `resolveStaggeredEnemySignature`)
      so it compares by value and only changes on a break or a recovery, never per tick (same trick as the
      hook's `rosterSignature`) — and `enemyPoiseStateAtom(enemyId)`, a cached per-enemy atom (like
      `partyMemberAtom`) so each `EnemySprite` only re-renders when *its* pool moves.
- [x] `src/lib/poise-system.test.ts` and `src/lib/poise-system.bench.ts` (see §H, §K).

**Implementation notes.** The stagger and immunity windows are **remaining-ms counters ticked by
`battleTickAtom`**, not absolute timestamps. The tick loop (`battle-screen.tsx:88–96`) is gated on
`isBattlePaused`, so both windows are pause-safe by construction — unlike the hook's absolute `releaseAtRef`
(§J). They also work in training mode, where the attack-timer hook returns early, and they are pure and
testable without fake timers. `battleTickAtom` already writes state every 100 ms, so the only rule is that
`tickEnemyPoise` hands back the same reference when idle.

### D. Break: cancel attack + vulnerable window

- [x] On depletion (inside `applyPoiseHits`): `breakCount + 1`, `max = resolveEscalatedMaxPoise(…)`,
      `current = max`, `staggerRemainingMs = POISE_BREAK_STAGGER_DURATION_MS`. The atom publishes
      `lastPoiseBreak: { enemyIds: string[], timestamp }` on `BattleState` — an array rather than
      `lastMaxFlinch`'s single id, because an all-enemy skill can Break several enemies in one write.
- [x] **Cancel the pending attack** in `use-enemy-attack-timers.ts`: subscribe `staggeredEnemySignatureAtom`
      and add it to the main effect's deps. In the roster loop, **before** the standby check, a staggered
      enemy gets its shot `clearTimeout`-ed and its `releaseAtRef` / `cycleStartRef` / `staggerUsedRef` entries
      deleted; ring duration = `POISE_BREAK_STAGGER_DURATION_MS`, ring elapsed = `duration − staggerRemainingMs`;
      `bumpVersion`; `continue`. The rebuild path already preserves running cycles for everyone else (`:229–240`).
- [x] **No recovery timeout in the hook.** When the tick zeroes the counter the signature changes, the effect
      re-runs, and the existing "no live cycle → `startCycle(id)`" branch (`:238–240`) opens a fresh full cycle.
- [x] **Vulnerable window**: `isEnemyStaggered` is read from the **pre-hit** state → `resolveVulnerableHits`
      before HP is subtracted, in `damageEnemyAtom` (next to the preemptive map, `:213–216`) and in both enemy
      branches of `activateSkillAtom`, which has no bonus hook today. The hit that *causes* a break never gets
      the bonus.
- [x] Recovery re-opens a **full fresh cycle** (`startCycle`), so the ring visibly restarts from full.
- [x] Break on a dead enemy is impossible: HP write and poise write are one transaction, and poise is skipped
      when the resulting HP is `≤ 0`. The skill path sets `gameStatus: 'won'` directly at
      `battle-atoms.ts:700/717`; the hook's main effect already bails when `gameStatus !== 'playing'`.
- [x] Standby enemies (`standbyEnemyIds`) take no poise damage at all until their first attack cycle
      (decided, §J).

**Implementation notes.** The hook is already structured around absolute release timestamps and a
self-rescheduling `setTimeout` per enemy; a Break is just "drop the release and skip this enemy while the
signature says it's staggered". State (the tick) owns the window; the hook only reacts to it, the same way
it reacts to `standbyEnemyIds`.

### E. Anti-stunlock: immunity + escalation (150% cap)

- [x] **Immunity** (poise damage only): when `tickEnemyPoise` brings `staggerRemainingMs` to 0 it sets
      `immuneRemainingMs = POISE_BREAK_IMMUNITY_MS`; while `isPoiseImmune`, `applyPoiseHits` is a no-op.
      **HP damage and the Flinch push still land** — immunity only stops the pool from filling again.
- [x] **Escalation**: `max = min(originalMax × (1 + breakCount × POISE_MAX_GROWTH_PER_BREAK), originalMax × POISE_MAX_GROWTH_CAP)`
      with `POISE_MAX_GROWTH_CAP = 1.5` — the pool grows 100% → 125% → 150% → **150% (hard cap)**.
- [x] State the two caps are independent in `COMBAT_SYSTEM.md`: `MAX_STAGGER_FRACTION_PER_CYCLE` still
      bounds Flinch per cycle; poise immunity + escalation bound Breaks per battle.
- [x] Optional visual: once `max > originalMax` the poise bar draws a 1px tick at `originalMax / max`
      (`POISE_BAR_CLASSES.originalMaxMark`).

**Implementation notes.** Both guards are pure functions of `EnemyPoiseState` (+ `deltaSeconds` for the
tick), so they belong in `poise-system.ts` and get unit-tested there. `breakCount` never resets mid-battle;
`originalMax` is captured once in `createEnemyPoiseState`.

### F. Attack-timer / radial-ring integration

- [x] Ring steps back on Flinch (`resolveCountdownRingAnchor`, `EnemyAttackTimer.elapsedMs`).
- [x] Ring shakes on Flinch (`EnemyAttackTimer.staggerPulse`).
- [x] `EnemyAttackTimer` (`use-enemy-attack-timers.ts:21`) gains `isStaggered: boolean`; while staggered
      `durationMs = POISE_BREAK_STAGGER_DURATION_MS`, `elapsedMs = duration − staggerRemainingMs`, and
      `cycleKey = \`stagger-${id}-${breakCount}\`` so the ring counts the *stagger window* down instead of the attack.
- [x] `timerListsMatch` (`:52–71`) compares `isStaggered` — it is the memo that keeps `BattleTopBar`
      from re-rendering, so a missed field means a stale ring.
- [x] `BattleTopBar`: `tone={timer.isStaggered ? 'neutral' : timer.isStandby ? 'gold' : 'danger'}` — the
      `neutral` tone already exists in `radial-countdown.tsx:12–16`; swap the `Swords` icon for lucide's
      `ShieldOff` while staggered.
- [x] Recovery: a new `cycleKey` (from `startCycle`'s `bumpVersion`) remounts the ring from full.

**Implementation notes.** Reuse the standby pattern exactly: standby already renders a different tone
(`gold`), icon (`Eye`) and `cycleKey` (`standby-<id>`) for a "not attacking yet" state. Stagger is the
same shape with a different reason.

### G. UI & feedback

- [x] **Poise bar**: new `src/components/battle/enemy-poise-bar.tsx` under the enemy HP bar in
      `enemy-display.tsx` — thin, no label, fill = `current / max`; empties on Break, refills on recovery;
      colours in `POISE_BAR_CLASSES` (`src/constants/ui.ts`), warm parchment / amber, no bright yellow.
      Optionally mark the escalated max. The training dummy keeps its readout and shows the bar beneath it.
- [x] **Staggered sprite state**: `enemy-staggered` (desaturated, tilted, slow sway) on the sprite
      **image itself** — not the wrapper, whose `animation` slot belongs to the recoil — while
      `isEnemyStaggered(poise)` (`src/styles/animations.css`); `reduced-motion.css` drops the sway and keeps
      the static tint/tilt. State-driven, so it clears when the tick zeroes the counter.
- [x] **Flinch callout renamed** (decided, see §J): the shipped flinch-cap pop in `enemy-display.tsx`
      (driven by `lastMaxFlinchAtom`) now reads **"Flinched!"** — text only, same trigger, same animation.
- [x] **Break callout**: its **own** pop reading **"Staggered!"**, driven by `lastPoiseBreakAtom`, reusing
      the same `EnemySprite` pattern and the `stagger-callout` keyframes (`animations.css:448`) with a
      `stagger-callout--break` modifier (bigger, held for `POISE_BREAK_CALLOUT_DURATION_MS`) so it clearly
      outranks the flinch one.
- [x] **Break SFX** through `SoundService` — `POISE_BREAK_SOUND` in `src/constants/audio.ts` (nullable, like
      `BOMB_EXPLOSION_SOUND`; reuses `blacksmithShorter` until a dedicated shatter asset exists), played from
      the `EnemySprite` break effect.
- [x] **Recovery cue** (sprite un-tints, poise bar refills, ring returns to `danger` on the fresh cycle). No
      recovery SFX for now.
- [x] Vulnerable-window damage numbers use the `critical` style already used for skill hits — `EnemySprite`
      reads `isStaggered` through a ref at hit time (so the breaking hit also reads as a crit) without
      re-running the damage effect when the window opens or closes.

**Implementation notes.** All per-enemy feedback already lives in `EnemySprite`; the ring lives in
`BattleTopBar`. No new overlay host is needed. `EnemySprite` already re-renders on every `lastDamage`, so
subscribing it to `enemyPoiseAtom` adds no new render cadence.

### H. Tests & benches

- [x] `src/lib/flinch-system.test.ts` — the moved `describe('Stagger Calculations')` block passes unchanged;
      `weighHitsByAttacker` covered (no passive → 1x, unknown/missing attacker → 1x, passive scales,
      `skillMultiplier` only on `source: 'skill'`, per-hit attackers keep order, empty batch).
- [x] `src/lib/flinch-system.bench.ts` — moved `calculateStaggerPushMs` / `clampStaggerToCycleBudget` benches
      plus `resolveStaggerHits` (1 hit / 4-hit batch) and `weighHitsByAttacker`, on `BENCH_OPTIONS`.
- [x] `src/lib/poise-system.test.ts` (33 tests): `calculateMaxPoise` scales with `maxHp`; `poise` multiplier
      direction (0.5 halves, 2 doubles); a batch resolves in order and breaks exactly once; no accumulation
      while staggered or immune (same reference back); escalation sequence 100% → 125% → 150% → 150% (cap
      holds for `breakCount ≥ 2`); `tickEnemyPoise` counts down, flips stagger → immunity, returns the same
      reference when idle; regen honours an explicit `0` and defaults to the shipped rate; `createEnemyPoiseState`
      seeds `current === max === originalMax`; vulnerable rounding; signature order/stability.
- [x] `src/lib/poise-system.bench.ts`: `calculatePoiseDamage`; `applyPoiseHits` (1 hit / 4-hit batch / batch
      that breaks); `resolveEscalatedMaxPoise`; `tickEnemyPoise` with 4 enemies (idle → same reference; 2
      staggered). `BENCH_OPTIONS`.
- [x] `src/lib/battle-atoms.test.ts` (`describe('enemy poise')`, 12 tests, vanilla `createStore`):
      `damageEnemyAtom` and `activateSkillAtom` update `enemyPoise` in the same commit as HP (one listener
      call, matches the pure reducer); vulnerable-window bonus on both paths; the breaking hit gets no bonus;
      no poise on a killing blow, a standby target, or while immune (HP still lands); `lastPoiseBreak`
      published once; `battleTickAtom` stays silent while idle, counts the window down and flips to immunity,
      and `staggeredEnemySignatureAtom` only notifies on the flip; a fresh setup resets everything.
- [x] `src/lib/battle-setup.test.ts`: `createBattleState` seeds `enemyPoise` for every enemy with
      `breakCount === 0` and both counters at 0.
- [ ] Stretch: first-ever test for `useEnemyAttackTimers` — a staggered signature drops the shot timer and
      a cleared signature re-arms a full cycle. There is no hook test today, and no React test environment
      (`jsdom` / `@testing-library/react`) is installed, so this needs a dev-dependency decision first.

### I. Docs to update

- [x] `docs/COMBAT_SYSTEM.md:51–66` — leave the "Enemy Stagger (Flinch) System" section intact and add a
      **Poise / Break** subsection right after it, with the formulas from §5 and a line stating both
      anti-stunlock caps are independent.
- [x] `docs/RPG_SYSTEM.md:30` — VIT "stagger resistance" → "flinch resistance"; note `poise` is a separate
      per-enemy stat, not derived from VIT.
- [x] `docs/BATTLE_SCREEN.md:59,119,140` — component map (poise bar, callout wording), `BattleState`
      fields (`enemyPoise`, `lastPoiseBreak`), feature list.
- [x] `docs/REMAINING_WORK.md:14` — the "telegraphed wind-ups / interrupt" item is partially covered by
      Break; reword.
- [x] `docs/ideas-proposals/ORTHOGONAL_FEATURES.md:65–76` (#3) and `docs/FEATURE_IDEAS_AND_GAPS.md:29` —
      mark the interrupt half as shipped once it is.

### J. Related bugs & open decisions

Bugs to be aware of:

- [x] **Pause doesn't shift the attack release timestamp** — fixed in Phase 3 (§M). `releaseAtRef` is
      absolute `performance.now()`, and the pause branch only cleared timeouts, so on resume
      `delay = max(0, release − now)` could be 0 and the enemy fired instantly while the CSS ring was
      frozen. The hook now records `pausedAtRef` when a pause starts and, on resume, shifts every
      `releaseAtRef` / `cycleStartRef` entry forward by the paused duration before re-arming, so each timer
      resumes exactly where its frozen ring left off (standby waits included). Poise windows never had the
      bug — they are tick-owned counters and the tick loop stops while paused.
- [ ] **Skill kills bypass `pendingVictory`** (`activateSkillAtom` sets `gameStatus: 'won'` at
      `battle-atoms.ts:700/717`, `pendingVictory: false` at `:759`) while match kills defer. Poise is
      skipped on a killing blow, and the hook bails on `gameStatus !== 'playing'`, so no timer can be re-armed
      on an enemy that died in the same write.

Decisions:

- [x] `staggerPushMultiplier` (warrior/rogue passives) also scales **poise damage** — via
      `weighHitsByAttacker`. Update the copy in `src/components/skills/passive-descriptions.ts:42`.
- [x] Separate `POISE_SKILL_MULTIPLIER` (not `SKILL_STAGGER_MULTIPLIER`) — different tuning axis: an ultimate
      that maxes the flinch shouldn't automatically break.
- [x] Standby enemies take no poise damage until their first attack cycle — there is nothing to cancel yet,
      and the preemptive bonus already rewards hitting them. (Simpler than "accumulate but don't Break",
      which would spring a surprise Break on the first post-standby hit.)
- [x] Training dummy breaks anyway (tick-owned windows work without the attack hook), so the feedback can be
      tuned in the Training Grounds; the readout shows the pool. Its `poise` is scaled against
      `TRAINING_DUMMY_POISE_HP_EQUIVALENT` so the sentinel HP doesn't make the pool unbreakable (§B).
- [x] Callout wording — the existing flinch-cap text becomes "Flinched!", the new Break callout reads
      "Staggered!" (see §G).
- [x] `POISE_REGEN_PER_SECOND` — shipped **on** at `0.01` (1% of max per second) after playtesting, so a
      long fight doesn't accumulate toward a guaranteed Break; escalation + immunity remain the main guards.
      Trade-off to watch: with regen on, a dented pool is never "idle", so `battleTickAtom` writes state on
      every tick until the pool is full again (see the note in §4).

### K. Lib layout: files, tests, benches

Pure logic only in `src/lib/`, JSDoc on every export, one `*.test.ts` and one `*.bench.ts` per module
(`BENCH_OPTIONS` from `src/lib/bench-options.ts`; benches are picked up by `vitest.config.ts` →
`src/lib/**/*.bench.ts`, run with `npm run bench-cli`).

| File | Status | Contents |
|---|---|---|
| `src/lib/flinch-system.ts` | [x] done | `calculateStaggerPushMs`, `clampStaggerToCycleBudget`, `StaggerHit`, `StaggerResolution`, `resolveStaggerHits` (moved verbatim) + `AttackerHit`, `weighHitsByAttacker` |
| `src/lib/flinch-system.test.ts` | [x] done | moved `describe('Stagger Calculations')` (14 tests) + `describe('weighHitsByAttacker')` (6 tests) |
| `src/lib/flinch-system.bench.ts` | [x] done | moved stagger benches + `resolveStaggerHits` (1-hit / 4-hit) + `weighHitsByAttacker` (1-hit match / 4-hit skill), on `BENCH_OPTIONS` |
| `src/lib/poise-system.ts` | [x] done | `EnemyPoiseState`, `createEnemyPoiseState`, `calculateMaxPoise`, `calculatePoiseDamage`, `resolveEscalatedMaxPoise`, `isEnemyStaggered`, `isPoiseImmune`, `applyPoiseHits`, `tickEnemyPoise`, `resolveVulnerableDamage`, `resolveVulnerableHits`, `resolveStaggeredEnemySignature` |
| `src/lib/poise-system.test.ts` | [x] done | 33 tests, see §H |
| `src/lib/poise-system.bench.ts` | [x] done | `calculatePoiseDamage`, `resolveEscalatedMaxPoise`, `applyPoiseHits` ×3, `resolveVulnerableHits`, `tickEnemyPoise` idle / 2-staggered, `resolveStaggeredEnemySignature` — all ≈0.1–0.3 µs |

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
           current ≤ 0 → BREAK: staggerRemainingMs set, lastPoiseBreak { enemyIds } published
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

### M. Phase 3 — usability polish

A read-through of the shipped feature from the player's seat, looking for moments where the screen
doesn't explain what just happened. Fixed items are `[x]`; the rest are judgement calls left for playtesting.

- [x] **Immunity was invisible.** After recovery the bar sat full and amber while hits were ignored for 2 s —
      it read as "my hits stopped working". The bar now has three phases (`EnemyPoiseView.phase`):
      **ready** (amber fill = poise left), **broken** (a pale fill drains over the vulnerable window), and
      **immune** (a muted stone fill *rebuilds* over the immunity window). Shatter → drain → rebuild → ready
      tells the whole story under the target. Colours in `POISE_BAR_CLASSES`.
- [x] **The vulnerable window had no timer near the enemy.** Only the top-bar ring counted it down, far from
      where the player is looking. The broken-phase drain above is that timer, right under the sprite.
- [x] **Standby enemies showed a full bar that could not be dented.** The bar is dimmed
      (`POISE_BAR_CLASSES.standby`) while the enemy is in `standbyEnemyIds`, matching the gold eye ring.
- [x] **No label, no explanation.** There is no vertical room for a "POISE" caption under the enemy panel, so
      the bar carries a phase-aware `title` ("Poise 72% — empty it to stagger this enemy", "Staggered! Bonus
      damage while the bar drains", "Recovering — poise damage is ignored while the bar rebuilds") plus the
      `meter` ARIA role. Training readout shows `IMMUNE` alongside `BROKEN`.
- [x] **Per-tick re-renders with regen on.** Every dented pool changes state 10×/s, which re-rendered each
      `EnemySprite` on every tick. `resolveEnemyPoiseView` projects the state onto integer percents and
      `enemyPoiseViewAtom(id)` caches the last view (`poiseViewsMatch`), so the sprite only re-renders when a
      percent actually flips — roughly once per second at 1%/s regen, and per tick only inside the two
      windows where the bar is visibly moving.
- [x] **Pause bug** (§J) — fixed as described there. Affected every attack timer, not just poise.
- [ ] **Balance to playtest — the Moss Golem may never Break.** Pool = 400 × 0.4 = 160, at `poise` 0.5 that is
      **320 damage** to Break, i.e. 80% of its 400 HP; in practice it dies first, so the feature is
      invisible on the one enemy where a cancelled attack would matter most. `poise` ≈ 0.75 would put the
      first Break around 53% HP. The Swamp Frog (27.2 pool ÷ 1.6 = 17 damage, 25% of its HP) Breaks about
      once per fight, twice with escalation.
- [ ] **Auto-target on Break?** Switching the selected enemy to the one that just Broke would push the player
      to pile onto the vulnerable window, but it also yanks the target away mid-plan. Left off; worth an
      A/B in the Training Grounds once there are multi-enemy fights that Break.
- [ ] **Bigger Break impact.** The Break lands with the callout, a clang and the sprite tint; a one-off
      `screen-shake` global animation or a stronger recoil on the breaking hit would sell the cancel harder.
      Cheap to add via `useGlobalAnimation` — held back until the balance pass says Breaks are frequent
      enough that the extra motion isn't fatiguing.

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
| `POISE_REGEN_PER_SECOND` | `0.01` | Refill of the pool while not Broken (fraction of max per second), applied by `tickEnemyPoise`; `0` = off. **Note:** any non-zero value means a dented pool is never idle, so `battleTickAtom` writes every tick until it refills |
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
