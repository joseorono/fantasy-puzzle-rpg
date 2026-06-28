/**
 * Pure helpers for stepping through a dungeon run. The `DungeonView` controller
 * drives the per-event state machine; these functions hold the branchless logic
 * so they can be unit-tested in isolation.
 */

import type { DungeonDefinition, DungeonFloor, DungeonEvent } from '~/types/dungeon';
import { DUNGEONS } from '~/constants/dungeons';

/**
 * Look up an authored dungeon by id.
 * @param id - The dungeon id (also its completion-tracking key)
 * @returns The dungeon definition, or undefined if no dungeon has that id
 */
export function getDungeonById(id: string): DungeonDefinition | undefined {
  return DUNGEONS[id];
}

/**
 * Get a floor by index.
 * @param dungeon - The dungeon being run
 * @param floorIndex - Zero-based floor index
 * @returns The floor, or undefined if the index is out of range
 */
export function getFloor(dungeon: DungeonDefinition, floorIndex: number): DungeonFloor | undefined {
  return dungeon.floors[floorIndex];
}

/**
 * Get an event within a floor by index.
 * @param floor - The floor being played
 * @param eventIndex - Zero-based event index
 * @returns The event, or undefined if the index is out of range
 */
export function getEvent(floor: DungeonFloor, eventIndex: number): DungeonEvent | undefined {
  return floor.events[eventIndex];
}

/**
 * Whether the given event index is the last event of the floor. An empty floor
 * is treated as already finished.
 * @param floor - The floor being played
 * @param eventIndex - Zero-based event index
 * @returns True if no event remains after `eventIndex`
 */
export function isLastEventOfFloor(floor: DungeonFloor, eventIndex: number): boolean {
  return eventIndex >= floor.events.length - 1;
}

/**
 * Whether the given floor index is the dungeon's last floor.
 * @param dungeon - The dungeon being run
 * @param floorIndex - Zero-based floor index
 * @returns True if no floor remains after `floorIndex`
 */
export function isLastFloor(dungeon: DungeonDefinition, floorIndex: number): boolean {
  return floorIndex >= dungeon.floors.length - 1;
}

/**
 * Whether an event should run given the replay state. On replays only `combat`
 * events run (dialogue and chests are skipped for farming); on a first clear
 * everything runs.
 * @param event - The event under consideration
 * @param isReplay - Whether the current run is a replay of an already-cleared dungeon
 * @returns True if the event should be processed
 */
export function shouldRunEvent(event: DungeonEvent, isReplay: boolean): boolean {
  if (!isReplay) return true;
  return event.type === 'combat';
}

/**
 * Resolve the background art for a floor: the floor's own override if set,
 * otherwise the dungeon default.
 * @param dungeon - The dungeon being run
 * @param floor - The current floor
 * @returns The background image URL to use
 */
export function getFloorBackground(dungeon: DungeonDefinition, floor: DungeonFloor): string {
  return floor.backgroundImage ?? dungeon.backgroundImage;
}
