# Save/Load Slot Card Aesthetic & UI Improvement Plan

## 1. Overview & Objectives

The goal of this task is to overhaul the look and feel of `save-slot-card__content` and its child elements within `save-load-menu__list`. The redesigned slot cards will adopt a rich, authentic **Indigolay pixel-RPG aesthetic** matching the rest of the game's UI (equipment lists, battle screens, skill panels).

Key requirements:
- **Indigolay Visual Language**: Introduce dark leather/parchment card backgrounds, warm gold/bronze trim, and crisp pixel art metadata indicators.
- **Autosave Slot Differentiation**: Give the **Autosave** slot a distinct cool slate/cyan/blue system theme with the official Indigolay autosave icon to distinguish it from player manual slots.
- **Character Portrait Independence**: Ensure the card design looks balanced, structured, and visually compelling without depending on full character portraits (using class icons and level capsules instead).
- **Dual View Support**: Work seamlessly across both **Save** and **Load** menu states, including empty slot placeholders.

---

## 2. Current Implementation Analysis

### File Structure & Dependencies
- [save-slot-card.tsx](file:///C:/Github/fantasy-puzzle-rpg/src/components/save-load/save-slot-card.tsx) — Component rendering slot card markup and logic.
- [save-load-menu.tsx](file:///C:/Github/fantasy-puzzle-rpg/src/components/save-load/save-load-menu.tsx) — Slot list container handling keyboard navigation, save/load triggers, and deletion confirmation.
- [save-load.css](file:///C:/Github/fantasy-puzzle-rpg/src/styles/save-load.css) — CSS rules for `.save-load-menu__list` and `.save-slot-card`.

### Identified Areas for Improvement
1. **Header & Labels**: Currently uses unstyled text (`save-slot-card__label`). Needs Indigolay header ribbons/badges with slot type icons.
2. **Party Display**: Bare class icons with plain `LvX` text. Needs structured party member "chips" or mini-frames.
3. **Metadata & Resources**: Plain inline text for coins, gold, and location. Needs Indigolay resource icon integration and location tags.
4. **Timestamp & Playtime**: Plain text aligned right. Needs system icons (`Icon_clock-fill.png`, `Icon_history.png` / calendar) and clear tabular layout.
5. **Delete Action**: Simple unbordered trash icon button. Needs Indigolay button frame treatment.
6. **Autosave Card**: Only changes border color slightly. Needs a distinct slate/cyan background fill and badge treatment.
7. **Empty Slot State**: Basic text with dashed border. Needs a styled parchment container with an inviting "+ Empty Slot" design.

---

## 3. Design Specification & Aesthetic Breakdown

### A. Card Background & Outer Frame
- **Manual Slot Base**: Gradient `linear-gradient(180deg, rgba(32, 21, 14, 0.92) 0%, rgba(20, 13, 9, 0.95) 100%)` with a subtle 1px inner gold border (`#d4a574` at 25% opacity) and a 3px left gold accent stripe (`#d4a574`).
- **Autosave Slot Base**: Slate-blue gradient `linear-gradient(180deg, rgba(22, 34, 48, 0.92) 0%, rgba(14, 22, 32, 0.95) 100%)` with a 3px left cyan/silver accent stripe (`#5b84b1`).
- **Selected / Focused State**: Warm gold glow for manual slots; bright azure glow for autosave slot, integrated with `ToffecBeigeCornersWrapper`.
- **Empty Slot State**: Subdued dark frame with dashed gold border (`rgba(212, 165, 116, 0.3)`), subtle inset shadow, and hover highlight.

### B. Header & Slot Badge Component
- **Manual Slot Header**: Gold/bronze ribbon badge displaying an icon (`/assets/icons/indigolay/Icon_bookmark-fill.png` or `icon-badge_Star.png`) + text (`SLOT 1`, `SLOT 2`, `SLOT 3`).
- **Autosave Header**: System blue ribbon badge displaying `/assets/icons/indigolay/icon-autosave.png` + text (`AUTOSAVE`).

### C. Party Member Level Capsules
- Each party member render within a compact capsule:
  - Dark inset background (`rgba(0, 0, 0, 0.4)`).
  - 1px border (`rgba(212, 165, 116, 0.3)`).
  - Class icon with class-specific color fill.
  - Level tag formatted in `pixel-font` with gold text color (`#e2c499`).

### D. Location & Resource Metadata Bar
- **Location Tag**: Highlighted location header (`summary.mapName`) with warm parchment color (`#f2d2af`) and location icon accent.
- **Resource Counters**: Coins and Gold displayed with `FrostyRpgIcon` and clean numeric badges.

### E. Sidebar (Timestamp, Playtime & Actions)
- **Timestamp Row**: `/assets/icons/indigolay/Icon_clock-fill.png` (or calendar) + formatted timestamp in `#a08a6a`.
- **Playtime Row**: `/assets/icons/indigolay/Icon_history.png` + formatted playtime in `#9fb0cc`.
- **Delete Button**: Styled mini square button using Indigolay trash icon, with red hover state (`#e55353`).

---

## 4. Required Assets

The following Indigolay icons will be copied from `C:\Users\joseo\OneDrive\Documents\assets\indigolay-mega\PixelAdventureBookUI_PNG_v1.1\Icons\System\` into `public/assets/icons/indigolay/`:
- `Icon_clock-fill.png` (for timestamp display)
- `Icon_history.png` (for playtime readout)
- `Icon_plus.png` (for empty slot visual cue)

Existing assets in `public/assets/icons/indigolay/`:
- `icon-autosave.png`
- `Icon_bookmark-fill.png`
- `Icon_trash.png`

---

## 5. Implementation Steps

1. **Asset Copying**:
   - Copy `Icon_clock-fill.png`, `Icon_history.png`, and `Icon_plus.png` into `public/assets/icons/indigolay/`.

2. **Component Refactoring ([save-slot-card.tsx](file:///C:/Github/fantasy-puzzle-rpg/src/components/save-load/save-slot-card.tsx))**:
   - Update JSX structure to include:
     - Header badge container with slot icon (`icon-autosave.png` or `Icon_bookmark-fill.png`).
     - Party member capsules with icon + level tag.
     - Location & resource section.
     - Sidebar timestamp & playtime section with icons.
     - Refactored delete button.
     - Refactored empty slot layout with `Icon_plus.png` and descriptive prompt.

3. **Styling Update ([save-load.css](file:///C:/Github/fantasy-puzzle-rpg/src/styles/save-load.css))**:
   - Add card background gradients, borders, and shadows.
   - Style `.save-slot-card__badge` (manual vs autosave).
   - Style `.save-slot-card__member-capsule`.
   - Style `.save-slot-card__meta-item` and `.save-slot-card__location-tag`.
   - Style `.save-slot-card__side-info` (icons + text alignment).
   - Add hover, focus, and selection animation transitions.
   - Maintain mobile responsiveness for smaller viewports.

---

## 6. Verification & Verification Steps

- **Visual Inspection**: Confirm both Save and Load views display the upgraded card layout correctly.
- **Autosave Distinction**: Check that the Autosave slot features the blue slate background gradient, blue badge, and autosave icon.
- **Keyboard Navigation**: Verify keyboard cursor highlighting works smoothly with `ToffecBeigeCornersWrapper`.
- **Empty & Active States**: Verify empty slots render neatly with the dashed border and plus icon, and filled slots show accurate party/time metadata.
- **Action Triggers**: Ensure save overwrite, load, and delete confirmations operate as expected.
