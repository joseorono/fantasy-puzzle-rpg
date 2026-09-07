# Guaranteed-Playable Board Plan

## 1. Context

The match-3 board can reach a state with no legal move (no adjacent swap forms a 3-run). Today nothing detects or prevents this: `createInitialBoard` fills 48 cells uniformly at random, `removeMatchedOrbsAndRefill` spawns uniformly random orbs at the top of each column, and the battle UI has no shuffle button, no "no moves" message, and no hint. A deadlocked board soft-locks the fight — the player can only burn items.

The opening board also routinely contains pre-made matches. They resolve as a free cascade before the first swap, which is where the "x14 combo on turn one that ends the battle" comes from.

**Goal:** the board is always playable — at generation and after every refill (cascade refills, the item row-clear, the item column-clear). Opening boards may still open with a small free cascade (up to 2 matches) so preemptive strikes keep happening, but never a runaway one.

**Hard constraints (from the user and `CLAUDE.md`):**

- Logic lives in **pure functions in `src/lib`**; new file `src/lib/board-generation.ts`, `match-3.ts` keeps detection.
- **Benchmarks first.** A baseline is recorded against the current code before anything changes, then re-run after.
- **Unit tests and benchmarks for every new or changed function.**
- **Gameplay randomness is untouched.** Every function takes an optional `rng: () => number` that defaults to `Math.random` (house pattern: `generateEnemyStandbyDelays` in `src/lib/battle-system.ts:30-33`). Nothing in the app passes a seed; only tests and benches do. The guarantee must not skew the distribution beyond conditioning on "playable".
- TS strict, no enums, JSDoc on lib functions, tunables in `src/constants`, no manual memoization, no new libraries (Vitest `bench` is already configured: `vitest.config.ts` → `benchmark.include: ['src/lib/**/*.bench.ts']`, scripts `bench` / `bench-cli`).
- Performance-conscious: the guarantee runs on every refill, so its fast path must be a few microseconds and allocation-free.

## 2. Decisions

Confirmed with the user:

| Decision | Choice |
|---|---|
| Opening board | Settled fill with a guaranteed move, **but** allow up to **2 pre-made matches** so preemptive strikes still trigger sometimes, without a runaway opening combo. |
| Forced-reshuffle feedback | Record `lastReshuffle` in battle state **and** show an on-board callout ("No moves! Reshuffle!") now. |
| File layout | Split: `match-3.ts` = detection/swap/move search; new `board-generation.ts` = ids, random orbs, generation, reshuffle, guarantee, and the refill (moved). |

Interpretations and assumptions (flag at review — cheap to change):

