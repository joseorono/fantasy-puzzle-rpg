# Row Clear / Column Clear — Design & Build Plan

Status checklist for reworking the two line-clear consumables (`row-clear`, `column-clear`). `[x]` = shipped
and verified in code, `[ ]` = pending. Each stage is shippable on its own and ends with what to evaluate
before moving on.

> **Stage 0 (done)** — this document.
>
> **Stages 1, 2 and 4 (done)** — the payoff, the targeting and the docs/balance pass. The items now
> resolve through the same pipeline a match does (`resolveMatchGroups`), are aimed by hand or
> auto-aimed with right-click, and Column Clear is priced at 400 to Row Clear's 300. 979 of 980 tests
> pass across 37 files (the one red test, the `hasMatchAtPosition` property check in `match-3.test.ts`,
> is a pre-existing timeout under parallel load — it passes on its own, and fails the same way with
> this work's test files excluded).
>
> **Next:** Stage 3 (presentation) — the icons, the sweep animation, the SFX and the callout. The
> integration points are marked `TODO(line-clear stage 3)` in `match3-board.tsx`, `battle-item-bar.tsx`
> and `src/constants/audio.ts`. Until then the clear borrows the ordinary match highlight and the bomb
> explosion animation, and the two items still wear the placeholder staff sprites.

## 1. Diagnosis

The items feel hollow. From the code:

| Complaint | Root cause |
|---|---|
| **No benefit** | `clearBoardRowAtom` / `clearBoardColumnAtom` (`src/stores/battle-atoms.ts`) only call `removeMatchedOrbsAndRefill` and write the new board. No damage, score, cooldown reduction, Guard, poise, or `lastMatchedType`. The only payoff is whatever the random refill happens to cascade into. |
| **No choice** | `BattleItemBar.handleUseItem` picks `Math.floor(Math.random() * BOARD_ROWS/COLS)`. |
| **No animation** | Orbs vanish in the same frame the board is replaced. `Match3Board` only animates *line matches* it detects itself (`findLineMatches` on every board change), so cleared orbs never get the glow/ping/disappear or the bomb `orb-exploding` treatment. |
| **Bad icon** | `iconName: 'woodStaff'` / `'crystalStaff'` — the Frosty 24×24 sheet has no row/column glyph. |

Everything the fix needs already exists: per-color match resolution in `Match3Board`'s board effect,
`expandBombExplosions` (`src/lib/match-3.ts`), `removeMatchedOrbsAtom`, `applyMatchResolutionAtom`,
`damageEnemyAtom` (flinch + poise + preemptive), `triggerHitstop`, `BattleCallout`, and right-click as a game
input (`useDisableContextMenu`, mounted in `App.tsx`).

**Intended outcome.** A line clear is a deliberate, aimed, loud play: arm the item, pick the line, every orb
in it counts as matched (its hero acts, gray charges Guard, bombs detonate), a sweep tears through the line,
damage numbers pop, and the refill cascades as usual. Right-click skips the aim and picks the best line.

## 2. Design decisions (locked)

1. **Payoff = cleared orbs count as matches.** Orbs are grouped by color; each living hero acts on their
   color's count (damage / heal for the healer / cooldown reduction), gray charges Guard, score is added,
   `lastMatchedType` pulses. Damage goes through `damageEnemyAtom`, so flinch, poise, and preemptive bonuses
   all apply. The clear starts a **new cascade chain at level 0**; refill cascades escalate normally.
2. **Targeting = both.** Left-click arms **aim mode**: hovering highlights a whole row/column, click fires,
   Esc or clicking the item again cancels; the battle keeps running while aiming. **Right-click fires
   instantly on the auto-picked best line.** Touch: tapping an orb while armed fires on that line.
3. **Icon = custom pixel SVG mini-grid** (a small orb grid with the target line lit + a sweep streak),
   rendered through an `ItemIcon` resolver so the store and pause menu show it too. Warm amber/parchment
   tones, no bright yellow.
4. **Bombs in the line detonate** (3×3, chain-reacting) via `expandBombExplosions`; blast orbs join the
   payoff and play the existing `orb-exploding` animation.
5. **A fired request resolves when the board settles.** The request carries only `orientation + index`; the
   board computes the orb ids at resolve time, so firing mid-cascade never targets orbs that have moved. Aim
   clicks are ignored while a cascade is running; the right-click path may queue.
6. **A line clear is a player action:** it increments `turn` and resets the cascade chain, like a swap.

### Damage model (tunable; evaluated in Stage 1)

Per color group: `calculateMatchDamage(count, BASE_MATCH_DAMAGE, pow, comboMultiplier = 1) × passives ×
LINE_CLEAR_DAMAGE_MULTIPLIER` (gray additionally × `GRAY_MATCH_DAMAGE_MULTIPLIER`).
Cooldown = `count × COOLDOWN_REDUCTION_PER_ORB`; Guard = `count × GUARD_CHARGE_PER_ORB × charge rate`;
score = `BASE_MATCH_SCORE + (totalOrbs − 3) × MATCH_SIZE_BONUS_MULTIPLIER`.

Caveat to evaluate: `calculateMatchMultiplier` is a step function (1–3 orbs → 1×), so one stray blue orb in
the row hands the Warrior a full 3-match hit. A 6-orb row with four colors present ≈ four matches of damage
from one 300-coin item on the shared item cooldown. `LINE_CLEAR_DAMAGE_MULTIPLIER` (default `1.0`) is the
knob; if it still feels swingy, the fallback is a linear per-orb model (`3-match damage × count /
MIN_MATCH_LENGTH`). A column is 8 orbs vs a row's 6 (`BOARD_ROWS = 8`, `BOARD_COLS = 6`), so Column Clear is
naturally ~33% stronger — pricing is a Stage 4 question.

### Auto-pick heuristic (`pickBestLine`)

Score every candidate line by the orbs it would destroy *including bomb blasts*: living-hero color = 1,
gray = `LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT` (0.5), dead-hero color = 0, bomb = `LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT`
(3). Ties are broken by an injected `rng` (default `Math.random`) so tests are deterministic.

## 3. Architecture

- **`src/lib/match-resolution.ts`** (new) — `resolveMatchGroups(groups, party, cascadeLevel, options?)`,
  extracted from the per-color loop in `match3-board.tsx`. `groups: Array<{ type: OrbType; matchSize: number }>`.
  Returns `{ effects, cooldownReductions, guardGain, primaryMatchedType }`. The board passes every matched
  color with `matchSize = matches.size` (behavior unchanged); the line clear passes per-color counts with
  `damageMultiplier: LINE_CLEAR_DAMAGE_MULTIPLIER`.
- **`src/lib/line-clear.ts`** (new) — `getLineOrbIds(board, orientation, index)`,
  `resolveLineClearOrbs(board, orientation, index)` (line ∪ bomb blasts), `groupOrbsByColor(board, ids)`,
  `pickBestLine(board, orientation, party, rng?)`, plus `getLineCount` for range checks. JSDoc on every
  export. A `lineClearOrder(board, ids, orientation)` helper for the sweep stagger is left to Stage 3.
- **`src/stores/battle-atoms.ts`** —
  - `armedLineClearAtom: { itemId; orientation } | null` — transient aim state.
  - `pendingLineClearAtom: { orientation; index; timestamp } | null` — the request the board resolves.
  - `lastItemFiredAtom: { itemId; timestamp } | null` — lets `BattleItemBar` consume the item and start the
    shared cooldown when the fire happens from the board (no sibling prop-drilling).
  - `fireLineClearAtom({ itemId, orientation, index })` — guards (`playing`, no request already pending),
    writes `pendingLineClear` + `lastItemFired`, clears `armedLineClear`, returns whether it fired.
  - `clearBoardRowAtom` / `clearBoardColumnAtom` are deleted (only the item bar used them).
- **`src/types/inventory.ts`** — `ConsumableAction` gets `{ type: 'clear-line'; orientation: 'row' | 'column' }`
  replacing the two separate variants (one code path in the bar).
- **`src/components/battle/match3-board.tsx`** —
  - New effect on `[pendingLineClear, isProcessingSwap]`: when a request is pending and the board is settled,
    lock input, reset the cascade refs, `incrementTurn()`, compute ids via `resolveLineClearOrbs`, highlight
    them (line orbs as a match, blast orbs as exploding), resolve via `resolveMatchGroups` at level 0,
    `applyMatchResolution`, land damage/heals + hitstop + SFX after the highlight delay, then
    `removeMatchedOrbs(ids, 0, BOMB_REFILL_CHANCE, MAX_CHAIN_BOMB_SPAWNS)` so the existing board effect
    takes over for cascades. The landing step is shared with the match path (one helper).
  - Aim mode: `aimHover` local state fed by an `onHover` on `OrbComponent`; while armed, `handleOrbClick`
    fires instead of selecting (ignored while `isProcessingSwap`).
  - `OrbComponentProps` gains `isAimed`, `isLineClearing`, `lineClearDelayMs`, `onHover`.
- **`src/components/battle/line-clear-sweep.tsx`** (new) — absolutely-positioned streak overlay inside the
  board grid, sized by `index / BOARD_ROWS|COLS`; plays once per request timestamp.
- **`src/components/battle/battle-item-bar.tsx`** — `consumeItem(item)` helper (remove unless training,
  `recordItemUsed`, start cooldown); instant items call it directly; an effect on `lastItemFiredAtom`
  (guarded by the last handled timestamp) calls it for fired line clears. Left-click on a `clear-line` item
  toggles `armedLineClearAtom`; `onContextMenu` runs `pickBestLine` → `fireLineClearAtom`. Esc cancels
  arming before the pause toggle in `battle-screen.tsx`. Armed slot: pulsing amber ring + "Pick a row / column".
- **`src/components/sprite-icons/line-clear-icons.tsx`** (new) — `RowClearIcon`, `ColumnClearIcon` inline SVGs
  (`shape-rendering: crispEdges`). **`item-icon.tsx`** (new) — `ItemIcon` resolves
  `ITEM_ICON_OVERRIDES[item.id]` → `FrostyRpgIcon` → emoji; used by the battle bar, `item-store.tsx`,
  `pause-menu-items.tsx`. The two items get `iconName: null`.
- **Styles** (`src/styles/animations.css`, `battle-elements.css`): `.orb-aimed`, `.board-aiming` (dim
  non-line orbs, crosshair cursor), `@keyframes line-clear-pop` + `.orb-line-clearing`, `@keyframes line-sweep`,
  `@keyframes board-shake`, `.battle-item-slot--armed`.
- **Tunables** (`src/constants/battle.ts`, new "Line-clear items" block): `LINE_CLEAR_DAMAGE_MULTIPLIER`,
  `LINE_CLEAR_SWEEP_MS`, `LINE_CLEAR_ORB_STAGGER_MS`, `LINE_CLEAR_AUTO_PICK_BOMB_WEIGHT`,
  `LINE_CLEAR_AUTO_PICK_GRAY_WEIGHT`. `LINE_CLEAR_SOUND` in `src/constants/audio.ts` (nullable, like
  `BOMB_EXPLOSION_SOUND`; `SoundNames.metalSharpening` as the swish placeholder).

## 4. Checklist by stage

### Stage 0 — Design doc

- [x] This document.
- [x] Pointer in `docs/ideas-proposals/ORTHOGONAL_FEATURES.md` §10 updated (the clear atoms go away).

### Stage 1 — Payoff (the benefit becomes real and visible)

- [x] `resolveMatchGroups` extracted into `src/lib/match-resolution.ts`; the board uses it (no behavior change).
- [x] `src/lib/line-clear.ts`: `getLineOrbIds`, `resolveLineClearOrbs`, `groupOrbsByColor`.
- [x] Atoms: `pendingLineClearAtom`, `lastItemFiredAtom`, `fireLineClearAtom`; the two clear atoms deleted.
- [x] `ConsumableAction` → `clear-line` with orientation; the bar still picks a **random** line but routes it
      through `fireLineClearAtom` and the `lastItemFired` consumption path.
- [x] Board: the pending-line-clear effect, reusing the existing highlight / `orb-exploding` visuals as placeholders.
- [x] Tests: `match-resolution.test.ts` (parity for single/multi-color, gray, dead hero, healer, multiplier),
      `line-clear.test.ts` (row/column ids, bomb expansion, color grouping), `battle-atoms.test.ts` additions
      (`fireLineClearAtom` writes pending + fired, clears armed, refuses when not playing or already pending).
- **Evaluate:** per-hero damage numbers pop, cooldowns drop, Guard charges on gray, bombs in the line go off,
  cascades chain with COMBO ×2+, the rating still counts the item. Tune `LINE_CLEAR_DAMAGE_MULTIPLIER`; decide
  whether the step-function damage stays or the linear per-orb fallback is needed.

### Stage 2 — Targeting (aim mode + right-click auto-aim)

- [x] `armedLineClearAtom`; the bar toggles it on left-click; Esc / re-click cancels; auto-cancel on pause or game over.
- [x] Board aim mode: hover highlights the whole line, other orbs dim, crosshair cursor; click fires; touch fires on tap.
- [x] Armed slot styling + hint text.
- [x] `pickBestLine`; right-click on the item fires it immediately (`onContextMenu`, no arming).
- [ ] Optional (not done): while armed, faintly pre-highlight the auto-pick line as a suggestion.
- [x] Tests: `pickBestLine` prefers bombs > living colors > gray > dead colors, counts blast orbs, breaks ties via rng.
- **Evaluate:** does aiming under real-time pressure feel tense-but-fair? Is right-click discoverable (tooltip
  copy: "Right-click: auto-aim")? Mobile tap flow.

### Stage 3 — Presentation (icon, sweep, sound, callout)

- [ ] `RowClearIcon` / `ColumnClearIcon` + `ItemIcon` resolver wired into the bar, store, and pause menu.
- [ ] `LineClearSweep` streak; `.orb-line-clearing` staggered flash→pop along the sweep direction; `board-shake`.
- [ ] `triggerHitstop()` when damage lands; `LINE_CLEAR_SOUND` swish, then the match SFX.
- [ ] `BattleCallout` "ROW CLEAR!" / "COLUMN CLEAR!" in warm amber.
- [ ] Item copy, e.g. *"Wipe a row of your choice. Every orb counts — bombs go off. Right-click to auto-aim."*
- **Evaluate:** sweep readability at phone width, the reduced-motion path, SFX loudness vs `match`.

### Stage 4 — Docs & balance

- [x] `docs/COMBAT_SYSTEM.md`: "Line-clear items" section (formulas, tunables, atoms).
- [x] Balance: Column (8 orbs) vs Row (6 orbs) pricing; whether line clears should count toward `maxCombo` /
      the rating differently; whether the shared item cooldown should be longer for line clears.

## 5. Verification

- `npm run test-cli` after each stage. `match-3.test.ts`, `board-generation.test.ts`, `battle-atoms.test.ts`
  and `town.test.ts` (references `row-clear`) must stay green.
- `npm run lint` — React Compiler rules (no memo hooks); the new board effect reads the party via
  `store.get(partyAtom)` like the match effect, never by subscription.
- Manual, in the Training Grounds (items are not consumed there, so every path can be spammed): left-click arm →
  hover → click; Esc cancel; right-click auto; a line through a bomb; firing while a cascade runs; pausing
  while armed (arming clears); a phone-width viewport tap.

## 6. Decisions taken in Stage 4

- **Price**: Row Clear stays 300; **Column Clear went to 400**. A column is 8 orbs to a row's 6, so it
  clears ~33% more and now costs ~33% more. Both keep the shared, SPD-scaled item cooldown — a line clear
  is not slower to come back than a potion, it is just dearer.
- **Rating**: a line clear counts as an item used (a penalty, unchanged) and commits `combo: 1`, so it can
  never inflate `maxCombo`. The cascade it sets off counts exactly as a swap's would.
- **Damage curve**: kept the step function (`calculateMatchMultiplier`) scaled by
  `LINE_CLEAR_DAMAGE_MULTIPLIER`, still at `1.0`. The linear per-orb fallback stays on the shelf until
  playtesting says the 4-colour line is too strong — that is what the knob is for.
