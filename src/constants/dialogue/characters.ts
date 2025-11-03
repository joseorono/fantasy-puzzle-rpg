import type { DialogueCharacter } from '~/types/dialogue';

export type DialogueCharacterId = 'innkeeper' | 'witch' | 'knight' | 'mage' | 'narrator' | 'mystery';

export const INNKEEPER_CHAR: DialogueCharacter = {
  id: 'innkeeper',
  name: 'Innkeeper',
  portrait: '/assets/portraits/Innkeeper_02.png',
  side: 'left',
};

export const WITCH_CHAR: DialogueCharacter = {
  id: 'witch',
  name: 'Mysterious Witch',
  portrait: '/assets/portraits/Witch_03.png',
  side: 'right',
};

export const KNIGHT_CHAR: DialogueCharacter = {
  id: 'knight',
  name: 'Sir Roland',
  portrait: '/assets/portraits/Innkeeper_02.png',
  side: 'left',
};

export const MAGE_CHAR: DialogueCharacter = {
  id: 'mage',
  name: 'Elara',
  portrait: '/assets/portraits/Witch_03.png',
  side: 'right',
};

export const NARRATOR_CHAR: DialogueCharacter = {
  id: 'narrator',
  side: 'center',
};

export const MYSTERY_CHAR: DialogueCharacter = {
  id: 'mystery',
  name: '???',
  side: 'center',
};

export const CharacterList: DialogueCharacterId[] = [
  'innkeeper',
  'witch',
  'knight',
  'mage',
  'narrator',
  'mystery',
];

