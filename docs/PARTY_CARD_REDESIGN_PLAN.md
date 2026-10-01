# Party Member Card + Pause-Menu Party Bar — Indigolay Redesign Plan

**Status: design locked, not implemented.**

## Context

`PartyMemberCard` (`src/components/party/party-member-card.tsx`) still uses the pre-art look: a lucide class icon in a `tc-bg-wood` box, xs bars, and a floating wood info strip. Battle, rewards and level-up now show the Stella portraits in an indigolay style, so the card looks out of place. It's used in 6 places: the pause bar, the Stats/Equip/Skills roster tabs, the Inn and Training Grounds. The goal is a compact card that matches the HUD reference in `indigolay-mega/PixelHUDUI_PNG_v1.0/Preview/HUD.png`: a gold-framed portrait with a level pennant, next to icon-socketed status bars.

## Locked decisions (with the user)

| Decision | Choice |
| --- | --- |
| Card art | **Face-crop portrait** (`portrait-face-crop` + `CHARACTER_SPRITES[class].face` / `faceFocus`) |
| Portrait frame | **HUD thumbnail frame** (`UI_Panel_Thumbnail.png`): the level is printed on its own pennant base, so no separate `LevelTag` |
| Card body | **Dark-wood panel**, same recipe as the rewards card |
| Bars | **New `IndigolayStatusBar`** built on the pack's `UI_StatusBar_*` art: icon socket on the left, value label inside |
| Party bar container | **Light touch**: tighter padding, gold gradient bottom rule; dungeon's red-framed override untouched |
| Size | **Compact**: no taller than today's 86px card |

## All options considered (for review)

Chosen options are marked ✅.

**1. Card art: what replaces the lucide class icon?**
- ✅ **Face-crop badge + level pennant.** The same treatment as the Level Up badge: the painted portrait cropped to the face.
- **Idle battler sprite.** The animated Stella battler (wait loop) in the slot. It's livelier, but the 128px frame shrinks to about 64px and it would animate in every menu.
- **Both.** Face crop at rest, swapping to the idle battler while hovered or active in roster views. The most polish, but more states to tune.

**2. Card frame: what frames the card body?**
- ✅ **Dark-wood panel like the reward card.** A gradient over `bg-board.png`, a 2px `#5c3a1e` border and a gold inset ring, forming one unified panel.
- **Indigolay parchment scroll.** The save-slot scroll art with dark ink text. Very indigolay, but the 22–30px scroll border makes compact 4-across cards hard.
- **Keep wood, restyle internals.** Keep the current wood look and only swap in the portrait, level and bar polish. The smallest change.

**3. Bars: how should HP/EXP read?**
- ✅ **Labeled bars**: the value sits inside the bar, the separate info strip is dropped, and the EXP tooltip is kept.
- **Keep xs bars plus a text line**, as today. Familiar, but slightly taller.

**4. Party bar container**
- ✅ **Light touch**: tighter padding and a gold gradient bottom rule; the dungeon's override is untouched.
- **Framed panel**: wrap the bar in the dark-wood recipe so it reads as a HUD strip.
- **Leave it**: only the cards change.

**5. Portrait frame art** (asked after surveying `indigolay-mega`)
- ✅ **HUD thumbnail frame** (`UI_Panel_Thumbnail.png`, 187×225). Gold corners and a crimson window, with the level printed on its own pennant base, so `LevelTag` isn't needed. It matches the HUD preview.
- **Plain frame + `LevelTag`.** A `#5c3a1e` frame with a gold inner ring and the red `LevelTag` pennant, as on the Level Up badge. No new assets.

**6. Bar art** (asked after surveying `indigolay-mega`)
- ✅ **StatusBar with icon socket** (`UI_StatusBar_*`, 395×57) as a new `IndigolayStatusBar`: a heart for HP and a potion for EXP, with the value label inside. It needs a new component and about 11 assets.
- **Existing `IndigolayBar` sm.** Labeled, with a small `icon-hp` beside it. No new assets, and consistent with the battle and Level Up bars.

