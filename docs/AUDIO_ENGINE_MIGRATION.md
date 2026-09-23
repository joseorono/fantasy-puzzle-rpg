# Audio Engine Migration — `@pixi/sound` → native Web Audio

## Context

`docs/REMAINING_WORK.md` › *Bundle size* found that PixiJS is ~278 KB of the 822 KB gzipped JS, even though nothing renders with Pixi. The only import is `import { sound } from '@pixi/sound'` in `src/services/sound-service.ts`. It suggested Howler as the fix. The user asked for a careful look at that idea: pros and cons, limitations, and new features. The rules are: change only `sound-service.ts`, add no unmaintained dependencies, and never make the game sound or feel worse. `src/constants/audio.ts` must not change.

**Status:** implemented in `src/services/sound-service.ts` (2026-09-22). Tier 1 features ship with it; Tier 2 methods exist but no call site uses them yet.

---

## 1. Why `@pixi/sound` is so heavy (verified in `node_modules`)

- `@pixi/sound@6.0.1` imports `EventEmitter`, `Ticker`, `path`, `DOMAdapter`, `CanvasSource`, `extensions`, `ExtensionType` and `LoaderParserPriority` from the **`pixi.js` barrel**. It uses only these few helpers.
- `pixi.js/package.json` marks `./lib/index.*`, `rendering/init`, `app/init`, `filters/init`, text, graphics, mesh, the compressed textures and ~20 more `init` modules as **`sideEffects`**. Once anything is imported from the barrel, Rollup must keep every one of them. Tree-shaking can't help.
- `index.mjs` also registers `browserExt` and `webworkerExt`. These lazily import `browserAll` and `webworkerAll`, which are the two extra output chunks (143 KB + 26 KB gzipped).
- `soundAsset.mjs` registers a Pixi `Assets` loader parser. We never use it, but it pulls in the Assets system.
- **Runtime cost as well as download cost:** each playing `WebAudioInstance` / `HTMLAudioInstance` adds itself to `Ticker.shared` (a `requestAnimationFrame` loop) to send progress events. Looping music keeps a Pixi rAF callback running the whole time it plays, next to our React frame work.
- `pixi.js` isn't in our `package.json`. npm installed it automatically as a peer dependency, so uninstalling `@pixi/sound` removes both.

## 2. Maintenance check (npm + GitHub, 2026-09-22)

| Option | Last npm release | Repo activity | Verdict |
|---|---|---|---|
| `@pixi/sound` (current) | 6.0.1 — **Jul 2024** | last commit Jul 2024 | Stale. Pinned to a `pixi.js` v8 peer we don't use |
| `howler` | 2.2.4 — **Sep 2023** | 3 commits since 2023, 418 open issues. The README advertises v3 but it isn't on npm and has no branch | **Fails the "actively maintained" rule** |
| `tone` | 15.1.22 — Sep 2026 | active | Built for synthesis and scheduling. ~20 KB+ gzipped plus a transport model we don't need |
| `standardized-audio-context` | Aug 2024 | slowing | Polyfill. We don't need it, since every target browser has standard Web Audio |
| **Native Web Audio API** | — (the browser vendors maintain it) | — | **Recommended** |

### Howler: pros, cons and limits
- **Pros:** ~10 KB gzipped, a well-known API, sprites, an HTML5-audio fallback, and it unlocks mobile autoplay for you.
- **Cons:** unmaintained for 3 years. It's plain JS with community `@types`. Its fades use `setInterval` volume steps on HTML5 audio, which is the same kind of zipper-prone fade we already have. It has a global-singleton `Howler` object, and it has no audio buses: music/SFX separation still means tracking volume per instance, as we do now. Its HTML5 fallback only matters for browsers we don't target.
- **Conclusion:** Howler solves the bundle size but adds a dead dependency and doesn't improve how the game sounds.

## 3. Recommendation: native Web Audio inside `SoundService`, with no dependency

