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
  getPassiveById,
  getPassivesForClass,
  getUnlockedPassives,
  hasPreviousPassiveTier,
  unlockPassive,
  getCharacterPassiveModifiers,
  getPartyPassiveModifiers,
  IDENTITY_CHARACTER_PASSIVES,
  IDENTITY_PARTY_PASSIVES,
} from './skill-system';
import { calculateCharacterCooldown } from './rpg-calculations';
import {
  SKILL_REGISTRY,
  PASSIVE_REGISTRY,
  SKILLS_BY_CLASS,
  PASSIVES_BY_CLASS,
  DEFAULT_SKILL_BY_CLASS,
  classSheetIconCount,
} from '~/constants/skills';
import type { CharacterClass } from '~/types/rpg-elements';
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
    baseHp: 50,
    currentLevelExp: 100,
    vitHpMultiplier: 6,
    maxHp: 170,
    currentHp: 170,
    skillCooldown: 0,
    maxCooldown: 30,
    unlockedSkillIds: ['warrior-smash'],
    selectedSkillId: 'warrior-smash',
    unlockedPassiveIds: [],
    ...overrides,
  };
}

describe('registry shape', () => {
  const classes: CharacterClass[] = ['warrior', 'rogue', 'mage', 'healer'];

  it('has exactly 4 actives (tiers 0-3) and 4 passives (tiers 1-4) per class', () => {
    for (const cls of classes) {
      expect(SKILLS_BY_CLASS[cls].map((s) => s.tier)).toEqual([0, 1, 2, 3]);
      expect(PASSIVES_BY_CLASS[cls].map((p) => p.tier)).toEqual([1, 2, 3, 4]);
    }
  });

  it('derives every class default from its tier-0 active', () => {
    for (const cls of classes) {
      const starter = SKILLS_BY_CLASS[cls].find((s) => s.tier === 0)!;
      expect(DEFAULT_SKILL_BY_CLASS[cls]).toBe(starter.id);
      expect(starter.unlockLevel).toBe(1);
    }
  });

  it('keeps every icon position inside its class sheet', () => {
    const all = [...Object.values(SKILL_REGISTRY), ...Object.values(PASSIVE_REGISTRY)];
    for (const def of all) {
      const count = classSheetIconCount(def.class);
      const index = def.icon.row * 10 + def.icon.col;
      expect(index, `${def.id} icon out of range`).toBeLessThan(count);
      expect(def.icon.col).toBeGreaterThanOrEqual(0);
      expect(def.icon.col).toBeLessThan(10);
    }
  });

  it('never repeats an icon within a class (across actives and passives)', () => {
    for (const cls of classes) {
      const icons = [...SKILLS_BY_CLASS[cls], ...PASSIVES_BY_CLASS[cls]].map((d) => `${d.icon.row}:${d.icon.col}`);
      expect(new Set(icons).size).toBe(icons.length);
    }
  });
});

describe('getSkillById', () => {
  it('returns the definition for a known id', () => {
    expect(getSkillById('warrior-whirlwind')?.name).toBe('Whirlwind');
  });

  it('returns undefined for an unknown id', () => {
    expect(getSkillById('not-a-skill')).toBeUndefined();
  });
});

describe('getSkillsForClass', () => {
  it('returns only skills of that class', () => {
    const warriorSkills = getSkillsForClass('warrior');
    expect(warriorSkills.length).toBe(4);
    expect(warriorSkills.every((s) => s.class === 'warrior')).toBe(true);
  });
});

describe('getSelectedSkill', () => {
  it('returns the selected skill when valid', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-smash', 'warrior-whirlwind'],
      selectedSkillId: 'warrior-whirlwind',
    });
    expect(getSelectedSkill(char).id).toBe('warrior-whirlwind');
  });

  it('falls back to the class default when selectedSkillId is empty', () => {
    const char = makeCharacter({ selectedSkillId: '' });
    expect(getSelectedSkill(char).id).toBe('warrior-smash');
  });

  it('falls back to the class default when selectedSkillId is unknown', () => {
    const char = makeCharacter({ selectedSkillId: 'bogus' });
    expect(getSelectedSkill(char).id).toBe('warrior-smash');
  });
});

