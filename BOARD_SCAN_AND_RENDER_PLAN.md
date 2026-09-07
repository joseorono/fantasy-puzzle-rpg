# Board Scan & Render Plan

Closes out the playability work and takes the next two board items from `BATTLE_PERFORMANCE_PLAN.md`: **2.3b** (stop cloning every orb per render) and **2.4** (cheaper board scans), plus **2.5** (delete dead `orb.tsx`), which 2.3b forces. Benchmarks are tightened so the gains are measurable, and the render-side change is measured in the browser rather than asserted.

## 1. Context

- The playability work (`BOARD_PLAYABILITY_PLAN.md`) is implemented and green (766 tests, tsc, lint). Two closing steps from its §11 were still open: its §10 before/after table had not been pasted in, and the in-browser Playwright pass had not run.
- `Match3Board` (`src/components/battle/match3-board.tsx`) rendered every orb as `orb={{ ...orb, isHighlighted: highlightedMatches.has(orb.id) }}` — a fresh object for all 48 orbs on every render — and `onSelect={() => handleOrbClick(orb.row, orb.col)}`, a fresh closure per orb per render. The React Compiler memoizes JSX *inside* `OrbComponent` keyed on its props, so a new `orb` object every time is a guaranteed cache miss: each of the 48 orbs re-runs `cn()` (clsx + tailwind-merge, the single most expensive call in that component) and rebuilds its subtree on every board render. The board re-renders on every cascade step and, until perf item 1.1 lands, on every 100 ms tick through its `partyAtom` subscription (for `deadColorClasses`).
- `findLineMatches` (`src/lib/match-3.ts`) allocates a temporary array per column on every call; `expandBombExplosions` always copied the id `Set` and scanned all 48 cells even when no matched orb is a bomb — which is almost every match. The board effect calls both on every board change.
- `hasMatchAtPosition`, the first bullet of 2.4, was already rewritten as a localized window check during the playability work (measured ~5× faster; `isValidSwap` ~8×).
- Vitest benches ran with the default 500 ms sampling window. Relative errors were ±1–5 %, too coarse to resolve the sub-microsecond wins expected here.

## 2. Decisions and assumptions

- **Zero visual change.** 2.3b and 2.4 are pixel-identical and mechanic-identical; the only observable effect is less work per render / per scan.
- **No `React.memo` / `useMemo` / `useCallback`** (project rule). Stability comes from passing the same references the compiler can cache: the board's own `orb` objects, a boolean flag, and the click handler itself.
- **`isHighlighted` and `isMatched` leave the `Orb` type.** Neither was ever written to board state (`isHighlighted` was synthesized at render time; `isMatched` was never used). Highlight is a prop of `OrbComponent`. The dead `src/components/battle/orb.tsx` was the only other reader, so it is deleted (perf item 2.5).
- **Measurement over assertion for the render change.** The claim "unchanged orbs stop doing work" is verified in the browser with React's commit timings, before and after, not inferred from compiler docs.
- **Bench options are shared and explicit** (`src/lib/bench-options.ts`), not sprinkled per call.

## 3. Part A — close out the playability work

1. The before/after table is in §10 of `BOARD_PLAYABILITY_PLAN.md` (means per call): `isValidSwap` 1.3 → 0.15 µs, `hasMatchAtPosition` 0.8 → 0.14 µs, refill 7.1 → 4.2 µs with the guarantee inside, opening board 3.3 → 13 µs once per battle. Plus two notes: imported constants are getters under vite-node (hence the `RUN_LENGTH` aliases), and a dead full random 8×6 board is too rare to sample (500 s found none), so deadlocks come from partial refills.
2. Playwright pass (dev server, scripts in the session scratchpad, nothing added to the repo) — **all passed, before and after Part C**: 20 deals through `setupBattleAtom` had 0–2 runs, longest run ≤ 4, every board playable, `lastReshuffle` null; an invalid swap kept the selection on the first orb with orb coordinates consistent, the shake played and cleared, the white ring returned; a `lastReshuffle` event rendered the callout once and it was gone after 1.5 s; a `DEADLOCKED_GRID` board plus the row-clear item was repaired by the reroll path with exactly 6 new orbs and a legal move (one run of the re-run landed a free cascade, as designed).

## 4. Part B — 2.4 cheaper board scans (pure lib)