About 250 lines in `sound-service.ts` replace ~280 KB gzipped plus two chunks. Every browser the game targets supports `AudioContext`, `decodeAudioData` (promise form), `GainNode`, `AudioParam` automation and `DynamicsCompressorNode`. Audio decoding stays the same: Pixi already used `decodeAudioData` under the hood, so format support (for example `.ogg` on older Safari) doesn't change.

### Audio graph
```
sfx:   source → voiceGain (→ StereoPanner) ───────────────────────┐
music: source → trackGain → musicBus → musicDuck → musicFilter ─┴→ masterGain → compressor → destination
```

### Public API is unchanged (100+ call sites untouched)
`preloadAudios`, `shouldPreload`, `playSound`, `asyncPlaySound`, `startMusic(alias, volume, { fadeIn, fadeInDurationMs })`, `stopMusic`, `setGlobalVolume`, `setMusicVolume`, `setSfxVolume`, `muteAll`, `unmuteAll`, `setMuted`, `isMuted`, and the `audioLoaded` / `isPreloading` / `*Volume` fields. The `SoundNames` enum and `soundFiles` map are used as they are.
`static soundApi` (Pixi's object, used nowhere else) is replaced by a read-only `audioContext` getter. The graph and `AudioContext` are created lazily on first use, so importing the service (e.g. from tests) never touches Web Audio.

### Keeping the current behaviour
| Current (pixi) | New (native) |
|---|---|
| `sound.add(..., {preload, loaded})` counts callbacks | `Promise.allSettled(fetch → arrayBuffer → decodeAudioData)` into `Map<SoundNames, AudioBuffer>`. Re-entrant `preloadPromise` and first-error reject kept |
| `play({volume, speed})` | `AudioBufferSourceNode` + `playbackRate` + per-voice `GainNode` → `masterGain`. `sfxVolume` is still baked into the voice gain before variance, so `getRandomlyVariedValue` gives identical numbers |
| music `loop: true` | `source.loop = true` (gapless, sample-accurate) |
| fade-in via 50 ms `setInterval` | `gain.setValueAtTime(0) → linearRampToValueAtTime(target, t + ms/1000)` |
| `setMusicVolume` walks the instances | sets `musicBus.gain` (smoothed with `setTargetAtTime`). `baseVolume` stays on each track's own gain |
| `context.volume` / `volumeAll` | `masterGain.gain` |
| `muteAll` / `unmuteAll`, `context.muted` | a `muted` flag that ramps `masterGain` to 0 or back over ~30 ms (no click) |
| `ensureContextRunning` (autoplay) | same guard, also recovering iOS's `interrupted` state (calls, Siri). Plus a capture-phase `touchend`/`click`/`pointerdown`/`keydown` unlock that plays a 1-sample silent buffer inside the gesture (as pixi and Howler do) and removes itself once the context runs |
| pixi ignores blur until unlocked | same: an early blur can't block the first-tap unlock |
| `play()` on a not-yet-decoded sound queues it | **music** waits for its buffer (a `stopMusic` meanwhile cancels it — pixi would start the track after the stop); **SFX** are dropped, since a click arriving seconds late reads as a bug |
| pixi master `DynamicsCompressor` (Web Audio defaults: −24 dB threshold, 30 knee, 12:1) | **kept with the same settings** (`MASTER_COMPRESSOR`), so the mix the game was balanced against is unchanged |
| pixi blur auto-pause | `visibilitychange`/`blur` → `ctx.suspend()`, focus → `resume()`, unless the game muted it on purpose |

### Latent bugs this also fixes
- The fade `setInterval` is never cleared by `stopMusic`. Also, a `setMusicVolume` during a fade gets overwritten by the next interval tick.
- `startMusic` on an alias that is already playing layers a second copy. The new code stops the old voice first.
- Volume sliders change instance volume in hard steps. Smoothed bus gain removes clicks while dragging.
- The Pixi `Ticker` rAF callbacks per playing sound go away.

## 4. New `SoundService` features (quality and feel, all opt-in, no call-site changes needed)

Tier 1 ships with the migration because it improves the current mix with no API change. Tiers 2 and 3 are **new optional methods**. Adopting them at call sites is later work (outside the one-file scope).

**Tier 1 (in the migration)**
- **Master compressor kept, not replaced.** Research turned up that pixi already ran everything through a default-settings `DynamicsCompressorNode`, so the game has always been compressed. Swapping in a transparent limiter would change the feel, so `MASTER_COMPRESSOR` keeps pixi's defaults. It's a tunable constant if we ever want to rebalance.
- **Voice cap per alias:** `MAX_SFX_VOICES_PER_ALIAS = 4`. When over the cap, the oldest copy is stolen with a 15 ms de-click fade. A **minimum retrigger gap** (`SFX_RETRIGGER_GAP_MS = 25`) keeps same-alias triggers in one tick from phase-stacking into one loud blast. Both are tunable constants at the top of `sound-service.ts` (`audio.ts` stays untouched).
- Sample-accurate fades, gapless loops, click-free mute and volume changes (see §3).

**Tier 2 (new methods, small)**
- `stopMusic(alias, { fadeOutMs })` as an optional second argument, plus `crossfadeMusic(from, to, ms)` for scene changes (town ↔ battle ↔ boss).
- `duckMusic(amount, ms)` / `unduckMusic(ms)` to dip the music under stingers such as `levelUp`, `saveChime` and `gameOver`.
- `setMusicMuffled(boolean)` puts a `BiquadFilterNode` low-pass on `musicBus`, for the "pause menu / dialogue" underwater feel.
- `playSound(alias, volume, volVariance, spdVariance, { pan })` uses a `StereoPannerNode` for board-position or party/enemy side panning.
- All four are implemented. No call site uses them yet.

**Tier 3 (possible later)**
- Music loop points (`loopStart`/`loopEnd`) for intro-plus-loop tracks.
- Lazy per-scene decode (item 4.1 in `REMAINING_WORK.md`), using the same buffer map.
- Reverb send (`ConvolverNode`) for dungeon or cave scenes.

## 5. Risks and limits

- **No HTML5 `<audio>` fallback.** Pixi and Howler keep one for browsers without Web Audio, but every browser we target has Web Audio.
- Decoding all 27 files into PCM uses the same memory as Pixi does today (Pixi also decoded to AudioBuffers). Nothing is lost here.
- iOS Safari's hardware mute switch silences Web Audio. Changed: the service sets `navigator.audioSession.type = 'playback'` (Safari-only, feature-checked) before creating the context, so game audio plays with the switch on. Trade-off accepted: it's an exclusive session, so it pauses the player's own music or podcast while the game plays.
- A hand-rolled engine means we maintain it ourselves. This is limited because the code uses only standard, stable Web Audio APIs.

## 6. Files touched

- `src/services/sound-service.ts`: full rewrite of the internals, public API preserved. JSDoc on new and changed methods.
- `package.json` / `package-lock.json`: `npm uninstall @pixi/sound` (this also drops the auto-installed `pixi.js`).
- New `docs/AUDIO_ENGINE_MIGRATION.md`: this analysis.
- Doc-only lines: `CLAUDE.md` / `README.md` "Audio: @pixi/sound" → "Web Audio API (native)", and tick the Bundle-size items in `docs/REMAINING_WORK.md`. Edit these by hand (no prettier on docs).
- **Not touched:** `src/constants/audio.ts` and every call site.

## 7. Verification checklist

1. `npm run build`: expect no `webworkerAll-*` / `browserAll-*` chunks, and a main chunk ~250 KB gzipped smaller. Confirm with `npm run visualize-bundle:json`.
2. The `src/views/sound-test.tsx` debug view: every SFX alias, speed/volume variance, music start/stop, fade-in, all three sliders while music plays (no clicks), mute toggle plus reload (the setting persists).
3. Gameplay: a large match cascade and bombs (no clipping, no machine-gun stacking), battle music (`battle-screen.tsx`) loops with no gap, start-menu music in and out (`start-menu-modal.tsx`), tab away and back (pauses and resumes), and a cold load without a click (the context unlocks on the first input).
4. Browsers: Chrome, Firefox, Safari (desktop and iOS if possible).
5. `npm run lint`, then `npm run test-cli` (no audio tests exist; this checks nothing else broke).
