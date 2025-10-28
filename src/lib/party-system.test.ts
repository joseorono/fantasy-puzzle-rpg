import { describe, it, expect } from 'vitest';
import type { CharacterData } from '~/types/rpg-elements';
import { fullyHealParty, damageAllPartyMembers } from './party-system';

const createTestCharacter = (overrides: Partial<CharacterData> = {}): CharacterData => ({
  id: 'test-warrior',
  name: 'Test Warrior',
  class: 'warrior',
  color: 'blue',
  pow: 15,
  vit: 20,
  spd: 5,
  vitHpMultiplier: 6,
  maxHp: 100,
  currentHp: 50,
  skillCooldown: 0,
  maxCooldown: 3,
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
      expect(result[2].pow).toBe(15);
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
});
