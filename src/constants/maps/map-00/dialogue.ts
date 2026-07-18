import type { DialogueScene } from '~/types/dialogue';
import { NARRATOR_CHAR, KNIGHT_CHAR } from '~/constants/dialogue/characters';
import {
  TEST_DIALOGUE_SCENE,
  SIMPLE_DIALOGUE_SCENE,
  CUTSCENE_WITH_NARRATOR,
} from '~/constants/dialogue/scenes/test-scene';

/**
 * Pre-fight and map dialogue scenes for map-00.
 *
 * Keys match the `dialogueScene` values on nodes in nodes.ts, plus
 * the coordinate-based DIALOGUE_TRIGGERS keys ('test', 'simple', 'narrator').
 */
export const MAP_00_DIALOGUE_SCENES: Record<string, DialogueScene> = {
  // ─── Pre-fight dialogues (referenced by node dialogueScene) ─────────
  'forest-encounter': {
    id: 'forest-encounter',
    characters: [NARRATOR_CHAR, KNIGHT_CHAR],
    lines: [
      {
        id: 'fe-1',
        speakerId: 'narrator',
        text: 'The trees grow thick here, and something stirs in the undergrowth...',
      },
      {
        id: 'fe-2',
        speakerId: 'knight',
        text: 'Stay sharp! I can hear them closing in!',
      },
    ],
  },
  'mountain-pass': {
    id: 'mountain-pass',
    characters: [NARRATOR_CHAR, KNIGHT_CHAR],
    lines: [
      {
        id: 'mp-1',
        speakerId: 'narrator',
        text: 'A cold wind howls through the narrow mountain pass ahead.',
      },
      {
        id: 'mp-2',
        speakerId: 'knight',
        text: 'This passage is too quiet. Be ready for anything.',
      },
    ],
  },
  'ancient-guardian': {
    id: 'ancient-guardian',
    characters: [NARRATOR_CHAR, KNIGHT_CHAR],
    lines: [
      {
        id: 'ag-1',
        speakerId: 'narrator',
        text: 'An ancient presence awakens, stone grinding against stone as the guardian rises.',
      },
      {
        id: 'ag-2',
        speakerId: 'knight',
        text: 'By the gods... that thing is enormous. Steel yourselves!',
      },
      {
        id: 'ag-3',
        speakerId: 'narrator',
        text: 'The ground trembles as the guardian takes its first step toward the party.',
      },
    ],
  },

  // ─── Existing test scenes (used by coordinate-based DIALOGUE_TRIGGERS) ──
  test: TEST_DIALOGUE_SCENE,
  simple: SIMPLE_DIALOGUE_SCENE,
  narrator: CUTSCENE_WITH_NARRATOR,
};
