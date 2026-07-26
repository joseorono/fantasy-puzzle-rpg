# Map Character Sprite — Implementation Reference

> Extracted from `MAP_CHARACTER_SPRITE_PLAN.md` — dimensions, formulas, and step-by-step breakdown.

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

`CHARACTER_HEIGHT_TILES = 2.5` keeps the same footprint as the current placeholder (~2 × 2.5 tiles).

## Animation timing constants

| Constant                  | Value     | Meaning |
|---------------------------|-----------|---------|
| `WALK_FRAME_MS`           | 110 ms    | Frame duration during walk |
| `RUN_FRAME_MS`            | 80 ms     | Frame duration during run |
| `SIT_FRAME_INTERVAL_MS`   | 5 000 ms  | Time between sit frame swaps |
| `IDLE_SIT_DELAY_MS`       | 60 000 ms | Idle time before sitting (1 minute) |
| `MOVE_ANIMATION_WINDOW_MS`| 250 ms    | Grace period after last step before returning to stand |

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
- [ ] Timing: `WALK_FRAME_MS`, `RUN_FRAME_MS`, `SIT_FRAME_INTERVAL_MS`, `IDLE_SIT_DELAY_MS`, `MOVE_ANIMATION_WINDOW_MS`

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

- [ ] Returns `{ spriteState, reportStep }`
- [ ] `spriteState: { mode, facing, frameIndex }`
- [ ] `reportStep(direction, { moved, running })` called from keydown handler
- [ ] Walk/run frame advancement via `setInterval`
- [ ] Idle→sit transition via `setTimeout`
- [ ] Sit frame cycling via `setInterval`
- [ ] Cleanup on unmount
- [ ] No `useMemo`/`useCallback` (React Compiler)

### Step 4 — Shared sprite component

**Files:** `src/components/map/map-character-sprite.tsx`, `src/styles/map-character-sprite.css` (new)

- [ ] Props: `position: { row, col }`, `tileSize`, `displayScale`, `spriteState`, `enableTransition?: boolean`
- [ ] Anchored `div` at tile position (left/top calc from col/row × tileSize)
- [ ] Inner 64×64 `div` with `background-image` from spritesheet, `background-position` from `getSpriteFrameOrigin`
- [ ] `transform: scale(k)` with `transform-origin: bottom center`
- [ ] `image-rendering: pixelated`
- [ ] No `border-radius` / `box-shadow`
- [ ] Optional transition on position (`0.2s ease-out`)

### Step 5 — Wire tile-map.tsx (main map)

**File:** `src/components/map/tile-map.tsx` (edit)

- [ ] Remove `characterPlaceholder` const and `characterImage` state + loader
- [ ] Restructure `useWindowKeyDown` handler: compute step outside `setCharPosition` updater
- [ ] Call `reportStep(direction, { moved: canMove, running: isRunModifier(event) })`
- [ ] Replace character `div` with `<MapCharacterSprite>`
- [ ] Wire `spriteState` from hook, pass position/tileSize/scale

### Step 6 — Wire tile-map-01.tsx (map-01)

**File:** `src/components/map/tile-map-01.tsx` (edit)

- [ ] Remove `characterImage` state + loader + canvas `drawImage`
- [ ] Call `reportStep` from keydown handler
- [ ] Render `<MapCharacterSprite displayScale={1}>` inside `.canvas-wrapper`
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