`src/lib/match-3.ts`:

- **`expandBombExplosions` early-returns.** It seeds the bomb queue first (one pass over the board, `matchedIds.has` only for bombs); if no matched orb is a bomb it returns `matchedIds` itself — no `Set` copy, no queue, no second pass. Only when a bomb is matched does it copy and flood-fill as before. Tests cover both branches, including the identity contract.
- **`findLineMatches` keeps its fresh per-line arrays — on purpose.** Two rewrites were measured and rejected (see §9): walking the board by index math, and reusing a scratch column plus a `runs` array cleared with `length = 0`. Both are slower than allocating; the scanner's JSDoc records this so nobody "fixes" it again. The greedy scanner returns `[start, end)` pairs, which `findLineMatches`, `countLineRuns` and `longestLineRun` share.
- `hasMatchAtPosition`: already done in the playability work; checked off in `BATTLE_PERFORMANCE_PLAN.md`.

`src/components/battle/match3-board.tsx`'s board effect is unchanged; it simply got cheaper.

## 5. Part C — 2.3b stop cloning every orb per render (+ 2.5)

- `src/types/components.ts` — `OrbComponentProps`: added `isHighlighted: boolean`; `onSelect` is now `(row: number, col: number) => void`.
- `src/types/battle.ts` — removed `isMatched?` and `isHighlighted?` from `Orb`.
- `src/components/battle/match3-board.tsx` — `OrbComponent` takes `isHighlighted` (effect and class list read it), calls `onSelect(orb.row, orb.col)`; the render loop passes `orb={orb}`, `isHighlighted={highlightedMatches.has(orb.id)}`, `onSelect={handleOrbClick}`.
- `src/components/battle/orb.tsx` — deleted (no importer).

Why this works under the compiler: `OrbComponent`'s cached `className` and subtree are keyed on `orb` (now the board's own object, stable across renders that do not move the orb), the flags, and `onSelect`. `handleOrbClick`'s identity only changes when its inputs change (selection, swap lock, pause, pending victory) — never on a cascade step or an idle tick — so during cascades and idle re-renders an unchanged orb returns its cached element and React skips its subtree. Every orb still *runs* (no `memo`), but the run is a handful of comparisons instead of `cn()` plus reconciliation. The served module confirms it: `OrbComponent` compiles to 40 memo slots with `cn()` guarded on the orb object and the six flags.

## 6. Part D — benchmarks that can see the gains

- **`src/lib/bench-options.ts`** — `BENCH_OPTIONS = { time: 1500, warmupTime: 250, iterations: 5000, warmupIterations: 500 }`, passed to every `bench()` in `match-3.bench.ts`, `board-generation.bench.ts` and the `createSeededRandom` bench. Relative error dropped from ±1–5 % to ±0.2–1 %.
- **New cases** in `match-3.bench.ts`: `expandBombExplosions` with and without a matched bomb (`BOMB_RUN_GRID` fixture: the 4-run with a wildcard inside), `findLineMatches` on the dead board (no early exit anywhere), and `board effect scan` — the exact `findLineMatches` + `expandBombExplosions` pair the component runs per board change.
- **Browser measurement for 2.3b** (Playwright, before and after, same protocol): a minimal `__REACT_DEVTOOLS_GLOBAL_HOOK__` installed via `addInitScript` makes React's dev build report every commit; the hook walks the fiber tree, finds `Match3Board` and every `OrbComponent`, and sums `actualDuration` for fibers that rendered in that commit. Two series: 3 s idle, and 4 s after one valid swap. The dev server is started by the user; the script only attaches.

## 7. Implementation order (as executed)

1. Results table into `BOARD_PLAYABILITY_PLAN.md` §10.
2. `bench-options.ts`; options applied to every bench; new baseline cases; baseline run.
3. Browser **before** probe and the Part A pass.
4. Part B in `match-3.ts` (two scanner variants benchmarked and rejected in a same-process A/B; fresh arrays kept), tests green.
5. Part C (types, component, `orb.tsx` deleted), tsc + lint + 768 tests green.
6. Browser **after** probe plus the visual pass (highlight ping ×8, disappear spin ×9, fall-in ×9, bomb ring ×1 all observed after a swap) and the Part A pass re-run.
7. §9 below; 2.3b, 2.4 and 2.5 checked off in `BATTLE_PERFORMANCE_PLAN.md` with one-line pointers here.

