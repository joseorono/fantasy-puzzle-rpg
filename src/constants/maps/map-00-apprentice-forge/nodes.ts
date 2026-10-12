import type { InteractiveMapNode } from '~/types/map-node';

/**
 * Interactive nodes in the Apprentice Forge. Every position sits on a reachable `road` tile.
 * Ids are prefixed because map progress is keyed by node id across all maps.
 */
export const APPRENTICE_FORGE_NODES: InteractiveMapNode[] = [
  {
    id: 'apprentice_forge_battle_1',
    type: 'Battle',
    position: { row: 10, col: 40 },
    name: 'Ember Roost',
    blocksMovement: false,
    description: 'Wings flutter in the heat above the cooling racks',
  },
  {
    id: 'apprentice_forge_battle_2',
    type: 'Battle',
    position: { row: 12, col: 2 },
    name: 'Scrap Corridor',
    blocksMovement: false,
    description: 'Old armour rattles in the dark, and it is not empty',
  },
  {
    id: 'apprentice_forge_battle_3',
    type: 'Battle',
    position: { row: 28, col: 7 },
    name: 'Quench Pit',
    blocksMovement: false,
    description: 'Something gelatinous has settled in the quenching water',
  },
  {
    id: 'apprentice_forge_battle_4',
    type: 'Battle',
    position: { row: 4, col: 4 },
    name: 'Bone Sentries',
    blocksMovement: false,
    description: 'Two skeletons still stand guard over a forge long gone cold',
  },
];
