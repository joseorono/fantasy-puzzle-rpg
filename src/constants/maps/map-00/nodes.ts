import type { InteractiveMapNode } from '~/types/map-node';

/**
 * Interactive nodes on the demo map
 * These positions are placed on road tiles at specified coordinates
 */
export const DEMO_MAP_NODES: InteractiveMapNode[] = [
  {
    id: 'battle_1',
    type: 'Battle',
    position: { row: 45, col: 46 },
    name: 'Forest Encounter',
    dialogueScene: 'test',
    blocksMovement: false,
    description: 'A group of monsters blocks your path',
  },
  {
    id: 'battle_2',
    type: 'Battle',
    position: { row: 40, col: 69 },
    name: 'Mountain Pass Battle',
    dialogueScene: 'simple',
    blocksMovement: false,
    description: 'Dangerous creatures guard this passage',
  },
  {
    id: 'battle_3',
    type: 'Battle',
    position: { row: 31, col: 76 },
    name: 'Road Ambush',
    blocksMovement: false,
    description: 'Bandits have set up an ambush',
  },
  {
    id: 'battle_4',
    type: 'Battle',
    position: { row: 43, col: 41 },
    name: 'Canyon Battle',
    blocksMovement: false,
    description: 'Enemies ambush from the canyon',
  },
  {
    id: 'boss_1',
    type: 'Boss',
    position: { row: 33, col: 40 },
    name: 'Ancient Guardian',
    dialogueScene: 'narrator',
    blocksMovement: false,
    description: 'A powerful guardian protects this area',
  },
  {
    id: 'boss_2',
    type: 'Boss',
    position: { row: 38, col: 33 },
    name: 'Dragon Overlord',
    blocksMovement: false,
    description: 'The fearsome dragon awaits challengers',
  },
  {
    id: 'town_1',
    type: 'Town',
    position: { row: 44, col: 28 },
    name: 'Starting Village',
    blocksMovement: false,
    description: 'A peaceful village where your journey begins',
  },
  {
    id: 'town_2',
    type: 'Town',
    position: { row: 50, col: 22 },
    name: 'Mountain Town',
    blocksMovement: false,
    description: 'A town nestled in the mountains',
  },
  {
    id: 'town_3',
    type: 'Town',
    position: { row: 37, col: 21 },
    name: 'Riverside Village',
    blocksMovement: false,
    description: 'A quiet village by the river',
  },
  {
    id: 'dungeon_1',
    type: 'Dungeon',
    position: { row: 31, col: 16 },
    name: 'Dark Cavern',
    dialogueScene: 'test',
    blocksMovement: false,
    description: 'A mysterious cave system',
  },
  {
    id: 'dungeon_2',
    type: 'Dungeon',
    position: { row: 25, col: 16 },
    name: 'Ancient Ruins',
    blocksMovement: false,
    description: 'Ruins of an ancient civilization',
  },
  {
    id: 'dungeon_3',
    type: 'Dungeon',
    position: { row: 21, col: 10 },
    name: 'Forgotten Temple',
    blocksMovement: false,
    description: 'An old temple lost to time',
  },
  {
    id: 'battle_5',
    type: 'Battle',
    position: { row: 17, col: 27 },
    name: 'Northern Skirmish',
    blocksMovement: false,
    description: 'Enemies block the northern path',
  },
  {
    id: 'battle_6',
    type: 'Battle',
    position: { row: 16, col: 37 },
    name: 'Eastern Conflict',
    blocksMovement: false,
    description: 'A fierce battle awaits',
  },
  {
    id: 'battle_7',
    type: 'Battle',
    position: { row: 11, col: 37 },
    name: 'Highland Battle',
    blocksMovement: false,
    description: 'Highland warriors challenge you',
  },
  {
    id: 'town_4',
    type: 'Town',
    position: { row: 16, col: 45 },
    name: 'Trading Post',
    blocksMovement: false,
    description: 'A bustling trading post',
  },
  {
    id: 'battle_8',
    type: 'Battle',
    position: { row: 17, col: 52 },
    name: 'Crossroads Fight',
    blocksMovement: false,
    description: 'Bandits control the crossroads',
  },
  {
    id: 'battle_9',
    type: 'Battle',
    position: { row: 18, col: 59 },
    name: 'Valley Ambush',
    blocksMovement: false,
    description: 'An ambush in the valley',
  },
  {
    id: 'battle_10',
    type: 'Battle',
    position: { row: 17, col: 66 },
    name: 'Ridge Battle',
    blocksMovement: false,
    description: 'Enemies guard the ridge',
  },
  {
    id: 'boss_3',
    type: 'Boss',
    position: { row: 17, col: 70 },
    name: 'Final Guardian',
    blocksMovement: false,
    description: 'The ultimate challenge awaits',
  },
];

/**
 * Get a node by its position
 */
export function getNodeAtPosition(row: number, col: number): InteractiveMapNode | undefined {
  return DEMO_MAP_NODES.find((node) => node.position.row === row && node.position.col === col);
}

/**
 * Get a node by its ID
 */
export function getNodeById(id: string): InteractiveMapNode | undefined {
  return DEMO_MAP_NODES.find((node) => node.id === id);
}

