# Save/Load Slot Cards — Indigolay Scroll Redesign

## Context

The save/load slot cards (`save-slot-card__content` and children, used by both the Save and Load tabs of `SaveLoadMenu`) currently read as generic dark rows with thin tan borders — functional but flat next to the rest of the Indigolay-styled menus. The Indigolay **PixelAdventureBookUI** pack ships a purpose-built Save/Load design (`Preview/5.Save_Load.png`): parchment **scroll rows** with a brown "Slot" plaque, gold-outlined scroll when active, and a greyed dim scroll for empty slots. The user approved adopting the **full scroll-row look**: parchment scrolls with dark-brown text, popping against the existing dark-wood list background. No character portraits/thumbnails (character art is coming later and will be too big to depend on).

## Assets to copy

From `C:\Users\joseo\OneDrive\Documents\assets\indigolay-mega\PixelAdventureBookUI_PNG_v1.1\UI\` into a new `public/assets/menu/save-load/` folder (kebab-renamed, per house convention):

| Source | Destination | Purpose |
|---|---|---|
| `Lists/UI_ListItem2_Normal.png` (468×170) | `indigolay-scroll-normal.png` | filled-slot card body |
| `Lists/UI_ListItem2_Hover.png` | `indigolay-scroll-hover.png` | hover + keyboard-selected (gold outline) |
| `Lists/UI_ListItem2_Dim.png` | `indigolay-scroll-dim.png` | empty / disabled slots (grey parchment) |
| `Panels/UI_SloaPane_bg.png` (127×42) | `indigolay-slot-plaque.png` | "Slot N" / "Autosave" label plaque |

Already in repo and reused: `/assets/icons/indigolay/icon-autosave.png` (plaque icon for the autosave slot), `/assets/icons/indigolay/Icon_trash.png` (delete button, unchanged).

**Preload**: add the four new paths to the asset list in `src/services/assets-service.ts` (near line 125, where `icon-autosave.png` already sits).

## Files to modify

### 1. `src/styles/save-load.css` (bulk of the work)

**Card chrome** — replace the flat dark background/border of `.save-slot-card` with the 9-sliced scroll, following the established border-image pattern from `pause-menu-skills.css:366` and `indigolay-bar.css`:

- `border: transparent` + `border-image: url(.../indigolay-scroll-normal.png) <slice> fill / <width> stretch`. Start around `slice: 56 64 56 64`, displayed border-width ≈ half the slice px (art is ~2× scale); tune visually so the rolled ends stay crisp and the parchment middle stretches.
- Hover and `--selected` swap `border-image-source` to `indigolay-scroll-hover.png` (gold outline). `border-image-source` doesn't interpolate — drop the `transition: all` in favor of an instant swap (correct for pixel art). The Toffec corner brackets stay as-is for keyboard/pointer selection parity.
- `--empty` and `--disabled` use `indigolay-scroll-dim.png`; disabled keeps the dim source on hover and keeps `opacity`/`cursor` handling.
- Padding: content must clear the rolled ends — roughly `0.45rem 1.1rem` inside the border-image border; verify against the smaller breakpoint.

**Text flips dark-on-parchment** (currently light-on-dark):

- `__label`: moves onto the plaque (see below), cream `#f2e6d0`.
- `__timestamp`: strong dark brown `#33200f` (the color the skills parchment panel already uses).
- `__member-level`, `__meta`, `__stat`: mid browns (`#4a3117` / `#6b4a2a`).
- `__location`: warm accent brown, readable on parchment (e.g. `#7a4a1e`).
- `__playtime`: muted sepia `#7d6748` (replaces the bluish `#9fb0cc`, which won't read on parchment).
- `__empty-text`: grey-brown italic `#8a7a66` on the dim scroll.

**Slot plaque** — new `.save-slot-card__plaque`: the brown label tab from the preview, positioned at the card's top-left, slightly overlapping the scroll's top edge (absolute position + negative top offset on the wrapper's padding, or negative margin on the header). Background = `indigolay-slot-plaque.png` (background-size or a small 9-slice if the "Autosave" label needs extra width). Autosave's plaque additionally shows `icon-autosave.png` (~12px) before the label — this replaces the current cool-blue border as the autosave differentiator (border colors can't be recolored on scroll art).

**Details divider** — `__side`'s solid `border-left` becomes a subtle dotted brown rule (`1px dotted rgba(90, 58, 30, 0.4)`), echoing the pack's `UI_Image_DotLine`; same for the `border-top` in the ≤640px breakpoint.

**List container** — `.save-load-menu__list` dark-wood panel stays (the scrolls pop against it); bump row `gap` to ~0.65rem so scroll silhouettes don't touch, and re-check the mobile breakpoint paddings.

### 2. `src/components/save-load/save-slot-card.tsx` (small)

- Replace the plain `__label` span in `__header` with the plaque element: `<span className="save-slot-card__plaque pixel-font">`, containing an `<img>` of `icon-autosave.png` (aria-hidden) when `slotId === 'autosave'`, then the `SAVE_SLOT_LABELS[slotId]` text.
- No structural changes otherwise — party icons, meta row, side column, delete button all keep their markup; `SaveLoadMenu` is untouched.

### 3. Plan doc (user request)

After approval, write this plan to **`docs/SAVE_LOAD_REDESIGN_PLAN.md`** in the repo before starting implementation.

## Verification

- Per project rules I don't run the dev server; the user runs `npm run dev`. If a dev server is already up, use the Playwright MCP tools to screenshot the title-screen Load modal and the in-game pause menu Save/Load tabs.
- States to eyeball in both Save and Load modes: filled slot (normal), hover, keyboard-selected (gold scroll + Toffec brackets), empty slot in save mode ("— Empty — Save here" on dim scroll), disabled empty slot in load mode, autosave plaque with icon, delete-button hit area, and the ≤640px stacked layout.
- `npm run lint` for the tsx change; no unit tests apply (pure styling).