**Open choices to revisit:**
- The EXP socket icon is a yellow potion for now; the pack has no dedicated EXP icon.
- Face zoom inside the frame (about 2.2).
- Whether the roster variant shows the class name next to the character name.

## Assets to import

Copy from `C:\Users\joseo\OneDrive\Documents\assets\indigolay-mega\PixelHUDUI_PNG_v1.0\UI Elements\`, kebab-renamed per the project convention, and register each in `assetList` (`src/services/assets-service.ts`):

| Source | Destination |
| --- | --- |
| `Panel/UI_Panel_Thumbnail.png` (187×225) | `public/assets/frame/indigolay/portrait-frame.png` |
| `Bars/Status/UI_StatusBar_Bg.png` (395×57) | `public/assets/hud/indigolay/status-bar-track.png` |
| `Bars/Status/UI_StatusBar_Fill_{Green,Yellow,Red,Orange,Blue,BlueGreen,SkyBlue,Pink,Purple}.png` (319×39) | `public/assets/hud/indigolay/status-fill-{green,yellow,red,orange,blue,blue-green,sky-blue,pink,purple}.png`, so every `IndigolayBar` variant has a status fill |
| `Bars/BarIcon/UI_Icon_Potion_Yellow.png` | `public/assets/icons/indigolay/icon-potion-yellow.png`, the EXP socket icon |

The HP socket reuses the existing `/assets/icons/indigolay/icon-hp.png`, which is the pack's `UI_Icon_HP`.

Measured geometry, to be re-checked against a headless render before finishing:
- **Thumbnail frame:** the crimson window is at about x 16–167, y 14–154. The pennant base is at about x 46–161, y 170–222, so its center is offset right of the window because of the strap on the left.
- **Status bar:** the icon socket is at about x 6–52. The fill channel starts at about x 60, y 9 and is 319×39, the same as the fill PNGs.

## Implementation

### 1. `IndigolayStatusBar` (new): `src/components/ui-custom/indigolay-status-bar.tsx` + `src/components/ui-custom/styles/indigolay-status-bar.css`

```ts
interface IndigolayStatusBarProps extends HTMLAttributes<HTMLDivElement> {
  percentage: number;            // clamped 0–100
  variant?: IndigolayBarVariant;  // reuse the IndigolayBar variant union (export it if not already)
  icon: string;                   // socket icon src
  label?: ReactNode;              // centered in the channel
}
```

- **Root:** fixed aspect ratio `395 / 57`, width from its container, track PNG as `background-size: 100% 100%`, class `indigolay-art` so it opts out of pixelated rendering.
- **Channel:** absolutely positioned in percentages of the art (left 15.2%, top 15.8%, width 80.8%, height 68.4%). The fill PNG inside is clipped by a `width: {pct}%` wrapper with `transition: width 300ms`.
- **Socket icon:** absolutely positioned (left about 1.5%, width about 11%, vertically centered).
- **Label:** the same text treatment as `IndigolayBar` labels (`#f5e6c8`, 700 weight, `1px 1px 0` black shadow), sized with the bar.
- Supports `--ib-filter` like `IndigolayBar`, so the dead state can grey it out.
- Import the CSS in `src/index.css` next to the other `components/ui-custom/styles/*.css` imports.

### 2. `PartyPortraitFrame` (new): `src/components/party/party-portrait-frame.tsx`

`PartyPortraitFrame({ characterClass, level, className })`:
- **Root:** fixed aspect `187 / 225`, frame PNG as its background (`indigolay-art`).
- **Window:** an absolutely positioned `portrait-face-crop` div over the measured crimson window (in percentages). It sets `--face-x`/`--face-y` from `CHARACTER_SPRITES[class].faceFocus` and `--face-zoom` ≈ 2.2, and contains the `<img>`. The `portrait-face-crop` utility from `src/styles/utilities.css` is reused as-is.
- **Level pennant:** an absolutely positioned span centered on the pennant reads `LV {level}` in `pixel-font`, about 0.45rem, `#ffe9c2`, with a 1px black text shadow, matching `LevelTag` text.

### 3. `PartyMemberCard` redesign: `src/components/party/party-member-card.tsx`

