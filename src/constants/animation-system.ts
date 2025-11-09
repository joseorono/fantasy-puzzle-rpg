// Types and constants for the Global Animations system

export type GlobalAnimationType = 'screen-shake' | 'fade-in-and-out' | 'view-transition-circle';
export type AnimationStrategy = 'overlay' | 'game-screen';

export interface AnimationConfig {
  duration: number;
  strategy: AnimationStrategy;
  className: string;
}

/**
 * Configuration for global animations
 * In order to add a new animation, add it to this object and update
 * the global-animations.css file, and the types.
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
    duration: 800,
    strategy: 'overlay',
    className: 'anim-view-transition-circle',
  },
};