- **"Up to 2 matches" is a cap on the generated board's pre-made runs**, counted as greedy runs across rows and columns (a cross-shaped match counts as 2). All pre-made runs resolve in one cascade step, so the opening step deals at most two matches' worth of damage. What happens after that is the normal random refill, with the same odds of chaining as any mid-battle refill — the opening chain is *not* artificially cut at step 2. (Alternative if the user meant "at most 2 cascade *steps*": the opening chain's refills would have to be generated match-free until the chain settles, which needs a flag threaded from the board component; not proposed.)
- **No free bombs at the opening.** A pre-made run of `BOMB_MATCH_SPAWN_THRESHOLD` (5) or longer spawns a bomb, which is the same kind of unearned spike the cap is meant to remove, so opening runs must also be shorter than that threshold. Bombs are never placed at generation (unchanged).
- **The cascade system is untouched.** Refills keep spawning uniformly random orbs and never avoid matches; chains of any depth remain possible mid-battle exactly as today. The 2-match cap applies **only** to `createOpeningBoard` (the deal), never to refills, rerolls, or reshuffles. A reroll that happens to create a match is accepted — the cascade continues and the next refill is checked again; forcing match-free rerolls would bias the color distribution and dampen chains.
- **A full reshuffle preserves the player's board.** It keeps the exact multiset of colors and keeps every bomb where it is (same id, same cell); only the non-bomb orbs are redistributed and get fresh ids. Dropping bombs would silently eat a reward the player earned and desync the cascade's bomb budget bookkeeping, so this is in scope, not a follow-up.

## 3. Current state (verified)

- `src/lib/match-3.ts` (361 lines). Exports: `getRandomOrbType`, `orbsMatch` (unused outside its test), `findLineMatches`, `expandBombExplosions`, `createBombOrb` (unused outside tests), `hasMatchAtPosition` (runs `findLineMatches` over the whole board to answer one cell), `createInitialBoard`, `swapOrbs`, `isValidSwap` (copies the board, full scan), `removeMatchedOrbsAndRefill`. The greedy scanner `scanLineForMatches` (`:39-78`) hardcodes `>= 3` at `:69`; `MIN_MATCH_LENGTH` in `src/constants/game.ts:14` is unused.
- Wildcard semantics: a bomb (`isBomb`) extends any run; a run's color is the first non-bomb seen. `[blue, *, blue]` matches; `[blue, *, green]` does not.
- **Pre-existing bug in `swapOrbs` (`match-3.ts:221-240`):** it copies the row arrays but writes `row`/`col` onto the *shared orb objects*. `swapOrbsAtom` (`src/stores/battle-atoms.ts:92-114`) discards the new board on an invalid swap, yet the two live orbs now carry each other's coordinates; `match3-board.tsx:493-501` reads `orb.row`/`orb.col` for the selection ring and the click handler, so both misreport until the next refill re-spreads the orbs. Must be fixed first — the new move search relies on never mutating the live board.
- Ids: initial board `orb-<row>-<col>` (positional, reused every battle), refill `orb-<Date.now()>-<row>-<col>` / `bomb-…`. Two refills in the same millisecond would collide, and a reshuffle right after a refill would regenerate identical ids for the spawned cells. The board component diffs ids to animate fall-in (`match3-board.tsx:212-230`) and uses them as React keys (`:488`); nothing persists boards (`save-game.ts` has no board) and no test asserts id text.
- Call sites of what moves: `src/lib/battle-system.ts:9,121` (`createInitialBoard` inside `createBattleState`); `src/stores/battle-atoms.ts:36-41` (`hasMatchAtPosition`, `isValidSwap`, `removeMatchedOrbsAndRefill`) used at `:99-100`, `:121`, `:269`, `:324`, `:338`; `src/lib/match-3.test.ts:2-9`. `match3-board.tsx:30` imports only `findLineMatches`/`expandBombExplosions` (unchanged).
- The board component's settle branch (`match3-board.tsx:242-250`) unlocks input when `matches.size === 0`; the refill dispatch (`:405-408`) calls `removeMatchedOrbs(matches, bombsToSpawn, bombChance, maxBombs)` and uses its numeric return (`bombsSpawned`). Neither changes.
- Callout precedent: `lastPreemptiveStrike: { timestamp } | null` in `BattleState` (`src/types/battle.ts:88`), initialised `null` in `createBattleState`, set in `damageEnemyAtom` (`battle-atoms.ts:219`), exposed by `lastPreemptiveStrikeAtom` (`:371`), rendered by `PreemptiveStrikeIndicator` (`src/components/battle/preemptive-strike-indicator.tsx`), mounted in `src/views/battle-screen.tsx:105`.
- Tests: `src/lib/match-3.test.ts` has a `makeBoard(grid)` helper (ids `"r-c"`, `'*'` = bomb) and never mocks `Math.random`; `src/lib/dungeon-randomizer.test.ts` spies on `Math.random`; no seeded RNG exists anywhere (`dungeon-randomizer.ts:9-10` even says so — that comment gets amended). Test files are type-checked by `tsc -b` (`tsconfig.app.json` includes all of `src`, `noUnusedLocals`, `verbatimModuleSyntax`), and `describe/it/expect/bench/vi` must be imported from `'vitest'` (no globals). Bench convention (`src/lib/math.bench.ts`): one `describe` per function, `bench('<case>', () => { fn(args); })`, fixtures built once at module top.

## 4. Algorithm

Definitions. A **window** is `MIN_MATCH_LENGTH` (3) consecutive cells in a row or column. A window is **uniform** if its non-bomb cells share one color (an all-bomb window is uniform). A **run** is what the greedy scanner emits: a maximal uniform segment of length ≥ 3, color fixed by its first non-bomb.

**Lemma A (existence).** `findLineMatches(board).size > 0` ⇔ some window is uniform. (⇒ a run of length ≥ 3 contains a uniform window. ⇐ the greedy scanner restarts one cell later after every failed run, so it either emits a 3+ run before reaching the uniform window's start, or starts a run exactly there whose color is the window's color and which therefore covers the window.)

**Lemma B (cell membership).** A cell lies in some uniform segment of length ≥ 3 ⇔ one of the ≤ 3 windows containing it in that orientation is uniform. Trivial (sub-windows of a uniform segment are uniform).

**Lemma C (swap validity).** On a board with **no** runs, after an adjacent swap of `e1`,`e2`: `findLineMatches(swapped).size > 0` ⇔ a uniform window contains `e1` or `e2`. (A uniform window that contains neither is unchanged from the original board, contradicting Lemma A.) Moreover the per-endpoint answer agrees with greedy membership on settled boards, so the rewritten `isValidSwap` returns exactly what the current one returns wherever the UI can call it (input is locked while a cascade is unsettled). The only divergence is on boards that already contain a run, e.g. `[blue, blue, *, green, green]`: greedy marks cells 0-2, the window test also says cell 3 is in a run. `findLineMatches` stays the single source of truth for match *membership*; the JSDoc states the difference.

Consequences: the localized match check needs **no candidate-color logic and no allocation** — at most 6 windows × 3 reads = 18 cell reads per cell. `hasAnyLineMatch` is 68 windows on 8×6 with early exit. `findPossibleMove` is 82 adjacent pairs × 2 endpoints, worst case ≈ 3,000 cell reads (a dead board; the common case exits within a handful of pairs). The whole-board `Set` allocation of `findLineMatches` stays out of the hot path.

**Virtual swap instead of mutation.** The move search never touches the input board. A cell's type is read through `orbTypeAt(board, row, col, swap)` where `swap: OrbSwap | null` maps the two swapped positions onto each other. (In-place swap-and-restore was considered and rejected: it transiently mutates Jotai state and can't be typed `readonly`.) The scan allocates one small `OrbSwap` per pair tested and returns the hit directly; on the normal path that is a few objects, on a dead board 82 — negligible against the two board copies plus `Set`s the current `isValidSwap` allocates per call.

