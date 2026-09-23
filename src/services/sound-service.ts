/* this is carl's domain */
import { betweenZeroAndOne, getRandomlyVariedValue } from '~/lib/math';
import { SoundNames } from '~/constants/audio';
import { soundFiles } from '~/constants/audio';
import { AUDIO_DEFAULTS, AUDIO_STORAGE_KEYS } from '~/constants/storage-keys';
import { readPersistedValue, writePersistedValue } from '~/lib/storage';
import { mutedSchema, volumePercentSchema, type AudioSettings } from '~/types/audio-types';

/** Most overlapping copies of one SFX alias; the oldest is stolen beyond this. */
const MAX_SFX_VOICES_PER_ALIAS = 4;
/** Same-alias SFX triggered closer than this are dropped instead of phase-stacking into one loud blast. */
const SFX_RETRIGGER_GAP_MS = 25;
/** Fade applied when a voice is stolen, stopped or muted, so it never cuts off with a click. */
const DECLICK_MS = 15;
/** Time constant for slider-driven gain changes (setTargetAtTime). */
const GAIN_SMOOTHING_S = 0.03;
/** Low-pass cutoff used by `setMusicMuffled`. */
const MUFFLED_MUSIC_CUTOFF_HZ = 700;
/** Lowpass Q is in dB in Web Audio; -3.01 dB is a flat Butterworth response. */
const FLAT_LOWPASS_Q_DB = -3.01;

/**
 * Master bus compressor. These are the Web Audio defaults, which is exactly what `@pixi/sound`
 * ran every sound through — keeping them preserves the mix the game was balanced against.
 */
const MASTER_COMPRESSOR = { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 } as const;

interface MusicPlayOptions {
  fadeIn?: boolean;
  /** Duration of fade-in in milliseconds. Defaults to 1000. */
  fadeInDurationMs?: number;
}

interface MusicStopOptions {
  /** Fade the track out over this many milliseconds before stopping. Defaults to a click-free cut. */
  fadeOutMs?: number;
}

interface SfxPlayOptions {
  /** Stereo position from -1 (left) to 1 (right). */
  pan?: number;
}

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  /** `performance.now()` at start; unlike `ctx.currentTime` it keeps moving while the context is suspended. */
  startedAt: number;
}

interface AudioGraph {
  ctx: AudioContext;
  masterGain: GainNode;
  musicBus: GainNode;
  musicDuck: GainNode;
  musicFilter: BiquadFilterNode;
}

class SoundService {
  private static instance: SoundService;

  public audioLoaded: boolean = false;
  public isPreloading: boolean = false;
  public globalVolume: number = 1; //between 0 and 1;
  public musicVolume: number = 1; //between 0 and 1;
  public sfxVolume: number = 1; //between 0 and 1;

  private graph: AudioGraph | null = null;
  private muted = false;
  private isPausedByBlur = false;
  private buffers = new Map<SoundNames, AudioBuffer>();
  private bufferPromises = new Map<SoundNames, Promise<AudioBuffer>>();
  private sfxVoices = new Map<SoundNames, Voice[]>();
  private activeMusic = new Map<SoundNames, Voice>();
  /** Incremented per alias by start/stop so a start still waiting on its buffer can tell it was cancelled. */
  private musicRequestIds = new Map<SoundNames, number>();
  private preloadPromise: Promise<boolean> | null = null;

  constructor() {
    if (!SoundService.instance) {
      console.log('created new instance of sound service');
      this.globalVolume = 1;
      this.musicVolume = 1;
      this.sfxVolume = 1;
      this.audioLoaded = false;
      this.isPreloading = false;
      this.initVolumeFromStorage();
      SoundService.instance = this;
    }
    return SoundService.instance;
  }

  /** The underlying Web Audio context, created on first access. */
  get audioContext(): AudioContext {
    return this.getGraph().ctx;
  }

