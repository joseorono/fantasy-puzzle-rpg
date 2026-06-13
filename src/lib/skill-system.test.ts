import { describe, it, expect } from 'vitest';
import {
  getSkillById,
  getSkillsForClass,
  getSelectedSkill,
  getUnlockedSkills,
  isSkillUnlocked,
  unlockSkill,
  selectSkill,
  getNewlyUnlockableSkills,
  resolveCharacterCooldown,
} from './skill-system';
import { calculateCharacterCooldown } from './rpg-calculations';
import { SKILL_REGISTRY } from '~/constants/skills';
import type { CharacterData } from '~/types/rpg-elements';

function makeCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    id: 'warrior',
    name: 'Warrior',
    class: 'warrior',
    color: 'blue',
    stats: { pow: 10, vit: 20, spd: 5 },
    potentialStats: { pow: 30, vit: 30, spd: 10 },
    level: 1,
    currentExp: 0,
    baseHp: 50,
    expToNextLevel: 100,
    vitHpMultiplier: 6,
    maxHp: 170,
    currentHp: 170,
    skillCooldown: 0,
    maxCooldown: 30,
    unlockedSkillIds: ['warrior-power-strike'],
    selectedSkillId: 'warrior-power-strike',
    ...overrides,
  };
}

describe('getSkillById', () => {
  it('returns the definition for a known id', () => {
    expect(getSkillById('warrior-cleave')?.name).toBe('Cleave');
  });

  it('returns undefined for an unknown id', () => {
    expect(getSkillById('not-a-skill')).toBeUndefined();
  });
});

describe('getSkillsForClass', () => {
  it('returns only skills of that class', () => {
    const warriorSkills = getSkillsForClass('warrior');
    expect(warriorSkills.length).toBeGreaterThanOrEqual(2);
    expect(warriorSkills.every((s) => s.class === 'warrior')).toBe(true);
  });
});

describe('getSelectedSkill', () => {
  it('returns the selected skill when valid', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-power-strike', 'warrior-cleave'],
      selectedSkillId: 'warrior-cleave',
    });
    expect(getSelectedSkill(char).id).toBe('warrior-cleave');
  });

  it('falls back to the class default when selectedSkillId is empty', () => {
    const char = makeCharacter({ selectedSkillId: '' });
    expect(getSelectedSkill(char).id).toBe('warrior-power-strike');
  });

  it('falls back to the class default when selectedSkillId is unknown', () => {
    const char = makeCharacter({ selectedSkillId: 'bogus' });
    expect(getSelectedSkill(char).id).toBe('warrior-power-strike');
  });
});

describe('getUnlockedSkills', () => {
  it('maps unlocked ids to definitions and skips unknown ids', () => {
    const char = makeCharacter({ unlockedSkillIds: ['warrior-power-strike', 'ghost-skill'] });
    const unlocked = getUnlockedSkills(char);
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe('warrior-power-strike');
  });
});

describe('isSkillUnlocked', () => {
  it('reflects the unlocked list', () => {
    const char = makeCharacter();
    expect(isSkillUnlocked(char, 'warrior-power-strike')).toBe(true);
    expect(isSkillUnlocked(char, 'warrior-cleave')).toBe(false);
  });
});

describe('unlockSkill', () => {
  it('adds a valid class skill', () => {
    const char = makeCharacter();
    const updated = unlockSkill(char, 'warrior-cleave');
    expect(updated.unlockedSkillIds).toContain('warrior-cleave');
  });

  it('does not duplicate an already-unlocked skill', () => {
    const char = makeCharacter();
    const updated = unlockSkill(char, 'warrior-power-strike');
    expect(updated.unlockedSkillIds).toHaveLength(1);
    expect(updated).toBe(char);
  });

  it('ignores unknown skill ids', () => {
    const char = makeCharacter();
    expect(unlockSkill(char, 'nope')).toBe(char);
  });

  it('ignores skills belonging to another class', () => {
    const char = makeCharacter();
    expect(unlockSkill(char, 'mage-arcane-blast')).toBe(char);
  });

  it('does not mutate the original character', () => {
    const char = makeCharacter();
    unlockSkill(char, 'warrior-cleave');
    expect(char.unlockedSkillIds).toEqual(['warrior-power-strike']);
  });
});

describe('selectSkill', () => {
  it('switches to an unlocked skill', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-power-strike', 'warrior-cleave'],
    });
    expect(selectSkill(char, 'warrior-cleave').selectedSkillId).toBe('warrior-cleave');
  });

  it('does not switch to a locked skill', () => {
    const char = makeCharacter();
    expect(selectSkill(char, 'warrior-cleave')).toBe(char);
  });
});

describe('getNewlyUnlockableSkills', () => {
  it('returns class skills at or below the level that are not owned', () => {
    const char = makeCharacter();
    const unlockable = getNewlyUnlockableSkills(char, 3);
    expect(unlockable.map((s) => s.id)).toContain('warrior-cleave');
    expect(unlockable.map((s) => s.id)).not.toContain('warrior-power-strike'); // already owned
    expect(unlockable.map((s) => s.id)).not.toContain('warrior-execute'); // unlockLevel 6 > 3
  });

  it('returns nothing when every qualifying skill is owned', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-power-strike', 'warrior-cleave'],
    });
    expect(getNewlyUnlockableSkills(char, 3)).toHaveLength(0);
  });
});

describe('resolveCharacterCooldown', () => {
  it('equals the base cooldown for a 1.0 multiplier skill', () => {
    const char = makeCharacter();
    expect(resolveCharacterCooldown(char)).toBeCloseTo(calculateCharacterCooldown(char));
  });

  it('applies a slower skill multiplier', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-power-strike', 'warrior-cleave'],
      selectedSkillId: 'warrior-cleave',
    });
    const expected = calculateCharacterCooldown(char) * SKILL_REGISTRY['warrior-cleave'].cooldownMultiplier;
    expect(resolveCharacterCooldown(char)).toBeCloseTo(expected);
    expect(resolveCharacterCooldown(char)).toBeGreaterThan(calculateCharacterCooldown(char));
  });

  it('applies a faster skill multiplier', () => {
    const char = makeCharacter({
      class: 'healer',
      unlockedSkillIds: ['healer-divine-heal', 'healer-mending-touch'],
      selectedSkillId: 'healer-mending-touch',
    });
    expect(resolveCharacterCooldown(char)).toBeLessThan(calculateCharacterCooldown(char));
  });
});