describe('getUnlockedSkills', () => {
  it('maps unlocked ids to definitions and skips unknown ids', () => {
    const char = makeCharacter({ unlockedSkillIds: ['warrior-smash', 'ghost-skill'] });
    const unlocked = getUnlockedSkills(char);
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe('warrior-smash');
  });
});

describe('isSkillUnlocked', () => {
  it('reflects the unlocked list', () => {
    const char = makeCharacter();
    expect(isSkillUnlocked(char, 'warrior-smash')).toBe(true);
    expect(isSkillUnlocked(char, 'warrior-whirlwind')).toBe(false);
  });
});

describe('unlockSkill', () => {
  it('adds a valid class skill', () => {
    const char = makeCharacter();
    const updated = unlockSkill(char, 'warrior-whirlwind');
    expect(updated.unlockedSkillIds).toContain('warrior-whirlwind');
  });

  it('does not duplicate an already-unlocked skill', () => {
    const char = makeCharacter();
    const updated = unlockSkill(char, 'warrior-smash');
    expect(updated.unlockedSkillIds).toHaveLength(1);
    expect(updated).toBe(char);
  });

  it('ignores unknown skill ids', () => {
    const char = makeCharacter();
    expect(unlockSkill(char, 'nope')).toBe(char);
  });

  it('ignores skills belonging to another class', () => {
    const char = makeCharacter();
    expect(unlockSkill(char, 'mage-fireball')).toBe(char);
  });

  it('does not mutate the original character', () => {
    const char = makeCharacter();
    unlockSkill(char, 'warrior-whirlwind');
    expect(char.unlockedSkillIds).toEqual(['warrior-smash']);
  });
});

describe('selectSkill', () => {
  it('switches to an unlocked skill', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-smash', 'warrior-whirlwind'],
    });
    expect(selectSkill(char, 'warrior-whirlwind').selectedSkillId).toBe('warrior-whirlwind');
  });

  it('does not switch to a locked skill', () => {
    const char = makeCharacter();
    expect(selectSkill(char, 'warrior-whirlwind')).toBe(char);
  });
});

describe('getNewlyUnlockableSkills', () => {
  it('returns class skills at or below the level that are not owned', () => {
    const char = makeCharacter();
    const unlockable = getNewlyUnlockableSkills(char, 7);
    expect(unlockable.map((s) => s.id)).toContain('warrior-whirlwind');
    expect(unlockable.map((s) => s.id)).not.toContain('warrior-smash'); // already owned
    expect(unlockable.map((s) => s.id)).not.toContain('warrior-overwhelm'); // unlockLevel 21 > 7
  });

  it('returns nothing when every qualifying skill is owned', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-smash', 'warrior-whirlwind'],
    });
    expect(getNewlyUnlockableSkills(char, 7)).toHaveLength(0);
  });
});

describe('resolveCharacterCooldown', () => {
  it('equals the base cooldown for a 1.0 multiplier skill', () => {
    const char = makeCharacter();
    expect(resolveCharacterCooldown(char)).toBeCloseTo(calculateCharacterCooldown(char));
  });

  it('applies a slower skill multiplier', () => {
    const char = makeCharacter({
      unlockedSkillIds: ['warrior-smash', 'warrior-whirlwind'],
      selectedSkillId: 'warrior-whirlwind',
    });
    const expected = calculateCharacterCooldown(char) * SKILL_REGISTRY['warrior-whirlwind'].cooldownMultiplier;
    expect(resolveCharacterCooldown(char)).toBeCloseTo(expected);
    expect(resolveCharacterCooldown(char)).toBeGreaterThan(calculateCharacterCooldown(char));
  });

  it('applies a faster skill multiplier', () => {
    const char = makeCharacter({
      class: 'healer',
      unlockedSkillIds: ['healer-heal', 'healer-salvation'],
      selectedSkillId: 'healer-salvation',
    });
    expect(resolveCharacterCooldown(char)).toBeLessThan(calculateCharacterCooldown(char));
  });

  it('applies a passive skillCooldownMultiplier on top of the skill multiplier', () => {
    const base = makeCharacter({
      class: 'mage',
      unlockedSkillIds: ['mage-fireball'],
      selectedSkillId: 'mage-fireball',
    });
    const hasted = {
      ...base,
      unlockedPassiveIds: ['mage-focus-boost', 'mage-mana-burst', 'mage-haste'],
    };
    expect(resolveCharacterCooldown(hasted)).toBeCloseTo(resolveCharacterCooldown(base) * 0.85);
  });
});

