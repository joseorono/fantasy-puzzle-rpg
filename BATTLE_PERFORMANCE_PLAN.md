# Battle System Performance Optimization Plan

## Context

- [ ] Done

Combat (the fight behind **Battle Demo**, but it applies to all battles) stutters on slightly older laptops, especially under load. Profiling the code found the battle screen does a large amount of continuous work even when idle: the whole battle subtree re-renders 10×/second, ~48 permanent blur filters sit on the board, several full-viewport layers repaint, and ~84 MB of WAV audio is decoded into RAM at startup.

**Hard constraints for every fix below:**

- **No mechanics or formula changes.** Same tick cadence (100 ms), same damage, same cooldowns, same timings.
- **No manual memoization** (`React.memo`/`useMemo`/`useCallback`) — the React Compiler handles that; fixes work at the source (dirty checks, stable references, CSS).
- No new libraries. `jotai/utils` is fine (jotai is already a dep).
- Visuals stay the same or near-identical (flagged with 👁 where not pixel-identical).

Impact ratings: 🔴 high · 🟡 medium · 🟢 low.

---

## Phase 1 — Kill the 10 Hz re-render storm (state layer) 🔴

- [ ] Done

The single biggest issue. `battleStateAtom` (`src/stores/battle-atoms.ts:52`) is one mega-atom; every write atom spreads and replaces the whole state.

### 1.1 Dirty-check the cooldown tick

- [x] Done

`tickSkillCooldownsAtom` (`src/stores/battle-atoms.ts:450-463`) runs every 100 ms (`battle-screen.tsx:78-84`, `BATTLE_TICK_INTERVAL_MS` in `src/constants/battle.ts:56`). Its `.map` returns the same char objects when nothing changed, but **always allocates a new array and unconditionally `set`s a new state** — so `partyAtom` changes identity 10×/sec for the entire battle, even with all cooldowns at 0. Everything subscribed to `partyAtom` re-renders at 10 Hz: `Match3Board` (48 orbs), `PartyDisplay` (4 sprites + NumberFlows), `BattleItemBar`, `SkillBurstOverlay`, and `useEnemyAttackTimers` → `BattleScreen` itself.

**Fix:** track whether any character actually changed in the map; if none did, `return` without `set` (mirror the guard pattern `tickGuardDecayAtom` already uses at `:479`).

**Measured (2.3b probe, dev build):** with no player input the board commits **31–33 times per 3 s**, ~3.8 ms each after 2.3b, all through `Match3Board`'s `partyAtom` subscription that only feeds `deadColorClasses`. Even with every orb cached, that is ~125 ms of board rendering per 3 s of idle. This item, plus reading dead colors through a narrower selector, is worth more than everything inside the orbs combined.

**Implemented, together with the narrow selectors this section, §1.5 and §2.2 pointed at.** The tick logic is now a pure `tickPartySkillCooldowns` in `src/lib/battle-system.ts` (copy-on-first-change; returns the **input array** when no cooldown moved) and `tickSkillCooldownsAtom` skips its `set` on reference equality. Same predicate, same `Math.max(0, cd − delta)`, same cadence.

The dirty check alone turned out to be a partial fix: `createBattleState` starts every hero on full cooldown (12–52 s with the starter party), and a *single* running cooldown defeats the guard, so idle-with-nothing-running is the only state it helps. The `partyAtom` subscribers that never needed the whole party were therefore moved off it:

- `Match3Board` reads `deadOrbColorClassesAtom` — the space-joined `dead-<color>` string it used to build inline. Jotai only notifies dependents when a derived value fails `Object.is` (`jotai/esm/vanilla/internals.mjs`, `setAtomStateValueOrPromise`), so a primitive selector sits out every tick. The cascade effect reads the party on demand via `useStore().get(partyAtom)`.
- `BattleItemBar` reads `itemCooldownMsAtom` (a number) instead of recomputing `calculateItemCooldownInMs` from `party` on every render.
- `useEnemyAttackTimers` and `SkillBurstOverlay` read `partyAtom` through the store inside their effects (the §1.5 fix that was deferred to here).
- `PartyDisplay` keeps its subscription — it draws the cooldown bars and must move while a cooldown runs.

**Measured in-browser** (dev build, Playwright + DevTools hook, idle 3 s, guard 0, per-component render count / summed `actualDuration`, StrictMode included — relative numbers):

