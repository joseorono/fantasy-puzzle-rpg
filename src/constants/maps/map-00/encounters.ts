import type { EncounterDefinition } from '~/types/encounter';
import { MOSS_GOLEM, SWAMP_FROG } from '~/constants/enemies/world-00';

/**
 * Enemy encounter compositions for each fight node on map-00.
 * Each key corresponds to a node ID from nodes.ts.
 */
const MAP_00_ENCOUNTERS: Record<string, EncounterDefinition> = {
  // ─── Regular Battles ────────────────────────────────────────────────
  battle_1: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  battle_2: {
    enemies: [MOSS_GOLEM],
  },
  battle_3: {
    enemies: [
      MOSS_GOLEM,
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog' },
    ],
  },
  battle_4: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },
  battle_5: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog' },
    ],
  },
  battle_6: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
    ],
  },
  battle_7: {
    enemies: [
      MOSS_GOLEM,
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  battle_8: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  battle_9: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },

  // ─── Boss Battles ───────────────────────────────────────────────────
  boss_1: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
    ],
  },
  boss_2: {
    enemies: [
      MOSS_GOLEM,
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog' },
    ],
  },
  boss_3: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...MOSS_GOLEM, id: 'moss-golem-3', name: 'Moss Golem C' },
    ],
  },
};

/**
 * Look up the encounter definition for a given node ID.
 */
export function getEncounterForNode(nodeId: string): EncounterDefinition | undefined {
  return MAP_00_ENCOUNTERS[nodeId];
}