## 8. Tests

- `src/lib/match-3.test.ts`: `expandBombExplosions` returns the input set by identity when no matched orb is a bomb and a fresh set otherwise (input left intact); `findLineMatches` finds a run that lives only in the last column; the 300-board `hasAnyLineMatch` agreement property cross-checks the scanner. 768 tests across 29 files pass.
- The component change has no unit tests (no jsdom in this repo); it is covered by the browser measurement and visual pass above.

## 9. Results

Lib numbers are a **same-process A/B**: the pre-change `match-3.ts` (commit `23c3695`) is loaded as a second module next to the current one and both run under `BENCH_OPTIONS` in one Vitest process. That is the only method that proved stable — separate runs of the same bench file drifted up to 2× for allocation-heavy functions depending on heap state. Means per call, ±1–2 %.

| bench | before | after | Δ |
|---|---|---|---|
| `findLineMatches` settled / with 4-run / dead | 1.24 / 1.52 / 1.31 µs | 0.82 / 1.09 / 0.84 µs | 1.4–1.6× faster |
| `expandBombExplosions` no matched bomb / matched bomb | 0.28 / 1.10 µs | 0.23 / 1.07 µs | 1.2× faster / parity |
| board effect scan (both), settled / with 4-run | 3.0 / 3.0 µs | 2.5 / 2.3 µs | 1.2–1.3× faster |
| `hasMatchAtPosition`, `isValidSwap` (playability work) | 0.8 / 1.3 µs | 0.14 / 0.15 µs | 5× / 8× faster |

Browser numbers are React dev-build commit timings (`actualDuration`) captured through a DevTools hook in Playwright on the Battle Demo, same machine and protocol before and after. StrictMode double-rendering is included on both sides, so treat them as relative.

| browser (Match3Board) | before | after | Δ |
|---|---|---|---|
| idle: board commits in 3 s | 31 | 33 | unchanged — the 10 Hz party tick (perf item 1.1) |
| idle: mean commit | 4.92 ms | 3.84 ms | −22 % |
| idle: Σ OrbComponent per commit | 1.35 ms (48 rendered) | 1.12 ms (48 rendered) | −17 % |
| cascade: mean commit | 4.46 ms | 4.04 ms | −9 % |
| idle: board render time per 3 s | 153 ms | 127 ms | −17 % |

Findings worth keeping:

- **Allocation was never the cost in `findLineMatches`.** Variant benches in one process, settled board: fresh per-line arrays 0.7 µs; walking the board by index math 2.3 µs; a reused scratch column plus a `runs` array cleared with `length = 0` 3.0–3.4 µs. V8 deoptimizes the reused arrays; six tiny young-generation allocations are the cheapest option. Perf-plan bullet 2.4.3 is marked refuted, and the scanner keeps its fresh copies with a JSDoc line saying why.
- **The compiler does its part.** The served module shows `OrbComponent` compiled with 40 memo slots and `cn()` guarded on the orb object and the flags, so unchanged orbs now skip class merging and subtree creation. All 48 orbs still *run* every commit (no `React.memo`, by project rule), and in the dev build each run still costs roughly 20 µs of React bookkeeping; that floor is why the win is 22 % and not 80 %.
- **The remaining idle cost is the commit itself.** Thirty-plus board commits every 3 s with no player input come from the `partyAtom` subscription used only for `deadColorClasses`. Perf item 1.1, and reading dead colors through a narrower selector, is where the next order of magnitude lives — not inside the orbs.

## 10. Verification

- `npx tsc --noEmit` clean; ESLint clean on every touched file (the one remaining warning in `match3-board.tsx` is the pre-existing effect-deps one); Prettier clean on new and rewritten files; `npm run test-cli` 768/768.
- `npm run bench-cli` before and after with the shared options; same-process A/B for the table in §9.
- Browser: the two probe series, the visual pass, and the Part A pass, all after Part C.

## 11. Risks

- The `Orb` type shrank; any external code that wrote `isHighlighted` would fail `tsc` — none exists in `src` and boards are not persisted.
- `expandBombExplosions` returning the input `Set` by identity: the component stores it in state and never mutates it, so aliasing is safe; stated in its JSDoc.
- Browser numbers depend on the dev build's profiler timer; they are relative before/after on the same machine and session, not absolute production costs.