| state | commits | total render | Match3Board | PartyDisplay | BattleItemBar |
| --- | --- | --- | --- | --- | --- |
| A cooldowns running (battle start) | 66 → **39** | 256 → **78 ms** | 33× / 129 ms → **4× / 14 ms** | 34× / 40 ms → 38× / 46 ms | 33× → **4×** |
| B all cooldowns 0 | 68 → **8** | 237 → **28 ms** | 33× / 129 ms → **3× / 10 ms** | 38× / 17 ms → **8× / 5 ms** | 33× → **3×** |
| C one cooldown running | 68 → **38** | 258 → **43 ms** | 33× / 140 ms → **2× / 7 ms** | 38× / 22 ms → 38× / 24 ms | 33× → **2×** |

What remains is legitimate: enemy attacks and damage-number timers (state B), plus the `PartyDisplay` tick while a cooldown runs (A/C). One cascade went from 101 → 27 commits and ~241 → ~61 ms of board render. Dead-hero `dead-<color>` classes were verified to apply and clear on the board container.

**Measured in-process** (same-process A/B per the measurement notes, `BENCH_OPTIONS`; the `git show HEAD` copy of the atoms as the legacy module; store rows drive a vanilla `createStore()` with the battle UI's 14 derived atoms mounted, plus the 2 new selectors for the current version):

| per tick | legacy | current |
| --- | --- | --- |
| pure reducer, idle | 0.13 µs | 0.13 µs |
| pure reducer, one / all running | 0.21 / 0.33 µs | 0.19 / 0.35 µs |
| **through the store, idle** | **51.1 µs** | **1.2 µs (42×)** |
| through the store, one / all running | 50.8 / 50.0 µs | 57.4 / 57.9 µs |

The reducer itself is a wash — four tiny allocations cost nothing in V8 (see the notes below) — so the entire idle win is skipping Jotai's write + propagation. Running-state store ticks cost ~7 µs more because `itemCooldownMsAtom` and `deadOrbColorClassesAtom` now recompute on each party change; those 7 µs replace a ~4 ms `Match3Board` render and an item-bar render per tick. Permanent benches: `src/lib/battle-system.bench.ts` (pure) and `src/lib/battle-atoms.bench.ts` (through the store). Tests: `tickPartySkillCooldowns` in `src/lib/battle-setup.test.ts`, the atoms and both selectors in `src/lib/battle-atoms.test.ts` (798 tests pass).

⚠️ Seen in the probe, not chased: `BattleTopBar` and `SkillBurstOverlay` register as rendered on every commit that touches the screen (39× in state A) although their inputs are stable, and the pre-change probe showed **two** commits per tick. Whether the probe's `actualStartTime` test also counts bailed-out fibers on the update path was not verified — worth checking with the `PerformedWork` flag before treating it as a compiler-memoization miss.

### 1.2 Merge the two tick writes into one

- [ ] Done

`battle-screen.tsx:78-84` calls `tickSkillCooldowns` **and** `tickGuardDecay` → two whole-state writes + two commit passes per tick. **Fix:** add a single `battleTickAtom` write atom that applies both cooldown decrement and guard decay in one `set` (early-returning when neither applies), keep the old atoms for any other callers. Cadence and math unchanged.

### 1.3 Cache the guard-decay resistance factor

- [x] Done

`tickGuardDecayAtom` (`:477-492`) recomputes `calculateGuardDecayResistance(party) * getPartyPassiveModifiers(party).guardDecayResistanceMultiplier` every 100 ms while guard > 0. The party composition it depends on only changes on death/revival. **Fix:** cache the factor keyed on the `party` array reference (module-level WeakMap or recompute-on-reference-change inside the tick atom).

**Implemented — but not on the array reference.** A reference key would have hit ~0% of the time: `tickSkillCooldownsAtom` runs immediately before the decay tick in the same interval callback (`battle-screen.tsx:80-81`) and unconditionally allocates a fresh `party` array, so the reference is always new. This only becomes a viable key once **1.1** lands, and even then it would miss whenever a cooldown is mid-countdown. (1.1 has landed: the reference now survives only while *every* living hero is at 0, so the value key stays.)

The cache is keyed on the **values the factor actually depends on**, checked in an allocation-free pass over the ≤4 members:

- living/dead status (the flip, not the HP value) and `stats.vit` — the inputs to `calculateGuardDecayResistance`
- the `unlockedPassiveIds` and `skillLevels` **references** — the inputs to `getPartyPassiveModifiers`. Both survive the tick's object spread untouched, so they compare equal by identity.

Members are compared index-by-index with an early `continue` on reference equality, so an unchanged party costs a handful of primitive comparisons instead of ~10 object allocations plus a registry walk. Both underlying functions are order-independent, so index-wise comparison is safe. `resolveGuardDecayFactor` and its cache live in `battle-atoms.ts` next to the atom that uses them (there is no store-level test suite; all 704 tests still pass).

⚠️ The comparison list is the correctness boundary: a mid-battle VIT buff or a passive granted during combat would go stale until added to `guardDecayFactorInputsMatch`. Noted in the JSDoc at the call site.

### 1.4 Batch match-resolution writes

- [ ] Done

One swap currently produces **6–10 sequential whole-state writes** from the cascade effect in `match3-board.tsx:233-415`: `addScore` → inline `setBattleState` for `lastMatchedType` (`:295-298`) → `reduceSkillCooldown` per matched color → `addGuard` → `recordMaxCombo` → `damageEnemy`/`healParty` per color — each recomputing all ~25 derived atoms and committing separately. **Fix:** add one composite `applyMatchResolutionAtom` write atom that takes the match summary (score delta, matched colors/counts, guard gain, combo) and produces **one** new state. The existing write atoms stay for their other callers; the board effect calls the composite. Damage/heal formulas are called unchanged, just inside one write.

### 1.5 Stable `enemyTimers` output

- [x] Done

`use-enemy-attack-timers.ts:267-288` builds a fresh array of fresh objects every render (which, with 1.1 fixed, becomes rare — but still). Keep the hook's timer logic (it's well-built); just make the returned array only change identity when its contents actually change (compare against a ref).

