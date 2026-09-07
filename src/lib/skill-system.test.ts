import { describe, it, expect } from 'vitest';
import {
  getSkillById,
  getSkillsForClass,
  getSelectedSkill,
  getUnlockedSkills,
  isSkillUnlocked,
  unlockSkill,
  hasPreviousActiveTier,
  selectSkill,
  getNewlyUnlockableSkills,
  resolveCharacterCooldown,
  getSkillLevel,
  resolveActiveSkillStats,
  resolvePassiveModifiers,
  getNextActiveUpgrade,
  getNextPassiveUpgrade,
  canUpgradeSkill,
  canUpgradePassive,
  upgradeSkill,
  upgradePassive,
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
import type { Resources } from '~/types/resources';
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
    skillLevels: {},
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

  it('prices every unlock: tier-0 actives are free, everything else costs resources', () => {
    const totalCost = (cost: Resources) => Object.values(cost).reduce((sum: number, v: number) => sum + v, 0);
    for (const cls of classes) {
      for (const skill of SKILLS_BY_CLASS[cls]) {
        if (skill.tier === 0) expect(totalCost(skill.cost), `${skill.id} should be free`).toBe(0);
        else expect(totalCost(skill.cost), `${skill.id} should cost resources`).toBeGreaterThan(0);
      }
      for (const passive of PASSIVES_BY_CLASS[cls]) {
        expect(totalCost(passive.cost), `${passive.id} should cost resources`).toBeGreaterThan(0);
      }
    }
  });
});

