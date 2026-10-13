import type { DialogueScene } from '~/types/dialogue';
import type { DialogueTrigger } from '~/types/map';
import { buildTutorialScene } from '~/lib/tutorial';

/**
 * Tutorial events, in walking order. Each spans every tile of a chokepoint so it can't be
 * walked around, and every combat lesson plays before the first FOE can spot the player.
 */
export const APPRENTICE_FORGE_DIALOGUE_TRIGGERS: DialogueTrigger[] = [
  { row: 4, col: 3, scene: 'tutorial-exploring', autoPlay: true },
  { row: 4, col: 4, scene: 'tutorial-exploring', autoPlay: true },
  { row: 4, col: 5, scene: 'tutorial-exploring', autoPlay: true },
  { row: 4, col: 6, scene: 'tutorial-exploring', autoPlay: true },
  { row: 6, col: 5, scene: 'tutorial-matching', autoPlay: true },
  { row: 6, col: 6, scene: 'tutorial-matching', autoPlay: true },
  { row: 7, col: 8, scene: 'tutorial-skills', autoPlay: true },
  { row: 8, col: 8, scene: 'tutorial-skills', autoPlay: true },
  { row: 7, col: 10, scene: 'tutorial-items', autoPlay: true },
  { row: 8, col: 10, scene: 'tutorial-items', autoPlay: true },
  { row: 7, col: 12, scene: 'tutorial-foes', autoPlay: true },
  { row: 8, col: 12, scene: 'tutorial-foes', autoPlay: true },
  // The west corridor down to the south hall: past the first fights.
  { row: 18, col: 3, scene: 'tutorial-victory', autoPlay: true },
  { row: 18, col: 4, scene: 'tutorial-victory', autoPlay: true },
  // The only way into the exit hall.
  { row: 24, col: 29, scene: 'tutorial-towns', autoPlay: true },
  { row: 24, col: 30, scene: 'tutorial-towns', autoPlay: true },
];

export const APPRENTICE_FORGE_DIALOGUE_SCENES: Record<string, DialogueScene> = {
  'tutorial-exploring': buildTutorialScene('tutorial-exploring', ['exploring']),
  'tutorial-matching': buildTutorialScene('tutorial-matching', ['matching', 'guard']),
  'tutorial-skills': buildTutorialScene('tutorial-skills', ['skills', 'enemies']),
  'tutorial-items': buildTutorialScene('tutorial-items', ['items']),
  'tutorial-foes': buildTutorialScene('tutorial-foes', ['foes']),
  'tutorial-victory': buildTutorialScene('tutorial-victory', ['victory', 'leveling']),
  'tutorial-towns': buildTutorialScene('tutorial-towns', ['towns']),
};
