# Replace the map character placeholder with an animated LPC sprite

> Findings + original implementation plan. **Status: implemented and since superseded in parts.**
>
> The sprite sheet geometry, the walk/run/stand/sit behaviours and the shared-component requirement
> below all shipped as written. The **movement model did not**: the discrete key-repeat stepping with
> a `left/top 0.2s ease-out` transition described here was replaced by a continuous simulation, and
> the timer-driven animation cadence was replaced by a distance-driven one. See
> [docs/map-character-sprite-impl.md](docs/map-character-sprite-impl.md#movement-model) for what the
> code actually does; treat the movement sections of this document as historical.

## Context

The map player is a static placeholder today: `tile-map.tsx` renders an absolutely-positioned `div`
with `character-placeholder.png` as its background (rounded corners + drop shadow — the "rectangle"),
and `tile-map-01.tsx` draws the same image straight onto its canvas. The goal is a real animated
character using the spritesheet at `public/assets/sprite/placeholder.png`:

- **walk** while moving (arrows/WASD),
- **run** while moving with **Shift** held,
- **sit** after being idle for 1 minute (a millisecond constant, so it can be lowered for testing),
  with the two sitting frames cycling every 5 seconds (also a constant).

**Hard requirement:** the sprite system is universal — one shared component/hook used by both existing
map components and any future map, not per-map copies.

## Verified sheet content (ground truth)

`placeholder.png` is **834×774**, **64×64 frames**, three 4-row blocks with a **2px gutter after each
block** (measured by scanning alpha bands — this is why block offsets aren't multiples of 64):

| Block | Row 0 y-offset | Frames per row | Notes |
|-------|---------------|----------------|-------|
| Run   | `0`   | 8 (cols 0–7) | full cycle |
| Sit   | `258` | 3 on the sheet — **use only cols 0–1** (per spec) | frame cycle every 5 s |
| Walk  | `516` | 9 (cols 0–8) | **col 0 is the neutral standing pose** (LPC convention) → reuse as the idle/stand frame; cols 1–8 are the walk cycle |

Rows within every block are, top to bottom: **up, left, down, right** (verified visually at 4× zoom) —
maps 1:1 onto the existing `NavDirection` type. A frame's sheet origin is
`x = col * 64`, `y = blockY + directionRow * 64`.

## New shared pieces

Per project conventions: tunables in `src/constants/`, pure logic + JSDoc + tests in `src/lib/`,
hooks in `src/hooks/`, kebab-case files.

### 1. `src/constants/character-sprite.ts` — geometry + timing tunables

- `CHARACTER_SPRITE_SHEET_PATH = '/assets/sprite/placeholder.png'`
- `SPRITE_FRAME_SIZE_PX = 64`
- Block offsets: `SPRITE_RUN_BLOCK_Y = 0`, `SPRITE_SIT_BLOCK_Y = 258`, `SPRITE_WALK_BLOCK_Y = 516`
- `SPRITE_DIRECTION_ROW: Record<NavDirection, number> = { up: 0, left: 1, down: 2, right: 3 }`
  (import `NavDirection` from `~/constants/keyboard`)
- Frame counts: `RUN_FRAME_COUNT = 8`, `WALK_FRAME_COUNT = 8` (cols 1–8), `WALK_STAND_COLUMN = 0`,
  `SIT_FRAME_COUNT = 2` (sheet has 3; spec says use the first two)
- Timing:
  - `WALK_FRAME_MS = 110`, `RUN_FRAME_MS = 80` (feel-tunable)
  - `SIT_FRAME_INTERVAL_MS = 5_000`
  - `IDLE_SIT_DELAY_MS = 60_000` — lower locally to test the sit transition
  - `MOVE_ANIMATION_WINDOW_MS = 250` — slightly above the 200 ms step transition, so the cycle keeps
    playing while OS key-repeat chains steps together
- Display policy: `CHARACTER_HEIGHT_TILES = 2.5`, feet anchored to the occupied tile (keeps the
  current footprint of the placeholder div: ~2×2.5 tiles).

### 2. `src/lib/character-sprite.ts` (+ `src/lib/character-sprite.test.ts`) — pure frame math

- `type CharacterSpriteMode = 'walk' | 'run' | 'stand' | 'sit'`
- `getSpriteFrameOrigin(mode, facing, frameIndex): { x, y }` — pixel origin on the sheet, gutter
  offsets included; `'stand'` resolves to walk col 0 of the facing row; walk cycle index `i` maps to
  col `i + 1`
- `advanceFrame(mode, frameIndex): number` — wrap-around per mode (run 0–7, walk 0–7, sit 0–1,
  stand always 0)
- JSDoc on everything (lib rule). Tests pin the hazard spots:
  - gutter offsets: e.g. walk·down·cycle-index 0 → `{ x: 64, y: 644 }`; sit·right·frame 1 →
    `{ x: 64, y: 450 }`; run·up·frame 0 → `{ x: 0, y: 0 }`
  - direction → row mapping for all four directions
  - wrap-around: run 7→0, walk 7→0, sit 1→0
  - stand ignores frameIndex, always col 0

### 3. `src/hooks/use-character-sprite.ts` — animation state machine

Returns `{ spriteState: { mode, facing, frameIndex }, reportStep }` where
`reportStep(direction, { moved, running })` is called by the map's keydown handler:

- Every call sets `facing` and resets the idle→sit timer — bumping a wall turns the sprite in place
  without playing the walk cycle (classic RPG behavior).
- `moved: true` → mode = `running ? 'run' : 'walk'`, record `lastStepAt`; an interval advances
  `frameIndex` every `RUN_FRAME_MS`/`WALK_FRAME_MS` via `advanceFrame`.
- When `now - lastStepAt > MOVE_ANIMATION_WINDOW_MS` → mode `'stand'` (frame 0) and start
  `setTimeout(IDLE_SIT_DELAY_MS)` → mode `'sit'`.
- In `'sit'`, `frameIndex` toggles on a `SIT_FRAME_INTERVAL_MS` interval.
- All timers/intervals cleaned up on unmount. No memoization (React Compiler).

### 4. `src/components/map/map-character-sprite.tsx` + `src/styles/map-character-sprite.css`

Presentational overlay, CSS imported by the component (same pattern as `demo-map.tsx` importing
`game-map.css`; pixel-art styling belongs in `src/styles/` per project rules).

- Props (interface): `position: { row, col }`, `tileSize: number`, `displayScale: number`,
  `spriteState`, `enableTransition?: boolean`
- Structure: an anchored wrapper `div` positioned from tile coords (keeps the existing
  `left/top 0.2s ease-out` transition behavior) containing a 64×64 sprite `div` with the sheet as
  `background-image`, `background-position: -x -y` from `getSpriteFrameOrigin`, and
  `transform: scale(k)` with `transform-origin: bottom center` so frame math stays in native sheet
  pixels (no neighbor-frame bleed at fractional scales). `k = (tileSize * CHARACTER_HEIGHT_TILES / 64) * displayScale`.
- `image-rendering: pixelated`; **no** `border-radius` / `box-shadow` (that was the rectangle look).

## Consumer changes

### `src/components/map/tile-map.tsx` (main map, map-00)

- Drop `characterPlaceholder` const (line 49), `characterImage` state (line 98) and its loader effect
  (lines 178–189).
- Restructure the `useWindowKeyDown` handler to compute the step **outside** the `setCharPosition`
  updater, the way `tile-map-01.tsx` already does — safe because `use-window-keydown` always invokes
  the latest closure via ref, and it avoids side effects inside a state updater. Then call
  `reportStep(direction, { moved: canMove, running: isRunModifier(event) })`.
- Replace the character `div` (lines 903–924) with
  `<MapCharacterSprite position={charPosition} tileSize={tileSize} displayScale={scale} … />`,
  keeping the `canvasReady` gate and `enableTransition` wiring.

### `src/components/map/tile-map-01.tsx` (map-01, used by demo-map-2)

- Drop `characterImage` state/loader (lines 9, 25, 49–60) and the canvas `drawImage` + circle
  fallback (lines 195–213).
- Call `reportStep` from its keydown handler (lines 121–139), same shape as above.
- Render `<MapCharacterSprite displayScale={1} …>` inside `.canvas-wrapper` next to the canvas —
  the canvas renders at native size there, so tile coords are already screen coords. Ensure
  `.canvas-wrapper` is `position: relative` so the sprite scrolls with the map.

### Small supporting edits

- `src/constants/keyboard.ts` — add `isRunModifier(event): boolean` (returns `event.shiftKey`) so
  "run = Shift" lives with the other keyboard helpers. Note `getNavDirection` already resolves
  Shift-held WASD (it lowercases single letters), so no other input change is needed.
- `src/services/assets-service.ts` (line 152) — replace `/assets/sprite/character-placeholder.png`
  with `/assets/sprite/placeholder.png` in the preload list. Leave the old png on disk for now.

## Licenses — `src/components/licenses/graphics-licenses.tsx`

Add entries following the existing "name, license, author, link" `<p>` format. Content (from the
Universal LPC generator credits output for this sheet):

- **Map character base — LPC Revised**, OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0.
  Body: "'Thick' Male Revised Run/Climb" by JaidynReiman, based on ElizaWy's LPC Revised. Authors:
  bluecarrot16, JaidynReiman, Benjamin K. Smith (BenCreating), Evert, Eliza Wyatt (ElizaWy),
  TheraHedwig, MuffinElZangano, Durrani, Johannes Sjölund (wulax), Stephen Challener (Redshrike).
  <https://opengameart.org/content/lpc-character-bases>
- **Head**: original by Stephen Challener (Redshrike), tweaks by Benjamin K. Smith (BenCreating),
  modular version by bluecarrot16 — OGA-BY 3.0 / CC-BY-SA 3.0 / GPL 3.0.
- **Face**: original by Redshrike, expressions by ElizaWy, mapped to all frames by JaidynReiman —
  OGA-BY 3.0.

## Files summary

| File | Change |
|------|--------|
| `src/constants/character-sprite.ts` | new — sheet geometry + timing constants |
| `src/lib/character-sprite.ts` / `.test.ts` | new — pure frame math + tests |
| `src/hooks/use-character-sprite.ts` | new — walk/run/stand/sit state machine |
| `src/components/map/map-character-sprite.tsx` | new — shared overlay component |
| `src/styles/map-character-sprite.css` | new — sprite styling |
| `src/components/map/tile-map.tsx` | swap placeholder div for shared component, wire `reportStep` |
| `src/components/map/tile-map-01.tsx` | remove canvas-drawn char, use shared component |
| `src/constants/keyboard.ts` | add `isRunModifier` |
| `src/services/assets-service.ts` | preload the new sheet |
| `src/components/licenses/graphics-licenses.tsx` | LPC Revised attribution |

## Verification

1. `npm run test-cli` — `character-sprite.test.ts` pins the gutter-offset math (the spot most likely
   to silently break); `npm run lint`. (Build/dev runs handled by the user.)
2. In-game, on **both** maps: arrows/WASD walk with correct facing in all four directions; holding
   Shift while moving plays the run cycle; walking into a wall turns the character without stepping;
   after `IDLE_SIT_DELAY_MS` of no input (temporarily lower the constant) the character sits facing
   its last direction and alternates its two sit frames every 5 s; any keypress stands it back up
   immediately.
3. Visual: feet sit on the occupied tile, no bleed from neighboring frames at any window size, and
   the old rectangle artifacts (rounded corners, drop shadow) are gone.