**Guarantee layer (`ensurePlayableBoard`).** A board is **playable** if it has a run (the cascade will act) or a possible move (the player can act).

1. Fast path: `isBoardPlayable(board)` → return the same reference, `wasReshuffled: false`. This is what runs on essentially every refill.
2. Reroll path: up to `MAX_SPAWN_REROLLS` (8) times, copy only the rows that contain spawned cells, draw a fresh type for every **non-bomb** spawned orb (ids and `isBomb` preserved — spawned bombs are wildcards and would only make the board *more* playable), re-check. Rerolling only cells the player has never seen keeps the fix invisible and keeps the color distribution uniform conditioned on playability.
3. Fallback: `reshuffleBoard` (below) → the same colors and bombs, redistributed into a playable layout, `wasReshuffled: true`. Fresh ids on the moved orbs make them replay their fall-in animation through the component's existing id diff, while bombs stay put; the state event drives the callout.

**Reshuffle (`reshuffleBoard`).** Contract: the output has the exact multiset of colors of the input, every bomb keeps its id and cell, every non-bomb orb gets a fresh id, and the board is playable. Preferred outcome is *settled* (no run, at least one move) so a deadlock is not rewarded with a free cascade; a run is accepted only when the constrained placement cannot avoid one (then the normal cascade takes over — playable by definition).

1. Collect the non-bomb types into a bag; bombs are pinned in place.
2. Up to `MAX_RESHUFFLE_ATTEMPTS` (10) times: Fisher-Yates the bag (rng), then place it row-major into the non-bomb cells, at each cell taking the first remaining bag entry that does not complete a uniform window with the already-placed left pair or up pair (bombs count as wildcards); if every remaining entry would, take the next one anyway (a tail dead-end — rare, yields a run). Accept the first result that is `isBoardPlayable`; prefer to return early only when it is also settled, otherwise remember the first playable-with-run result and keep trying for a settled one.
3. If no attempt produced a settled board, return the remembered playable-with-run one. If none was even playable (requires ten consecutive dead permutations — practically impossible, and covered by a unit test with `maxAttempts = 0`), run `plantMove` on the last attempt, which verifies with the general predicates and therefore works with bombs present whenever a candidate exists.

Cost: 48 draws plus ≤ 48 × 5 window reads per attempt; only reachable after 8 failed rerolls.

**Opening board (`createOpeningBoard`).** Rejection sampling on the natural distribution, so openings stay as random as today, just truncated:

1. Up to `MAX_BOARD_GENERATION_ATTEMPTS` (20) times: uniform random fill; `runs = countLineRuns(board)`; accept when `runs <= OPENING_MAX_MATCHES` (2), `longestLineRun(board) <= OPENING_MAX_RUN_LENGTH` (4), and (`runs > 0` or `hasPossibleMove`). Expected number of uniform windows on a random 8×6 5-color board is 68/25 ≈ 2.7, so roughly half of all fills are accepted; the loop typically ends within 1–3 attempts, and 20 attempts bound the failure at ~10⁻⁶.
2. Fallback: `fillBoardWithoutMatches` (row-major; each cell forbids the color of the two cells to its left if equal and the two above if equal — at most 2 of 5 colors — so no run can form; one pass, 48 draws), then `hasPossibleMove || plantMove`.

**`plantMove` (deterministic last resort).** For rows in the order `[0, rows-1, 1 … rows-2]`, each window start `0 … cols-4`, patterns `XX?X` and `X?XX`, `X` over `ORB_TYPES` rotated by an rng offset, `Y` over the other colors: write into a row-copied board and accept the first candidate with `!hasAnyLineMatch && hasPossibleMove` (verifying with the general predicates instead of hand-deriving neighbour rules). Feasibility on a bomb-free board with 5 colors: in an edge row the forbidden colors for `X` are at most one per planted cell from the vertical pair beyond it (≤ 3) plus the cell after the window (≤ 1) — 4 < 5, and `Y` has ≤ 2 forbidden — so the first edge-row window always yields a candidate. (A *middle* row can be fully blocked by adversarial pairs above and below, which is why edge rows go first.) With bombs the proof does not hold, but `plantMove` is only ever called on bomb-free boards (`fillBoardWithoutMatches` output). Returns `null` if somehow exhausted; the caller then returns the fill as-is (still settled, and unit tests over 500 seeds plus adversarial boards must never reach this).

