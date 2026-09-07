# Performance — What To Do Next

Written 2026-09-07, after item 1.1 of `BATTLE_PERFORMANCE_PLAN.md` landed; updated the same day once
the three items below were implemented and measured. Everything here was **measured on the working
tree**, not inferred.

Reconciled against `BATTLE_PERFORMANCE_PLAN.md` on 2026-09-07: the plan's Phase 3–5 items that are still
open are now named below rather than left implied.

**Constraint: the game must look identical.** All three items are 🟢 NONE for visual risk — none of
them can change a rendered pixel. Most rendering, CSS and audio work has been ruled out; see the bottom
of this file so none of it gets re-litigated. The exceptions that survived that sweep are named under
"What is left on the battle screen" — do not read "ruled out" as covering the whole tier.

---

## The three items — done, with an honest result

| # | Item | Store cost per event (A/B) | React commits | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Batch match resolution (`applyMatchResolutionAtom`) | 228 → **57 µs** (4.0×), 324 → **63 µs** (5.1×) | **26 → 26** | store win only |
| 2 | Split `PartyDisplay` (`partyMemberAtom`) | 58 → **82 µs** per tick (+24 µs) | panel **32 → 4** per 3 s | small net positive |
| 3 | Merge tick writes (`battleTickAtom`) | 106 → **58 µs** when both tick (−45 %) | **1 → 1** per tick | store win only |

**The premise behind items 1 and 3 was half wrong, and the measurement caught it.** Both were
justified as "N writes → N commits". A deterministic cascade probe (seeded RNG, same board, same
move, enemies parked, medians of 3) showed **26 commits before and 26 after** item 1, with identical
board render counts and ms. React already batches every store dispatch made inside one effect or
timer callback into a single commit. What the batching saves is Jotai's own work per write — one
state spread, one derived-atom walk, one listener pass instead of five or seven — which is real and
locked in by tests, but is a microsecond-scale win: roughly **1 ms per five-step cascade** and
**≤0.5 ms per second** of active play for the tick merge.

Item 2 does what it says: the stats panel, both `NumberFlow`s and the Guard effects no longer render on
cooldown ticks (32 → 4 renders per 3 s). But the four `CharacterSprite`s still render every tick
because all four cooldowns move, and they were most of the cost. The five extra derived atoms cost the
store 24 µs per tick; the panel render they spare was ~7 ms per 3 s in the dev build. Net positive,
small. While Guard is decaying the panel legitimately re-renders every tick anyway.

All three are kept: the code is simpler (one composite write, one tick writer, no prop-drilled party
array), field-for-field equivalence with the legacy paths is locked by 18 new tests, and the store
savings are free. Just don't expect a frame graph to move.

### Where the numbers came from

