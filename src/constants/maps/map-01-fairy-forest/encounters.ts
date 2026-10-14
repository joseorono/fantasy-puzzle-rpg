import type { EncounterDefinition } from '~/types/map-node';
import {
  BADGER,
  BAT,
  DINO_TRI,
  GIANT_FROG,
  MOSS_GOLEM,
  SMALL_SLIME,
  STONE_GOLEM,
  SWAMP_FROG,
} from '~/constants/enemies/world-00';

/**
 * Enemy encounter compositions for each fight node on the Fairy Forest, grouped by zone in
 * walking order: each zone fights harder than the one before it. Most fights field four
 * enemies; ones with an xl enemy field three so the enemy row still fits.
 * Each key corresponds to a node ID from nodes.ts, or a FOE id from foes.ts.
 */
export const FAIRY_FOREST_ENCOUNTERS: Record<string, EncounterDefinition> = {
  // ─── Start pocket and south-east column (tier 1–2) ─────────────────────
  fairy_forest_battle_8: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  // Gate: Briar Line.
  fairy_forest_battle_9: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_battle_10: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SMALL_SLIME, id: 'small-slime-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  // Gate: Fernwall.
  fairy_forest_battle_11: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...BAT, id: 'bat-1' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
    ],
  },

  // ─── Central-east hub (tier 3) ─────────────────────────────────────────
  fairy_forest_battle_1: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...BAT, id: 'bat-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },
  fairy_forest_battle_4: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_battle_12: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  fairy_forest_battle_13: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
    ],
  },
  fairy_forest_battle_14: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  // Gate: Glade Gate.
  fairy_forest_battle_15: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...BAT, id: 'bat-1' },
    ],
  },

  // ─── Side regions — harder than the main path ──────────────────────────
  // Gate: Canopy Gate (north band).
  fairy_forest_battle_16: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
    ],
  },
  fairy_forest_battle_7: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  // Gate: Mire Gate (south hollow).
  fairy_forest_battle_17: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
    ],
  },
  fairy_forest_battle_5: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  fairy_forest_battle_6: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },

  // ─── West clearing (tier 4) ────────────────────────────────────────────
  fairy_forest_battle_18: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_battle_3: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
      { ...MOSS_GOLEM, id: 'moss-golem-1' },
      { ...SMALL_SLIME, id: 'small-slime-1' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  // Gate: Thistle Gate.
  fairy_forest_battle_19: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...SMALL_SLIME, id: 'small-slime-1' },
    ],
  },

  // ─── North-west (tier 5) ───────────────────────────────────────────────
  fairy_forest_battle_2: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...SMALL_SLIME, id: 'small-slime-1' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
    ],
  },
  fairy_forest_battle_20: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },

  // ─── Boss Battles (xl bosses keep 3 so the enemy row fits) ─────────────
  fairy_forest_boss_1: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Elder Treant' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Treant Sapling' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_boss_2: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Bog Courtier' },
      { ...GIANT_FROG, id: 'giant-frog-1', name: 'Bog Sovereign' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Bog Herald' },
    ],
  },
  fairy_forest_boss_3: {
    enemies: [
      { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
      { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Gatekeeper' },
      { ...MOSS_GOLEM, id: 'moss-golem-3', name: 'Moss Golem B' },
      { ...SWAMP_FROG, id: 'swamp-frog-1' },
    ],
  },
  // The area boss, guarding the exit: tuned to challenge a level-10 party.
  fairy_forest_boss_4: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...BADGER, id: 'badger-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },

  // ─── Roaming FOEs (keys match ids in foes.ts), weakest first along the path ───
  fairy_forest_foe_6: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
      { ...BAT, id: 'bat-3', name: 'Bat C' },
    ],
  },
  fairy_forest_foe_7: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },
  fairy_forest_foe_8: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
    ],
  },
  fairy_forest_foe_4: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
      { ...BAT, id: 'bat-3', name: 'Bat C' },
    ],
  },
  // The Dino Tri roam as a trio; xl bodies keep the row at three.
  fairy_forest_foe_13: {
    enemies: [
      { ...DINO_TRI, id: 'dino-tri-1', name: 'Dino Tri A' },
      { ...DINO_TRI, id: 'dino-tri-2', name: 'Dino Tri B' },
      { ...DINO_TRI, id: 'dino-tri-3', name: 'Dino Tri C' },
    ],
  },
  fairy_forest_foe_10: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
      { ...SWAMP_FROG, id: 'swamp-frog-3', name: 'Swamp Frog C' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  fairy_forest_foe_5: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...SMALL_SLIME, id: 'small-slime-3', name: 'Small Slime C' },
    ],
  },
  fairy_forest_foe_11: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...SMALL_SLIME, id: 'small-slime-3', name: 'Small Slime C' },
    ],
  },
  fairy_forest_foe_9: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
      { ...SMALL_SLIME, id: 'small-slime-3', name: 'Small Slime C' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  fairy_forest_foe_3: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...GIANT_FROG, id: 'giant-frog-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  fairy_forest_foe_12: {
    enemies: [
      { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
      { ...GIANT_FROG, id: 'giant-frog-1' },
      { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
    ],
  },
  fairy_forest_foe_1: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...STONE_GOLEM, id: 'stone-golem-1' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  fairy_forest_foe_2: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...STONE_GOLEM, id: 'stone-golem-1' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
};
