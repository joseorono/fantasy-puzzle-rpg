# Remaining Work Checklist

Audit of open work as of 2026-09-13, based on the many planning docs already in the repo plus a pass over the actual code (TODO/FIXME grep, view stubs, wiring checks). Excludes "add more maps/levels/content" — that's out of scope by design.

## Combat depth (biggest gap)

- [ ] **Board hazards** — enemy-applied stone/cursed orbs.
- [ ] **Boss phases** with real mechanic changes mid-fight.
- [ ] **Active block/defend** input (distinct from the passive Guard meter already shipped).
- [ ] **Momentum / "fever" meter.**
- [ ] **Charms/accessory slot** with on-match procs.
- [ ] **Enemy archetypes with real mechanics** — shielded/armored/splitter/summoner types.
- [ ] **Wave/endless "Horde" mode.**
- [ ] **Telegraphed mid-battle wind-ups** — only the always-on stagger mechanic shipped; the actual charge-up/interrupt variant isn't built.
- [ ] **Batched dungeon end-of-run rewards** — currently every fight interrupts with a full rewards screen instead of accumulating into one end-of-run tally; dungeon loot tables also only drop resources/coins, never gear.
- [ ] **Board "hint" affordance** — `findPossibleMove()` already exists in `src/lib/match-3.ts` but has zero UI consumers, so surfacing it is a cheap follow-up.

## Progression & economy

- [ ] **Deeper loot tables** — most tables still lean on coins/resources; equipable/consumable drop pools are thin outside chests.
- [ ] **Animated treasure-chest reveal.**
- [ ] **Gambling minigame** at the tavern.

## Map/story systems

- [ ] **Wire up the `emotion` field on dialogue lines** — it's defined in data but never actually swaps portraits.
- [ ] **Tutorial/onboarding encounter** — the game currently drops the player at title/debug with no guided first battle.

## UI/UX & accessibility

- [x] ~~Implement the real Inventory view~~ — misnomer, there will never be a standalone Inventory view; inventory management lives in the pause menu (`pause-menu-items.tsx`). Removed the vestigial `'inventory'` route entirely: the `game-screen.tsx` placeholder, `goToInventory()` (router action, slice, and `lib/routing.ts` function), `InventoryViewData`/`ViewDataMap['inventory']`, and the stale references in `CLAUDE.md`, `docs/ROUTING.md`, `docs/ROUTING_QUICK_REFERENCE.md`. The dev-only `inventory-test.tsx` debug page was kept — it exercises the inventory slice directly and isn't tied to the deleted route.

## Electron packaging

Scaffolding exists but the integration is incomplete despite `ELECTRON_IMPLEMENTATION_SUMMARY.md` calling phases 1–3 done:

- [ ] **Activate `src/utils/electron-ipc.ts`** — it's entirely commented out, so the save/load bridge to the Electron filesystem was never turned on. The game always uses localStorage, Electron or not.
- [ ] Wire `PauseMenuSave`/`PauseMenuLoad` to `electronIPC`.
- [ ] Dev/build/package testing pass for the Electron build.
- [ ] Code signing.
- [ ] Auto-update.
- [ ] Directory-listing IPC handler.
- [ ] System tray.
- [x] `isElectron()` detection is already wired correctly (disables the `beforeunload` warning under Electron).

## Battle performance

Phases 1–2 of `BATTLE_PERFORMANCE_PLAN.md` are done and measured. Per `PERFORMANCE_NEXT_STEPS.md`, still open:

- [ ] **3.1 Hitstop full-screen recalc** — scope `.hitstop-freeze` rules from `#game-screen`/`*` down to `.battleContainer`. Designed, zero visual risk, just not applied yet.
- [ ] **3.6** Background painted 3× (`.partySection`/`.enemySection`/`#boardSection::before`).
- [ ] **3.8** Overly broad `image-rendering` selector.
- [ ] **3.10** Forced-reflow click ripple in `mouse-tracker.tsx`.
- [ ] **Phase 5 "Performance mode" toggle** — designed, not implemented.
- [ ] **4.5 Image optimization** — tooling exists (`scripts/optimize-images.mjs`) but hasn't been run against actual assets. Low priority.
- [x] Note: 3.3, 3.4, 3.5, 3.9 (bar-width→transform, skill-glow blur, filter/box-shadow crossfades, particle-burst caps) are explicitly **ruled out** in `PERFORMANCE_NEXT_STEPS.md` — real but below the noise floor, don't revisit these.
- [x] Note: 4.1 (lazy-load music per scene) is deliberately deferred, not a bug.

## Bundle size

Measured 2026-09-14 with `npm run visualize-bundle:json` (`vite-bundle-visualizer`). Production JS is
3415 KB rendered / 822 KB gzipped across three chunks, and the build warns on the 1220 KB main chunk.

- [ ] **PixiJS is 34% of the JS payload and nothing renders with it.** `pixi.js` contributes 915 KB
  rendered / 250 KB gzipped (279 modules); with its satellites (`earcut`, `ismobilejs`, `eventemitter3`)
  it is 278 KB of the 822 KB gzipped total. The only Pixi import in `src/` is
  `import { sound } from '@pixi/sound'` in `src/services/sound-service.ts` — `@pixi/sound` declares
  `pixi.js` as a **peerDependency**, so the whole WebGL/WebGPU engine ships to play audio.
- [ ] Two of the three output chunks exist only because of Pixi: `webworkerAll-*.js` (143 KB gzipped) is
  97% Pixi and `browserAll-*.js` (26 KB gzipped) is 100% Pixi. Both would likely disappear with the
  audio backend swapped.