The props stay the same, so none of the 6 call sites change. New markup:

```
.party-member-card (dark-wood panel, flex row, gap 0.5rem, padding 0.4rem 0.5rem)
├─ PartyPortraitFrame (width 56px → ≈67px tall)
└─ .party-member-card__body (flex column, gap 3px, min-width 0)
   ├─ .party-member-card__name   WARRIOR  (+ class in muted gold, roster only if it fits)
   ├─ IndigolayStatusBar  icon=icon-hp, variant=HP_THRESHOLD_BAR_VARIANT[...], label="170/170"
   └─ Tooltip > IndigolayStatusBar  icon=icon-potion-yellow, variant=yellow, no label (existing EXP tooltip kept)
```

- Remove the `CHARACTER_COLORS`/`CHARACTER_ICONS` usage from the card. Both exports stay, because other files use them.
- The `.party-member-card__detail` "Lv · HP" line goes away: the level is on the pennant and HP is in the bar label.

### 4. Card CSS: `src/styles/pause-menu.css` (rewrite the "Party Member Card" block, about lines 68–250)

- **Panel recipe** (same as `.character-card` in `src/styles/battle-rewards-screen.css`): `linear-gradient(135deg, rgba(61,40,23,.88), rgba(42,24,16,.92))` over `bg-board.png` at 50px, `2px solid #5c3a1e`, `border-radius: 8px`, shadow `inset 0 0 0 1px rgba(212,165,116,.6), inset 0 1px 0 rgba(255,255,255,.12), 0 3px 8px rgba(0,0,0,.5)`.
- Drop `image-rendering: pixelated` from `.party-member-card`.
- **Name:** keep the current style (`#fff8dc`, 0.65rem, uppercase, ellipsis).
- **Roster:** pointer cursor, `brightness(1.08)` on hover. Active state: border `#d4a574` plus a soft `0 0 8px rgba(212,165,116,.45)` glow, kept subtle.
- **Dead:** the portrait frame gets `grayscale(1) brightness(.7)`, the status bars set `--ib-filter: grayscale(1) brightness(.6)`, and the name turns `#9d9691` with a line-through.
- Keep the `.exp-bar-tooltip*` rules and `.kb-cursor` (around line 1448) as they are.
- Card height target is about 79px (frame 67px plus padding), which is no taller than today's 86px.

### 5. Clean up overrides

- `src/styles/town.css:1034-1093`: remove the inn rules aimed at the old internals (`__icon` height 86px, the `__info-bar`/`__exp-bar` width 100%). The new card is already a square box that fills its cell, so the cursor corners will hug it. Keep `.inn-party-members-grid .party-member-card--bar { min-width: 0 }`, `.cannot-afford`, and the cell/heal-chip rules.
- `src/styles/dungeon.css:501` (`.dungeon-party .pause-menu-party-bar` red frame): no change.

### 6. Party bar container: `.pause-menu-party-bar` in `src/styles/pause-menu.css:58`

- Padding goes from `0.75rem 1rem` to `0.5rem 0.75rem`. The gap stays at `0.5rem`.
- The flat `border-bottom` is replaced by a gold gradient rule. Use `border-image: linear-gradient(90deg, transparent, #8b6914 20%, #d4a574 50%, #8b6914 80%, transparent) 1` on a 2px bottom border, matching `GradientDivider` gold.

## Verification

- `npx tsc -p tsconfig.app.json --noEmit` and `npx eslint` on the touched files. Prettier on touched `src` `.ts`/`.tsx` files only.
- **Headless render check** (cached Chromium at `~/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe --headless=new --screenshot`): a static HTML page with the frame and status-bar art at card size, to confirm the window and channel percentages line up before handing over.
- **User checks in the dev server:**
  - pause menu party bar
  - the Stats, Equip and Skills roster tabs (active state, `kb-cursor`)
  - Inn grid (corners hug, cannot-afford dimming, heal chips)
  - Training Grounds
  - dungeon party strip
  - a dead member
  - the EXP tooltip
  - narrow widths (cards keep `min-width: 200px`)
