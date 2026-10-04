import type { DialogueScene } from '~/types/dialogue';
import type { DialogueTrigger } from '~/types/map';
import { NARRATOR_CHAR, KNIGHT_CHAR, MAGE_CHAR, MYSTERY_CHAR } from '~/constants/dialogue/characters';

/**
 * Tiles that prompt a dialogue scene when the player walks onto them.
 * `scene` keys into FAIRY_FOREST_DIALOGUE_SCENES below.
 */
export const FAIRY_FOREST_DIALOGUE_TRIGGERS: DialogueTrigger[] = [
  { row: 39, col: 40, scene: 'forest-arrival' },
  { row: 13, col: 45, scene: 'whispering-crossroads' },
];

/**
 * Pre-fight and map dialogue scenes for the Fairy Forest.
 *
 * Keys match the `dialogueScene` values on nodes in nodes.ts, plus
 * the FAIRY_FOREST_DIALOGUE_TRIGGERS scene keys.
 */
export const FAIRY_FOREST_DIALOGUE_SCENES: Record<string, DialogueScene> = {
  // ─── Pre-fight dialogues (referenced by node dialogueScene) ─────────
  'glade-ambush': {
    id: 'glade-ambush',
    characters: [NARRATOR_CHAR, KNIGHT_CHAR],
    lines: [
      {
        id: 'ga-1',
        speakerId: 'narrator',
        text: 'Something in the ferns has been keeping pace with you.',
      },
      {
        id: 'ga-2',
        speakerId: 'knight',
        text: 'Frogs. Big ones.',
      },
    ],
  },
  'elder-treant': {
    id: 'elder-treant',
    characters: [NARRATOR_CHAR, KNIGHT_CHAR, MAGE_CHAR],
    lines: [
      {
        id: 'et-1',
        speakerId: 'narrator',
        text: "The old oak at the end of the path isn't an oak.",
      },
      {
        id: 'et-2',
        speakerId: 'mage',
        text: "Its bark's gone grey. Something has been feeding on it.",
      },
      {
        id: 'et-3',
        speakerId: 'knight',
        text: 'Can we help it?',
      },
      {
        id: 'et-4',
        speakerId: 'mage',
        text: "Not while it's swinging at us.",
      },
    ],
  },

  // ─── Mystery node scenes ────────────────────────────────────────────
  'fairy-ring': {
    id: 'fairy-ring',
    characters: [NARRATOR_CHAR, MYSTERY_CHAR],
    lines: [
      {
        id: 'fr-1',
        speakerId: 'narrator',
        text: "A ring of pale mushrooms. The grass inside hasn't been stepped on in a long time.",
      },
      {
        id: 'fr-2',
        speakerId: 'mystery',
        text: 'Not yet.',
      },
    ],
  },

  // ─── Trigger scenes ─────────────────────────────────────────────────
  'forest-arrival': {
    id: 'forest-arrival',
    characters: [NARRATOR_CHAR, MAGE_CHAR],
    lines: [
      {
        id: 'fa-1',
        speakerId: 'narrator',
        text: 'The road narrows to a dirt trail under the trees.',
      },
      {
        id: 'fa-2',
        speakerId: 'mage',
        text: 'Stay on the trail. I mean it.',
      },
    ],
  },
  'whispering-crossroads': {
    id: 'whispering-crossroads',
    characters: [NARRATOR_CHAR],
    lines: [
      {
        id: 'wc-1',
        speakerId: 'narrator',
        text: 'Someone has carved two arrows into a trunk here. One points east. The other points south, and has been scratched out.',
      },
    ],
  },
};
