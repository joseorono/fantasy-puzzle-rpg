# Skill Menu UI — the pause-menu Skills tab

> The player-facing home of the skill system: a new **Skills** tab in the pause menu, styled after
> IndigoLay's own skill-book preview — framed icon slots, a parchment detail panel, equip and
> unlock flows — built almost entirely from components and conventions the codebase already has.

**Status: implemented** — tab in `src/components/pause-menu/tabs/pause-menu-skills.tsx`, pieces in `src/components/pause-menu/skills/`, styles in `src/styles/pause-menu-skills.css`. Companion docs: [`SKILL_SYSTEM.md`](./SKILL_SYSTEM.md) (architecture),
[`SKILL_ROSTER.md`](./SKILL_ROSTER.md) (the 32 skills and their icons).

Design intent: **eye candy through the pack's own chrome, restraint everywhere else.** The
IndigoLay skill-icon art is the star; the UI around it uses the pack's slot frames and panel art
plus our existing warm-parchment components. No new badge art, no drapes (deferred), no grade
medals (rejected).

---

## 1. Visual reference & palette

The look is IndigoLay's `Preview/1Preview_SkillBook.png` (in the source pack): a grid of framed
skill icons beside a detail page — name, description, stat rows in a parchment text panel, and an
**Equip** button. We adapt that composition into the pause menu's existing chrome rather than
rendering a literal open book — the menu already provides the wood-and-parchment frame, sidebar,
and party bar.

Palette (all already in use in `pause-menu.css`):

| Role | Value |
| :--- | :--- |
| Accent / frame gold | `#d4a574`, hover-bright `#f2d2af` |
| Borders | `color(srgb 0.83 0.65 0.46 / 0.6)` |
| Panel background | `linear-gradient(to bottom, #1a1008, #0a0604)` |
| Body text | `#e0e0e0`, names `#FFF8DC` |
| Selected glow | `box-shadow: 0 0 12px rgba(212, 165, 116, 0.7)` (roster-card active glow) |

**`#ffd700` is a metal accent, not a text colour.** It is allowed on the dark gilded plates —
the stat strip's highlight value, the gilded divider, the ledger hairline, the mastery pips, the
Mastered seal — where it reads as struck metal against the board texture. It stays banned as body
or heading text, and banned outright on the parchment itself, which uses the `#d4a574` family.
The existing `.pause-menu-content h2` rule uses it as text; that is grandfathered, not a precedent
— headings here are bitmap-font images anyway (`NarikRedwoodBitFont`), so no gold text color is
needed at all.

---

## 2. Assets to copy from the pack

Source: `<OneDrive>/Documents/assets/indigolay-mega/PixelSkillIconsBookUI_PNG_v1.0/UI Elements/`.
Destination: **`public/assets/skills/ui/`**, kebab-renamed **keeping the load-bearing `indigolay-`
prefix** — `src/styles/utilities.css` opts `img[src*='indigolay-']` out of the global
`image-rendering: pixelated`, and anything painted as a `background-image` instead of an `<img>`
must add the `.indigolay-art` class itself (the `IndigolayBar` precedent).

| Source file | Copy to | Used for |
| :--- | :--- | :--- |
| `UI_Slot_Normal.png` | `indigolay-slot-normal.png` | slot frame, resting state |
| `UI_Slot_hover.png` | `indigolay-slot-hover.png` | slot frame, hover/focus |
| `UI_Slot_Selected.png` | `indigolay-slot-selected.png` | slot frame, selected |
| `UI_SkillSlot_Deco.png` | `indigolay-skill-slot-deco.png` | gold eight-point frame behind the detail panel's featured icon |
| `UI_SkillPanel_TextArea.png` | `indigolay-skill-panel-text-area.png` | detail panel background |
| `UI_Icon_equip.png` | `indigolay-icon-equip.png` | "equipped" corner marker on the active slot |

**Excluded:** `UI_Image_Drape_Blue/Red` (deferred by request — revisit for the unlock celebration
later), `Bonus/UI_GradeIcon_*` medals and `UI_badge_Star*` (rejected as tier markers), class
emblems `Bonus/UI_Icon_{WR,MG,AC,PR}` (optional future idea only — `CHARACTER_ICONS` +
`CHARACTER_COLORS` already cover class identity).

