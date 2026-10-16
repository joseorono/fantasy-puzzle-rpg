import type { ReactNode } from 'react';

/** The chest designs on Admurin's sheet, top to bottom. */
export type ChestVariant = 'wood' | 'ebony' | 'royal' | 'frost';

/** Each variant has two rows: a looping idle glint, then the lid opening. */
export type ChestAnimationRow = 'idle' | 'open';

/** One piece of loot as it launches out of an opened chest. */
export interface ChestLootIcon {
  key: string;
  kind: 'equipment' | 'consumable' | 'resource';
  icon: ReactNode;
  /** Tints the halo behind the icon; equipment carries its rarity colour. */
  color?: string;
}