**Implemented.** The built list is compared field-for-field against `lastTimersRef` by a module-level `timerListsMatch`; when nothing moved the hook hands back the *previous* array. `staggerPulse` is compared by `nonce`/`level` rather than by reference, so mutating a pulse in place could not slip through as "unchanged". Timer logic untouched.

The payoff is in the consumer, not the hook: `enemyTimers` is a prop from `BattleScreen` to `BattleTopBar` (`battle-screen.tsx:102`), which renders up to four `RadialCountdown` rings. A prop that was new by identity on every render defeated the compiler's bailout; now `BattleTopBar` re-renders only at real anchor points (cycle start, mid-battle rebuild, stagger).

⚠️ **Adjacent finding — the hook itself forces the 10 Hz re-render of `BattleScreen`.** `useEnemyAttackTimers` calls `useAtomValue(partyAtom)` (`:73`) purely to keep `partyRef` current for the stagger effect, which reads it inside a callback. That subscription is what re-renders the whole battle screen on every cooldown tick. Note that `enemiesAtom` does **not** have this problem: the tick replaces only `state.party`, so the derived enemies array keeps its identity and Jotai skips the notify.

Fix (not applied — changes subscription semantics, worth doing with 1.1): drop the `partyAtom` subscription and read the party on demand via `useAtomCallback` or `useStore().get(partyAtom)` inside the stagger effect. Even after 1.1 lands, `party` still changes identity whenever any cooldown is counting down — which is most of a fight — so 1.1 alone does not fix this.

**Applied with 1.1:** the hook now calls `useStore().get(partyAtom)` inside the stagger effect; `partyRef` is gone.

**Verify:** React DevTools Profiler on an idle battle — after 1.1/1.2, there should be **zero** re-renders between player actions and enemy attacks (except guard-decay ticks while guard > 0). All existing Vitest suites pass (`npm run test-cli`).

---

## Phase 2 — Component hot spots 🔴/🟡

- [ ] Done

### 2.1 Background particles re-randomize every render 🔴

- [x] Done

`battle-screen.tsx:161-174`: 20 particles computed `Math.random()` **inline in `style` in the render body** — every re-render re-scattered them and restarted their CSS animations. Extracted to `~/components/effects/floating-particles`, which seeds placements once in a lazy `useState` initializer (the pattern `sparkle-layer.tsx:26-33` already uses). Count now lives in `BATTLE_AMBIENT_PARTICLE_COUNT` (`src/constants/battle.ts`).

**Investigating this turned up that the effect was invisible in play** — 20 white `h-1 w-1` dots at 30–50% opacity (Tailwind's `pulse` keyframe interpolates against the element's own `opacity-30`) spread over the whole viewport, i.e. one 4×4 px dot per ~85,000 px² against bright sky-and-grass art. That is also why the reseeding bug went unnoticed for so long. Rather than optimize an effect nobody could see, the layer was made to earn its cost:

- Warm cream motes (`#f7ead0`) with an amber glow instead of white — white has no contrast on these backdrops.
- Sizes 2–6 px with brightness scaled to size, for depth.
- Slow upward drift with sway (9–18 s), replacing the static in-place `animate-pulse`. **Only `transform`/`opacity` animate**, so the motes stay on the compositor — no layout or paint.
- Negative `animation-delay` per mote, so the field is already populated on mount rather than fading up in unison.
- Layer switched from `fixed` to `absolute`: it now fills `#game-screen` instead of the browser viewport, so motes no longer spill over the decorative window frame.
- Base `opacity` is the animation's peak, so Reduced Motion (which collapses animations to 1 ms) leaves them visible and static instead of stuck at `opacity: 0`.

Styles in `src/styles/floating-particles.css`. Count held at 20 — 👁 the optional cap to 12 is now a one-line constant change.

### 2.2 Item bar 60 fps setState loop 🔴

- [x] Done

`battle-item-bar.tsx:45-58` ran a rAF loop calling `setCooldownProgress` every frame for the entire item-cooldown window, re-rendering the whole bar at 60 fps, rebuilding the inline `conic-gradient` string (`:139`) and reading `Date.now()` in render (`:143`).

**Implemented, with no visual change.** The wedge is now a registered `@property --item-cd-angle` animated by `battle-item-cd-sweep` (`src/styles/battle-elements.css`), mirroring `RadialCountdown`'s pattern; `animation-duration` is set inline from the party's SPD-derived cooldown and the layer is keyed on the cooldown's end timestamp so each use replays it. The rAF loop, `cooldownProgress` state and the `useCallback` are gone.

- The `Ns` label is the only thing React still moves. It polls every `ITEM_COOLDOWN_LABEL_TICK_MS` (250 ms, `src/constants/battle.ts`) rather than scheduling on second boundaries — a throttled tab can't desync it — and is guarded against repeat values by a ref, so it costs **one render per second**, not four.
- Polling (rather than one `setTimeout` per second) keeps the digit honest if the tab is backgrounded; the guard is what keeps the render count at 1/s.
- `ConsumableItems.filter(...)` hoisted to a module-level `BATTLE_ITEMS`. `calculateItemCooldownInMs`/`getPartyPassiveModifiers` are no longer on any per-frame path.
- `.motion-exempt` on the wedge is deliberate: it is the cooldown *readout*, not decoration, so it must keep its real duration under Reduced Motion — same reasoning the codebase already applies to `.radial-countdown__fill`. Without it the global 1 ms override would blank the wedge while the item was still locked.

**Measured in-browser** (Playwright against the dev server, one full cooldown of 6578 ms):

| | before | after |
|---|---|---|
| inline `style` writes inside `#battle-item-bar` | **1837** | **2** |
| label sequence | `7s…1s` | `7s…1s` (identical) |
| overlay cleared / button re-enabled | ~6.9 s | ~6.8 s |
| wedge angle | JS, per frame | linear `28.3°→344.8°`, `animation-duration: 6.578s` |

Reduced Motion re-checked with `data-reduced-motion` set: `animation-duration` stays `6.578s` (not collapsed to `1ms`).

⚠️ Same adjacent finding as 1.5: the bar subscribes to `partyAtom` (`:32`) only to derive `cooldownDuration`, so it still re-renders at 10 Hz from the cooldown tick. That is now the bar's *only* remaining render churn, and it belongs with 1.1.

**Applied with 1.1:** the bar reads `itemCooldownMsAtom` instead.

### 2.3 Orb keys — verified, no change needed ✅

- [x] Done

`removeMatchedOrbsAndRefill` (`src/lib/match-3.ts:317-324`) already preserves `id` through gravity (only `row`/`col` update), so surviving orbs never remount. New `Date.now()`-based ids (`:333`) are minted only for genuinely new orbs — which must be detected as new anyway to get their fall-in animation (`match3-board.tsx:212-230` depends on the id diff). Remounting 3–10 fresh buttons per cascade step is cheap and correct. Documented here so nobody "fixes" it.

### 2.3b Stop cloning every orb per render 🟡

- [x] Done — `BOARD_SCAN_AND_RENDER_PLAN.md` §5: the board passes its own `orb` object, an `isHighlighted` prop and the shared `onSelect(row, col)` handler; `orb.tsx` deleted with it. Idle board commit −22% in the dev build (§9).