  /**
   * Reads persisted audio settings from localStorage (written by Jotai atomWithStorage)
   * and applies them so the SoundService starts with the user's saved preferences.
   */
  private initVolumeFromStorage() {
    const settings: AudioSettings = {
      masterVolume: readPersistedValue(
        AUDIO_STORAGE_KEYS.masterVolume,
        volumePercentSchema,
        AUDIO_DEFAULTS.masterVolume,
      ),
      musicVolume: readPersistedValue(AUDIO_STORAGE_KEYS.musicVolume, volumePercentSchema, AUDIO_DEFAULTS.musicVolume),
      sfxVolume: readPersistedValue(AUDIO_STORAGE_KEYS.sfxVolume, volumePercentSchema, AUDIO_DEFAULTS.sfxVolume),
      muted: readPersistedValue(AUDIO_STORAGE_KEYS.muted, mutedSchema, AUDIO_DEFAULTS.muted),
    };

    this.globalVolume = betweenZeroAndOne(settings.masterVolume / 100, 'master');
    this.musicVolume = betweenZeroAndOne(settings.musicVolume / 100, 'music');
    this.sfxVolume = betweenZeroAndOne(settings.sfxVolume / 100, 'sfx');
    this.setMuted(settings.muted);
  }

  /**
   * Builds the audio graph on first use, so importing the service never touches Web Audio:
   * voices → masterGain, music → musicBus → musicDuck → musicFilter → masterGain,
   * masterGain → compressor → destination.
   */
  private getGraph(): AudioGraph {
    if (this.graph) return this.graph;

    const ctx = new AudioContext();
    const compressor = new DynamicsCompressorNode(ctx, MASTER_COMPRESSOR);
    const masterGain = new GainNode(ctx, { gain: this.muted ? 0 : this.globalVolume });
    const musicBus = new GainNode(ctx, { gain: this.musicVolume });
    const musicDuck = new GainNode(ctx, { gain: 1 });
    const musicFilter = new BiquadFilterNode(ctx, {
      type: 'lowpass',
      frequency: ctx.sampleRate / 2,
      Q: FLAT_LOWPASS_Q_DB,
    });

    musicBus.connect(musicDuck).connect(musicFilter).connect(masterGain);
    masterGain.connect(compressor).connect(ctx.destination);

    this.graph = { ctx, masterGain, musicBus, musicDuck, musicFilter };
    this.installContextLifecycle(ctx);
    return this.graph;
  }

  /**
   * Unlocks the context on the first user gesture (autoplay policy, iOS) and suspends it while
   * the window is blurred, restoring on focus — the same auto-pause `@pixi/sound` provided.
   */
  private installContextLifecycle(ctx: AudioContext) {
    const unlockEvents = ['pointerdown', 'touchend', 'keydown'] as const;
    const unlock = () => {
      if (this.isPausedByBlur) return;
      void ctx.resume().then(() => {
        if (ctx.state !== 'running') return;
        for (const eventName of unlockEvents) document.removeEventListener(eventName, unlock, true);
      });
    };
    for (const eventName of unlockEvents) document.addEventListener(eventName, unlock, true);

    window.addEventListener('blur', () => {
      this.isPausedByBlur = true;
      void ctx.suspend();
    });
    window.addEventListener('focus', () => {
      this.isPausedByBlur = false;
      void ctx.resume();
    });
  }

  /** Smoothly moves an AudioParam to `value`, avoiding the zipper noise of an instant jump. */
  private rampParam(param: AudioParam, value: number, timeConstantS: number = GAIN_SMOOTHING_S) {
    const now = this.getGraph().ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.setTargetAtTime(value, now, timeConstantS);
  }

