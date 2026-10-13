import type { FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';

export type TutorialTopicId =
  | 'exploring'
  | 'matching'
  | 'guard'
  | 'skills'
  | 'enemies'
  | 'items'
  | 'foes'
  | 'victory'
  | 'leveling'
  | 'towns';

/** One mechanic, explained in a few short lines. Each line is one dialogue line on the map and one bullet in the menu. */
export interface TutorialTopic {
  id: TutorialTopicId;
  title: string;
  iconName: FrostyRpgIconName;
  lines: readonly string[];
}