describe('registry level tables', () => {
  const classes: CharacterClass[] = ['warrior', 'rogue', 'mage', 'healer'];
  const totalCost = (cost: Resources) => Object.values(cost).reduce((sum: number, v: number) => sum + v, 0);
  const allDefs = [...Object.values(SKILL_REGISTRY), ...Object.values(PASSIVE_REGISTRY)];

  it('gives every skill 4 levels and a full upgrade table', () => {
    for (const def of allDefs) {
      expect(def.maxLevel, `${def.id} maxLevel`).toBe(4);
      expect(def.levelUpgrades.length, `${def.id} table length`).toBe(def.maxLevel - 1);
    }
  });

  it('gates each level at a strictly increasing character level above the unlock level', () => {
    for (const def of allDefs) {
      let previous = def.unlockLevel;
      for (const upgrade of def.levelUpgrades) {
        expect(upgrade.requiredCharacterLevel, `${def.id} gate order`).toBeGreaterThan(previous);
        previous = upgrade.requiredCharacterLevel;
      }
    }
  });

  it('finishes every skill’s gates before the next tier unlocks', () => {
    for (const cls of classes) {
      for (const track of [SKILLS_BY_CLASS[cls], PASSIVES_BY_CLASS[cls]] as const) {
        for (let i = 0; i < track.length - 1; i++) {
          const nextUnlock = track[i + 1].unlockLevel;
          for (const upgrade of track[i].levelUpgrades) {
            expect(upgrade.requiredCharacterLevel, `${track[i].id} gate vs ${track[i + 1].id}`).toBeLessThan(nextUnlock);
          }
        }
      }
    }
  });

  it('prices every upgrade step, tier-0 actives included', () => {
    for (const def of allDefs) {
      for (const upgrade of def.levelUpgrades) {
        expect(totalCost(upgrade.cost), `${def.id} upgrade should cost resources`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps every passive upgrade record on the same key set as its baseline', () => {
    for (const passive of Object.values(PASSIVE_REGISTRY)) {
      const baseKeys = Object.keys(passive.modifiers).sort();
      for (const upgrade of passive.levelUpgrades) {
        expect(Object.keys(upgrade.modifiers).sort(), `${passive.id} upgrade keys`).toEqual(baseKeys);
      }
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

  it('refuses a higher tier while a lower one is locked', () => {
    const char = makeCharacter();
    expect(unlockSkill(char, 'warrior-sharp-blow')).toBe(char);
    expect(unlockSkill(char, 'warrior-overwhelm')).toBe(char);
  });

  it('unlocks the next tier once every lower tier is owned', () => {
    const char = makeCharacter({ unlockedSkillIds: ['warrior-smash', 'warrior-whirlwind'] });
    expect(unlockSkill(char, 'warrior-sharp-blow').unlockedSkillIds).toContain('warrior-sharp-blow');
  });
});

describe('hasPreviousActiveTier', () => {
  it('is true for the starter tier', () => {
    expect(hasPreviousActiveTier(makeCharacter(), SKILL_REGISTRY['warrior-smash'])).toBe(true);
  });

  it('is true for tier 1 with the starter owned', () => {
    expect(hasPreviousActiveTier(makeCharacter(), SKILL_REGISTRY['warrior-whirlwind'])).toBe(true);
  });

  it('is false for tier 2 while tier 1 is locked', () => {
    expect(hasPreviousActiveTier(makeCharacter(), SKILL_REGISTRY['warrior-sharp-blow'])).toBe(false);
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

  it('uses the selected skill’s level-resolved cooldown multiplier', () => {
    // Overwhelm’s capstone shaves its charge from ×1.6 to ×1.5.
    const base = makeCharacter({
      unlockedSkillIds: ['warrior-smash', 'warrior-whirlwind', 'warrior-sharp-blow', 'warrior-overwhelm'],
      selectedSkillId: 'warrior-overwhelm',
    });
    const maxed = { ...base, skillLevels: { 'warrior-overwhelm': 4 } };
    expect(resolveCharacterCooldown(base)).toBeCloseTo(calculateCharacterCooldown(base) * 1.6);
    expect(resolveCharacterCooldown(maxed)).toBeCloseTo(calculateCharacterCooldown(maxed) * 1.5);
  });
});

describe('getSkillLevel', () => {
  it('defaults to 1 for an empty map or unknown id', () => {
    const char = makeCharacter();
    expect(getSkillLevel(char, 'warrior-smash')).toBe(1);
    expect(getSkillLevel(char, 'nope')).toBe(1);
  });

  it('reads the stored level', () => {
    const char = makeCharacter({ skillLevels: { 'warrior-smash': 3 } });
    expect(getSkillLevel(char, 'warrior-smash')).toBe(3);
  });
});

describe('resolveActiveSkillStats', () => {
  const smash = SKILL_REGISTRY['warrior-smash'];

  it('returns the baseline fields at level 1', () => {
    expect(resolveActiveSkillStats(smash, 1)).toEqual({
      baseDamageMultiplier: smash.baseDamageMultiplier,
      flatDamageBonus: smash.flatDamageBonus,
      cooldownMultiplier: smash.cooldownMultiplier,
    });
  });

  it('indexes the upgrade table for levels 2..maxLevel', () => {
    expect(resolveActiveSkillStats(smash, 2)).toMatchObject(
      // levelUpgrades[0] is level 2 — compare against the table itself.
      {
        baseDamageMultiplier: smash.levelUpgrades[0].baseDamageMultiplier,
        flatDamageBonus: smash.levelUpgrades[0].flatDamageBonus,
      },
    );
    expect(resolveActiveSkillStats(smash, 4).baseDamageMultiplier).toBe(
      smash.levelUpgrades[2].baseDamageMultiplier,
    );
  });

  it('clamps below 1 and above maxLevel', () => {
    expect(resolveActiveSkillStats(smash, 0)).toEqual(resolveActiveSkillStats(smash, 1));
    expect(resolveActiveSkillStats(smash, 99)).toEqual(resolveActiveSkillStats(smash, smash.maxLevel));
  });
});

describe('resolvePassiveModifiers', () => {
  const ironSkin = PASSIVE_REGISTRY['warrior-iron-skin'];

  it('returns the baseline record at level 1 and clamps below 1', () => {
    expect(resolvePassiveModifiers(ironSkin, 1)).toBe(ironSkin.modifiers);
    expect(resolvePassiveModifiers(ironSkin, 0)).toBe(ironSkin.modifiers);
  });

  it('indexes the upgrade table for levels 2..maxLevel and clamps above', () => {
    expect(resolvePassiveModifiers(ironSkin, 2)).toBe(ironSkin.levelUpgrades[0].modifiers);
    expect(resolvePassiveModifiers(ironSkin, 99)).toBe(ironSkin.levelUpgrades[2].modifiers);
  });
});

describe('getNextActiveUpgrade / getNextPassiveUpgrade', () => {
  it('returns the entry that buys the next level', () => {
    const smash = SKILL_REGISTRY['warrior-smash'];
    expect(getNextActiveUpgrade(smash, 1)).toBe(smash.levelUpgrades[0]);
    expect(getNextActiveUpgrade(smash, 3)).toBe(smash.levelUpgrades[2]);
    const ironSkin = PASSIVE_REGISTRY['warrior-iron-skin'];
    expect(getNextPassiveUpgrade(ironSkin, 2)).toBe(ironSkin.levelUpgrades[1]);
  });

  it('returns undefined at max level', () => {
    expect(getNextActiveUpgrade(SKILL_REGISTRY['warrior-smash'], 4)).toBeUndefined();
    expect(getNextPassiveUpgrade(PASSIVE_REGISTRY['warrior-iron-skin'], 4)).toBeUndefined();
  });
});

describe('canUpgradeSkill / upgradeSkill', () => {
  const gate2 = SKILL_REGISTRY['warrior-smash'].levelUpgrades[0].requiredCharacterLevel;

  it('rejects unknown ids, other classes, and locked skills', () => {
    const char = makeCharacter({ level: 99 });
    expect(canUpgradeSkill(char, 'nope')).toBe(false);
    expect(canUpgradeSkill(char, 'mage-fireball')).toBe(false);
    expect(canUpgradeSkill(char, 'warrior-whirlwind')).toBe(false); // not unlocked
  });

  it('rejects a character below the level gate', () => {
    const char = makeCharacter({ level: gate2 - 1 });
    expect(canUpgradeSkill(char, 'warrior-smash')).toBe(false);
    expect(upgradeSkill(char, 'warrior-smash')).toBe(char);
  });

  it('rejects a maxed skill', () => {
    const char = makeCharacter({ level: 99, skillLevels: { 'warrior-smash': 4 } });
    expect(canUpgradeSkill(char, 'warrior-smash')).toBe(false);
    expect(upgradeSkill(char, 'warrior-smash')).toBe(char);
  });

  it('increments the level immutably when every gate passes', () => {
    const char = makeCharacter({ level: gate2 });
    expect(canUpgradeSkill(char, 'warrior-smash')).toBe(true);
    const updated = upgradeSkill(char, 'warrior-smash');
    expect(updated.skillLevels['warrior-smash']).toBe(2);
    expect(char.skillLevels).toEqual({});
  });
});

describe('canUpgradePassive / upgradePassive', () => {
  const gate2 = PASSIVE_REGISTRY['warrior-iron-skin'].levelUpgrades[0].requiredCharacterLevel;

  it('rejects unknown ids, other classes, and locked passives', () => {
    const char = makeCharacter({ level: 99 });
    expect(canUpgradePassive(char, 'nope')).toBe(false);
    expect(canUpgradePassive(char, 'mage-focus-boost')).toBe(false);
    expect(canUpgradePassive(char, 'warrior-iron-skin')).toBe(false); // not unlocked
  });

  it('rejects a character below the level gate and a maxed passive', () => {
    const early = makeCharacter({ level: gate2 - 1, unlockedPassiveIds: ['warrior-iron-skin'] });
    expect(canUpgradePassive(early, 'warrior-iron-skin')).toBe(false);
    const maxed = makeCharacter({
      level: 99,
      unlockedPassiveIds: ['warrior-iron-skin'],
      skillLevels: { 'warrior-iron-skin': 4 },
    });
    expect(upgradePassive(maxed, 'warrior-iron-skin')).toBe(maxed);
  });

  it('increments the level immutably when every gate passes', () => {
    const char = makeCharacter({ level: gate2, unlockedPassiveIds: ['warrior-iron-skin'] });
    const updated = upgradePassive(char, 'warrior-iron-skin');
    expect(updated.skillLevels['warrior-iron-skin']).toBe(2);
    expect(char.skillLevels).toEqual({});
  });
});

describe('level-aware passive aggregation', () => {
  it('reads party-wide modifiers at the stored level', () => {
    const warrior = makeCharacter({
      unlockedPassiveIds: ['warrior-iron-skin'],
      skillLevels: { 'warrior-iron-skin': 4 },
    });
    expect(getPartyPassiveModifiers([warrior]).guardDecayResistanceMultiplier).toBeCloseTo(0.74);
  });

  it('reads character-side modifiers at the stored level', () => {
    const warrior = makeCharacter({
      unlockedPassiveIds: ['warrior-iron-skin', 'warrior-blood-roar', 'warrior-indomitable-will', 'warrior-unleash-power'],
      skillLevels: { 'warrior-unleash-power': 4 },
    });
    const mods = getCharacterPassiveModifiers(warrior);
    expect(mods.skillDamageMultiplier).toBeCloseTo(1.35);
    expect(mods.skillGuardRestore).toBe(25);
    // Unleveled passives on the same character stay at their baseline.
    expect(mods.staggerPushMultiplier).toBeCloseTo(1.5);
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
