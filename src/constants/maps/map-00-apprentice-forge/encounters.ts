import type { EncounterDefinition } from '~/types/map-node';
import { BAT, SKELETON, SMALL_SLIME } from '~/constants/enemies/world-00';

/**
 * Enemy encounter compositions for each fight node in the Apprentice Forge.
 * Each key corresponds to a node ID from nodes.ts, or a FOE id from foes.ts.
 */
export const APPRENTICE_FORGE_ENCOUNTERS: Record<string, EncounterDefinition> = {
  // ─── Regular Battles ────────────────────────────────────────────────
  apprentice_forge_battle_1: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...SMALL_SLIME, id: 'small-slime-1' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  apprentice_forge_battle_2: {
    enemies: [
      { ...SKELETON, id: 'skeleton-1' },
      { ...BAT, id: 'bat-1' },
    ],
  },
  apprentice_forge_battle_3: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
    ],
  },
  apprentice_forge_battle_4: {
    enemies: [
      { ...SKELETON, id: 'skeleton-1', name: 'Skeleton A' },
      { ...SKELETON, id: 'skeleton-2', name: 'Skeleton B' },
    ],
  },

  // ─── Roaming FOEs (keys match ids in foes.ts) ───────────────────────
  apprentice_forge_foe_1: {
    enemies: [
      { ...BAT, id: 'bat-1', name: 'Bat A' },
      { ...BAT, id: 'bat-2', name: 'Bat B' },
    ],
  },
  apprentice_forge_foe_2: {
    enemies: [
      { ...SMALL_SLIME, id: 'small-slime-1', name: 'Small Slime A' },
      { ...SMALL_SLIME, id: 'small-slime-2', name: 'Small Slime B' },
    ],
  },
  apprentice_forge_foe_3: {
    enemies: [{ ...SKELETON, id: 'skeleton-1' }],
  },
};
