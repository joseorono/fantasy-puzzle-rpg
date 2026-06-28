import type { EncounterDefinition } from '~/types/map-node';
import type { DialogueScene } from '~/types/dialogue';
import type { LootTable } from '~/types/loot';

/**
 * One event in a floor's ordered sequence.
 *
 * Discriminated union on `type` (no enums). Payloads are typed objects referenced
 * by `const` — authoring `const CRYPT_INTRO = {…}` and using it as `scene: CRYPT_INTRO`
 * shares one instance by reference, so there is no registry/lookup layer. Treat the
 * referenced consts as immutable (combat clones via `createBattleState`; enemy
 * templates are spread like `{ ...SWAMP_FROG }`).
 */
export type DungeonEvent =
  | { type: 'dialogue'; scene: DialogueScene } // inline overlay; skipped on replays
  | { type: 'combat'; encounter: EncounterDefinition } // multi-enemy fight
  | { type: 'chest'; loot: LootTable }; // granted directly + popup; skipped on replays

/**
 * A floor: an ordered, arbitrary, all-optional sequence of events. May be `[chest]`
 * only, `[dialogue, combat, chest]`, a single conversation, etc.
 */
export interface DungeonFloor {
  id: string;
  /** Display name, e.g. "Floor 1" or "B2 — The Crypt". */
  name: string;
  events: DungeonEvent[];
  isBoss?: boolean;
  /** Optional per-floor background override; falls back to the dungeon default. */
  backgroundImage?: string;
}

/**
 * A complete dungeon authored as a constant. Self-contained — it does not depend on
 * the map system. `id` doubles as the completion-tracking key.
 */
export interface DungeonDefinition {
  id: string;
  name: string;
  /** Default art; individual floors may override via `backgroundImage`. */
  backgroundImage: string;
  /** Played in order from index 0. */
  floors: DungeonFloor[];
}