**Orb ids.** One factory `nextOrbId(isBomb)` → `` `${'orb'|'bomb'}-${SESSION_EPOCH}-${counter}` `` with `SESSION_EPOCH = Date.now().toString(36)` captured at module load. The epoch guards against a module-counter reset under Vite HMR colliding with ids on the live board (that would corrupt id-keyed removal, not just React keys). Used for the opening board, refills, and reshuffles; positional ids go away. Restarting a battle without remounting the board now fall-in animates all orbs, which is correct feedback rather than a regression.

## 5. File layout and public API

Import direction is strictly `board-generation.ts → match-3.ts`, never the reverse (no cycles).

### `src/lib/match-3.ts` — detection, swap, move search (~330 lines)

```ts
export function orbsMatch(a: Orb, b: Orb): boolean                                   // unchanged
export function findLineMatches(board: Orb[][]): Set<string>                         // unchanged behaviour; scanner uses MIN_MATCH_LENGTH; built on scanLineRuns
export function countLineRuns(board: Orb[][]): number                                // NEW: greedy runs across rows + cols (cross = 2)
export function longestLineRun(board: Orb[][]): number                               // NEW: 0 when settled; used by the opening bomb-threshold check
export function expandBombExplosions(board: Orb[][], matchedIds: Set<string>): Set<string> // unchanged
export function hasMatchAtPosition(board: Orb[][], row: number, col: number): boolean // REWRITTEN: window test, no allocation
export function hasAnyLineMatch(board: Orb[][]): boolean                             // NEW: 68-window scan, early exit, no allocation
export function swapOrbs(board: Orb[][], from: GridPosition, to: GridPosition): Orb[][] // FIXED: spreads the two orbs with new row/col, never mutates inputs
export function isValidSwap(board: Orb[][], from: GridPosition, to: GridPosition): boolean // REWRITTEN: virtual swap, no copy, no Set
export function findPossibleMove(board: Orb[][]): OrbSwap | null                     // NEW: 40 horizontal pairs row-major, then 42 vertical; first valid swap
export function hasPossibleMove(board: Orb[][]): boolean                             // NEW
export function isBoardPlayable(board: Orb[][]): boolean                             // NEW: hasAnyLineMatch || hasPossibleMove
```

Private helpers: `scanLineRuns(line): number[]` (flat `[start, endExclusive, …]` pairs — `findLineMatches` expands them, `countLineRuns`/`longestLineRun` count them), `orbTypeAt(board, r, c, swap)`, `isWindowUniform(board, r, c, dr, dc, swap)`, `hasRunThrough(board, row, col, swap)`.

Removed from this file (moved): `getRandomOrbType`, `createBombOrb`, `createInitialBoard`, `removeMatchedOrbsAndRefill`.

### `src/lib/board-generation.ts` — NEW (~260 lines)

```ts
export function nextOrbId(isBomb?: boolean): string
export function getRandomOrbType(rng?: () => number): OrbType
export function createBombOrb(row: number, col: number): Orb                          // moved; uses nextOrbId(true)
export function fillBoardRandom(rows: number, cols: number, rng?: () => number): Orb[][]
export function fillBoardWithoutMatches(rows: number, cols: number, rng?: () => number): Orb[][]
export function plantMove(board: Orb[][], rng?: () => number): Orb[][] | null
export function createOpeningBoard(rows?: number, cols?: number, rng?: () => number, maxAttempts?: number): Orb[][]
export function reshuffleBoard(board: Orb[][], rng?: () => number, maxAttempts?: number): Orb[][] // same colors, bombs pinned, fresh ids on moved orbs, playable (settled preferred)
export function ensurePlayableBoard(
  board: Orb[][], spawned: GridPosition[], rng?: () => number, maxRerolls?: number,
): { board: Orb[][]; wasReshuffled: boolean }

export interface RefillOptions { bombsToSpawn?: number; bombRefillChance?: number; maxBombs?: number; rng?: () => number }
export interface RefillResult { board: Orb[][]; bombsSpawned: number; wasReshuffled: boolean }
export function removeMatchedOrbsAndRefill(board: Orb[][], matchedOrbIds: Set<string>, options?: RefillOptions): RefillResult
```

`removeMatchedOrbsAndRefill` changes while moving: options object instead of a 5th/6th positional parameter (three atoms and eight tests adapt); the `matchedPositions` string `Set` (48 template-string allocations per call) is dropped in favour of testing `matchedOrbIds.has(orb.id)` directly in the column pass; ids come from `nextOrbId`; the bomb roll and the partial Fisher-Yates use `rng`; the function ends with `ensurePlayableBoard(newBoard, newlySpawned, rng)`. The `matchedOrbIds.size === 0` early return yields `{ board, bombsSpawned: 0, wasReshuffled: false }` with the same board reference. `chance = 0` / `chance = 1` semantics are unchanged.

### `src/lib/match-3.fixtures.ts` — NEW (pure, no vitest import)

`makeBoard(grid)` moves here from the test file (same contract: ids `"r-c"`, `'*'` = bomb). Named grids (`string[][]`, 8×6):

