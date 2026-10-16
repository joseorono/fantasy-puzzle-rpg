import type { InteractiveMapNode } from '~/types/map-node';

/**
 * Interactive nodes in the Castle Garden. Every position sits on a reachable `road` tile.
 * Ids are prefixed because map progress is keyed by node id across all maps.
 */
export const CASTLE_GARDEN_NODES: InteractiveMapNode[] = [
  {
    id: 'castle_garden_previous_map',
    type: 'PreviousMap',
    position: { row: 4, col: 0 },
    name: 'Desert Road',
    blocksMovement: false,
    description: 'The road back into the Desert',
    destination: { mapId: 'map-03-desert', arrival: { row: 13, col: 117 } },
  },
];
