// Map tile types
export type TileType = 'grass' | 'road' | 'water' | 'forest' | 'mountain' | 'town' | 'battle' | 'boss' | 'dungeon';

// Map data structure - 2D array of tiles
export type MapData = readonly (readonly TileType[])[];

// Character position on the map
export interface CharacterPosition {
  row: number;
  col: number;
}

// Map node properties for interactive elements
export interface MapNode {
  type: TileType;
  completed?: boolean;
  walkable: boolean;
  onEnter?: () => void;
  onInteract?: () => void;
  dialogueSequence?: string[];
}

// Direction for character movement
export type Direction = 'up' | 'down' | 'left' | 'right';

// Valid sublocations of any town
export type townLocations = 'town-hub' | 'blacksmith' | 'inn' | 'item-store';