import type { EncounterDefinition } from '~/types/map-node';
import { RIDER } from '~/constants/enemies/world-00';

/**
 * Enemy encounter compositions for the Castle Garden. Each key corresponds to a
 * FOE id from foes.ts.
 */
export const CASTLE_GARDEN_ENCOUNTERS: Record<string, EncounterDefinition> = {
  // The mounted guard sweeps the plaza alone: a sturdy, fast tank.
  castle_garden_foe_1: {
    enemies: [{ ...RIDER, id: 'rider-1', name: 'Rider' }],
  },
};
