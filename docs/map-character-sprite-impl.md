# Map Character Sprite — Implementation Reference

> Extracted from `MAP_CHARACTER_SPRITE_PLAN.md` — dimensions, formulas, and step-by-step breakdown.
>
> The sheet geometry and frame math below are current. **"Implementation steps" is a historical
> build checklist**: it is all shipped, and its movement/animation entries were superseded by the
> [movement model](#movement-model) — walk/run frames are distance-driven now, not `setInterval`-driven.

## Sprite sheet reference

| Property | Value |
|----------|-------|
| File | `public/assets/sprite/placeholder.png` |
| Format | PNG, 8-bit RGBA |
| Dimensions | **834 × 774 px** |
| Frame size | **64 × 64 px** |
| Gutter | **2 px** after each block (between blocks vertically) |

### Block layout (y-offsets from top of sheet)

```
┌─────────────────────────────────────────────┐  y=0
│  RUN     8 cols × 4 rows (up,left,down,right) │    0–255
│          y-offset: 0                           │
│          cols 0–7                              │
├────── 2 px gutter ──────────────────────────┤  y=256–257
│  SIT     3 cols × 4 rows                      │    258–513
│          y-offset: 258                         │
│          use only cols 0–1                     │
├────── 2 px gutter ──────────────────────────┤  y=514–515
│  WALK    9 cols × 4 rows                      │    516–771
│          y-offset: 516                         │
│          col 0 = stand/idle                    │
│          cols 1–8 = walk cycle                 │
└─────────────────────────────────────────────┘  y=774 (end)
```

### Direction → row mapping (same for every block)

| Direction | Row index | y within block |
|-----------|-----------|----------------|
| Up        | 0         | `blockY + 0`   |
| Left      | 1         | `blockY + 64`  |
| Down      | 2         | `blockY + 128` |
| Right     | 3         | `blockY + 192` |

### Per-block frame counts

| Block | Total cols | Used cols | Cycle count | Notes |
|-------|-----------|-----------|-------------|-------|
| Run   | 8         | 0–7       | 8           | Full cycle |
| Sit   | 3         | 0–1       | 2           | Sheet has 3; spec uses first 2 |
| Walk  | 9         | 0–8       | 8           | col 0 = stand; cols 1–8 = walk cycle |
| Stand | –         | –         | 1           | Walk col 0 of the facing row |

## Frame coordinate formula

```ts
// Given: mode, direction, frameIndex
const row = SPRITE_DIRECTION_ROW[direction];   // 0–3
let col: number;

switch (mode) {
  case 'run':    col = frameIndex;                break; // 0–7
  case 'sit':    col = frameIndex;                break; // 0–1
  case 'walk':   col = frameIndex + 1;            break; // 1–8
  case 'stand':  col = WALK_STAND_COLUMN;         break; // 0
}

const blockY = mode === 'run'  ? SPRITE_RUN_BLOCK_Y
             : mode === 'sit'  ? SPRITE_SIT_BLOCK_Y
             : SPRITE_WALK_BLOCK_Y;

const originX = col * SPRITE_FRAME_SIZE_PX;          // always multiples of 64
const originY = blockY + row * SPRITE_FRAME_SIZE_PX; // includes gutter
```

### Test-pin coordinates

| Mode | Direction | Frame | Expected `{ x, y }` |
|------|-----------|-------|----------------------|
| run  | up        | 0     | `{ 0,   0   }`       |
| walk | down      | 0     | `{ 64,  644 }`       |
| sit  | right     | 1     | `{ 64,  450 }`       |
| stand| left      | any   | `{ 0,  580 }`        |

## Display / scale formula

```ts
// How many pixels the character occupies at its native 64 px:
const k = (tileSize * CHARACTER_HEIGHT_TILES / 64) * displayScale;

// CSS on the sprite element:
//   width: 64px;
//   height: 64px;
//   transform: scale(k);
//   transform-origin: bottom center;
//   background-position: -originX -originY;
//   image-rendering: pixelated;
```

`CHARACTER_HEIGHT_TILES = 3.5` sets the rendered height of the sprite in tiles.

## Movement model

Movement is a continuous simulation in `useCharacterMovement` + `src/lib/map-movement.ts`, not
discrete stepping. Four properties carry the feel:

- **One coordinate space.** The simulation runs in *map pixels* — the space the canvas draws tiles
  in. `displayScale` is applied only when the sprite's `transform` is written, so resizing the
  window never moves, re-anchors or re-speeds the character.
- **Fixed timestep.** Real time accumulates and is consumed in `MOVEMENT_STEP_SECONDS` substeps with
  carry-over, so behaviour is identical at 30 or 144 fps and fast movement cannot tunnel through
  walls. Frames longer than `MAX_FRAME_SECONDS` are discarded, never replayed.
- **No React in the loop.** Position is written straight to the sprite element's `transform`
  (rounded to whole screen pixels, so pixel art never lands on a fractional device pixel). React
  state changes only when the tile or the sprite frame actually changes.
- **Assists, not rails.** Diagonals are normalised to cardinal speed. Collision is resolved per axis
  so the character slides along walls but cannot cut a pinhole corner. While moving along one axis
  the character eases toward the tile's centre line (`PATH_CENTERING_*`), except when the tile ahead
  is blocked — there it keeps its alignment so `CORNER_ASSIST_*` can slip it around a nearly-aligned
  gap. Nothing is latched: every substep re-tests the wall.

Tunables live in `src/constants/map-movement.ts`. `resolveMovementStep` is pure and covered by
`src/lib/map-movement.test.ts`.

## Input model

Two producers feed one consumer. Both emit the same `MovementIntent`
(`{ dirX, dirY, facing, running }`), a pure merge picks the winner, and the rAF loop only ever reads
one direction and one gait:

```
held keys → useMultiKeyDirection → keyboardToIntent    ─┐
                                                        ├─ mergeMovementIntents → resolveMovementStep
held pointer → usePointerDirection → resolvePointerIntent ─┘
```

- **Keyboard wins** whenever a direction key is down, so reaching for the keys mid-drag takes over
  instantly instead of fighting the pointer. Shift forces a run in either mode.
- **Pointer = click-and-hold.** Direction is the vector from the character to the pointer; the gait
  comes from the *distance* (`POINTER_RUN_DISTANCE_TILES`, with `POINTER_RUN_HYSTERESIS_TILES` so a
  cursor resting on the boundary can't flutter the animation). Inside `POINTER_DEAD_ZONE_TILES` the
  character stands still and keeps its facing, so arriving under the cursor stops cleanly.
- **Both sources snap to the same eight directions** via one `OCTANT_VECTORS` table — including the
  keyboard, which routes through `snapToOctant` rather than normalising separately, so the two paths
  emit bit-identical vectors and cannot drift apart. Snapping is what keeps path centering engaged:
  it only acts on single-axis movement, so a free-angle cursor would leave the character grazing tile
  borders down every one-tile road.
- **Pointer position is converted to map pixels at event time**, not per frame. That keeps a
  layout-reading `getBoundingClientRect()` out of the animation loop, and a map-space target stays
  correct if the window is resized mid-hold.

Pointer capture keeps a drag alive off-canvas; `blur`/`visibilitychange` release it so nothing
latches. `touch-action: none` on the canvas makes touch-drag steer rather than pan. Every rule above
is a pure function in `src/lib/pointer-movement.ts`, covered by `src/lib/pointer-movement.test.ts`.

## Animation timing constants

Walk and run frames are driven by **distance travelled**, not a timer, so the cadence scales with
speed automatically and pushing against a wall (zero distance) stops the cycle instead of
moonwalking. Only the idle chain uses timers.

| Constant                    | Value     | Meaning |
|-----------------------------|-----------|---------|
| `WALK_TILES_PER_ANIM_FRAME` | 0.55      | Tiles travelled per walk-cycle frame (~110 ms at walk speed) |
| `RUN_TILES_PER_ANIM_FRAME`  | 0.62      | Tiles travelled per run-cycle frame (~80 ms at run speed) |
| `SIT_FRAME_INTERVAL_MS`     | 5 000 ms  | Time between sit frame swaps |
| `IDLE_SIT_DELAY_MS`         | 60 000 ms | Idle time before sitting (1 minute) |

## State machine diagram

```
                 reportStep(d, { moved: true })
  ┌─────────┐ ──────────────────────────────────► ┌──────────┐
  │  STAND  │                                       │ WALK/RUN │
  │ frame 0 │ ◄──── idle > MOVE_WINDOW_MS ────── │ cycle    │
  └────┬────┘                                       └──────────┘
       │
       │ idle > IDLE_SIT_DELAY_MS
       ▼
  ┌─────────┐
  │   SIT   │
  │ frames  │ ◄── toggles every SIT_FRAME_INTERVAL_MS
  │  0 ⇄ 1 │
  └────┬────┘
       │
       │ any reportStep() call → immediate stand
       ▼
  ┌─────────┐
  │  STAND  │
  └─────────┘
```

- Every `reportStep()` sets `facing` to the new direction (character turns in place even when blocked).
- Run mode is selected when `running: true` (Shift held).
- All timers/intervals cleaned up on unmount.

## Implementation steps

### Step 1 — Constants & types

**File:** `src/constants/character-sprite.ts` (new)

- [ ] `CHARACTER_SPRITE_SHEET_PATH`
- [ ] `SPRITE_FRAME_SIZE_PX`
- [ ] Block-y constants: `SPRITE_RUN_BLOCK_Y`, `SPRITE_SIT_BLOCK_Y`, `SPRITE_WALK_BLOCK_Y`
- [ ] `SPRITE_DIRECTION_ROW` mapping `NavDirection` → row index
- [ ] Frame counts: `RUN_FRAME_COUNT`, `WALK_FRAME_COUNT`, `SIT_FRAME_COUNT`
- [ ] `WALK_STAND_COLUMN`
- [ ] Display: `CHARACTER_HEIGHT_TILES`
- [ ] Timing: `WALK_TILES_PER_ANIM_FRAME`, `RUN_TILES_PER_ANIM_FRAME`, `SIT_FRAME_INTERVAL_MS`, `IDLE_SIT_DELAY_MS`

**File:** `src/constants/keyboard.ts` (edit)

- [ ] Add `isRunModifier(event: KeyboardEvent): boolean` → `event.shiftKey`

### Step 2 — Pure frame math + tests

**Files:** `src/lib/character-sprite.ts`, `src/lib/character-sprite.test.ts` (new)

- [ ] `type CharacterSpriteMode = 'walk' | 'run' | 'stand' | 'sit'`
- [ ] `getSpriteFrameOrigin(mode, facing, frameIndex): { x, y }` with JSDoc
- [ ] `advanceFrame(mode, frameIndex): number` with wrap-around per mode
- [ ] Tests pinning: gutter-offset coordinates, direction→row mapping, wrap-around (run 7→0, etc.), stand ignores frameIndex

### Step 3 — Animation hook

**File:** `src/hooks/use-character-sprite.ts` (new)

- [ ] Returns `{ spriteState, updateSprite }`
- [ ] `spriteState: { mode, facing, frameIndex }`
- [ ] `updateSprite(mode, facing, frameIndex)` pushed from the movement loop; no-ops when unchanged
- [ ] Walk/run frame index derived from distance travelled (no frame timer)
- [ ] Idle→sit transition via `setTimeout`
- [ ] Sit frame cycling via `setInterval`
- [ ] Cleanup on unmount
- [ ] No `useMemo`/`useCallback` (React Compiler)

### Step 4 — Shared sprite component

**Files:** `src/components/map/map-character-sprite.tsx`, `src/styles/map-character-sprite.css` (new)

- [ ] Props: `positionRef`, `tileSize`, `displayScale`, `spriteState`
- [ ] Zero-size anchor `div` positioned by the movement loop writing `transform: translate3d(...)`
- [ ] Inner 64×64 `div` with `background-image` from spritesheet, `background-position` from `getSpriteFrameOrigin`
- [ ] `transform: scale(k)` with `transform-origin: bottom center`
- [ ] `image-rendering: pixelated`
- [ ] No `border-radius` / `box-shadow`
- [ ] No CSS transition on position — the rAF loop supplies the smoothness

### Step 5 — Wire tile-map.tsx (main map)

**File:** `src/components/map/tile-map.tsx` (edit)

- [ ] Remove `characterPlaceholder` const and `characterImage` state + loader
- [ ] `useWindowKeyDown` only forwards direction keys; key release, the run modifier and focus loss
      are owned by `useMultiKeyDirection`
- [ ] Replace character `div` with `<MapCharacterSprite>`, passing `movement.characterRef`
- [ ] Wrap canvas + sprite in a shrink-to-fit `position: relative` element so the sprite's absolute
      origin *is* the canvas origin (the centred, letterboxed canvas would otherwise offset it)
- [ ] Take `displayScale` from `useCanvasDisplayScale` (ResizeObserver), never a render-time layout read

### Step 6 — Wire tile-map-01.tsx (map-01)

**File:** `src/components/map/tile-map-01.tsx` (edit)

- [ ] Remove `characterImage` state + loader + canvas `drawImage`
- [ ] Same keydown wiring as Step 5
- [ ] Render `<MapCharacterSprite>` inside `.canvas-wrapper` with the real `displayScale`
- [ ] Ensure `.canvas-wrapper` is `position: relative`

### Step 7 — Supporting edits

- [ ] `src/services/assets-service.ts` → preload `/assets/sprite/placeholder.png` instead of the old placeholder
- [ ] `src/components/licenses/graphics-licenses.tsx` → add LPC Revised attribution entries (3 entries)

## Verification checklist

| # | Check |
|---|-------|
| 1 | `npm run test-cli` passes — frame math tests green |
| 2 | `npm run lint` passes |
| 3 | Arrows/WASD → walk animation with correct facing (up/left/down/right) |
| 4 | Shift + movement → run cycle plays |
| 5 | Walking into wall → character turns in place without stepping |
| 6 | Idle 1 min → character sits facing last direction |
| 7 | Sit → frames alternate every 5 s |
| 8 | Any key during sit → stands up immediately |
| 9 | Works on both maps (tile-map and tile-map-01) |
| 10 | Feet anchored to tile, no frame bleed at any zoom |
| 11 | Old rectangle artifacts (rounded corners, drop shadow) gone |
