import { bench, describe } from 'vitest';
import {
  fullyHealParty,
  isPartyFullyHealed,
  damageAllPartyMembers,
  getLivingMembers,
  getHealableMembers,
  damagePartyMember,
  healPartyMember,
  healAllLivingPartyMembers,
  isPartyDefeated,
} from './party-system';
import type { CharacterData } from '~/types/rpg-elements';

const makeChar = (overrides: Partial<CharacterData> = {}): CharacterData => ({
  id: 'warrior',
  name: 'Warrior',
  class: 'warrior',
  color: 'blue',
  stats: { pow: 15, vit: 20, spd: 5 },
  vitHpMultiplier: 6,
  maxHp: 100,
  currentHp: 50,
  skillCooldown: 0,
  maxCooldown: 3,
  baseHp: 100,
  potentialStats: { pow: 15, vit: 20, spd: 5 },
  level: 1,
  expToNextLevel: 100,
  ...overrides,
});

const threeParty: CharacterData[] = [
  makeChar({ id: 'warrior', currentHp: 50, maxHp: 100 }),
  makeChar({ id: 'rogue', currentHp: 30, maxHp: 60 }),
  makeChar({ id: 'mage', currentHp: 20, maxHp: 50 }),
];

const mixedParty: CharacterData[] = [
  makeChar({ id: 'alive1', currentHp: 50, maxHp: 100 }),
  makeChar({ id: 'dead', currentHp: 0, maxHp: 60 }),
  makeChar({ id: 'alive2', currentHp: 1, maxHp: 50 }),
];

describe('fullyHealParty', () => {
  bench('3 members', () => {
    fullyHealParty(threeParty);
  });
});

describe('isPartyFullyHealed', () => {
  bench('not fully healed', () => {
    isPartyFullyHealed(threeParty);
  });
});

describe('damageAllPartyMembers', () => {
  bench('damage (canDie=false)', () => {
    damageAllPartyMembers(threeParty, 10);
  });

  bench('damage (canDie=true)', () => {
    damageAllPartyMembers(threeParty, 100, true);
  });
});

describe('getLivingMembers', () => {
  bench('mixed party', () => {
    getLivingMembers(mixedParty);
  });
});

describe('getHealableMembers', () => {
  bench('mixed party', () => {
    getHealableMembers(mixedParty);
  });
});

describe('damagePartyMember', () => {
  bench('damage single member', () => {
    damagePartyMember(threeParty, 'warrior', 20);
  });
});

describe('healPartyMember', () => {
  bench('heal single member', () => {
    healPartyMember(threeParty, 'mage', 15);
  });
});

describe('healAllLivingPartyMembers', () => {
  bench('heal all living (3 members)', () => {
    healAllLivingPartyMembers(threeParty, 25);
  });
});

describe('isPartyDefeated', () => {
  bench('alive party', () => {
    isPartyDefeated(threeParty);
  });

  bench('defeated party', () => {
    isPartyDefeated([
      makeChar({ currentHp: 0 }),
      makeChar({ currentHp: 0 }),
      makeChar({ currentHp: 0 }),
    ]);
  });
});
