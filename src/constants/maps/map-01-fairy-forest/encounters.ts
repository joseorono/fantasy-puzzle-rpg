import type { EncounterDefinition } from '~/types/map-node';
import { BAT, GIANT_FROG, MOSS_GOLEM, SMALL_SLIME, STONE_GOLEM, SWAMP_FROG } from '~/constants/enemies/world-00';

/**
 * Enemy encounter compositions for each fight node on the Fairy Forest.
 * Each key corresponds to a node ID from nodes.ts.
 */
export const FAIRY_FOREST_ENCOUNTERS: Record<string, EncounterDefinition> = {
  // ─── Regular Battles ────────────────────────────────────────────────
  fairy_forest_battle_1: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  fairy_forest_battle_2: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_battle_3: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },
  fairy_forest_battle_4: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...BAT, id: 'bat-1' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
    ],
  },
  fairy_forest_battle_5: {
    enemies: [
      MOSS_GOLEM,
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  fairy_forest_battle_6: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },
  fairy_forest_battle_7: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  fairy_forest_battle_8: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },

  // ─── Boss Battles ───────────────────────────────────────────────────
  fairy_forest_boss_1: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Elder Treant' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Treant Sapling' },
    ],
  },
  fairy_forest_boss_2: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Bog Sovereign' },
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog' },
    ],
  },
  fairy_forest_boss_3: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Gatekeeper' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-3', name: 'Moss Golem B' },
    ],
  },

  // ─── Roaming FOEs (keys match ids in foes.ts) ───────────────────────
  fairy_forest_foe_1: {
    enemies: [{ ...STONE_GOLEM, id: 'stone-golem-1' }],
  },
  fairy_forest_foe_2: {
    enemies: [{ ...STONE_GOLEM, id: 'stone-golem-1' }],
  },
  fairy_forest_foe_3: {
    enemies: [{ ...GIANT_FROG, id: 'giant-frog-1' }],
  },
  fairy_forest_foe_4: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_foe_5: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
    ],
  },
};