describe('passive lookups', () => {
  it('getPassiveById returns definitions and undefined for unknowns', () => {
    expect(getPassiveById('warrior-iron-skin')?.name).toBe('Iron Skin');
    expect(getPassiveById('nope')).toBeUndefined();
  });

  it('getPassivesForClass returns the 4-tier track in order', () => {
    expect(getPassivesForClass('rogue').map((p) => p.tier)).toEqual([1, 2, 3, 4]);
  });

  it('getUnlockedPassives skips unknown ids', () => {
    const char = makeCharacter({ unlockedPassiveIds: ['warrior-iron-skin', 'ghost'] });
    expect(getUnlockedPassives(char).map((p) => p.id)).toEqual(['warrior-iron-skin']);
  });
});

describe('unlockPassive', () => {
  it('unlocks tier 1 with no prerequisites', () => {
    const char = makeCharacter();
    const updated = unlockPassive(char, 'warrior-iron-skin');
    expect(updated.unlockedPassiveIds).toContain('warrior-iron-skin');
    expect(char.unlockedPassiveIds).toEqual([]); // pure
  });

  it('refuses a higher tier while a lower one is locked', () => {
    const char = makeCharacter();
    expect(hasPreviousPassiveTier(char, PASSIVE_REGISTRY['warrior-blood-roar'])).toBe(false);
    expect(unlockPassive(char, 'warrior-blood-roar')).toBe(char);
  });

  it('unlocks the next tier once the previous is owned', () => {
    const char = makeCharacter({ unlockedPassiveIds: ['warrior-iron-skin'] });
    expect(unlockPassive(char, 'warrior-blood-roar').unlockedPassiveIds).toContain('warrior-blood-roar');
  });

  it('ignores passives of another class and duplicates', () => {
    const char = makeCharacter({ unlockedPassiveIds: ['warrior-iron-skin'] });
    expect(unlockPassive(char, 'mage-focus-boost')).toBe(char);
    expect(unlockPassive(char, 'warrior-iron-skin')).toBe(char);
  });
});

describe('passive aggregation', () => {
  it('returns identity values when nothing is unlocked', () => {
    const char = makeCharacter();
    expect(getCharacterPassiveModifiers(char)).toEqual(IDENTITY_CHARACTER_PASSIVES);
    expect(getPartyPassiveModifiers([char])).toEqual(IDENTITY_PARTY_PASSIVES);
  });

  it('multiplies multiplicative keys and sums additive keys', () => {
    // Mage with Focus Boost (x1.15) and Overload (x1.25): product, not sum.
    const mage = makeCharacter({
      id: 'mage',
      class: 'mage',
      unlockedPassiveIds: ['mage-focus-boost', 'mage-mana-burst', 'mage-haste', 'mage-overload'],
    });
    const mods = getCharacterPassiveModifiers(mage);
    expect(mods.skillDamageMultiplier).toBeCloseTo(1.15 * 1.25);
    expect(mods.skillCooldownMultiplier).toBeCloseTo(0.85 * 1.15);
    expect(mods.matchDamageMultiplier).toBeCloseTo(1.15);
  });

  it('stacks party-wide guard decay from two classes multiplicatively', () => {
    const warrior = makeCharacter({ unlockedPassiveIds: ['warrior-iron-skin'] });
    const healer = makeCharacter({
      id: 'healer',
      class: 'healer',
      unlockedPassiveIds: ['healer-blessing-of-courage', 'healer-barrier-of-light', 'healer-aura-of-glory'],
    });
    const party = getPartyPassiveModifiers([warrior, healer]);
    expect(party.guardDecayResistanceMultiplier).toBeCloseTo(0.88 * 0.9);
    expect(party.itemCooldownSpdBonus).toBe(10);
  });

  it("keeps counting a KO'd member (resolve-once semantics)", () => {
    const warrior = makeCharacter({ unlockedPassiveIds: ['warrior-iron-skin'], currentHp: 0 });
    expect(getPartyPassiveModifiers([warrior]).guardDecayResistanceMultiplier).toBeCloseTo(0.88);
  });
});
