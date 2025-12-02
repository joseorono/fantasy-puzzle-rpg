/**
 * Generic Interaction Sound System
 * Provides a unified interface for playing generic interaction sounds
 * Used for non-specific player actions like button presses, door opens, object pickups
 */

import { soundService } from './sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Interaction sound configuration
 * Maps intensity levels to existing sounds with tunable parameters
 */
export const INTERACTION_SOUND_CONFIG = {
  // Default generic interaction
  default: {
    sound: SoundNames.mechanicalClick, // Clear, neutral mechanical click
    volume: 0.5,
    volumeVariance: 0.1,
    speedVariance: 0.05,
  },

  // Soft interaction (subtle, non-intrusive)
  soft: {
    sound: SoundNames.beep, // Soft beep for subtle feedback
    volume: 0.3,
    volumeVariance: 0.1,
    speedVariance: 0.05,
  },

  // Loud interaction (noticeable, significant)
  loud: {
    sound: SoundNames.uncork, // Distinctive uncork sound
    volume: 0.7,
    volumeVariance: 0.1,
    speedVariance: 0.05,
  },

  // Quick interaction (fast, snappy)
  quick: {
    sound: SoundNames.clickCoin, // Quick, snappy coin click
    volume: 0.5,
    volumeVariance: 0.15,
    speedVariance: 0.15,
  },
};

export type InteractionIntensity = keyof typeof INTERACTION_SOUND_CONFIG;

/**
 * Generic interaction sound system
 * Provides simple, reusable sound feedback for common player actions
 */
class InteractionSoundSystem {
  /**
   * Play a generic interaction sound
   * @param intensity - The intensity level of the interaction
   */
  playInteraction(intensity: InteractionIntensity = 'default'): void {
    const config = INTERACTION_SOUND_CONFIG[intensity];
    soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
  }

  /**
   * Play interaction sound with custom volume
   * @param volume - Custom volume level (0-1)
   * @param intensity - The intensity level
   */
  playInteractionWithVolume(volume: number, intensity: InteractionIntensity = 'default'): void {
    const config = INTERACTION_SOUND_CONFIG[intensity];
    soundService.playSound(config.sound, volume, config.volumeVariance, config.speedVariance);
  }

  /**
   * Play interaction sound with custom parameters
   * @param volume - Custom volume level (0-1)
   * @param volumeVariance - Volume variance (0-1)
   * @param speedVariance - Speed variance (0-1)
   */
  playInteractionCustom(volume: number = 0.5, volumeVariance: number = 0.1, speedVariance: number = 0.05): void {
    soundService.playSound(SoundNames.mechanicalClick, volume, volumeVariance, speedVariance);
  }

  /**
   * Get configuration for an intensity level
   */
  getConfig(intensity: InteractionIntensity) {
    return INTERACTION_SOUND_CONFIG[intensity];
  }

  /**
   * Get all available intensity levels
   */
  getAvailableIntensities(): InteractionIntensity[] {
    return Object.keys(INTERACTION_SOUND_CONFIG) as InteractionIntensity[];
  }
}

// Singleton instance
export const interactionSoundSystem = new InteractionSoundSystem();

/**
 * Common use case helpers
 */

/**
 * Play sound for button press
 */
export function playButtonInteraction(): void {
  interactionSoundSystem.playInteraction('default');
}

/**
 * Play sound for door opening
 */
export function playDoorInteraction(): void {
  interactionSoundSystem.playInteraction('default');
}

/**
 * Play sound for object pickup
 */
export function playPickupInteraction(): void {
  interactionSoundSystem.playInteraction('quick');
}

/**
 * Play sound for lever/switch activation
 */
export function playLeverInteraction(): void {
  interactionSoundSystem.playInteraction('default');
}

/**
 * Play sound for container opening
 */
export function playContainerInteraction(): void {
  interactionSoundSystem.playInteraction('soft');
}

/**
 * Play sound for generic action
 */
export function playGenericAction(intensity: InteractionIntensity = 'default'): void {
  interactionSoundSystem.playInteraction(intensity);
}
