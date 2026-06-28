import type { DungeonDefinition } from '~/types/dungeon';
import type { DialogueScene } from '~/types/dialogue';
import { NARRATOR_CHAR, KNIGHT_CHAR } from '~/constants/dialogue/characters';
import { MOSS_GOLEM, SWAMP_FROG } from '~/constants/enemies/world-00';
import { ANCIENT_CHEST_LOOT } from '~/constants/maps/map-00/loot-tables';

const CAVE_BG_1 = '/assets/bg/dungeon/bg-generic-cave-1.jpg';
const CAVE_BG_2 = '/assets/bg/dungeon/bg-generic-cave-2.jpg';

// ─── Dialogue (named consts, shared by reference) ─────────────────────

const CAVE_INTRO: DialogueScene = {
  id: 'sample-cave-intro',
  characters: [NARRATOR_CHAR, KNIGHT_CHAR],
  lines: [
    {
      id: 'ci-1',
      speakerId: 'narrator',
      text: 'Damp air and the drip of unseen water — the mouth of the cave swallows your torchlight whole.',
    },
    { id: 'ci-2', speakerId: 'knight', text: 'Keep close. Whatever nests down here, it heard us coming.' },
  ],
};

const BOSS_INTRO: DialogueScene = {
  id: 'sample-boss-intro',
  characters: [NARRATOR_CHAR, KNIGHT_CHAR],
  lines: [
    { id: 'bi-1', speakerId: 'narrator', text: 'The passage opens into a vast hollow. Something enormous shifts in the dark.' },
    { id: 'bi-2', speakerId: 'knight', text: 'This is it. Stand your ground!' },
  ],
};

/**
 * A throwaway dungeon used to exercise the full run loop end-to-end. Reuses
 * existing enemies and a chest loot table. Floor 1 `[dialogue, combat]`, Floor 2
 * `[chest]` (no battle), Floor 3 boss `[dialogue, combat, chest]`.
 */
export const SAMPLE_DUNGEON: DungeonDefinition = {
  id: 'sample-cave',
  name: 'Echoing Hollow',
  backgroundImage: CAVE_BG_1,
  floors: [
    {
      id: 'sample-floor-1',
      name: 'Floor 1 — Vanguard Gate',
      events: [
        { type: 'dialogue', scene: CAVE_INTRO },
        {
          type: 'combat',
          encounter: {
            enemies: [
              { ...SWAMP_FROG, id: 'swamp-frog-1', name: 'Swamp Frog A' },
              { ...SWAMP_FROG, id: 'swamp-frog-2', name: 'Swamp Frog B' },
            ],
          },
        },
      ],
    },
    {
      id: 'sample-floor-2',
      name: 'Floor 2 — Hidden Cache',
      backgroundImage: CAVE_BG_2,
      events: [{ type: 'chest', loot: ANCIENT_CHEST_LOOT }],
    },
    {
      id: 'sample-floor-3',
      name: 'Floor 3 — The Deep Hollow',
      isBoss: true,
      events: [
        { type: 'dialogue', scene: BOSS_INTRO },
        {
          type: 'combat',
          encounter: {
            enemies: [
              { ...MOSS_GOLEM, id: 'moss-golem-1', name: 'Moss Golem A' },
              { ...MOSS_GOLEM, id: 'moss-golem-2', name: 'Moss Golem B' },
            ],
          },
        },
        { type: 'chest', loot: ANCIENT_CHEST_LOOT },
      ],
    },
  ],
};
