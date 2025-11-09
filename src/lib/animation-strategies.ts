/**
 * Animation strategy system for global animations.
 * Supports different implementation approaches:
 * - Overlay: Apply class to fixed overlay div
 * - GameScreen: Apply class to #game-screen element
 */

export type AnimationStrategy = 'overlay' | 'game-screen';

export interface AnimationConfig {
  duration: number;
  strategy: AnimationStrategy;
  className: string;
}

export type GlobalAnimationType = 'screen-shake' | 'fade-in-and-out';

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
};

/**
 * Apply animation class to the appropriate element based on strategy
 */
export function applyAnimation(
  type: GlobalAnimationType,
  overlayRef: HTMLDivElement | null
): void {
  const config = ANIMATION_CONFIG[type];

  if (config.strategy === 'overlay') {
    if (overlayRef) {
      overlayRef.classList.add(config.className);
    }
  } else if (config.strategy === 'game-screen') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.add(config.className);
    }
  }
}

/**
 * Remove animation class from the appropriate element
 */
export function removeAnimation(
  type: GlobalAnimationType,
  overlayRef: HTMLDivElement | null
): void {
  const config = ANIMATION_CONFIG[type];

  if (config.strategy === 'overlay') {
    if (overlayRef) {
      overlayRef.classList.remove(config.className);
    }
  } else if (config.strategy === 'game-screen') {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.classList.remove(config.className);
    }
  }
}

/**
 * Get animation duration for a given type
 */
export function getAnimationDuration(type: GlobalAnimationType): number {
  return ANIMATION_CONFIG[type].duration;
}
