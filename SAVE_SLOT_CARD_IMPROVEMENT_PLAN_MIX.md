# Save Slot Card Improvement — Plan Comparison (AGY vs CLAUDE) + Proposed Mix

Compares `SAVE_SLOT_CARD_IMPROVEMENT_PLAN_AGY.md` and `SAVE_SLOT_CARD_IMPROVEMENT_PLAN_CLAUDE.md`, then proposes a merged direction.

## 1. Core philosophy

| | AGY | CLAUDE |
|---|---|---|
| **Base look** | Keep the dark leather cards; enrich them with CSS gradients, gold trim, and more icon chrome | Replace the card chrome entirely with the pack's parchment **scroll art** (`UI_ListItem2_*`, 9-sliced via `border-image`) — the design Indigolay itself uses in its Save/Load preview |
| **Text palette** | Stays light-on-dark (current colors, slightly enriched) | Flips to dark-brown-on-parchment (`#33200f` family, matching the skills parchment panel) |
| **Assets needed** | 3 small icons only (`Icon_clock-fill`, `Icon_history`, `Icon_plus`) | 4 chrome images (scroll normal/hover/dim + slot plaque), plus preload registration in `assets-service.ts` |
| **Risk / effort** | Low — pure CSS, no art integration risk | Medium — border-image slice tuning, full color flip, but follows the proven pattern from `pause-menu-skills.css` and `indigolay-bar.css` |
| **Visual payoff** | Incremental — "same card, busier" is a real risk | A distinct leap; the menu matches the pack's own Save/Load screen |

## 2. Element-by-element

| Element | AGY | CLAUDE |
|---|---|---|
| **Slot label** | Gold ribbon badge with bookmark/star icon; blue ribbon for autosave | `UI_SloaPane_bg` brown plaque overlapping the scroll's top edge (the pack's own "① Slot" tab) |
| **Autosave distinction** | Full cool slate-blue card gradient + cyan accent stripe + blue badge | Same parchment scroll for all; autosave differentiated only by `icon-autosave.png` in its plaque (scroll art can't be recolored per-slot) |
| **Party members** | Dark inset "capsules" per member (bg + 1px border) with gold `LvX` text | Keeps current bare icon + `LvX`, just recolored dark-on-parchment |
| **Timestamp / playtime** | Adds `Icon_clock-fill` and `Icon_history` icons before each value | Text only, recolored (playtime loses the bluish `#9fb0cc` that wouldn't read on parchment) |
| **Empty slot** | Dashed gold border + `Icon_plus` + inviting prompt | Grey **dim scroll** variant (`UI_ListItem2_Dim`) — the pack's own empty-slot treatment — with italic text |
| **Hover / selected** | CSS glow (gold; azure for autosave) + Toffec brackets | Swap to the **gold-outlined hover scroll** variant + Toffec brackets (instant swap; `border-image-source` doesn't interpolate) |
| **Delete button** | Framed mini square button, red hover | Unchanged trash icon |
| **Main/side divider** | Not addressed | Solid rule becomes dotted brown (echoes `UI_Image_DotLine`) |

## 3. Assessment

- **AGY's strengths**: nice micro-detail ideas — clock/history icons give the sidebar structure, `Icon_plus` makes empty save slots inviting, the framed delete button and member capsules add polish. All cheap to adopt.
- **AGY's weaknesses**: the card itself stays a CSS-gradient rectangle, so the result risks looking like "the same card with more icons" rather than *Indigolay-esque*. The full blue autosave card pulls against the warm parchment palette.
- **CLAUDE's strengths**: uses the pack's actual Save/Load design language (scroll rows, plaque, gold-outline active state, dim empty state), so the result is unmistakably Indigolay; reuses the project's established 9-slice `border-image` pattern; handles preloading.
- **CLAUDE's weaknesses**: lighter on micro-detail — sidebar stays text-only, empty state is plainer, delete button untouched; autosave differentiation (plaque icon only) is subtler than AGY's.

## 4. Proposed mix

Use **CLAUDE as the base** (scroll-art chrome, dark-on-parchment text, plaque labels, dim-scroll empty state, hover-scroll active state, preload registration), and fold in AGY's compatible detail work:

1. **Sidebar icons** (AGY §3E): copy `Icon_clock-fill.png` and `Icon_history.png` into `public/assets/icons/indigolay/` and prefix the timestamp and playtime rows, tinted/dark enough to sit on parchment.
2. **Empty save slots** (AGY §2.7): on the dim scroll, show `Icon_plus.png` + "Empty — Save here" instead of bare italic text (load mode keeps plain "— Empty —").
3. **Delete button** (AGY §3E): give the trash icon a small framed square treatment with a red hover state.
4. **Autosave** (compromise): CLAUDE's plaque-icon approach as the primary marker, plus a *subtle* cool tint on the autosave plaque only — not AGY's full blue card, which fights the parchment.
5. **Member capsules** (AGY §3C): **skip**. Dark inset capsules were designed for dark cards; on parchment they'd read as holes. Recolored icon + `LvX` (CLAUDE) is enough.

Net asset list for the mix: 4 chrome images + 3 icons, all from `PixelAdventureBookUI_PNG_v1.1`, all preloaded in `assets-service.ts`.