`match3-board.tsx:487-492` builds `orb={{ ...orb, isHighlighted }}` — a fresh object for all 48 orbs on every render, which defeats React Compiler memoization of unchanged orbs. **Fix:** pass `orb={orb}` plus a separate `isHighlighted` boolean prop (adjust the orb props type and the highlight `useEffect` at `:67-81` to key on the prop).

### 2.4 Cheaper board scans (pure lib, zero visual change) 🟡

- [x] Done — `BOARD_SCAN_AND_RENDER_PLAN.md` §4 and §9 (one bullet refuted by measurement, see below).

- [x] `hasMatchAtPosition` (`match-3.ts:186`) runs `findLineMatches` over the **whole board** to answer one cell; `swapOrbsAtom` calls it twice per swap (`battle-atoms.ts:99-100`). Replace with a localized check of the two swapped cells' rows/columns (≤ ~14 cells vs 2×48 + allocation). → **Done** in `BOARD_PLAYABILITY_PLAN.md`: `hasMatchAtPosition` is a localized window check and `isValidSwap` no longer copies the board or allocates a `Set` (measured ~7× faster in-process).
- [x] `expandBombExplosions` (`match-3.ts:121`) scans all 48 cells even when the board has no bombs — early-return when no matched orb is a bomb. → **Done**: seeds the bomb queue first and returns the input set untouched when no matched orb is a bomb (~1.4× faster on the common path).
- [x] `findLineMatches` allocates a fresh column array per column (`:102-103`) — index directly instead. → **Refuted by measurement, kept as is**: in a same-process A/B the fresh copy scans in 0.7 µs, index math in 2.3 µs and reused scratch arrays (`length = 0`) in 3.0–3.4 µs — V8 deoptimizes the reuse; young-generation allocation of six tiny arrays is the cheapest option.

All behavior is locked by `src/lib/match-3.test.ts`; JSDoc per house rules.

### 2.5 Delete dead code 🟢

- [x] Done — `src/components/battle/orb.tsx` deleted (it was also the only other reader of the removed `Orb.isHighlighted` field).

`src/components/battle/orb.tsx` exports an `OrbComponent` nothing imports (the board uses its own inline one at `match3-board.tsx:63`). Remove it.

---

## Phase 3 — CSS & compositing 🔴/🟡

- [ ] Done

### 3.1 Hitstop full-screen recalc 🔴

- [ ] Done

`triggerHitstop` (`src/lib/animation-strategies.ts:68-84`) fires on **every damaging match, every cascade step, every skill cast**. Its CSS (`global-animations.css:372-381`) has two problems:

1. `#game-screen.hitstop-freeze * { animation-play-state: paused !important }` — a universal descendant selector that forces a full-subtree style recalc twice per hit (class add + remove).
2. `transform: scale(1.012)` on `#game-screen` makes it a **containing block for all `position: fixed` descendants** (scanline overlay, particle layer, SkillBurstOverlay) → full-viewport re-raster twice per hit.

**Fix:** scope both rules to `.battleContainer` instead of `#game-screen`/`*` — verified that the fixed overlays (`retro-screen` at `battle-screen.tsx:97`, particle layer `:161`, `SkillBurstOverlay` `:177`) are **siblings** of `.battleContainer` (`:107`), so scaling it changes no containing block and bounds the re-raster to the battle area:

```css
#game-screen.hitstop-freeze .battleContainer,
#game-screen.hitstop-freeze .battleContainer * { animation-play-state: paused !important; }
#game-screen.hitstop-freeze .battleContainer { transform: scale(1.012); transition: transform 40ms ease-out; will-change: transform; }
```

`animation-strategies.ts` needs no JS change; update the matching overrides in `reduced-motion.css` to the same selectors. 👁 The top bar's countdown rings and the overlays no longer freeze/scale for the 80 ms — imperceptible, and arguably more correct since the rings read real timers.

### 3.2 48 permanent blur filters on the board 👁 🔴

- [ ] Done

Every orb renders a `blur-sm` shine div (`match3-board.tsx:107`). **Fix:** replace with an unblurred `radial-gradient` (or a tiny pre-rendered PNG) — visually near-identical at orb size, removes 48 always-on `filter: blur(4px)` paint passes.

### 3.3 Bars: animate transform, not width 👁(imperceptible) 🟡

- [ ] Done