- `DEADLOCKED_GRID`: `color(r, c) = ORB_TYPES[(r + 2c) % 5]`. Equal colors sit ≥ 5 apart in every row (+2, +4 mod 5) and column (+1, +2 mod 5), so no window is uniform and no swap can make one — a post-swap uniform window with one swapped cell needs two unchanged equal cells within distance 2; one containing both swapped cells is swap-invariant.

  ```
  r0: blue   purple gray   green  yellow blue
  r1: green  yellow blue   purple gray   green
  r2: purple gray   green  yellow blue   purple
  r3: yellow blue   purple gray   green  yellow
  r4: gray   green  yellow blue   purple gray
  r5: blue   purple gray   green  yellow blue
  r6: green  yellow blue   purple gray   green
  r7: purple gray   green  yellow blue   purple
  ```

- `DEADLOCKED_CORNER_BOMB_GRID`: same with `(0,0) = '*'` (tests brute-force confirm it is still dead).
- `EARLY_MOVE_GRID`: row 0 → `blue blue gray blue yellow blue`; move `(0,2)↔(0,3)`, found at horizontal pair index 2 (best case).
- `LATE_MOVE_GRID`: row 7 → `purple purple green purple blue purple`; move `(7,2)↔(7,3)`, pair index ~37 (realistic upper bound before the vertical pass).
- `MATCH_GRID`: `EARLY_MOVE_GRID` with `(0,2) = blue` (a 4-run) for positive match cases.
- Reference implementations for property tests: `bruteForceIsValidSwap` (copy-swap + `findLineMatches` membership — the current algorithm) and `bruteForceFindMove`.

### `src/lib/math.ts`

```ts
/** Deterministic `[0, 1)` generator (mulberry32) for tests and benches; gameplay keeps `Math.random`. */
export function createSeededRandom(seed: number): () => number
```

### `src/constants/board.ts` — NEW home for every board / match-3 tunable

`src/constants/battle.ts` is already 132 lines and `game.ts` mixes board rules with loader, notification, and store settings, so the board rules get their own file. The eight existing board constants **move** out of `game.ts` (no re-exports — a clean cut; the four importers are listed in §6): `BOARD_ROWS`, `BOARD_COLS`, `ORB_TYPES`, `MIN_MATCH_LENGTH`, `BOMB_MATCH_SPAWN_THRESHOLD`, `BOMB_REFILL_CHANCE`, `CASCADE_BOMB_CHANCE_MULTIPLIER`, `MAX_CHAIN_BOMB_SPAWNS`. New ones, all with a JSDoc line saying what turning the knob does:

```ts
// ─── Opening board ───────────────────────────────────────────────────────────
/** Opening boards may contain at most this many pre-made runs: a small free cascade, never a runaway one. 0 = always settled. */
export const OPENING_MAX_MATCHES = 2;
/** Longest pre-made run allowed on an opening board. Kept below BOMB_MATCH_SPAWN_THRESHOLD so a deal never hands out a free bomb. */
export const OPENING_MAX_RUN_LENGTH = BOMB_MATCH_SPAWN_THRESHOLD - 1;
/** Random deals tried for an opening board before falling back to a constraint-aware (match-free) fill. */
export const MAX_BOARD_GENERATION_ATTEMPTS = 20;

// ─── Playability guarantee ───────────────────────────────────────────────────
/** Re-draws of the freshly spawned orbs tried on a dead board before the whole board is reshuffled. */
export const MAX_SPAWN_REROLLS = 8;
/** Permutations tried by a reshuffle to land a settled layout (same colors, bombs pinned) before accepting one with a run. */
export const MAX_RESHUFFLE_ATTEMPTS = 10;
```

