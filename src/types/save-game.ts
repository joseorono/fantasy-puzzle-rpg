import * as z from 'zod'; // This leads to a smaller bundle size somehow
import { RARITY_TIERS } from '~/constants/rarity';
import type { MapId } from '~/types/map';
import type { Resources } from '~/types/resources';
import type { CharacterData } from '~/types/rpg-elements';
import type { PartyState } from '~/stores/slices/party.types';
import type { InventoryState } from '~/stores/slices/inventory.types';
import type { MapProgressState } from '~/stores/slices/map-progress.types';
import type { FloorLootProgressState } from '~/stores/slices/floor-loot-progress.types';
import type { CraftingState } from '~/stores/slices/crafting.types';
import type { DungeonProgressState } from '~/stores/slices/dungeon-progress.types';

const rarityTierSchema = z.enum(RARITY_TIERS);

/** Must list every MapId — a new map becomes a compile error here, not a save that fails to validate. */
const MAP_ID_COVERAGE = { 'map-00': true, 'map-01': true } as const satisfies Record<MapId, true>;
export const mapIdSchema = z.enum(Object.keys(MAP_ID_COVERAGE) as [MapId, ...MapId[]]);

const gridPositionSchema = z.object({ row: z.number().int(), col: z.number().int() });

const coreRpgStatsSchema = z.object({ pow: z.number(), vit: z.number(), spd: z.number() });

/** One completed/visited flag per node id. */
const nodeProgressSchema = z.record(z.string(), z.boolean());

/**
 * A party member as persisted in a save. Equipment fields are `.optional()` because
 * `unequipItem` writes literal `undefined`, which `JSON.stringify` drops entirely.
 */
export const savedCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.enum(['warrior', 'rogue', 'mage', 'healer']),
  color: z.enum(['blue', 'green', 'purple', 'yellow', 'gray']),
  maxHp: z.number(),
  currentHp: z.number(),
  baseHp: z.number(),
  stats: coreRpgStatsSchema,
  potentialStats: coreRpgStatsSchema,
  vitHpMultiplier: z.number(),
  skillCooldown: z.number(),
  maxCooldown: z.number(),
  level: z.number().int().min(1),
  currentLevelExp: z.number(),
  equippedWeaponId: z.string().optional(),
  equippedArmorId: z.string().optional(),
  equippedWeaponRarity: rarityTierSchema.optional(),
  equippedArmorRarity: rarityTierSchema.optional(),
  unlockedSkillIds: z.array(z.string()),
  selectedSkillId: z.string(),
  unlockedPassiveIds: z.array(z.string()),
  skillLevels: z.record(z.string(), z.number()),
}) satisfies z.ZodType<CharacterData>;

/**
 * The seven persistent store slices. The router slice is deliberately absent: its viewData
 * holds functions and object references, and loads always resume on the map view anyway.
 * The `satisfies` clause is the drift alarm — a slice gaining a field breaks compilation
 * here until the schema learns about it. Unknown keys in old saves are stripped by Zod.
 */
export const saveGameStateSchema = z.object({
  resources: z.object({
    coins: z.number(),
    gold: z.number(),
    copper: z.number(),
    silver: z.number(),
    iron: z.number(),
  }),
  party: z.object({ members: z.array(savedCharacterSchema) }),
  inventory: z.object({
    items: z.array(
      z.object({
        itemId: z.string(),
        quantity: z.number().int(),
        rarity: rarityTierSchema.optional(),
      }),
    ),
  }),
  mapProgress: z.object({
    battlesCompleted: nodeProgressSchema,
    bossesCompleted: nodeProgressSchema,
    dungeonsCompleted: nodeProgressSchema,
    townsVisited: nodeProgressSchema,
    treasuresFound: nodeProgressSchema,
    mysteriesSolved: nodeProgressSchema,
    characterPositions: z.partialRecord(mapIdSchema, gridPositionSchema),
  }),
  floorLootProgress: z.record(z.string(), z.record(z.string(), z.boolean())),
  crafting: z.object({ pity: z.number().int().min(0) }),
  dungeonProgress: z.object({ completedDungeons: z.record(z.string(), z.boolean()) }),
}) satisfies z.ZodType<{
  resources: Resources;
  party: PartyState;
  inventory: InventoryState;
  mapProgress: MapProgressState;
  floorLootProgress: FloorLootProgressState;
  crafting: CraftingState;
  dungeonProgress: DungeonProgressState;
}>;

/**
 * The versioned envelope written to a save slot. `savedAt` is epoch ms (never a Date) so the
 * whole file stays plain JSON. `currentMapId` is denormalized because the router isn't saved,
 * but a load must know which map to resume on.
 */
export const saveGameSchema = z.object({
  version: z.number().int(),
  savedAt: z.number(),
  playtimeMs: z.number().min(0),
  currentMapId: mapIdSchema,
  state: saveGameStateSchema,
});

export type SaveGame = z.infer<typeof saveGameSchema>;
export type SaveGameState = z.infer<typeof saveGameStateSchema>;
export type SavedCharacter = z.infer<typeof savedCharacterSchema>;