- [ ] `battle-hp-bar.tsx:43-49` (party + enemy HP), `party-display.tsx:193-197` (cooldown bars, retargeted 10×/sec ×4), `indigolay-bar.css:27-32` (HP/Guard fills) all transition `width` (layout). **Fix:** fixed-width fill + `transform: scaleX(fraction)` with `transform-origin: left`, and `transition-transform` instead of `transition-all`. Two caveats: `indigolay-bar__fill` uses 9-slice `border-image` — scaleX would distort the end-cap, so keep width there but narrow to `transition: width` (or move the chrome to a non-scaling wrapper); and fills containing gradient/shine children (the cooldown bar's `via-white/30` overlay at `party-display.tsx:199`) stretch under scale — keep the shine outside the scaled element.
- [ ] 👁 `party-display.tsx:320`: always-on `animate-pulse` HP-bar shimmer — remove or make it fire only on heal.

### 3.4 Skill-ready glow blur 👁 🟡

- [ ] Done

`party-display.tsx:88`: `blur-xl` (24 px) + `animate-pulse` on up to 4 characters for most of the fight. **Fix:** swap for a radial-gradient glow div with animated opacity (compositable). Near-identical.

### 3.5 Infinite filter/box-shadow animations → opacity crossfades 👁 🟡

- [ ] Done

Each of these animates `filter`/`box-shadow` (paint per frame) continuously; re-implement as a pre-painted glow layer whose **opacity** animates:

- [ ] `.guard-icon-full` drop-shadow anim (`battle-elements.css:112`) and `.guard-bar-full` box-shadow anim (`:127`)
- [ ] `.enemy-selected` brightness blink (`animations.css:354`)
- [ ] `rc-urgency` drop-shadow across the whole enemy attack interval ×4 rings (`radial-countdown.css:86-97`)

### 3.6 Background composited 3× 🟡

- [ ] Done

The ~220 KB battle JPEG paints on `.partySection` (`battle-screen.tsx:112-119`), `.enemySection` (`:125-132`), **and** `#boardSection::before` (`battle-layout.css:321-331`), plus the tiled SVG grid layer. **Fix:** paint it once on a single absolutely-positioned layer behind `battleArea` (sections keep their tint/gradient overlays). 👁 Should look the same; verify seams.

### 3.7 SkillBurstOverlay conic gradient 🟡

- [ ] Done

`animations.css:508-592`: a 200%×200%-viewport, 72-stop conic gradient repainting for 650 ms per skill cast. **Fix:** rotate an element with a **static** gradient via `transform: rotate` (compositor-cached) instead of animating the gradient itself, and shrink to ~120% viewport. 👁 Near-identical.

### 3.8 Scope the universal `image-rendering` rule 🟢

- [ ] Done

`index.css:369-379` applies 3 declarations to `*, *::before, *::after`, with substring `img[src*=…]` opt-outs (`utilities.css:24-30`) — a tax on every style recalc, and recalcs are frequent in battle. **Fix:** scope to `img, canvas` + the known pixel-art classes; replace substring selectors with an explicit class on smooth images.

### 3.9 Particle-burst caps 👁 🟢

- [ ] Done

Match: 8 `animate-ping` divs per matched orb (`match3-board.tsx:150-166`); bomb: 12 shadowed divs per exploding orb (`:133-145`) — a 3×3 blast spawns ~96 animated nodes. **Fix:** cap at ~4/6 per orb and/or a global burst budget. Barely visible at 600 ms lifetimes.

### 3.10 Click ripple forced reflow 🟢

- [ ] Done

`mouse-tracker.tsx:35-37` forces synchronous layout (`getBoundingClientRect`) on **every click app-wide**, including each orb click. **Fix:** restart the animation by toggling `animation: none` via rAF or a counter-keyed class instead.

---

## Phase 4 — Audio 🔴 (memory + startup)

- [ ] Done

~84 MB of WAV is eagerly loaded **and decoded to PCM** at startup (`sound-service.ts:75-105` via `loader-service.ts:23`): `fight-music-loop.wav` 37.9 MB, `boss-fight.wav` 31 MB, `epic-cinematic.wav` 11.9 MB, `combatMusic.wav` 3.8 MB… This alone can push an older 8 GB laptop into memory pressure.

**Verified bonus finding:** `SoundNames.bossFight` (31 MB) and `SoundNames.fightMusicLoop` (37.9 MB) are registered in `src/constants/audio.ts:53-54` but **never played anywhere in `src/`** — 69 MB of the footprint is dead weight until a caller exists.

- [ ] **4.1 Lazy-load music per scene (the actual RAM win):** split `src/constants/audio.ts` into `PRELOAD_SOUND_FILES` (small SFX) and `MUSIC_SOUND_FILES`; add an idempotent `soundService.ensureLoaded(alias)` (cached promise map) that `sound.add`s on first use; `startMusic` awaits it, so call sites need no changes. Prefetch `combatMusic` in the background after the loading screen resolves to hide first-battle latency. The unused `bossFight`/`fightMusicLoop` simply stop loading entirely.
- [x] **4.2 Convert music tracks to a compressed format** — **done, tooling committed.** `npm run assets:audio` (dry run) / `assets:audio-write` drives `scripts/convert-audio.mjs`, which uses the bundled `ffmpeg-static` binary (falls back to a system `ffmpeg`). Measured result on the music tier: **80.65 MB → 7.00 MB (-91%)**, durations and sample rates verified identical.

  | file | before | after |
  | --- | --- | --- |
  | `ui/fight-music-loop.wav` | 36.12 MB | 3.96 MB |
  | `ui/boss-fight.wav` | 29.61 MB | 1.52 MB |
  | `ui/epic-cinematic.wav` | 11.33 MB | 1.24 MB |
  | `bg-noise/combatMusic.wav` | 3.59 MB | 0.27 MB |

  OGG Vorbis q5 was chosen over MP3/M4A because it loops seamlessly (no encoder padding) and `levelup.ogg` is already precedent. Pass `--format m4a` if older Safari support is needed. Note `combatMusic.wav` was **24-bit PCM for a 14-second loop** — that alone explains its size. Remaining step: point `src/constants/audio.ts` at the `.ogg` paths, confirm playback, then delete the `.wav` originals. Caveat: compression cuts **download, decode time, and disk** — decoded in-RAM PCM still depends on duration, so the resident-memory win comes from 4.1, not the codec.
- [ ] **4.3 Stop calling `sound.resumeAll()` on every SFX** (`sound-service.ts:112-117`) — it churns the global audio context per play. Guard it: only call when `sound.context.audioContext.state === 'suspended'` (the autoplay-policy case it exists for).
- [ ] **4.4 Small bug fixes:** `preloadAudios` early-return never settles its promise (`:79-81`, would hang `Promise.all` on a second call); music fade-in 50 ms interval isn't cancelled when the sound stops mid-fade (`:163-171`); bomb-SFX `setTimeout` in `match3-board.tsx:262-265` has no cleanup.

---

### 4.5 Image assets — measured, low priority 🟢

- [ ] Done

`npm run assets:images` drives `scripts/optimize-images.mjs` (uses `sharp`), rewriting files **in place with the same filenames**, so no `src` paths change. Honest numbers from a dry run over the 31 MB of `public/assets`:

- **Lossless PNG re-deflate (default, safe): only ~0.45 MB.** Not worth a commit on its own.
- `--jpeg` (lossy mozjpeg q82): ~4 MB, mostly the two ~1.2 MB dungeon cave backgrounds.
- `--palette` (lossy 256-colour quantization): ~6 MB, almost all of it the four skill sheets (~-67% each).

The skill sheets and menu art were measured at **well over 256 colours**, so `--palette` genuinely degrades them — eyeball before committing. Both lossy modes are opt-in flags for this reason. Verdict: images are a marginal win next to audio's 73 MB; revisit only if download size matters.

---

## Phase 5 (optional) — "Performance mode" toggle 🟢

- [ ] Done

A toggle that disables the purely decorative layers for low-end machines: floating particles, scanline overlay (`battle-screen.tsx:97`), orb shine, hitstop scale, particle-burst caps, shimmer/urgency/glow animations. The codebase already has the exact pattern to mirror 1:1: the in-game reduced-motion system — `src/lib/reduced-motion.ts` (cached getter + `data-reduced-motion` attribute on `<html>`), `reducedMotionAtom` in `src/stores/pause-menu-atoms.ts:54`, overrides in `src/styles/reduced-motion.css`. Add `performanceModeAtom` (`atomWithStorage`), `src/lib/performance-mode.ts`, `src/styles/performance-mode.css` keyed off `html[data-perf-mode]`, and a settings entry next to Reduced Motion. Worth having since "older laptop under load" is exactly the target user.

---

## Suggested order & expected payoff

- [ ] Done

| Step | Effort | Payoff |
| --- | --- | --- |
| Phase 1 (tick dirty-check + batching) | Small | Largest: idle battle goes from 10 Hz full-tree renders to ~0 |
| 2.1 particles + 2.2 item bar | Small | Removes the two remaining per-frame render loops |
| 3.1 hitstop + 3.2 orb blur | Small–medium | Biggest paint/raster wins |
| Phase 4 audio | Medium | Biggest memory win; helps most with "lots of stuff open" |
| Remaining Phase 2/3 items | Medium | Steady paint-cost reductions |
| Phase 5 toggle | Small | Safety valve for the slowest machines |

## Verification

- [ ] Done

- [ ] `npm run test-cli` — all match-3 / lib suites must stay green (they lock the mechanics).
- [ ] React DevTools Profiler: idle battle should show no re-renders between events after Phase 1.
- [ ] Chrome Performance panel with **6× CPU throttle**: record 30 s of Battle Demo (idle + a cascade + a skill cast) before/after; compare scripting/rendering/painting totals and dropped frames.
- [ ] Memory: heap + AudioBuffer footprint before/after Phase 4 (Performance monitor → JS heap).
- [ ] Visual pass: side-by-side of orb shine, glows, bars, skill burst at normal speed to confirm the 👁 substitutions read the same.

### Measurement notes (learned while doing 1.3, 1.5, 2.2, 2.3b, 2.4 and the playability work)

- **Separate bench runs drift; compare in one process.** Running the same `*.bench.ts` twice gave up to 2× different means for allocation-heavy functions (`findLineMatches` read 0.7 µs in one run and 2.3 µs in the next, unchanged code) because heap state and JIT tiering differ per run. The only stable before/after method was a **same-process A/B**: load the pre-change file as a second module (`git show <commit>:src/lib/x.ts > src/lib/legacy-x.tmp.ts`), bench legacy and current side by side in one throwaway `zz-compare.bench.ts`, delete both afterwards. Every table in `BOARD_PLAYABILITY_PLAN.md` and `BOARD_SCAN_AND_RENDER_PLAN.md` was produced this way.
- **Use `BENCH_OPTIONS`** (`src/lib/bench-options.ts`: 1.5 s window, 5 000 iteration floor, warmup) on every `bench()`. Vitest's 500 ms default gave ±1–5 % error; the shared options give ±0.2–1 %, enough to resolve 0.1 µs deltas.
- **Imported constants are getters under vite-node.** A hot loop that compares against an imported constant per cell benchmarks ~2.6× slower than the same loop with a literal, because the SSR transform exposes module exports through getters. Production builds inline the constant, so this is a bench artifact — but a big one. Hot lib loops alias the constant once at module scope (`const RUN_LENGTH = MIN_MATCH_LENGTH` in `match-3.ts` and `board-generation.ts`) purely so the benches reflect production.
- **Allocation is not the enemy in V8; reuse can be.** Six tiny per-line arrays in `findLineMatches` cost 0.7 µs; walking the board by index math cost 2.3 µs; reusing a scratch array cleared with `length = 0` cost 3.0–3.4 µs (deoptimized). Measure before removing an allocation.
- **Render cost is measured, not asserted.** A minimal `__REACT_DEVTOOLS_GLOBAL_HOOK__` injected with Playwright's `addInitScript` makes React's dev build call `onCommitFiberRoot`; walking the fiber tree and summing `actualDuration` for the fibers that rendered in that commit gives per-commit cost per component. Dev builds include StrictMode double-rendering, so treat the numbers as relative before/after, never absolute. The harness lives in the session scratchpad, not the repo.
- **Jotai runs without React, so the store's own cost is benchable.** `createStore()` (`jotai`) gives `get`/`set`/`sub` with no Provider; mounting the same derived atoms the UI subscribes to makes each `store.set` pay the real dependency walk and `Object.is` checks. Benching the pure reducer *and* the atom in the same file (1.1) separated the two: the reducer was a wash, the store write was 50 µs per idle tick. Tests get the same benefit — `store.sub` listeners fire exactly when a `useAtomValue` subscriber would re-render.
- **The React Compiler caches JSX, it does not skip components.** Passing stable references (the board's own `orb`, a boolean, the shared handler) makes an unchanged `OrbComponent` hit its memo cache and return the same element, but the function still runs every commit. In the dev build that floor is ~20 µs per orb, which is why 2.3b bought 22 %, not 80 %; the rest belongs to 1.1.