`MIN_MATCH_LENGTH` becomes load-bearing (the greedy scanner's threshold and the window size of every localized check). `src/constants/battle.ts` gains one line, `BATTLE_CALLOUT_DURATION_MS = 1200`, replacing the literal in the callout component so both callouts share it.

### Constants policy for this change

- **Every gameplay number that could plausibly be tuned later is a named constant in `src/constants/board.ts`**, imported by name — never a literal in `src/lib` or a component. That includes board size, color list, match length, all bomb knobs, the opening cap and run cap, the generation attempt bound, and the reroll bound.
- Lib functions take these as **defaulted parameters** (`rows = BOARD_ROWS`, `maxAttempts = MAX_BOARD_GENERATION_ATTEMPTS`, `maxRerolls = MAX_SPAWN_REROLLS`, `bombRefillChance = BOMB_REFILL_CHANCE`), so tests and benches can override them without touching the constants and the game always runs on the constants.
- Tests **never hardcode 8, 6, 3, 5, 0.02** — they import the constants, so a future tweak does not break the suite for the wrong reason. Fixture grids are the one exception (they are literal 8×6 boards by nature) and say so in a comment.
- Internal algorithm shapes that are not tunables (the `XX?X` / `X?XX` seed patterns, the edge-rows-first order in `plantMove`, the id prefix strings) stay private in the lib file.
- Property-test sample sizes (300 / 500 seeds) are local test constants, not game constants.

### `src/types/battle.ts`

```ts
export interface OrbSwap { from: GridPosition; to: GridPosition }
// BattleState:
/** Fires when a dead board had to be fully reshuffled, so the "No moves! Reshuffle!" callout can replay. */
lastReshuffle: { timestamp: number } | null;
```

## 6. Integration

- Constants move (`~/constants/game` → `~/constants/board`) in the four importers: `src/lib/match-3.ts` (`ORB_TYPES`, `BOARD_ROWS`, `BOARD_COLS`, `BOMB_REFILL_CHANCE`), `src/stores/battle-atoms.ts` (`BOMB_REFILL_CHANCE`), `src/components/battle/match3-board.tsx:46` (the bomb knobs), `src/components/battle/battle-item-bar.tsx` (`BOARD_ROWS`, `BOARD_COLS`). `game.ts` keeps its loader / notification / inn / store constants.
- `src/lib/battle-system.ts`: import `createOpeningBoard` from `~/lib/board-generation`; `board: createOpeningBoard()`; `lastReshuffle: null` next to `lastPreemptiveStrike: null`.
- `src/stores/battle-atoms.ts`:
  - imports: `swapOrbs`, `isValidSwap` from `~/lib/match-3`; `removeMatchedOrbsAndRefill` from `~/lib/board-generation` (`hasMatchAtPosition` no longer needed here).
  - `swapOrbsAtom`: `if (!isValidSwap(board, from, to)) return false;` then `set(... board: swapOrbs(board, from, to), selectedOrb: null)`; returns `true`. Same contract, one board copy instead of two plus a scan.
  - `removeMatchedOrbsAtom`: options object; `set({ ...state, board, lastReshuffle: wasReshuffled ? { timestamp: Date.now() } : state.lastReshuffle })`; **still returns `bombsSpawned: number`** so `match3-board.tsx` is untouched.
  - `clearBoardRowAtom` / `clearBoardColumnAtom`: same one-line `lastReshuffle` handling.
  - `export const lastReshuffleAtom = atom((get) => get(battleStateAtom).lastReshuffle ?? null);` next to `lastPreemptiveStrikeAtom`.
- Callout UI, generalising the existing pattern rather than duplicating it:
  - `src/components/battle/battle-callout.tsx` — NEW `BattleCallout({ trigger, label, color })`: the `visible`/`animationKey`/timer effect (`BATTLE_CALLOUT_DURATION_MS`) and the outlined `pixel-font` span lifted out of `PreemptiveStrikeIndicator`, including its `TEXT_SHADOW` constant.
  - `PreemptiveStrikeIndicator` becomes `<BattleCallout trigger={lastPreemptiveStrike} label="Preemptive Strike!" color="#ffd47a" />` (pixel-identical).
  - `src/components/battle/board-reshuffle-indicator.tsx` — NEW: `<BattleCallout trigger={lastReshuffle} label="No moves! Reshuffle!" color=… />` using a warm parchment tone from the existing palette (no `#ffd700`; e.g. the `#ffd47a` family or the guard-popup ivory).
  - Mount `<BoardReshuffleIndicator />` beside `<PreemptiveStrikeIndicator />` in `src/views/battle-screen.tsx:105`.
- Docs: `docs/COMBAT_SYSTEM.md` board section gains three lines (opening cap, guaranteed move, reshuffle fallback with callout). `BATTLE_PERFORMANCE_PLAN.md` item 2.4's first bullet (localized `hasMatchAtPosition`) gets marked done with a pointer here.
- `src/lib/dungeon-randomizer.ts:9-10` comment ("there is no seeding") amended to mention `createSeededRandom` is test-only.

## 7. Tests

`src/lib/math.test.ts` — `createSeededRandom`: same seed → identical sequence; different seeds differ; 10,000 draws all in `[0, 1)` with mean within 0.02 of 0.5.

`src/lib/match-3.test.ts` (existing cases stay; refill/bomb cases move out)
- `findLineMatches`: unchanged cases; `countLineRuns` and `longestLineRun` on `MATCH_GRID`, a cross-shaped board (= 2 runs), `DEADLOCKED_GRID` (= 0).
- `hasMatchAtPosition`: horizontal and vertical 3+; bomb in the middle `[blue, *, blue]`; bomb at a line end `[*, *, blue]`; adjacent bombs `[blue, *, *, green]` (true for the bomb cells — their windows are uniform); `[blue, *, green]` false; all-bomb line true for n ≥ 3, false for n = 2; the documented divergence `[blue, blue, *, green, green]` cell 3 → true.
- `hasAnyLineMatch`: agrees with `findLineMatches(...).size > 0` on every fixture and on 300 seeded boards with 0 and with 3 sprinkled bombs.
- `swapOrbs`: does not mutate the input orbs (regression test for the bug); result orbs carry updated `row`/`col`; other rows are shared references (cheap copy is intentional).
- `isValidSwap`: the three existing cases; property: on 300 seeded **settled** boards (filtered by `!hasAnyLineMatch`), with 0 and with 3 bombs, all 82 pairs agree with `bruteForceIsValidSwap`, and per endpoint `hasMatchAtPosition(swappedCopy, e)` agrees with greedy membership.
- `findPossibleMove`: `null` on `DEADLOCKED_GRID` and `DEADLOCKED_CORNER_BOMB_GRID`; `(0,2)↔(0,3)` on `EARLY_MOVE_GRID`; `(7,2)↔(7,3)` on `LATE_MOVE_GRID`; property over 300 seeded boards: `null` iff `bruteForceFindMove` is `null`, otherwise the pair is adjacent and `isValidSwap` confirms it.
- `isBoardPlayable`: true on `MATCH_GRID` (run, no move needed), true on `EARLY_MOVE_GRID`, false on `DEADLOCKED_GRID`.

`src/lib/board-generation.test.ts` — NEW
- `nextOrbId`: 1,000 calls unique; `orb-` / `bomb-` prefixes.
- `getRandomOrbType`: deterministic under a seeded rng; all five types appear over 500 draws; frequencies within ±20% of uniform (randomness-preservation check).
- `fillBoardRandom`: dimensions, ids unique, no bombs.
- `fillBoardWithoutMatches`: 500 seeds → never `hasAnyLineMatch`, no bombs, ids unique.
- `plantMove`: on `DEADLOCKED_GRID` and on hand-built boards whose middle rows are fully blocked → a move exists and no run; touches at most 4 cells of one row; different seeds pick different windows.
- `createOpeningBoard`: 500 seeds → `countLineRuns <= OPENING_MAX_MATCHES`, `longestLineRun <= OPENING_MAX_RUN_LENGTH`, `isBoardPlayable`; across those seeds at least one board has 0 runs and at least one has 2 (the cap is a truncation, not a fixed count); per-color frequency over all cells within ±10% of uniform; `maxAttempts = 0` forces the fallback and still satisfies the contract; default dimensions 8×6.
- `reshuffleBoard`: over 200 seeds on `DEADLOCKED_GRID` and on `DEADLOCKED_CORNER_BOMB_GRID` plus a board with 3 bombs: the sorted color multiset equals the input's; every bomb keeps its id and cell; every non-bomb id is new; the result is `isBoardPlayable`; at least 90% of results are settled (no run); `maxAttempts = 0` still returns a playable board (exercises the `plantMove` path with bombs present); dimensions preserved; a board with no non-bomb orbs is returned unchanged.
- `ensurePlayableBoard`: fast path returns the **same reference** for a playable board and for a board with pending runs; reroll path on `DEADLOCKED_GRID` with `spawned = [(0,0),(0,1),(0,2)]` and a seed known to succeed keeps every non-spawned orb identical (reference-equal rows untouched), keeps spawned ids and `isBomb`, `wasReshuffled: false`; a spawned bomb is never re-typed; `maxRerolls = 0` on `DEADLOCKED_GRID` → `wasReshuffled: true`, playable, same color multiset, bombs pinned; a reroll that lands a run is accepted (cascades are never suppressed — assert with a seed that produces one).
- `removeMatchedOrbsAndRefill`: the 8 existing cases moved to the options object (chance 0/1, caps, guaranteed bombs); output is always `isBoardPlayable`; `wasReshuffled` false in the normal case; deterministic under a seeded rng; surviving ids preserved; no-op early return keeps the reference; **cascade regression**: over 300 seeded refills of a 3-orb match, the fraction of results that contain a new run is statistically indistinguishable from an unconstrained random refill (same seeds, guarantee bypassed) — proves the guarantee never suppresses chains.
- `createBombOrb`: moved case.

`src/lib/battle-setup.test.ts` — add: initial board `countLineRuns <= OPENING_MAX_MATCHES` and `isBoardPlayable`; `lastReshuffle` starts `null`.

## 8. Implementation order (benchmarks first)

1. **`createSeededRandom`** in `src/lib/math.ts` + tests + one bench.
2. **`src/lib/match-3.fixtures.ts`** with `makeBoard`, the grids, and the brute-force references.
3. **`src/lib/match-3.bench.ts` — baseline against the current code.** Cases (labels are kept stable across the rewrite so the before/after table lines up):
   - `createInitialBoard` → `'opening board 8x6'` (later calls `createOpeningBoard`)
   - `findLineMatches` → `'settled board (LATE_MOVE)'`, `'board with a 4-run (MATCH_GRID)'`
   - `hasMatchAtPosition` → `'cell (7,2) on settled board'`
   - `isValidSwap` → `'valid swap (7,2)↔(7,3)'`, `'invalid swap (0,0)↔(0,1) on DEADLOCKED'`
   - `swapOrbs` → `'adjacent swap'`
   - `removeMatchedOrbsAndRefill` → `'3-orb match (row 0, cols 0-2)'`, `'6-orb row clear (row 3)'`, `'8-orb column clear (col 2)'` — bomb chance 0; after the rewrite, `rng: createSeededRandom(1)` per iteration.
   Run `npm run bench-cli -- src/lib/match-3.bench.ts` and paste the ops/sec table into **§10 Baseline** of the repo copy of this document.
4. Constants: create `src/constants/board.ts`, move the eight board constants out of `game.ts`, add the new ones, update the four importers (§6), add `BATTLE_CALLOUT_DURATION_MS` to `battle.ts`. Types (`OrbSwap`, `lastReshuffle`).
5. `src/lib/match-3.ts`: `scanLineRuns` refactor + `MIN_MATCH_LENGTH`; `swapOrbs` fix; `orbTypeAt`/`isWindowUniform`/`hasRunThrough`; rewrite `hasMatchAtPosition`, `isValidSwap`; add `hasAnyLineMatch`, `countLineRuns`, `longestLineRun`, `findPossibleMove`, `hasPossibleMove`, `isBoardPlayable`; delete the four moved functions.
6. `src/lib/board-generation.ts` per §5.
7. Tests: update `match-3.test.ts`, add `board-generation.test.ts`, extend `battle-setup.test.ts`, `math.test.ts`.
8. Call sites: `battle-system.ts`, `battle-atoms.ts`, then the callout (`battle-callout.tsx`, `board-reshuffle-indicator.tsx`, `preemptive-strike-indicator.tsx`, `battle-screen.tsx`).
9. `src/lib/board-generation.bench.ts`; re-run both bench files; fill in **§10 After** and the delta column.
10. Docs (§6), `BATTLE_PERFORMANCE_PLAN.md` 2.4 note.

## 9. Benchmarks

`src/lib/match-3.bench.ts` (after the rewrite, additions on top of the baseline cases): `hasAnyLineMatch` settled / with run; `findPossibleMove` on `EARLY_MOVE_GRID` (early exit), `LATE_MOVE_GRID`, `DEADLOCKED_GRID` (full 82-pair scan, worst case); `countLineRuns`; `isBoardPlayable` on `EARLY_MOVE_GRID` and `DEADLOCKED_GRID`.

`src/lib/board-generation.bench.ts`: `createOpeningBoard` (seeded); `fillBoardRandom`; `fillBoardWithoutMatches`; `plantMove` on `DEADLOCKED_GRID`; `reshuffleBoard` on `DEADLOCKED_GRID` and on `DEADLOCKED_CORNER_BOMB_GRID`; `ensurePlayableBoard` fast path (`EARLY_MOVE_GRID`), pending-run path (`MATCH_GRID`), reroll path (`DEADLOCKED_GRID` + 3 spawned), forced reshuffle (`maxRerolls = 0`); `nextOrbId`; `getRandomOrbType`; `removeMatchedOrbsAndRefill` (same three cases as the baseline, seeded).

Expected budget: `hasAnyLineMatch` < 1 µs; worst-case `findPossibleMove` ≈ 5–15 µs; so the guarantee adds at most that to a refill, and dropping the `matchedPositions` string `Set` from the refill should offset it. `isValidSwap` should get several times faster (no board copy, no `Set`).

## 10. Baseline / After (filled in during implementation)

| bench | before (ops/s) | after (ops/s) | Δ |
|---|---|---|---|
| _to be pasted from `npm run bench-cli`_ | | | |

## 11. Verification

- `npm run test-cli` — all suites green (716 today, plus the new ones); `npx tsc --noEmit`; `npx eslint` on touched files.
- `npm run bench-cli` before (step 3) and after (step 9); table in §10.
- In-browser (Playwright against the dev server, as done for the earlier perf items): load Battle Demo ~20 times and assert the opening board never shows more than 2 highlighted runs and no 5-run; play a few swaps to confirm valid/invalid swap feedback is unchanged and the selection ring no longer jumps after an invalid swap (the `swapOrbs` fix); write a `lastReshuffle` event into the live store and confirm the callout renders once and fades; set a `DEADLOCKED_GRID` board into the store and trigger the row-clear item to watch the reroll path leave a playable board with the six new orbs animating.
- Reduced Motion: the callout inherits the `motion-hold` behaviour of the preemptive-strike one.

## 12. Risks and follow-ups

- **Behaviour changes, all intentional:** the deal has at most 2 pre-made runs and no run of 5+; opening/refill/reshuffle ids change format; battle restart animates fall-in. **Nothing else about cascades changes** — refills stay uniformly random, chains keep their depth, bomb budgets keep their bookkeeping.
- `hasMatchAtPosition` per-cell semantics differ from greedy only on boards that already contain a run — documented in JSDoc, and no caller is affected.
- `plantMove`'s feasibility proof is for bomb-free boards, which is the only place it is *relied upon* (opening fallback). The reshuffle also calls it as a last resort with bombs present, where it verifies each candidate with the general predicates and may return `null`; the reshuffle's preceding permutation attempts make that path practically unreachable, and it is unit-tested.
- Bench and test fixtures with bombs are hand-checked and additionally brute-force verified inside the tests, so a fixture mistake fails loudly.
- Follow-ups (not in scope): a "hint" affordance using `findPossibleMove` (it already returns the swap); `checkSwapValidityAtom` has no UI consumer today and keeps working.
