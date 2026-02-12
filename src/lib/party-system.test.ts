import { describe, it, expect } from 'vitest';
import type { CharacterData } from '~/types/rpg-elements';
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

const createTestCharacter = (overrides: Partial<CharacterData> = {}): CharacterData => ({
  id: 'test-warrior',
  name: 'Test Warrior',
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

const testParty: CharacterData[] = [
  createTestCharacter({ id: 'warrior', name: 'Warrior', class: 'warrior', currentHp: 50, maxHp: 100 }),
  createTestCharacter({ id: 'rogue', name: 'Rogue', class: 'rogue', currentHp: 30, maxHp: 60 }),
  createTestCharacter({ id: 'mage', name: 'Mage', class: 'mage', currentHp: 20, maxHp: 50 }),
];

describe('party system utilities', () => {
  describe('fullyHealParty', () => {
    it('should heal all party members to max HP', () => {
      const result = fullyHealParty(testParty);
      expect(result[0].currentHp).toBe(100);
      expect(result[1].currentHp).toBe(60);
      expect(result[2].currentHp).toBe(50);
    });

    it('should not modify max HP values', () => {
      const result = fullyHealParty(testParty);
      expect(result[0].maxHp).toBe(100);
      expect(result[1].maxHp).toBe(60);
      expect(result[2].maxHp).toBe(50);
    });

    it('should preserve other character properties', () => {
      const result = fullyHealParty(testParty);
      expect(result[0].name).toBe('Warrior');
      expect(result[1].class).toBe('rogue');
      expect(result[2].stats.pow).toBe(15);
    });

    it('should work with single member party', () => {
      const singleParty = [createTestCharacter({ currentHp: 10, maxHp: 100 })];
      const result = fullyHealParty(singleParty);
      expect(result[0].currentHp).toBe(100);
    });

    it('should work with already fully healed party', () => {
      const fullyHealed = [
        createTestCharacter({ currentHp: 100, maxHp: 100 }),
        createTestCharacter({ currentHp: 60, maxHp: 60 }),
      ];
      const result = fullyHealParty(fullyHealed);
      expect(result[0].currentHp).toBe(100);
      expect(result[1].currentHp).toBe(60);
    });

    it('should not mutate original party', () => {
      const original = [...testParty];
      fullyHealParty(testParty);
      expect(testParty[0].currentHp).toBe(50);
      expect(testParty).toEqual(original);
    });
  });

  describe('isPartyFullyHealed', () => {
    it('should return false when any member is not at full HP', () => {
      expect(isPartyFullyHealed(testParty)).toBe(false);
    });

    it('should return true when all members are at full HP', () => {
      const fullParty = [
        createTestCharacter({ currentHp: 100, maxHp: 100 }),
        createTestCharacter({ currentHp: 60, maxHp: 60 }),
      ];
      expect(isPartyFullyHealed(fullParty)).toBe(true);
    });
  });

  describe('damageAllPartyMembers', () => {
    it('should damage all party members by given amount', () => {
      const result = damageAllPartyMembers(testParty, 10);
      expect(result[0].currentHp).toBe(40);
      expect(result[1].currentHp).toBe(20);
      expect(result[2].currentHp).toBe(10);
    });

    it('should not let HP go below 1 by default', () => {
      const result = damageAllPartyMembers(testParty, 100);
      expect(result[0].currentHp).toBe(1);
      expect(result[1].currentHp).toBe(1);
      expect(result[2].currentHp).toBe(1);
    });

    it('should allow HP to reach 0 when canDie is true', () => {
      const result = damageAllPartyMembers(testParty, 100, true);
      expect(result[0].currentHp).toBe(0);
      expect(result[1].currentHp).toBe(0);
      expect(result[2].currentHp).toBe(0);
    });

    it('should allow HP to go to 0, but not below 0', () => {
      const result = damageAllPartyMembers(testParty, 150, true);
      expect(result[0].currentHp).toBe(0);
      expect(result[1].currentHp).toBe(0);
      expect(result[2].currentHp).toBe(0);
      // Not below 0
      expect(result[0].currentHp).toBeGreaterThanOrEqual(0);
      expect(result[1].currentHp).toBeGreaterThanOrEqual(0);
      expect(result[2].currentHp).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero damage', () => {
      const result = damageAllPartyMembers(testParty, 0);
      expect(result[0].currentHp).toBe(50);
      expect(result[1].currentHp).toBe(30);
      expect(result[2].currentHp).toBe(20);
    });

    it('should preserve other character properties', () => {
      const result = damageAllPartyMembers(testParty, 10);
      expect(result[0].name).toBe('Warrior');
      expect(result[1].class).toBe('rogue');
      expect(result[2].maxHp).toBe(50);
    });

    it('should work with single member party', () => {
      const singleParty = [createTestCharacter({ currentHp: 50, maxHp: 100 })];
      const result = damageAllPartyMembers(singleParty, 20);
      expect(result[0].currentHp).toBe(30);
    });

    it('should not mutate original party', () => {
      const original = [...testParty];
      damageAllPartyMembers(testParty, 10);
      expect(testParty[0].currentHp).toBe(50);
      expect(testParty).toEqual(original);
    });

    it('should handle partial damage with canDie false', () => {
      const party = [createTestCharacter({ currentHp: 5, maxHp: 100 })];
      const result = damageAllPartyMembers(party, 10, false);
      expect(result[0].currentHp).toBe(1);
    });

    it('should handle partial damage with canDie true', () => {
      const party = [createTestCharacter({ currentHp: 5, maxHp: 100 })];
      const result = damageAllPartyMembers(party, 10, true);
      expect(result[0].currentHp).toBe(0);
    });
  });

  describe('getLivingMembers', () => {
    it('should return only members with HP > 0', () => {
      const party = [
        createTestCharacter({ id: 'alive1', currentHp: 50, maxHp: 100 }),
        createTestCharacter({ id: 'dead', currentHp: 0, maxHp: 60 }),
        createTestCharacter({ id: 'alive2', currentHp: 1, maxHp: 50 }),
      ];
      const result = getLivingMembers(party);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('alive1');
      expect(result[1].id).toBe('alive2');
    });

    it('should return empty array when all members are dead', () => {
      const party = [
        createTestCharacter({ currentHp: 0, maxHp: 100 }),
        createTestCharacter({ currentHp: 0, maxHp: 60 }),
      ];
      expect(getLivingMembers(party)).toHaveLength(0);
    });

    it('should return all members when all are alive', () => {
      expect(getLivingMembers(testParty)).toHaveLength(3);
    });

    it('should not mutate original party', () => {
      const party = [
        createTestCharacter({ currentHp: 50, maxHp: 100 }),
        createTestCharacter({ currentHp: 0, maxHp: 60 }),
      ];
      const original = [...party];
      getLivingMembers(party);
      expect(party).toEqual(original);
    });
  });

  describe('getHealableMembers', () => {
    it('should return living members not at full HP, sorted by HP% ascending', () => {
      const party = [
        createTestCharacter({ id: 'half', currentHp: 50, maxHp: 100 }), // 50%
        createTestCharacter({ id: 'full', currentHp: 60, maxHp: 60 }), // 100% - excluded
        createTestCharacter({ id: 'low', currentHp: 10, maxHp: 50 }), // 20%
      ];
      const result = getHealableMembers(party);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('low'); // 20% first
      expect(result[1].id).toBe('half'); // 50% second
    });

    it('should exclude dead members', () => {
      const party = [
        createTestCharacter({ id: 'dead', currentHp: 0, maxHp: 100 }),
        createTestCharacter({ id: 'hurt', currentHp: 30, maxHp: 60 }),
      ];
      const result = getHealableMembers(party);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('hurt');
    });

    it('should return empty array when all members are at full HP', () => {
      const party = [
        createTestCharacter({ currentHp: 100, maxHp: 100 }),
        createTestCharacter({ currentHp: 60, maxHp: 60 }),
      ];
      expect(getHealableMembers(party)).toHaveLength(0);
    });

    it('should return empty array when all members are dead', () => {
      const party = [
        createTestCharacter({ currentHp: 0, maxHp: 100 }),
        createTestCharacter({ currentHp: 0, maxHp: 60 }),
      ];
      expect(getHealableMembers(party)).toHaveLength(0);
    });
  });

  describe('damagePartyMember', () => {
    it('should damage only the targeted member', () => {
      const result = damagePartyMember(testParty, 'warrior', 20);
      expect(result[0].currentHp).toBe(30); // 50 - 20
      expect(result[1].currentHp).toBe(30); // unchanged
      expect(result[2].currentHp).toBe(20); // unchanged
    });

    it('should clamp HP to 0', () => {
      const result = damagePartyMember(testParty, 'mage', 999);
      expect(result[2].currentHp).toBe(0);
    });

    it('should not mutate original party', () => {
      const original = testParty.map((c) => ({ ...c }));
      damagePartyMember(testParty, 'warrior', 20);
      expect(testParty[0].currentHp).toBe(original[0].currentHp);
    });

    it('should return unchanged party if characterId not found', () => {
      const result = damagePartyMember(testParty, 'nonexistent', 20);
      expect(result[0].currentHp).toBe(50);
      expect(result[1].currentHp).toBe(30);
      expect(result[2].currentHp).toBe(20);
    });

    it('should handle zero damage', () => {
      const result = damagePartyMember(testParty, 'warrior', 0);
      expect(result[0].currentHp).toBe(50);
    });
  });

  describe('healPartyMember', () => {
    it('should heal only the targeted member', () => {
      const result = healPartyMember(testParty, 'mage', 15);
      expect(result[0].currentHp).toBe(50); // unchanged
      expect(result[1].currentHp).toBe(30); // unchanged
      expect(result[2].currentHp).toBe(35); // 20 + 15
    });

    it('should clamp HP to maxHp', () => {
      const result = healPartyMember(testParty, 'mage', 999);
      expect(result[2].currentHp).toBe(50); // maxHp
    });

    it('should not mutate original party', () => {
      const original = testParty.map((c) => ({ ...c }));
      healPartyMember(testParty, 'mage', 15);
      expect(testParty[2].currentHp).toBe(original[2].currentHp);
    });

    it('should return unchanged party if characterId not found', () => {
      const result = healPartyMember(testParty, 'nonexistent', 20);
      expect(result[0].currentHp).toBe(50);
      expect(result[1].currentHp).toBe(30);
      expect(result[2].currentHp).toBe(20);
    });
  });

  describe('healAllLivingPartyMembers', () => {
    it('should heal all living members clamped to maxHp', () => {
      const result = healAllLivingPartyMembers(testParty, 999);
      expect(result[0].currentHp).toBe(100);
      expect(result[1].currentHp).toBe(60);
      expect(result[2].currentHp).toBe(50);
    });

    it('should not heal dead members', () => {
      const party = [
        createTestCharacter({ id: 'dead', currentHp: 0, maxHp: 100 }),
        createTestCharacter({ id: 'alive', currentHp: 10, maxHp: 50 }),
      ];
      const result = healAllLivingPartyMembers(party, 25);
      expect(result[0].currentHp).toBe(0);
      expect(result[1].currentHp).toBe(35);
    });
  });

  describe('isPartyDefeated', () => {
    it('should return true when all members have 0 HP', () => {
      const party = [
        createTestCharacter({ currentHp: 0, maxHp: 100 }),
        createTestCharacter({ currentHp: 0, maxHp: 60 }),
        createTestCharacter({ currentHp: 0, maxHp: 50 }),
      ];
      expect(isPartyDefeated(party)).toBe(true);
    });

    it('should return false when any member has HP > 0', () => {
      const party = [
        createTestCharacter({ currentHp: 0, maxHp: 100 }),
        createTestCharacter({ currentHp: 1, maxHp: 60 }),
        createTestCharacter({ currentHp: 0, maxHp: 50 }),
      ];
      expect(isPartyDefeated(party)).toBe(false);
    });

    it('should return false for a healthy party', () => {
      expect(isPartyDefeated(testParty)).toBe(false);
    });

    it('should return true for empty party', () => {
      expect(isPartyDefeated([])).toBe(true);
    });
  });
});
