# Battle System Performance Optimization Plan

## Context

Combat (the fight behind **Battle Demo**, but it applies to all battles) stutters on slightly older laptops, especially under load. Profiling the code found the battle screen does a large amount of continuous work even when idle: the whole battle subtree re-renders 10×/second, ~48 permanent blur filters sit on the board, several full-viewport layers repaint, and ~84 MB of WAV audio is decoded into RAM at startup.

**Hard constraints for every fix below:**

- **No mechanics or formula changes.** Same tick cadence (100 ms), same damage, same cooldowns, same timings.
- **No manual memoization** (`React.memo`/`useMemo`/`useCallback`) — the React Compiler handles that; fixes work at the source (dirty checks, stable references, CSS).
- No new libraries. `jotai/utils` is fine (jotai is already a dep).
- Visuals stay the same or near-identical (flagged with 👁 where not pixel-identical).

Impact ratings: 🔴 high · 🟡 medium · 🟢 low.

---

## Phase 1 — Kill the 10 Hz re-render storm (state layer) 🔴

The single biggest issue. `battleStateAtom` (`src/stores/battle-atoms.ts:52`) is one mega-atom; every write atom spreads and replaces the whole state.

### 1.1 Dirty-check the cooldown tick

`tickSkillCooldownsAtom` (`src/stores/battle-atoms.ts:450-463`) runs every 100 ms (`battle-screen.tsx:78-84`, `BATTLE_TICK_INTERVAL_MS` in `src/constants/battle.ts:56`). Its `.map` returns the same char objects when nothing changed, but **always allocates a new array and unconditionally `set`s a new state** — so `partyAtom` changes identity 10×/sec for the entire battle, even with all cooldowns at 0. Everything subscribed to `partyAtom` re-renders at 10 Hz: `Match3Board` (48 orbs), `PartyDisplay` (4 sprites + NumberFlows), `BattleItemBar`, `SkillBurstOverlay`, and `useEnemyAttackTimers` → `BattleScreen` itself.

**Fix:** track whether any character actually changed in the map; if none did, `return` without `set` (mirror the guard pattern `tickGuardDecayAtom` already uses at `:479`).

### 1.2 Merge the two tick writes into one

`battle-screen.tsx:78-84` calls `tickSkillCooldowns` **and** `tickGuardDecay` → two whole-state writes + two commit passes per tick. **Fix:** add a single `battleTickAtom` write atom that applies both cooldown decrement and guard decay in one `set` (early-returning when neither applies), keep the old atoms for any other callers. Cadence and math unchanged.

### 1.3 Cache the guard-decay resistance factor

`tickGuardDecayAtom` (`:477-492`) recomputes `calculateGuardDecayResistance(party) * getPartyPassiveModifiers(party).guardDecayResistanceMultiplier` every 100 ms while guard > 0. The party composition it depends on only changes on death/revival. **Fix:** cache the factor keyed on the `party` array reference (module-level WeakMap or recompute-on-reference-change inside the tick atom).

### 1.4 Batch match-resolution writes

One swap currently produces **6–10 sequential whole-state writes** from the cascade effect in `match3-board.tsx:233-415`: `addScore` → inline `setBattleState` for `lastMatchedType` (`:295-298`) → `reduceSkillCooldown` per matched color → `addGuard` → `recordMaxCombo` → `damageEnemy`/`healParty` per color — each recomputing all ~25 derived atoms and committing separately. **Fix:** add one composite `applyMatchResolutionAtom` write atom that takes the match summary (score delta, matched colors/counts, guard gain, combo) and produces **one** new state. The existing write atoms stay for their other callers; the board effect calls the composite. Damage/heal formulas are called unchanged, just inside one write.

### 1.5 Stable `enemyTimers` output

`use-enemy-attack-timers.ts:267-288` builds a fresh array of fresh objects every render (which, with 1.1 fixed, becomes rare — but still). Keep the hook's timer logic (it's well-built); just make the returned array only change identity when its contents actually change (compare against a ref).

**Verify:** React DevTools Profiler on an idle battle — after 1.1/1.2, there should be **zero** re-renders between player actions and enemy attacks (except guard-decay ticks while guard > 0). All existing Vitest suites pass (`npm run test-cli`).

---

## Phase 2 — Component hot spots 🔴/🟡

### 2.1 Background particles re-randomize every render 🔴

