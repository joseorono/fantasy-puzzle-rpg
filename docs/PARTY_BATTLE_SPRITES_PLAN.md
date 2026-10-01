# Party Battle Sprites — Implementation Plan

Bring the new Stella character art into battle: real animated sprites in `#party-members-grid` and a portrait + battler skill-burst, with the infrastructure to art-swap all 4 party characters. For now the Healer clones the Mage and the Rogue clones the Warrior.

**Status: implemented.** Deviations from the spec below:

- The guard pose reacts to a mitigated hit **on that member** (`lastDamage.characterId`), not party-wide, since enemy hits target one hero; an unguarded hit plays the flinch.
- No extra reduced-motion rule: the global collapse in `reduced-motion.css` (1 ms, single iteration) already leaves loops on frame 0 and one-shots on their final frame.
- The grid sprite uses `--battler-scale` per breakpoint (0.7 / 0.85 / 0.95) instead of a `--battler-h`, and renders with `image-rendering: auto` because it's downscaled; the burst battler (2× / 3×) stays pixelated.

## Locked design decisions

| Decision | Choice |
| --- | --- |
| Clone differentiation | **Untinted** — identity comes from the existing `CHARACTER_BATTLE_COLORS` frames/glows/bars |
| Grid slot look | **Keep the colored rounded box**; the sprite renders inside it (the 128px frame's sides may crop) |
| Grid sprite size | **Grow ~30%** over today's slots; grid gaps drop one step to compensate |
| Ready state | **`victory` motion loop + keep `animate-bounce`**; glow toned down to a subtle rim |
| Reactive motions (first pass) | **All in**: `damage` flinch, `guard` pose on block, `dying` pre-roll before `dead` |
| Dead state | `dying` → `dead`, hold the lying pose; **skull overlay removed**, dim/grayscale kept |
| Burst composition | **Portrait cut-in left on a diagonal band; ~3× battler right of center playing the cast motion; ribbon banner stays** |
| Burst duration | **650 → 900 ms**; keyframes re-proportioned; duration fed from the constant via a CSS var |
| Cast motion | **Per-character property in constants** (`castMotion`): warrior `swing`, rogue `missile`, mage `spell`, healer `chant` |
| Preload | **Battlers + faces only**; walk sheets wait for the map integration |

## Asset facts

All Stella exports of a kind share the same dimensions and layout.

- **Side-view battlers** — `public/assets/sprite/party-{mage,warrior}-stella-side-view.png`, 1152×768: a 9×6 grid of **128×128** frames, three 3-column blocks × 6 rows = 18 motions × 3 frames (RPG Maker SV layout):

  | Row | Left block (cols 0–2) | Middle block (cols 3–5) | Right block (cols 6–8) |
  | --- | --------------------- | ----------------------- | ---------------------- |
  | 0   | walk                  | thrust                  | escape                 |
  | 1   | wait (idle)           | swing                   | victory                |
  | 2   | chant                 | missile                 | dying                  |
  | 3   | guard                 | skill                   | abnormal               |
  | 4   | damage                | spell                   | sleep                  |
  | 5   | evade                 | item                    | dead (lying flat)      |

- **Walk sheets** — `party-{mage,warrior}-stella-walk.png`, 216×288: 3×4 grid of **72×72** (3-frame cycle × down/left/right/up). Battle doesn't use them; see Future work.
- **Full-body portraits** — `public/assets/portraits/party-mage-face.png` (598×1280), `party-warrior-face.png` (705×1280): painted art, not pixel art. The `/portraits/` smoothing opt-out in `src/styles/utilities.css` already covers them.
- Battler sheets **are** pixel art → the global `image-rendering: pixelated` is correct for them, no opt-out.

## Implementation spec

### 0. Prerequisite — trim the portraits

Trim transparent padding from both `party-*-face.png` (Pillow `getbbox` on the alpha channel + ~4px margin — same one-off scratchpad script approach used for `innkeeper-2.png`).

### 1. `src/constants/stella-sprites.ts` (new) — shared geometry + timing tunables

```ts
export type StellaMotion = 'walk' | 'wait' | 'chant' | 'guard' | 'damage' | 'evade'
  | 'thrust' | 'swing' | 'missile' | 'skill' | 'spell' | 'item'
  | 'escape' | 'victory' | 'dying' | 'abnormal' | 'sleep' | 'dead';

export const STELLA_SV_FRAME_PX = 128;
export const STELLA_SV_FRAMES_PER_MOTION = 3;
/** col = the motion block's first column (0 / 3 / 6), row 0–5. */
export const STELLA_SV_MOTIONS: Record<StellaMotion, { col: number; row: number }> = { /* all 18 */ };

// Timing tunables (ms)
export const STELLA_IDLE_CYCLE_MS = 1040; // wait/victory ping-pong (0-1-2-1)
export const STELLA_CAST_FRAME_MS = 150;  // one-shot cast: 3×150 = 450ms inside the 600ms isActivating window
export const STELLA_DAMAGE_MS = 500;      // flinch length (showDamage lasts 1000ms)
export const STELLA_DYING_MS = 450;       // dying pre-roll before settling into 'dead'
export const STELLA_GUARD_HOLD_MS = 800;  // matches the existing guardBlock popup window

// Walk sheets (future map use)
export const STELLA_WALK_FRAME_PX = 72;
export const STELLA_WALK_DIRECTION_ROWS = { down: 0, left: 1, right: 2, up: 3 } as const;
```

### 2. `src/lib/stella-sprites.ts` (new, JSDoc + test) — pure frame math

- `getStellaMotionOrigin(motion: StellaMotion, frame = 0): { x: number; y: number }` → `x = (col + frame) * 128`, `y = row * 128`.
- `src/lib/stella-sprites.test.ts`: corner motions (`walk` → 0,0; `dead` → 768,640), frame offsets, all 18 origins land inside the 1152×768 sheet.

### 3. `src/constants/party.ts` — `CHARACTER_SPRITES`

Next to `CHARACTER_ICONS`, keyed by class — no new `CharacterData` field, so existing saves need no migration:

```ts
export const CHARACTER_SPRITES: Record<CharacterClass, {
  battler: string;  // side-view sheet
  walk: string;     // reserved for the map integration
  face: string;     // full-body portrait
  castMotion: StellaMotion;
}> = {
  warrior: { battler: '/assets/sprite/party-warrior-stella-side-view.png', walk: '/assets/sprite/party-warrior-stella-walk.png', face: '/assets/portraits/party-warrior-face.png', castMotion: 'swing' },
  rogue:   { /* same files as warrior (clone) */ castMotion: 'missile' },
  mage:    { battler: '/assets/sprite/party-mage-stella-side-view.png', walk: '/assets/sprite/party-mage-stella-walk.png', face: '/assets/portraits/party-mage-face.png', castMotion: 'spell' },
  healer:  { /* same files as mage (clone) */ castMotion: 'chant' },
};
```

### 4. `src/components/battle/stella-battler-sprite.tsx` (new) — reusable sprite component

```ts
interface StellaBattlerSpriteProps {
  characterClass: CharacterClass;
  motion: StellaMotion;
  mode: 'loop' | 'once'; // loop = ping-pong 0-1-2-1; once = 0-1-2, holds frame 2
  heightPx: number;      // displayed frame height; scale = heightPx / 128
  frameMs?: number;      // per-frame ms; defaults by mode from the constants
  className?: string;
}
```

- Outer anchor div `heightPx` tall; inner 128×128 cell with `backgroundImage` from `CHARACTER_SPRITES[class].battler`, base `backgroundPosition` from `getStellaMotionOrigin(motion)`, `transform: scale(heightPx / 128)`, `transformOrigin: 'bottom center'` — the same cell + scale pattern as `src/components/map/map-character-sprite.tsx`.
- Animation is pure CSS: the component sets `--stella-x` / `--stella-y` (frame-0 origin) and `--stella-cycle-ms` inline and applies `.stella-battler--loop` or `.stella-battler--once`. `key={motion}` remounts the cell so the animation restarts cleanly on motion change.

### 5. `src/hooks/use-battler-motion.ts` (new) — motion state machine

`useBattlerMotion(character, { isActivating })` returns `{ motion, mode }`. Priority, highest first:

1. **dead** — on the `currentHp <= 0` transition: `dying` (once) for `STELLA_DYING_MS`, then `dead` (once, holds the lying frame). Already dead on mount → straight to `dead`.
2. **cast** — while `isActivating` (the existing 600 ms window): `CHARACTER_SPRITES[class].castMotion`, once.
3. **damage** — when `lastDamageAtom` hits this character (`target === 'party' && characterId === id && amount > 0`, the same predicate as `showDamage`): `damage`, once, for `STELLA_DAMAGE_MS`.
4. **guard** — when `lastDamage.wasGuarded` for the party: `guard`, held for `STELLA_GUARD_HOLD_MS` (the BLOCK! popup window).
5. **ready** — `skillCooldown <= 0`: `victory`, loop.
6. **idle** — `wait`, loop.

### 6. `src/components/battle/party-display.tsx` — slot changes

In `CharacterSprite`:

- Replace the chibi block (head div + lucide `Icon` + skull `<img>`) with `<StellaBattlerSprite>` driven by `useBattlerMotion`; drop this file's `CHARACTER_ICONS` usage.
- Keep: the colored box (`colors.bg` / `colors.border`), `animate-bounce` + hover grow on ready, the `skill-activate` flash, dead `grayscale opacity-50`, the ready skill badge, HP bar, name, cooldown bar.
- **Subtle glow**: the ready glow div goes from `animate-pulse rounded-lg blur-xl` + full-opacity `colors.glow` to roughly `opacity-40 blur-lg` — a soft rim, not a bloom. Exact values eyeballed at implementation.
- **+30% size** (the box crops the 128-wide frame's sides by design): `h-16 w-14 sm:h-20 sm:w-16 md:h-22 md:w-18` → approximately `h-21 w-18 sm:h-26 sm:w-21 md:h-29 md:w-24` (≈84×72 / 104×84 / 116×96; exact Tailwind steps verified visually). Grid gaps drop one step: `gap-2 sm:gap-3 md:gap-4 xl:gap-7 2xl:gap-12` → `gap-1.5 sm:gap-2 md:gap-3 xl:gap-5 2xl:gap-8`. The ≤780px-height scale in `battle-layout.css` (`#party-members-grid { transform: scale(0.88) }`) stays and gets re-checked.
- Sprite `heightPx` ≈ box height minus a 4px border allowance, provided per breakpoint via a CSS var on the box (`--battler-h`) rather than JS measurement.

### 7. `src/components/battle/skill-burst-overlay.tsx` — portrait + battler

- The root gets `style={{ '--skill-burst-ms': `${SKILL_BURST_DURATION_MS}ms` }}`, and every `skill-burst-*` animation switches from the hardcoded `650ms` to `var(--skill-burst-ms)` — single source of truth. `SKILL_BURST_DURATION_MS` goes 650 → **900** in `party.ts`.
- Replace the centered lucide icon block with:
  - **`.skill-burst-cutin`** (left): `<img src={CHARACTER_SPRITES[class].face}>`, height `clamp(320px, 78vh, 820px)`, on a diagonal band (`clip-path` polygon, ~8° slant) sliding in from the left (`skill-burst-cutin-slide`: enter over the first ~17%, hold, exit with the fade).
  - **`.skill-burst-battler`** (right of center, above the ribbon): `<StellaBattlerSprite heightPx={min(384, 45vw)} motion={castMotion} mode="once">` — plays its 3 frames, then holds.
- Keep: the conic burst lines, the `SKILL_BURST_COLORS` wash, the title-sign ribbon. Keyframe stops re-proportioned for 900 ms (enter ~15%, hold to ~78%, fade out).
- Remove the `CHARACTER_ICONS` import from this file.

### 8. `src/styles/party-sprites.css` (new) — sprite keyframes/classes

```css
.stella-battler__cell {
  width: 128px; height: 128px;
  background-repeat: no-repeat;
  background-position: calc(var(--stella-x) * -1px) calc(var(--stella-y) * -1px);
  transform-origin: bottom center;
}

/* 3-frame ping-pong (0-1-2-1), discrete steps */
@keyframes stella-loop {
  0%, 100% { background-position: calc(var(--stella-x) * -1px) calc(var(--stella-y) * -1px); }
  25%, 75% { background-position: calc((var(--stella-x) + 128) * -1px) calc(var(--stella-y) * -1px); }
  50%      { background-position: calc((var(--stella-x) + 256) * -1px) calc(var(--stella-y) * -1px); }
}
.stella-battler--loop .stella-battler__cell {
  animation: stella-loop var(--stella-cycle-ms) step-end infinite;
}

/* one-shot 0-1-2, holds the last frame */
@keyframes stella-once { /* 0% frame 0 · 33.4% frame 1 · 66.7%,100% frame 2 */ }
.stella-battler--once .stella-battler__cell {
  animation: stella-once var(--stella-cycle-ms) step-end forwards;
}

/* plus: skill-burst-cutin-slide and the battler pop, durations var(--skill-burst-ms) */
```

Imported in `src/index.css` after `./styles/battle-top-bar.css`; `reduced-motion.css` stays last and gains a freeze (`.stella-battler__cell { animation: none }` → rests on frame 0 of the current motion, so the dead pose still reads because the base `background-position` already points at the dead block).

### 9. `src/services/assets-service.ts`

Add to `assetList`: the 2 battler sheets (Sprites section) and the 2 trimmed face PNGs (Portraits section). Walk sheets are intentionally **not** preloaded until the map uses them.

## Future work

- **Map walk cycles per character**: replace the LPC `placeholder.png`; frame size changes 64→72 and the body boxes in `src/constants/character-sprite.ts` must be re-measured for the Stella sheets.
- **Real Healer/Rogue art**: once exported from Stella, drop-in by editing only `CHARACTER_SPRITES`.
- **Level-up / battle-rewards screens** still hardcode `Innkeeper_02.png` for every character (`src/views/level-up-view.tsx`, `src/views/battle-rewards-screen.tsx`) — swap to `CHARACTER_SPRITES[class].face`.

## Verification

Run the dev server and check in battle:

- All 4 slots play the `wait` idle; ready members switch to the `victory` loop with bounce and a subtle glow; hover grow still works.
- Each cast: the grid sprite plays its `castMotion`; the burst shows the portrait cut-in left + ~3× battler right + ribbon over 900 ms; chaining two casts quickly restarts cleanly (`animationKey`).
- Taking a hit plays the `damage` flinch; a guarded hit holds the `guard` pose during the BLOCK! window; a KO plays `dying` → lying `dead`, held, dimmed, no skull.
- Clones: Healer/Rogue show mage/warrior art inside green/yellow boxes.
- Layout: new slot sizes at base/sm/md, tightened grid gaps, the ≤780px height scale, and the party panel doesn't overflow.
- `npm run test-cli` passes with the new `stella-sprites.test.ts`.
- `prefers-reduced-motion`: sprites freeze on frame 0 of their current motion; the dead pose still shows.