  /** Fades a voice to silence over `fadeMs` and stops it. */
  private releaseVoice(voice: Voice, fadeMs: number = DECLICK_MS) {
    const now = this.getGraph().ctx.currentTime;
    const endTime = now + Math.max(fadeMs, DECLICK_MS) / 1000;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, endTime);
    try {
      voice.source.stop(endTime);
    } catch {
      // Already stopped.
    }
  }

  /** Fetches and decodes one alias. Concurrent callers share the same in-flight promise. */
  private loadBuffer(alias: SoundNames): Promise<AudioBuffer> {
    const existing = this.bufferPromises.get(alias);
    if (existing) return existing;

    const promise = fetch(soundFiles[alias])
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} loading ${soundFiles[alias]}`);
        return response.arrayBuffer();
      })
      .then((data) => this.getGraph().ctx.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(alias, buffer);
        return buffer;
      })
      .catch((error: unknown) => {
        this.bufferPromises.delete(alias);
        throw error instanceof Error ? error : new Error(String(error));
      });

    this.bufferPromises.set(alias, promise);
    return promise;
  }

  shouldPreload(): boolean {
    return !this.audioLoaded && !this.isPreloading;
  }

  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Fetches and decodes every entry in `soundFiles`. Re-entrant: resolves immediately once loaded
   * and shares the in-flight promise while loading. Rejects with the first failure after every
   * file has settled, so one bad file does not leave the rest half-loaded.
   */
  preloadAudios(): Promise<boolean> {
    if (this.audioLoaded) return Promise.resolve(true);
    if (this.preloadPromise) return this.preloadPromise;

    this.isPreloading = true;
    const aliases = Object.keys(soundFiles) as SoundNames[];

    this.preloadPromise = Promise.allSettled(aliases.map((alias) => this.loadBuffer(alias))).then((results) => {
      this.isPreloading = false;
      const failure = results.find((result) => result.status === 'rejected');
      if (failure) {
        console.error('error loading sound ==> ', failure.reason);
        this.preloadPromise = null;
        throw failure.reason;
      }
      this.audioLoaded = true;
      console.log('sound service loaded successfully');
      return true;
    });

    return this.preloadPromise;
  }

  /** Resumes a context suspended by the browser's autoplay policy, without overriding the blur auto-pause. */
  private ensureContextRunning() {
    const { ctx } = this.getGraph();
    if (!this.isPausedByBlur && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  /**
   * Plays a one-shot SFX. Dropped if its buffer has not decoded yet (a click arriving seconds late
   * reads as a bug), or if the same alias fired within `SFX_RETRIGGER_GAP_MS`.
   */
  playSound(
    alias: SoundNames,
    volume: number = 1,
    volVariance: number = 0,
    spdVariance: number = 0,
    options?: SfxPlayOptions,
  ) {
    volume = betweenZeroAndOne(volume, 'volume');
    volVariance = betweenZeroAndOne(volVariance, 'volVariance');
    spdVariance = betweenZeroAndOne(spdVariance, 'spdVariance');

    const buffer = this.buffers.get(alias);
    if (!buffer) return;

    const { ctx, masterGain } = this.getGraph();
    this.ensureContextRunning();

    const now = performance.now();
    const voices = this.sfxVoices.get(alias) ?? [];
    const newestVoice = voices.at(-1);
    if (newestVoice && now - newestVoice.startedAt < SFX_RETRIGGER_GAP_MS) return;
    if (voices.length >= MAX_SFX_VOICES_PER_ALIAS) {
      const oldestVoice = voices.shift();
      if (oldestVoice) this.releaseVoice(oldestVoice);
    }

    const source = new AudioBufferSourceNode(ctx, {
      buffer,
      playbackRate: getRandomlyVariedValue(1, spdVariance),
    });
    const gain = new GainNode(ctx, { gain: getRandomlyVariedValue(volume * this.sfxVolume, volVariance) });

    if (options?.pan) {
      const panner = new StereoPannerNode(ctx, { pan: Math.max(-1, Math.min(1, options.pan)) });
      source.connect(gain).connect(panner).connect(masterGain);
    } else {
      source.connect(gain).connect(masterGain);
    }

    const voice: Voice = { source, gain, startedAt: now };
    voices.push(voice);
    this.sfxVoices.set(alias, voices);
    source.onended = () => {
      const current = this.sfxVoices.get(alias);
      if (!current) return;
      const index = current.indexOf(voice);
      if (index !== -1) current.splice(index, 1);
    };
    source.start();
  }

  async asyncPlaySound(alias: SoundNames, volume: number = 1, volVariance: number = 0, spdVariance: number = 0) {
    this.playSound(alias, volume, volVariance, spdVariance);
  }

  /**
   * Starts a looping music track. Waits for the buffer if it is still decoding; a `stopMusic` issued
   * meanwhile cancels the start. Restarting an alias that is already playing replaces it.
   */
  startMusic(alias: SoundNames, volume: number = 1, options?: MusicPlayOptions) {
    volume = betweenZeroAndOne(volume, 'volume');

    const fadeIn = options?.fadeIn ?? false;
    const fadeInDurationMs = options?.fadeInDurationMs ?? 1000;
    const requestId = this.bumpMusicRequest(alias);

    const begin = (buffer: AudioBuffer) => {
      if (this.musicRequestIds.get(alias) !== requestId) return;

      const { ctx, musicBus } = this.getGraph();
      this.ensureContextRunning();

      const previous = this.activeMusic.get(alias);
      if (previous) this.releaseVoice(previous);

      const source = new AudioBufferSourceNode(ctx, { buffer, loop: true });
      const gain = new GainNode(ctx, { gain: fadeIn ? 0 : volume });
      if (fadeIn) gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + fadeInDurationMs / 1000);

      source.connect(gain).connect(musicBus);
      const voice: Voice = { source, gain, startedAt: performance.now() };
      this.activeMusic.set(alias, voice);
      source.onended = () => {
        if (this.activeMusic.get(alias) === voice) this.activeMusic.delete(alias);
      };
      source.start();
    };

    const buffer = this.buffers.get(alias);
    if (buffer) {
      begin(buffer);
      return;
    }
    this.loadBuffer(alias)
      .then(begin)
      .catch((error: unknown) => console.error('error loading music ==> ', error));
  }

  private bumpMusicRequest(alias: SoundNames): number {
    const requestId = (this.musicRequestIds.get(alias) ?? 0) + 1;
    this.musicRequestIds.set(alias, requestId);
    return requestId;
  }

  /** Stops a music track, optionally fading it out. Also cancels a start still waiting on its buffer. */
  stopMusic(alias: SoundNames, options?: MusicStopOptions) {
    this.bumpMusicRequest(alias);
    const voice = this.activeMusic.get(alias);
    if (!voice) return;
    this.activeMusic.delete(alias);
    this.releaseVoice(voice, options?.fadeOutMs);
  }

  /** Fades `from` out while `to` fades in over the same duration. */
  crossfadeMusic(from: SoundNames, to: SoundNames, volume: number = 1, durationMs: number = 1000) {
    this.stopMusic(from, { fadeOutMs: durationMs });
    this.startMusic(to, volume, { fadeIn: true, fadeInDurationMs: durationMs });
  }

  /**
   * Dips the music bus under a stinger (level-up, save chime). `amount` is how much to remove:
   * 0.5 halves the music level. Pair with `unduckMusic`.
   */
  duckMusic(amount: number = 0.5, attackMs: number = 120) {
    amount = betweenZeroAndOne(amount, 'amount');
    this.rampParam(this.getGraph().musicDuck.gain, 1 - amount, attackMs / 1000 / 3);
  }

  /** Restores the music level after `duckMusic`. */
  unduckMusic(releaseMs: number = 400) {
    this.rampParam(this.getGraph().musicDuck.gain, 1, releaseMs / 1000 / 3);
  }

  /** Sweeps a low-pass over the music for a muffled, "behind a wall" feel (pause menu, dialogue). */
  setMusicMuffled(isMuffled: boolean, transitionMs: number = 250) {
    const { ctx, musicFilter } = this.getGraph();
    const target = isMuffled ? MUFFLED_MUSIC_CUTOFF_HZ : ctx.sampleRate / 2;
    this.rampParam(musicFilter.frequency, target, transitionMs / 1000 / 3);
  }

  setGlobalVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    this.globalVolume = volume;
    if (this.graph && !this.muted) this.rampParam(this.graph.masterGain.gain, volume);
  }

  setMusicVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    this.musicVolume = volume;
    if (this.graph) this.rampParam(this.graph.musicBus.gain, volume);
  }

  setSfxVolume(volume: number) {
    volume = betweenZeroAndOne(volume, 'volume');
    this.sfxVolume = volume;
  }

  muteAll() {
    this.setMuted(true);
  }

  unmuteAll() {
    this.setMuted(false);
  }

  /** Applies the mute state to the master bus and persists it so it survives a reload. */
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.graph) this.rampParam(this.graph.masterGain.gain, muted ? 0 : this.globalVolume, DECLICK_MS / 1000 / 3);

    writePersistedValue(AUDIO_STORAGE_KEYS.muted, muted);
  }
}

export const soundService = new SoundService();