The six new images join the asset-service preload list the same way `SKILL_ICON_SHEET_IMAGES`
does (`src/constants/skill-icons.ts` → spread into `assetList`). They are small; preloading all
six is fine.

---

## 3. Tab wiring — three edits

1. `src/stores/pause-menu-atoms.ts` — `'skills'` into `PAUSE_MENU_TABS`, after `'equip'`:
   `['items', 'equip', 'skills', 'stats', 'options', 'save', 'load']`.
2. `src/components/pause-menu/pause-menu-sidebar.tsx` — `TABS` entry
   `{ id: 'skills', label: 'Skills', icon: 'openBook' }` (`FrostyRpgIcon`; `openBook` is unused by
   the other tabs and reads "skill book").
3. `src/components/pause-menu/pause-menu-content.tsx` — render case for
   `<PauseMenuSkills />` plus a `pause-menu-content--skills` modifier on the content div, using the
   same inner-scroll mode as `--items`/`--equip` (`display:flex; flex-direction:column;
   min-height:0; overflow:hidden`).

Keyboard note: the sidebar cycles tabs on window-level Up/Down. Any arrow navigation inside the
tab must `stopPropagation()` — the exact pattern `skill-selector.tsx` already documents.

---

## 4. Layout

Mirrors the Stats tab's roster-plus-main split, then stacks the two slot rows above a detail panel
(the approved wireframe):

```
<h2><NarikRedwoodBitFont text="SKILLS" size={1.2} /></h2>     ← tab convention
.pause-menu-skills-layout        flex, gap 1rem, flex:1, min-height:0
├─ .pause-menu-party-roster      REUSE: PartyMemberCard variant="roster" ×4 (Stats-tab pattern,
│                                 local useState selectedId)
└─ .pause-menu-skills-main       flex column, min-width:0, overflow-y:auto + .pixel-scrollbar
     ├─ PauseMenuCharacterHeader REUSE (name | class | Lv; CHARACTER_ICONS/CHARACTER_COLORS)
     ├─ ACTIVE section           label + <IndigolayDivider /> · 4 SkillSlots
     ├─ PASSIVE section          label + <IndigolayDivider /> · 4 SkillSlots
     └─ .skill-detail            detail panel for the selected slot (§6)
```

```
┌─ Roster ─┬────────────────────────────────────┐
│ Warrior  │  ⚔ Warrior · warrior · Lv 7        │
│ Rogue    │  ACTIVE ─────────────◆──────────── │
│ Mage     │   [★■]──[■]──[□Lv14]──[□Lv21]      │
│ Healer   │  PASSIVE ────────────◆──────────── │
│          │   [■]──[□Lv10]──[□Lv17]──[□Lv24]   │
│          │  ┌─ skill-detail ────────────────┐ │
│          │  │ ◈ WHIRLWIND                   │ │
│          │  │ Hits every enemy at a slower  │ │
│          │  │ charge.                       │ │
│          │  │ ◆ All enemies · Dmg ×2        │ │
│          │  │ ◆ Charge ×1.4                 │ │
│          │  │              [ EQUIP ]        │ │
│          │  └───────────────────────────────┘ │
└──────────┴────────────────────────────────────┘
```

Content width beside the roster is ~460 px (900 max menu − 160 sidebar − 230 roster − padding);
four 56–64 px slots per row plus connectors fit comfortably. Slot icons render from the 64 px
sheet (`sheetSize={64}`), the detail panel's featured icon from the default 102.

---

## 5. The SkillSlot

New component `src/components/pause-menu/skills/skill-slot.tsx`, BEM block `.skill-slot`. One `<button>`
with stacked layers, exactly the crossfade technique `IndigolaySkillIcon` itself uses:

```
<button class="skill-slot [locked|equipped] [active]">
  <img class="skill-slot__frame skill-slot__frame--normal"   src=".../indigolay-slot-normal.png">
  <img class="skill-slot__frame skill-slot__frame--hover"    src=".../indigolay-slot-hover.png">
  <img class="skill-slot__frame skill-slot__frame--selected" src=".../indigolay-slot-selected.png">
  <SkillIcon class={class} position={icon} disabled={locked} size={~44} sheetSize={64} />
  {equipped && <img class="skill-slot__equipped-mark" src=".../indigolay-icon-equip.png">}
  {locked   && <LevelTag level={unlockLevel} />}        ← positioned bottom-center
</button>
```

