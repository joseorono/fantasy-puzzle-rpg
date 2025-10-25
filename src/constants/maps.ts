import type { MapData, TileType } from '~/types/map';

// Tile type constants
export const GRASS: TileType = 'grass';
export const ROAD: TileType = 'road';
export const WATER: TileType = 'water';
export const FOREST: TileType = 'forest';
export const MOUNTAIN: TileType = 'mountain';
export const TOWN: TileType = 'town';
export const BATTLE: TileType = 'battle';
export const BOSS: TileType = 'boss';
export const DUNGEON: TileType = 'dungeon';

// Walkable tiles configuration
export const WALKABLE_TILES: Set<TileType> = new Set([
  GRASS,
  ROAD,
  TOWN,
  BATTLE,
  BOSS,
  DUNGEON,
]);

// Example map 1 - Expanded with more terrain variety
export const MAP_1: MapData = [
  [FOREST, FOREST, GRASS, ROAD, ROAD, ROAD, ROAD, MOUNTAIN, MOUNTAIN],
  [FOREST, GRASS, GRASS, ROAD, GRASS, GRASS, GRASS, GRASS, MOUNTAIN],
  [GRASS, GRASS, GRASS, ROAD, GRASS, WATER, WATER, GRASS, GRASS],
  [GRASS, GRASS, GRASS, ROAD, BATTLE, GRASS, WATER, GRASS, GRASS],
  [MOUNTAIN, GRASS, GRASS, ROAD, GRASS, GRASS, GRASS, FOREST, FOREST],
  [MOUNTAIN, GRASS, GRASS, ROAD, ROAD, ROAD, GRASS, FOREST, FOREST],
  [GRASS, GRASS, GRASS, GRASS, GRASS, ROAD, GRASS, GRASS, GRASS],
  [GRASS, WATER, WATER, GRASS, GRASS, ROAD, ROAD, ROAD, TOWN],
] as const;

// Example map 2 - More complex with diverse terrain
export const MAP_2: MapData = [
  [MOUNTAIN, FOREST, FOREST, ROAD, GRASS, GRASS, GRASS, GRASS, MOUNTAIN],
  [MOUNTAIN, FOREST, GRASS, ROAD, GRASS, BATTLE, GRASS, GRASS, MOUNTAIN],
  [FOREST, GRASS, GRASS, ROAD, ROAD, ROAD, GRASS, GRASS, GRASS],
  [FOREST, GRASS, WATER, WATER, GRASS, ROAD, GRASS, FOREST, FOREST],
  [GRASS, GRASS, WATER, WATER, GRASS, ROAD, GRASS, FOREST, FOREST],
  [TOWN, GRASS, GRASS, GRASS, GRASS, ROAD, ROAD, ROAD, GRASS],
  [GRASS, GRASS, DUNGEON, GRASS, GRASS, GRASS, GRASS, ROAD, GRASS],
  [GRASS, MOUNTAIN, GRASS, GRASS, GRASS, GRASS, GRASS, ROAD, BOSS],
  [GRASS, MOUNTAIN, MOUNTAIN, GRASS, GRASS, GRASS, GRASS, ROAD, GRASS],
] as const;

// Tile visual representations (can be replaced with actual sprites later)
export const TILE_SPRITES: Record<TileType, string> = {
  grass: '🌱',
  road: '🟫',
  water: '💧',
  forest: '🌲',
  mountain: '⛰️',
  town: '🏘️',
  battle: '⚔️',
  boss: '👹',
  dungeon: '🏰',
};

// Tile colors for styling
export const TILE_COLORS: Record<TileType, string> = {
  grass: 'bg-green-600',
  road: 'bg-amber-700',
  water: 'bg-blue-500',
  forest: 'bg-green-800',
  mountain: 'bg-gray-600',
  town: 'bg-yellow-600',
  battle: 'bg-red-600',
  boss: 'bg-purple-700',
  dungeon: 'bg-indigo-700',
};
