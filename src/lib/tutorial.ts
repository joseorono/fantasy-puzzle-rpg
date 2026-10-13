import type { DialogueScene } from '~/types/dialogue';
import type { TutorialTopicId } from '~/types/tutorial';
import { NARRATOR_CHAR } from '~/constants/dialogue/characters';
import { TUTORIAL_TOPICS } from '~/constants/tutorial';

/**
 * Builds a narrated dialogue scene from tutorial topics, so map events reuse the exact
 * text the pause menu's Tutorial tab shows.
 *
 * @param sceneId The scene's id; also the key it's registered under in a map's `dialogueScenes`.
 * @param topicIds Topics to narrate, in order.
 * @returns A scene with one narrator line per topic line, ids `${sceneId}-${n}`.
 */
export function buildTutorialScene(sceneId: string, topicIds: readonly TutorialTopicId[]): DialogueScene {
  const texts = topicIds.flatMap((topicId) => TUTORIAL_TOPICS[topicId].lines);
  return {
    id: sceneId,
    characters: [NARRATOR_CHAR],
    lines: texts.map((text, index) => ({ id: `${sceneId}-${index + 1}`, speakerId: NARRATOR_CHAR.id, text })),
  };
}
