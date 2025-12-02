/**
 * Loot Audio Feedback System
 * Provides audio feedback for looting interactions
 * Ensures reliable, synchronized sound effects for chest opening and loot collection
 */

import { soundService } from './sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Audio feedback configuration for loot interactions
 * All values are tunable for game feel adjustments
 */
export const LOOT_AUDIO_CONFIG = {
  // Chest opening sound
  chestOpen: {
    sound: SoundNames.bgNoiseMiner,
    volume: 0.7, // Base volume (0-1)
    volumeVariance: 0.1, // Random volume variation (±10%)
    speedVariance: 0.05, // Random speed variation (±5%)
    delay: 0, // Delay before playing (ms)
  },

  // Floor loot collection sound
  floorLootCollect: {
    sound: SoundNames.clickCoin,
    volume: 0.6,
    volumeVariance: 0.1,
    speedVariance: 0.05,
    delay: 0,
  },

  // Loot notification sound (optional secondary feedback)
  lootNotification: {
    sound: SoundNames.shimmeringSuccessShort,
    volume: 0.5,
    volumeVariance: 0.08,
    speedVariance: 0.03,
    delay: 100, // Slight delay for layered effect
  },
};

/**
 * Play chest opening sound effect
 * Triggered when player opens a treasure chest
 * Provides immediate auditory confirmation of successful interaction
 */
export function playChestOpenSound(): void {
  const config = LOOT_AUDIO_CONFIG.chestOpen;

  if (config.delay > 0) {
    setTimeout(() => {
      soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
    }, config.delay);
  } else {
    soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
  }
}

/**
 * Play floor loot collection sound effect
 * Triggered when player collects floor loot
 * Provides immediate auditory confirmation of resource collection
 */
export function playFloorLootSound(): void {
  const config = LOOT_AUDIO_CONFIG.floorLootCollect;

  if (config.delay > 0) {
    setTimeout(() => {
      soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
    }, config.delay);
  } else {
    soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
  }
}

/**
 * Play loot notification sound effect (optional)
 * Can be used for additional feedback when showing loot notifications
 * Provides layered audio feedback for enhanced immersion
 */
export function playLootNotificationSound(): void {
  const config = LOOT_AUDIO_CONFIG.lootNotification;

  if (config.delay > 0) {
    setTimeout(() => {
      soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
    }, config.delay);
  } else {
    soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);
  }
}

/**
 * Play combined loot feedback sequence
 * Plays chest open sound followed by optional notification sound
 * Creates a satisfying, multi-layered audio experience
 */
export function playLootFeedbackSequence(): void {
  playChestOpenSound();
  playLootNotificationSound();
}

/**
 * Adjust loot audio volume
 * Allows runtime tuning of loot audio feedback volume
 * @param soundType - Type of loot sound to adjust
 * @param volume - New volume level (0-1)
 */
export function setLootAudioVolume(soundType: keyof typeof LOOT_AUDIO_CONFIG, volume: number): void {
  const config = LOOT_AUDIO_CONFIG[soundType];
  if (config) {
    config.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Get current loot audio configuration
 * Useful for debugging and testing audio feedback
 * @returns Copy of current loot audio configuration
 */
export function getLootAudioConfig() {
  return JSON.parse(JSON.stringify(LOOT_AUDIO_CONFIG));
}