- **Store, with and without Jotai:** `src/lib/battle-atoms.bench.ts` (through `createStore()` with the
  battle UI's 16 derived atoms mounted, legacy and new side by side in one process) and
  `src/lib/battle-system.bench.ts` (the pure reducers). `BENCH_OPTIONS`, ±1–2 %.
- **Browser:** Playwright + a DevTools-hook commit probe, counting only fibers with `PerformedWork`
  set. Cascade runs use a seeded `Math.random` and enemies parked on a 1e9 ms standby so every rep
  replays the same refills and no attack lands inside the window. Harness in the session scratchpad
  (`probe2.mjs`, `probe3.mjs`).
- Tests: 816 passing (18 new across `battle-atoms.test.ts` and `battle-setup.test.ts`).

---

## What is left on the battle screen

After these three, the measured cost that remains is **the board rendering on each cascade step**
(~12 `Match3Board` renders × ~4.5 ms per five-step cascade in the dev build) and the CSS/paint work
below. Neither has a zero-visual fix that has *measured* as worthwhile:

- The board re-renders because the board *changed* — orbs moved. The React Compiler already caches
  unchanged orbs; the remaining floor is ~20 µs per orb of component invocation. Cutting it means
  restructuring how the board is rendered, not batching state.
- Most of the CSS tier either changes how the game looks or did not survive measurement (below). **3.1
  is the exception** and is still open — see the list that follows.

No *measured* zero-visual item remains on this screen. That is not the same as "the plan is empty" — the
following are still open in `BATTLE_PERFORMANCE_PLAN.md`, ruled neither in nor out here:

- **3.1 Hitstop full-screen recalc** — the one open item carrying a **zero-visual argument**.
  `#game-screen.hitstop-freeze *` is a universal descendant selector, and `transform: scale(1.012)` on
  `#game-screen` makes it a containing block for every `position: fixed` descendant, so both fire twice
  per hit across the whole viewport. The plan's fix scopes both to `.battleContainer` and verifies the
  fixed overlays are its **siblings**. Unmeasured, not refuted — the blanket CSS ruling below does not
  cover it.
- **3.6** the battle background painted three times (`.partySection`, `.enemySection`,
  `#boardSection::before`), **3.8** the broad `image-rendering` rule in `src/index.css`, and **3.10**
  `getBoundingClientRect()` on every app-wide click in `mouse-tracker.tsx`. None of the three
  necessarily changes a pixel; none has been measured.
- **Phase 5** performance-mode toggle — designed and scoped, an opt-in visual change.

The next win means picking one of those up, accepting a visual change, or profiling a different screen.

---

## Ruled out

**Rendering and CSS.** The old plan's Phase 3 ranks these by reasoning about CSS. Measurement doesn't
support the ranking, and every candidate either changes how the game looks or shows no measurable
gain.

- **Orb shine blur (48 × `blur-sm`), the plan's top paint item at 🔴 high — refuted.** The blurred
  shine divs **never appear in the idle repaint list**. They paint once and stay cached. Close to free
  at rest, and changing them would be visible. Don't.
- **Skill-burst conic gradient — stale.** Already compositor-friendly: the gradient is static and only
  `transform: rotate` animates. Nothing to fix.
- **Bar `width` transitions, glows, filter animations, particle caps** — all real as described, all
  visible if changed, and none surfaced as top repainters.
- **Hitstop is _not_ ruled out.** It was previously grouped with the line above; that was wrong. See
  3.1 in the open list — the plan's `.battleContainer` scoping was verified against the overlay tree
  and changes nothing in the battle area.
- Turning off **every** decorative effect at once measured *worse* than baseline, which is the clearest
  signal that this tier is below the noise floor.

**Audio — the performance items only.** 4.1 (lazy-load music per scene, which the plan calls the actual
RAM win) is deliberately out of scope: not worth the churn in the sound service while bosses and maps
are being integrated.

⚠️ That ruling does **not** cover Phase 4's correctness items, which are still open. `preloadAudios`
(`src/services/sound-service.ts`) `return`s from inside its `Promise` executor when a preload is already
in flight, resolving and rejecting nothing — so a second call never settles, and
`loaderService.preloadEverything()` awaits it inside a `Promise.all`. 4.3's `sound.resumeAll()` calls
are likewise unguarded. Separately, the `.wav` originals superseded by 4.2 are still on disk (~81 MB);
PR #37 tracks that as a pre-merge follow-up.

**Disk space.** Not worth touching in pre-alpha — unused assets are expected at this stage.

---

## Measurement notes

- **Count commits before batching writes.** React coalesces every store dispatch from one task into
  one commit. Items 1 and 3 assumed otherwise; the deterministic probe showed the commit count did not
  move. Batching is then a store optimisation, not a render one — still worth taking, but size it
  accordingly.
- **CSS ablation by injection does not work, and those numbers aren't trustworthy.** Injecting
  `.blur-sm { filter: none !important }` *adds* a rule and forces a full restyle instead of removing
  the original's cost. Attributing a CSS rule properly means deleting it from source and rebuilding.
  The layer-repaint counts quoted above are injection-free and are the ones to trust.
- **Random refills make cascade traces incomparable.** Seed `Math.random` and park the enemies before
  measuring a cascade, or two runs of "the same" swap will differ in chain depth by 2–3×.
- Dev-build numbers include StrictMode double-rendering. Relative, never absolute.