- [ ] **Candidate fix:** replace `@pixi/sound` with Howler (~10 KB gzipped) or plain Web Audio. The blast
  radius is one file — `SoundService` is a singleton wrapper with a small surface (`preloadAudios`,
  `playSound`, `startMusic`/`stopMusic`, volume and mute setters) — but it needs real playback testing
  across music looping, fade-in, per-instance music volume, and the mute/autoplay-unlock paths.
- [ ] Not yet checked: how much of the bundled Pixi is reachable at runtime versus dead weight Rollup
  could not shake. The numbers above are bytes emitted, not bytes executed.
- [ ] Main-chunk code splitting is untouched — no `manualChunks`, no dynamic `import()` for views. Worth
  revisiting only after the Pixi question is settled, since it dominates everything else.
- [x] `npm run visualize-bundle` fixed: it chained three full builds with `&` (a sequential separator
  under `cmd.exe`, not a background operator) that all wrote to the same default temp file and clobbered
  each other. Now one build per template with explicit `-o` paths, plus `:sunburst`, `:network` and
  `:json` variants; output is gitignored.
- [x] Repo disk footprint is measurable with `npm run size` (`scripts/measure-repo-size.mjs`): 45.4 MB of
  source and assets excluding `node_modules`, of which `public/` is 39.5 MB (86.9%) and PNGs alone are
  27.2 MB. Image optimization (4.5 above) is where the *download* win is, separate from the JS payload.

## Audio correctness bugs (separate from performance)

- [x] `preloadAudios()` in `sound-service.ts` never settles its promise on a second call — hangs any `Promise.all` awaiting it. Fixed: re-entrant calls now share the in-flight promise. Root cause of a second, worse bug found while verifying: pixi's `loaded` callback fires **once per file**, so `audioLoaded` flipped true after the first decode — now counts completions before resolving.
- [x] `sound.resumeAll()` is called unguarded on every SFX playback. Replaced with a guard that only resumes an autoplay-suspended context and respects pixi's blur auto-pause.
- [x] Original `.wav` audio files (~81 MB) are still on disk even though the `.ogg` conversion tooling has already shipped — deleted `combatMusic.wav`, `epic-cinematic.wav`, `boss-fight.wav`, `fight-music-loop.wav` (`src/constants/audio.ts` already points to their `.ogg` replacements). The remaining 13 SFX `.wav` files are now converted too: 3.66 MB became 0.40 MB of Ogg Vorbis and the originals are deleted. `public/assets/audio/` holds no `.wav` at all; the whole folder is 7.89 MB.

## Audio content gaps (`docs/SOUNDS_TODO.md`)

- [ ] Per-class combat SFX: Rogue melee/flurry/ranged, Warrior medium/heavy melee, Mage fireball tiers, Healer heal tiers, crit sound.
- [ ] Ally-death voicelines.
- [ ] Generic enemy-death sounds.
- [ ] Victory fanfare.
- [ ] Map "bad tile" buzz and battle-start sound.
- [ ] Chest-open sound(s).
- [ ] Level-up bar-fill sound.
- [ ] Dedicated Inn ambience track (only Blacksmith and Item Store currently have location-specific ambience).

## Testing / tech debt

- [x] No other meaningful TODO/FIXME/XXX markers remain in `src/` — the inventory view above is the only real one.
- [ ] **Flaky test: `match-3.test.ts` property test times out under full-suite load.**
  `hasMatchAtPosition > agrees with greedy membership for every cell of a settled board after any swap`
  (`src/lib/match-3.test.ts:276`) exceeds the default 5000 ms `testTimeout`. Measured 2026-09-14:
  **fails in 2 of 3 full `vitest --run` passes** (868/869; the failing run clocked 5231 ms), but passes
  **3 for 3 in isolation at ~1970 ms**. So it is load-dependent, not a bad assertion — the test only has
  ~2.5× headroom over the budget and loses it to worker contention. Fix is a longer per-test
  `testTimeout` or fewer `PROPERTY_SAMPLES`, not a logic change.

## Housekeeping — stale planning docs worth deleting or archiving

These describe work that's already shipped; keeping them around as if they're live TODOs is misleading:

- [x] `docs/fixes-todo.md` — deleted (its one open item, board-generation deadlock detection, is done, implemented in `src/lib/board-generation.ts`).
- [x] `TRAINING_GROUNDS_PLAN.md`, `TRAINING_GROUNDS_PHASE2.md` — deleted (both phases shipped).
- [x] `docs/ideas-proposals/TRAINING_GROUNDS.md`, `SKILL_SYSTEM.md`, `SKILL_ROSTER.md`, `SKILL_MENU_UI.md`, `ENEMY_STAGGER.md`, `docs/GUARD_METER_PLAN.md` — deleted (all self-marked "implemented" and verified in code).
- [x] `docs/ideas-proposals/dungeons/*.md` — deleted, directory removed (dungeon system is fully implemented).
- [x] `docs/ideas-proposals/progression.md`, `stats-and-leveling.md`, `loot-system.md`, `town-system.md`, `level-up-screen.md` — deleted (pre-implementation brainstorms; everything described now exists).
- [x] `BOARD_PLAYABILITY_PLAN.md`, `BOARD_SCAN_AND_RENDER_PLAN.md` — deleted (fully implemented, no open items).
- [x] `SAVE_SLOT_CARD_IMPROVEMENT_PLAN_AGY.md`, `_CLAUDE.md`, `_MIX.md` — deleted (the MIX version shipped; verified in `save-load.css`/`save-slot-card.tsx`).
- [x] `docs/MENU_UI_PROMPT.md` — deleted (pre-implementation prompt; the real pause menu is built).
- [x] `current-prompt.md` — deleted (one-off instruction for the bitmap font component, already implemented as `narik-redwood.tsx`).