- Frame layers crossfade on `opacity` (`--normal` 1 → `--hover` on `:hover/:focus-visible` →
  `--selected` when the slot is the detail panel's subject). `background-position` never animates.
- `SkillIcon` is the thin class→sheet dispatch wrapper from `SKILL_SYSTEM.md` §4.1
  (`src/components/skill-sprite-icons/skill-icon.tsx`). Its `disabled` prop *is* the locked
  visual — the sheets ship a greyed twin of every icon, zero extra art.
- Wrapped in `ToffecBeigeCornersWrapper` for the house hover-corner cursor, like every other
  interactive pause-menu element.
- `aria-pressed` for the equipped active; `aria-disabled` while `isInBattle`.

### Tier treatment — no medals, no stars

1. **Position is the tier.** Slots read left→right in tier order, joined by thin engraved
   connector notches (pure CSS: a 2 px rule in the border tone
   `color(srgb 0.83 0.65 0.46 / 0.6)` with a 1 px dark underline — the "carved into the wood"
   look, matching `pause-menu` borders).
2. **Locked slots show the gate, not the ordinal**: the existing `LevelTag` component
   (`/assets/indicators/indigolay/level-tag-red.png`) overlaid bottom-center with the required
   level. The *level requirement* is what the player actually needs to know.
3. **The detail panel says the rest in text**: "Tier II Passive · requires Lv 10" (§6).

---

## 6. The detail panel

New component `src/components/pause-menu/skill-detail-panel.tsx`, BEM block `.skill-detail`,
background `indigolay-skill-panel-text-area.png` (as `border-image` slices or a stretched `<img>`
layer — whichever survives resizing better; remember `.indigolay-art` if it's a background).

Content, top to bottom:

- **Featured icon**: `indigolay-skill-slot-deco.png` (the approved gold eight-point frame) with a
  102-sheet `SkillIcon` centered on it.
- **Name**: `NarikWoodBitFont` (the overlay/confirm font — distinguishes it from the tab's
  Redwood heading). Kind + tier + gate line in small text: `Tier II Passive · requires Lv 10`.
- **Description** from the definition.
- **Stat rows**, `◆`-bulleted via the `.indigolay-list` classes (`src/styles/lists.css` — and this
  is the moment to add the trivial `<IndigolayList>` wrapper component that CSS has been waiting
  for): actives show `TARGET_LABELS[target]`, `Dmg ×n` / `Heal ×n`, `Charge ×n`; passives show
  each modifier in player language ("Guard bleeds 12% slower"), reusing the phrasing from
  `SKILL_ROSTER.md`'s tables.
- **Action row**:
  - Active, unlocked → `ToffecButton variant="tan" size="xs"` **Equip** →
    `partyActions.selectSkillForCharacter(character.id, skill.id)` (exists). Equipped → disabled
    **Equipped** + the corner mark on its slot.
  - Passive, locked → **the cost, rendered explicitly**: a row of `CostBadge`s (relocate
    `src/components/town/cost-badge.tsx` → `src/components/ui-custom/cost-badge.tsx`; its current
    home is the town trainer, which is being deleted) followed by an **Unlock** button gated on
    `character.level >= unlockLevel && canAfford(resources, cost) && previous tier unlocked`.
    When blocked, the button says *why*: `Requires Lv 17` / `Not enough resources` / `Unlock
    Tier I first` — never a bare grey button.
  - Passive, unlocked → no button; the stat list simply renders lit.
  - `isInBattle` → every action disabled plus the `SkillSelector` precedent line, "Locked during
    battle".

**Unlock confirm**: compose `ConfirmPanel` directly (the `SalvageConfirmDialog` precedent — richer
`children` than `useConfirm` allows): featured icon, cost badges, the modifier list, and
`variant="default"` with confirm label **Unlock**. On confirm: `reduceResources(cost)` → a new
`useUnlockPassive` hook mirroring `src/hooks/use-unlock-skill.ts` (validate → party action →
`showOverlay` → `SoundNames.shimmeringSuccess`).

---

## 7. CSS — one new file

**`src/styles/pause-menu-skills.css`**, `@import`ed in `src/index.css` immediately after the
`pause-menu` import (and long before `reduced-motion`, which must stay last; no `!important`, so
its overrides keep winning).

Conventions, following the file it sits next to:

- Layout classes flat: `.pause-menu-skills-layout`, `.pause-menu-skills-main`,
  `.pause-menu-skills-section`, `.pause-menu-skills-row`.
- Component blocks BEM: `.skill-slot`, `.skill-slot__frame--{normal,hover,selected}`,
  `.skill-slot__equipped-mark`, `.skill-detail`, `.skill-detail__icon`, `.skill-detail__stats`,
  `.skill-detail__actions`, `.skill-detail__gate-note`.
- State as separate classes: `.locked`, `.equipped`, `.active` (matches `.pause-menu-item-row
  .selected`, `.party-member-card .dead`).
- Juice budget (subtle, house-style): hover lift `translateY(-1px)` + frame crossfade ~120 ms;
  selected slot gets the roster-card glow; a just-unlocked slot may reuse the existing sparkle
  layer via the overlay rather than any new CSS animation.

---

## 8. Flows, sound, and feedback

| Event | Behaviour |
| :--- | :--- |
| Select roster character | local `useState`, `SoundNames.clickChangeTab`, detail resets to that character's equipped active |
| Select slot | local `useState`, `clickChangeTab` |
| Equip active | `selectSkillForCharacter`, `mechanicalClick` |
| Unlock passive | ConfirmPanel → `clickCoin` on spend → overlay + `shimmeringSuccess` |
| Keyboard | Left/Right within a row, Up/Down between Active row / Passive row / detail; `stopPropagation` throughout |

**Celebration**: extend the existing `skill-unlock` overlay to render the real `SkillIcon` on the
deco frame instead of today's generic class icon, and add a `passive-unlock` kind to
`OverlayRequest` per the extension recipe documented in `overlay-host.tsx`. No drapes for now.

**Retired by this tab**: `src/components/pause-menu/skill-selector.tsx` (and its call site in
`pause-menu-equip.tsx`) — the Equip tab goes back to being purely gear.

---

## 9. Implementation phases (revised ordering)

Supersedes the ordering in `SKILL_SYSTEM.md` §10 — UI lands before the battle engine, which is
safe because passive modifiers are purely additive:

- **A. Data**: `src/constants/skills/` split with all 32 definitions + `packIcon` + tiers
  (`SKILL_ROSTER.md` §4); `SkillIcon` wrapper; per-skill icons appearing in the existing surfaces
  (`party-display.tsx`, `pause-menu-stats.tsx`, `skill-unlock-overlay.tsx`).
- **B. This tab**: assets copied (§2), tab wired (§3), `SkillSlot` + detail panel + unlock flow
  (§5–§6), CSS (§7). Passives are visible and purchasable but inert in battle.
- **C. Engine**: `resolvePartyPassives` + `BattleState.passives` + the nine hookups
  (`SKILL_SYSTEM.md` §6–§7) with their unit tests.
- **D. Cleanup**: delete the town trainer (`SKILL_SYSTEM.md` §9), retire `SkillSelector`, extend
  `skill-debug.tsx` into an icon contact sheet.

---

## 10. Open questions

1. `use-pause-menu.ts` `open()` always resets to the Items tab — worth remembering the last tab
   once there are seven?
2. Should the passive detail show a before/after preview (the `derived-stats-display.tsx`
   pattern from the level-up screen) instead of static modifier text?
3. Class emblems (`Bonus/UI_Icon_{WR,MG,AC,PR}`) on the roster cards or header — nice-to-have,
   currently excluded.
4. The slot-frame PNGs' native size is unknown until copied — if they're much larger than 64 px,
   decide between downscaling (they're `image-rendering:auto` art, so it's safe) or generating a
   resized set the way `build-skill-icon-spritesheets.py` does for icons.
