// Types and constants for the Global Animations system
import { SoundNames } from '~/constants/audio';

export type GlobalAnimationType =
  | 'screen-shake'
  | 'fade-in-and-out'
  | 'view-transition-circle'
  | 'stairs-ascent'
  | 'town-arrival'
  | 'battle-swirl'
  | 'battle-flash-wipe'
  | 'battle-blinds'
  | 'battle-zoom-shake';
export type AnimationStrategy = 'overlay' | 'game-screen';

/** Duration of the battle hitstop freeze-frame at the moment a hit lands. */
export const HITSTOP_DURATION_MS = 80;

export interface AnimationSound {
  name: SoundNames;
  /** SFX gain, 0–1, multiplied by the user's SFX volume. */
  volume: number;
}

export interface AnimationConfig {
  /** Must match the CSS animation duration: callers are resolved on this timer, not on `animationend`. */
  duration: number;
  strategy: AnimationStrategy;
  className: string;
  /** Optional one-shot played the moment the animation is triggered (also under reduced motion). */
  sound?: AnimationSound;
}

/**
 * Configuration for global animations
 * In order to add a new animation, add it to this object and update
 * the global-animations.css file, and the types. Pair a `sound` if the
 * flourish has one; it plays even when reduced motion skips the visuals.
 *
 * "Cover" animations (`stairs-ascent`, `town-arrival`, every `battle-*`) end on a fully
 * opaque overlay so a route change can land under them — see `useViewTransitions`.
 * @type {Record<GlobalAnimationType, AnimationConfig>}
 */
export const ANIMATION_CONFIG: Record<GlobalAnimationType, AnimationConfig> = {
  'screen-shake': {
    duration: 350,
    strategy: 'game-screen',
    className: 'anim-screen-shake',
  },
  'fade-in-and-out': {
    duration: 600,
    strategy: 'overlay',
    className: 'anim-fade-in-and-out',
  },
  'view-transition-circle': {
    duration: 1600,
    strategy: 'overlay',
    className: 'anim-view-transition-circle',
  },
  'stairs-ascent': {
    duration: 2800,
    strategy: 'game-screen',
    className: 'anim-stairs-ascent',
    sound: { name: SoundNames.runningUpStairs, volume: 0.7 },
  },
  'town-arrival': {
    duration: 1100,
    strategy: 'game-screen',
    className: 'anim-town-arrival',
  },
  'battle-swirl': {
    duration: 1200,
    strategy: 'overlay',
    className: 'anim-battle-swirl',
  },
  'battle-flash-wipe': {
    duration: 1000,
    strategy: 'overlay',
    className: 'anim-battle-flash-wipe',
  },
  'battle-blinds': {
    duration: 900,
    strategy: 'overlay',
    className: 'anim-battle-blinds',
  },
  'battle-zoom-shake': {
    duration: 900,
    strategy: 'game-screen',
    className: 'anim-battle-zoom-shake',
  },
};

/** Played when walking into a town from the map. */
export const TOWN_ENTRY_ANIMATION: GlobalAnimationType = 'town-arrival';

/** Pool for entering combat: one is drawn per encounter, never the same one twice in a row. */
export const BATTLE_TRANSITION_ANIMATIONS: readonly GlobalAnimationType[] = [
  'battle-swirl',
  'battle-flash-wipe',
  'battle-blinds',
  'battle-zoom-shake',
];
