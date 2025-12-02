/**
 * Footstep Audio System
 * Manages footstep sounds based on surface type and movement state
 * Provides realistic audio feedback for character movement
 */

import { soundService } from './sound-service';
import { SoundNames } from '~/constants/audio';

/**
 * Surface types for footstep audio
 */
export type SurfaceType = 'road' | 'stone' | 'wood' | 'dirt' | 'grass';

/**
 * Audio feedback configuration for footsteps
 * Maps surface types to existing sounds with tunable parameters
 * All values are tunable for game feel adjustments
 */
export const FOOTSTEP_CONFIG: Record<
  SurfaceType,
  {
    sound: SoundNames;
    volume: number;
    volumeVariance: number;
    speedVariance: number;
    minIntervalMs: number; // Minimum time between footsteps
  }
> = {
  road: {
    sound: SoundNames.mechanicalClick, // Distinctive metallic sound for road tiles
    volume: 0.35,
    volumeVariance: 0.1,
    speedVariance: 0.08,
    minIntervalMs: 300, // ~2 steps per second
  },
  stone: {
    sound: SoundNames.mechanicalClick, // Hard, crisp click for stone
    volume: 0.4,
    volumeVariance: 0.15,
    speedVariance: 0.1,
    minIntervalMs: 300, // ~2 steps per second
  },
  wood: {
    sound: SoundNames.bottleClink, // Hollow clink for wood
    volume: 0.35,
    volumeVariance: 0.15,
    speedVariance: 0.1,
    minIntervalMs: 300,
  },
  dirt: {
    sound: SoundNames.beep, // Soft beep for dirt
    volume: 0.3,
    volumeVariance: 0.2,
    speedVariance: 0.12,
    minIntervalMs: 300,
  },
  grass: {
    sound: SoundNames.clickChangeTab, // Subtle click for grass
    volume: 0.25,
    volumeVariance: 0.2,
    speedVariance: 0.15,
    minIntervalMs: 300,
  },
};

/**
 * Footstep system class
 * Manages footstep playback with throttling to prevent audio spam
 */
class FootstepSystem {
  private lastFootstepTime: number = 0;
  private currentSurface: SurfaceType = 'stone';

  /**
   * Set the current surface type
   * @param surface - The surface the character is walking on
   */
  setSurface(surface: SurfaceType): void {
    this.currentSurface = surface;
  }

  /**
   * Get the current surface type
   */
  getSurface(): SurfaceType {
    return this.currentSurface;
  }

  /**
   * Play a footstep sound if enough time has passed since the last one
   * Prevents audio spam by enforcing minimum interval between footsteps
   * @returns true if footstep was played, false if throttled
   */
  playFootstep(): boolean {
    const now = Date.now();
    const config = FOOTSTEP_CONFIG[this.currentSurface];

    // Check if enough time has passed since last footstep
    if (now - this.lastFootstepTime < config.minIntervalMs) {
      return false;
    }

    // Play the footstep sound
    soundService.playSound(config.sound, config.volume, config.volumeVariance, config.speedVariance);

    this.lastFootstepTime = now;
    return true;
  }

  /**
   * Play a footstep for a specific surface
   * Useful for one-off footsteps on different surfaces
   * @param surface - The surface to play footstep for
   * @returns true if footstep was played, false if throttled
   */
  playFootstepForSurface(surface: SurfaceType): boolean {
    const previousSurface = this.currentSurface;
    this.setSurface(surface);
    const played = this.playFootstep();
    this.setSurface(previousSurface);
    return played;
  }

  /**
   * Reset the footstep timer
   * Useful when character stops moving
   */
  resetTimer(): void {
    this.lastFootstepTime = 0;
  }

  /**
   * Get configuration for a specific surface
   */
  getConfig(surface: SurfaceType) {
    return FOOTSTEP_CONFIG[surface];
  }

  /**
   * Get all available surfaces
   */
  getAvailableSurfaces(): SurfaceType[] {
    return Object.keys(FOOTSTEP_CONFIG) as SurfaceType[];
  }
}

// Singleton instance
export const footstepSystem = new FootstepSystem();

/**
 * Determine surface type based on map tile data
 * @param tileId - The tile ID from the map
 * @param layerName - The layer name (optional, for context)
 * @returns The surface type
 */
export function determineSurfaceType(tileId: number, layerName?: string): SurfaceType {
  // Default to stone for road layer
  if (layerName === 'road') {
    return 'stone';
  }

  // Determine based on tile ID ranges (customize based on your tileset)
  // This is a placeholder - adjust based on your actual tile IDs
  if (tileId >= 1 && tileId <= 100) {
    return 'grass';
  } else if (tileId >= 101 && tileId <= 200) {
    return 'dirt';
  } else if (tileId >= 201 && tileId <= 300) {
    return 'wood';
  } else {
    return 'stone';
  }
}

/**
 * Determine surface type based on position and map data
 * @param row - Character row position
 * @param col - Character column position
 * @param mapData - The map data object
 * @returns The surface type
 */
export function determineSurfaceTypeFromPosition(row: number, col: number, mapData: any): SurfaceType {
  // Check road layer first (highest priority)
  const roadLayer = mapData.layers?.find((layer: any) => layer.name === 'road');
  if (roadLayer) {
    const dataIndex = row * roadLayer.width + col;
    const tileId = roadLayer.data[dataIndex];
    if (tileId !== 0) {
      return 'road'; // Return 'road' for road tiles
    }
  }

  // Check ground layer
  const groundLayer = mapData.layers?.find((layer: any) => layer.name === 'ground');
  if (groundLayer) {
    const dataIndex = row * groundLayer.width + col;
    const tileId = groundLayer.data[dataIndex];
    if (tileId !== 0) {
      return 'grass';
    }
  }

  // Default to stone
  return 'stone';
}
