/**
 * Pure helpers for stepping through a dungeon run. The `DungeonView` controller
 * drives the per-event state machine; these functions hold the branchless logic
 * so they can be unit-tested in isolation.
 */

import type { DungeonDefinition, DungeonFloor, DungeonEvent } from '~/types/dungeon';
import type { Resources } from '~/types/resources';
import type { BattleRatingResult } from './battle-rating';
import { DUNGEONS } from '~/constants/dungeons';
import { DUNGEON_REST_POOL_DIVISOR, DUNGEON_REST_POOL_MINIMUM } from '~/constants/dungeon';
import { createResources, addResources, getPercentageOfResources } from './resources';

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

/**
 * Total Rests available for one run of a dungeon: `floor(floorCount / divisor)`,
 * floored to a minimum so even short dungeons grant at least one Rest.
 * @param dungeon - The dungeon being run
 * @returns The number of Rests available for the whole run
 */
export function getDungeonRestPool(dungeon: DungeonDefinition): number {
  return Math.max(
    DUNGEON_REST_POOL_MINIMUM,
    Math.floor(dungeon.floors.length / DUNGEON_REST_POOL_DIVISOR),
  );
}

/** Aggregate rank across a run's per-floor combat ratings. */
export interface DungeonRatingSummary {
  /** Number of floors that were rated (i.e. had a combat). */
  ratedFloors: number;
  /** Sum of stars earned across all rated floors. */
  totalStars: number;
  /** Mean stars, rounded UP to a whole star (1..MAX_STARS); 0 when no floor was rated. */
  averageStars: number;
}

/**
 * Summarizes a run's per-floor combat ratings into a single dungeon rank. Floors without a rating
 * (dialogue/chest-only) are ignored, so a peaceful floor never drags the average down. The average
 * is rounded UP (so, e.g., a 4★ and a 5★ floor yield a 5★ run) — the run rank is generous, taking
 * the benefit of the doubt. `averageStars` is the headline "dungeon rank"; `totalStars` is kept for
 * a possible score display.
 * @param floorRatings - Map of floor index → battle rating, as accumulated during the run
 * @returns The rated-floor count, total stars, and rounded-up average (0 if nothing was rated)
 */
export function summarizeFloorRatings(
  floorRatings: Record<number, BattleRatingResult>,
): DungeonRatingSummary {
  const ratings = Object.values(floorRatings);
  const ratedFloors = ratings.length;
  const totalStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
  const averageStars = ratedFloors === 0 ? 0 : Math.ceil(totalStars / ratedFloors);
  return { ratedFloors, totalStars, averageStars };
}

/**
 * Total estimated resource yield of a dungeon: every combat enemy's loot plus every
 * chest, with each loot table weighted by its own drop `probability` (so it's an
 * expected-value estimate, not a best-case sum).
 * @param dungeon - The dungeon to estimate
 * @returns The summed, probability-weighted resources across the whole dungeon
 */
export function getDungeonEstimatedResources(dungeon: DungeonDefinition): Resources {
  let total = createResources();
  for (const floor of dungeon.floors) {
    for (const event of floor.events) {
      const tables =
        event.type === 'combat'
          ? event.encounter.enemies.map((enemy) => enemy.lootTable)
          : event.type === 'chest'
            ? [event.loot]
            : [];
      for (const table of tables) {
        total = addResources(total, getPercentageOfResources(table.resources.item, table.resources.probability));
      }
    }
  }
  return total;
}