`battle-screen.tsx:161-174`: 20 particles compute `Math.random()` **inline in `style` in the render body** — every re-render re-scatters them and restarts their CSS animations. **Fix:** generate positions once in a module-level constant (or lazy `useState` initializer, the pattern `sparkle-layer.tsx:26-33` already uses). 👁 Optionally cap 20 → 12.

### 2.2 Item bar 60 fps setState loop 🔴

`battle-item-bar.tsx:45-58` runs a rAF loop calling `setCooldownProgress` every frame for the entire item-cooldown window, re-rendering the whole bar at 60 fps, rebuilding the inline `conic-gradient` string (`:139`) and reading `Date.now()` in render (`:143`). **Fix:** drive the radial sweep in CSS instead — the codebase already has the exact pattern in `RadialCountdown` (`radial-countdown.css:44-64`): a registered `@property` angle animated by a keyframe with `animation-duration` set to the cooldown length, keyed remount on cooldown start. React then renders **twice** per cooldown (start/end) instead of ~60×/sec. Also hoist `calculateItemCooldownInMs`/`getPartyPassiveModifiers` (`:39`) and the `ConsumableItems` filter (`:68`) out of the per-frame path.

### 2.3 Orb keys — verified, no change needed ✅

`removeMatchedOrbsAndRefill` (`src/lib/match-3.ts:317-324`) already preserves `id` through gravity (only `row`/`col` update), so surviving orbs never remount. New `Date.now()`-based ids (`:333`) are minted only for genuinely new orbs — which must be detected as new anyway to get their fall-in animation (`match3-board.tsx:212-230` depends on the id diff). Remounting 3–10 fresh buttons per cascade step is cheap and correct. Documented here so nobody "fixes" it.

### 2.3b Stop cloning every orb per render 🟡

`match3-board.tsx:487-492` builds `orb={{ ...orb, isHighlighted }}` — a fresh object for all 48 orbs on every render, which defeats React Compiler memoization of unchanged orbs. **Fix:** pass `orb={orb}` plus a separate `isHighlighted` boolean prop (adjust the orb props type and the highlight `useEffect` at `:67-81` to key on the prop).

### 2.4 Cheaper board scans (pure lib, zero visual change) 🟡

- `hasMatchAtPosition` (`match-3.ts:186`) runs `findLineMatches` over the **whole board** to answer one cell; `swapOrbsAtom` calls it twice per swap (`battle-atoms.ts:99-100`). Replace with a localized check of the two swapped cells' rows/columns (≤ ~14 cells vs 2×48 + allocation).
- `expandBombExplosions` (`match-3.ts:121`) scans all 48 cells even when the board has no bombs — early-return when no matched orb is a bomb.
- `findLineMatches` allocates a fresh column array per column (`:102-103`) — index directly instead.

All behavior is locked by `src/lib/match-3.test.ts`; JSDoc per house rules.

### 2.5 Delete dead code 🟢

`src/components/battle/orb.tsx` exports an `OrbComponent` nothing imports (the board uses its own inline one at `match3-board.tsx:63`). Remove it.

---

## Phase 3 — CSS & compositing 🔴/🟡

### 3.1 Hitstop full-screen recalc 🔴

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

Every orb renders a `blur-sm` shine div (`match3-board.tsx:107`). **Fix:** replace with an unblurred `radial-gradient` (or a tiny pre-rendered PNG) — visually near-identical at orb size, removes 48 always-on `filter: blur(4px)` paint passes.

### 3.3 Bars: animate transform, not width 👁(imperceptible) 🟡

- `battle-hp-bar.tsx:43-49` (party + enemy HP), `party-display.tsx:193-197` (cooldown bars, retargeted 10×/sec ×4), `indigolay-bar.css:27-32` (HP/Guard fills) all transition `width` (layout). **Fix:** fixed-width fill + `transform: scaleX(fraction)` with `transform-origin: left`, and `transition-transform` instead of `transition-all`. Two caveats: `indigolay-bar__fill` uses 9-slice `border-image` — scaleX would distort the end-cap, so keep width there but narrow to `transition: width` (or move the chrome to a non-scaling wrapper); and fills containing gradient/shine children (the cooldown bar's `via-white/30` overlay at `party-display.tsx:199`) stretch under scale — keep the shine outside the scaled element.
- 👁 `party-display.tsx:320`: always-on `animate-pulse` HP-bar shimmer — remove or make it fire only on heal.

### 3.4 Skill-ready glow blur 👁 🟡

`party-display.tsx:88`: `blur-xl` (24 px) + `animate-pulse` on up to 4 characters for most of the fight. **Fix:** swap for a radial-gradient glow div with animated opacity (compositable). Near-identical.

### 3.5 Infinite filter/box-shadow animations → opacity crossfades 👁 🟡

Each of these animates `filter`/`box-shadow` (paint per frame) continuously; re-implement as a pre-painted glow layer whose **opacity** animates:

- `.guard-icon-full` drop-shadow anim (`battle-elements.css:112`) and `.guard-bar-full` box-shadow anim (`:127`)
- `.enemy-selected` brightness blink (`animations.css:354`)
- `rc-urgency` drop-shadow across the whole enemy attack interval ×4 rings (`radial-countdown.css:86-97`)

### 3.6 Background composited 3× 🟡

The ~220 KB battle JPEG paints on `.partySection` (`battle-screen.tsx:112-119`), `.enemySection` (`:125-132`), **and** `#boardSection::before` (`battle-layout.css:321-331`), plus the tiled SVG grid layer. **Fix:** paint it once on a single absolutely-positioned layer behind `battleArea` (sections keep their tint/gradient overlays). 👁 Should look the same; verify seams.

### 3.7 SkillBurstOverlay conic gradient 🟡

`animations.css:508-592`: a 200%×200%-viewport, 72-stop conic gradient repainting for 650 ms per skill cast. **Fix:** rotate an element with a **static** gradient via `transform: rotate` (compositor-cached) instead of animating the gradient itself, and shrink to ~120% viewport. 👁 Near-identical.

### 3.8 Scope the universal `image-rendering` rule 🟢

`index.css:369-379` applies 3 declarations to `*, *::before, *::after`, with substring `img[src*=…]` opt-outs (`utilities.css:24-30`) — a tax on every style recalc, and recalcs are frequent in battle. **Fix:** scope to `img, canvas` + the known pixel-art classes; replace substring selectors with an explicit class on smooth images.

### 3.9 Particle-burst caps 👁 🟢

Match: 8 `animate-ping` divs per matched orb (`match3-board.tsx:150-166`); bomb: 12 shadowed divs per exploding orb (`:133-145`) — a 3×3 blast spawns ~96 animated nodes. **Fix:** cap at ~4/6 per orb and/or a global burst budget. Barely visible at 600 ms lifetimes.

### 3.10 Click ripple forced reflow 🟢

`mouse-tracker.tsx:35-37` forces synchronous layout (`getBoundingClientRect`) on **every click app-wide**, including each orb click. **Fix:** restart the animation by toggling `animation: none` via rAF or a counter-keyed class instead.

---

## Phase 4 — Audio 🔴 (memory + startup)

~84 MB of WAV is eagerly loaded **and decoded to PCM** at startup (`sound-service.ts:75-105` via `loader-service.ts:23`): `fight-music-loop.wav` 37.9 MB, `boss-fight.wav` 31 MB, `epic-cinematic.wav` 11.9 MB, `combatMusic.wav` 3.8 MB… This alone can push an older 8 GB laptop into memory pressure.

**Verified bonus finding:** `SoundNames.bossFight` (31 MB) and `SoundNames.fightMusicLoop` (37.9 MB) are registered in `src/constants/audio.ts:53-54` but **never played anywhere in `src/`** — 69 MB of the footprint is dead weight until a caller exists.

- **4.1 Lazy-load music per scene (the actual RAM win):** split `src/constants/audio.ts` into `PRELOAD_SOUND_FILES` (small SFX) and `MUSIC_SOUND_FILES`; add an idempotent `soundService.ensureLoaded(alias)` (cached promise map) that `sound.add`s on first use; `startMusic` awaits it, so call sites need no changes. Prefetch `combatMusic` in the background after the loading screen resolves to hide first-battle latency. The unused `bossFight`/`fightMusicLoop` simply stop loading entirely.
- **4.2 Convert music tracks to a compressed format** — **done, tooling committed.** `npm run assets:audio` (dry run) / `assets:audio-write` drives `scripts/convert-audio.mjs`, which uses the bundled `ffmpeg-static` binary (falls back to a system `ffmpeg`). Measured result on the music tier: **80.65 MB → 7.00 MB (-91%)**, durations and sample rates verified identical.

  | file | before | after |
  | --- | --- | --- |
  | `ui/fight-music-loop.wav` | 36.12 MB | 3.96 MB |
  | `ui/boss-fight.wav` | 29.61 MB | 1.52 MB |
  | `ui/epic-cinematic.wav` | 11.33 MB | 1.24 MB |
  | `bg-noise/combatMusic.wav` | 3.59 MB | 0.27 MB |

  OGG Vorbis q5 was chosen over MP3/M4A because it loops seamlessly (no encoder padding) and `levelup.ogg` is already precedent. Pass `--format m4a` if older Safari support is needed. Note `combatMusic.wav` was **24-bit PCM for a 14-second loop** — that alone explains its size. Remaining step: point `src/constants/audio.ts` at the `.ogg` paths, confirm playback, then delete the `.wav` originals. Caveat: compression cuts **download, decode time, and disk** — decoded in-RAM PCM still depends on duration, so the resident-memory win comes from 4.1, not the codec.
- **4.3 Stop calling `sound.resumeAll()` on every SFX** (`sound-service.ts:112-117`) — it churns the global audio context per play. Guard it: only call when `sound.context.audioContext.state === 'suspended'` (the autoplay-policy case it exists for).
- **4.4 Small bug fixes:** `preloadAudios` early-return never settles its promise (`:79-81`, would hang `Promise.all` on a second call); music fade-in 50 ms interval isn't cancelled when the sound stops mid-fade (`:163-171`); bomb-SFX `setTimeout` in `match3-board.tsx:262-265` has no cleanup.

---

### 4.5 Image assets — measured, low priority 🟢

`npm run assets:images` drives `scripts/optimize-images.mjs` (uses `sharp`), rewriting files **in place with the same filenames**, so no `src` paths change. Honest numbers from a dry run over the 31 MB of `public/assets`:

- **Lossless PNG re-deflate (default, safe): only ~0.45 MB.** Not worth a commit on its own.
- `--jpeg` (lossy mozjpeg q82): ~4 MB, mostly the two ~1.2 MB dungeon cave backgrounds.
- `--palette` (lossy 256-colour quantization): ~6 MB, almost all of it the four skill sheets (~-67% each).

The skill sheets and menu art were measured at **well over 256 colours**, so `--palette` genuinely degrades them — eyeball before committing. Both lossy modes are opt-in flags for this reason. Verdict: images are a marginal win next to audio's 73 MB; revisit only if download size matters.

---

## Phase 5 (optional) — "Performance mode" toggle 🟢

A toggle that disables the purely decorative layers for low-end machines: floating particles, scanline overlay (`battle-screen.tsx:97`), orb shine, hitstop scale, particle-burst caps, shimmer/urgency/glow animations. The codebase already has the exact pattern to mirror 1:1: the in-game reduced-motion system — `src/lib/reduced-motion.ts` (cached getter + `data-reduced-motion` attribute on `<html>`), `reducedMotionAtom` in `src/stores/pause-menu-atoms.ts:54`, overrides in `src/styles/reduced-motion.css`. Add `performanceModeAtom` (`atomWithStorage`), `src/lib/performance-mode.ts`, `src/styles/performance-mode.css` keyed off `html[data-perf-mode]`, and a settings entry next to Reduced Motion. Worth having since "older laptop under load" is exactly the target user.

---

## Suggested order & expected payoff

| Step | Effort | Payoff |
| --- | --- | --- |
| Phase 1 (tick dirty-check + batching) | Small | Largest: idle battle goes from 10 Hz full-tree renders to ~0 |
| 2.1 particles + 2.2 item bar | Small | Removes the two remaining per-frame render loops |
| 3.1 hitstop + 3.2 orb blur | Small–medium | Biggest paint/raster wins |
| Phase 4 audio | Medium | Biggest memory win; helps most with "lots of stuff open" |
| Remaining Phase 2/3 items | Medium | Steady paint-cost reductions |
| Phase 5 toggle | Small | Safety valve for the slowest machines |

## Verification

- `npm run test-cli` — all match-3 / lib suites must stay green (they lock the mechanics).
- React DevTools Profiler: idle battle should show no re-renders between events after Phase 1.
- Chrome Performance panel with **6× CPU throttle**: record 30 s of Battle Demo (idle + a cascade + a skill cast) before/after; compare scripting/rendering/painting totals and dropped frames.
- Memory: heap + AudioBuffer footprint before/after Phase 4 (Performance monitor → JS heap).
- Visual pass: side-by-side of orb shine, glows, bars, skill burst at normal speed to confirm the 👁 substitutions read the same.
