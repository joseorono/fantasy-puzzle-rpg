import { describe, it, expect } from 'vitest';
import { resolveMatchGroups } from './match-resolution';
import { calculateComboMultiplier, calculateGuardChargeRate, calculateMatchDamage } from './rpg-calculations';
import { getPartyPassiveModifiers } from './skill-system';
import { INITIAL_PARTY } from '~/constants/party';
import {
  BASE_MATCH_DAMAGE,
  COOLDOWN_REDUCTION_PER_ORB,
  GRAY_MATCH_DAMAGE_MULTIPLIER,
  GUARD_CHARGE_PER_ORB,
} from '~/constants/party';
import type { CharacterData } from '~/types/rpg-elements';

/** The shipped roster: warrior=blue, rogue=green, mage=purple, healer=yellow. */
const PARTY = INITIAL_PARTY;

function findByColor(party: CharacterData[], color: string): CharacterData {
  const character = party.find((char) => char.color === color);
  if (!character) throw new Error(`no character with color ${color}`);
  return character;
}

function killColor(party: CharacterData[], color: string): CharacterData[] {
  return party.map((char) => (char.color === color ? { ...char, currentHp: 0 } : char));
}

/** The damage the production formula expects for one colour, so the tests assert behaviour not constants. */
function expectedDamage(party: CharacterData[], color: string, matchSize: number, cascadeLevel = 0): number {
  const character = party.find((char) => char.color === color);
  const pow = character?.stats.pow ?? 0;
  // The shipped roster carries no equipment and no passives, so the combo multiplier is the plain curve.
  const base = Math.floor(
    calculateMatchDamage(matchSize, BASE_MATCH_DAMAGE, pow, calculateComboMultiplier(cascadeLevel, 0)),
  );
  return color === 'gray' ? Math.floor(base * GRAY_MATCH_DAMAGE_MULTIPLIER) : base;
}

describe('resolveMatchGroups', () => {
  it('gives a single colour its hero damage, cooldown relief and the primary pulse', () => {
    const result = resolveMatchGroups([{ type: 'blue', matchSize: 4 }], PARTY, 0);

    expect(result.primaryMatchedType).toBe('blue');
    expect(result.effects).toEqual([
      { amount: expectedDamage(PARTY, 'blue', 4), isHeal: false, characterId: findByColor(PARTY, 'blue').id },
    ]);
    expect(result.cooldownReductions).toEqual([
      { characterId: findByColor(PARTY, 'blue').id, amount: 4 * COOLDOWN_REDUCTION_PER_ORB },
    ]);
    expect(result.guardGain).toBe(0);
  });

  it('resolves every colour of a multi-colour move independently, first seen driving the pulse', () => {
    const result = resolveMatchGroups(
      [
        { type: 'green', matchSize: 3 },
        { type: 'purple', matchSize: 5 },
      ],
      PARTY,
      0,
    );

    expect(result.primaryMatchedType).toBe('green');
    expect(result.effects.map((effect) => effect.amount)).toEqual([
      expectedDamage(PARTY, 'green', 3),
      expectedDamage(PARTY, 'purple', 5),
    ]);
    // Each hero's relief is sized by their own group, not the move's total.
    expect(result.cooldownReductions.map((reduction) => reduction.amount)).toEqual([
      3 * COOLDOWN_REDUCTION_PER_ORB,
      5 * COOLDOWN_REDUCTION_PER_ORB,
    ]);
  });

  it("marks the healer's action as a heal", () => {
    const healer = findByColor(PARTY, 'yellow');
    const result = resolveMatchGroups([{ type: 'yellow', matchSize: 3 }], PARTY, 0);

    expect(healer.class).toBe('healer');
    expect(result.effects).toEqual([
      { amount: expectedDamage(PARTY, 'yellow', 3), isHeal: true, characterId: healer.id },
    ]);
  });

  it('charges Guard from gray and deals it reduced chip damage, with no cooldown relief', () => {
    const result = resolveMatchGroups([{ type: 'gray', matchSize: 4 }], PARTY, 0);

    expect(result.cooldownReductions).toEqual([]);
    expect(result.effects).toEqual([
      { amount: expectedDamage(PARTY, 'gray', 4), isHeal: false, characterId: undefined },
    ]);
    expect(result.guardGain).toBeCloseTo(
      4 *
        GUARD_CHARGE_PER_ORB *
        (calculateGuardChargeRate(PARTY) + getPartyPassiveModifiers(PARTY).guardChargeRateBonus),
    );
    // Gray trades damage for Guard, so it must chip for less than a coloured hit of the same size.
    expect(result.effects[0].amount).toBeLessThan(expectedDamage(PARTY, 'blue', 4));
  });

  it('produces no action for a dead hero but still charges Guard from gray in the same move', () => {
    const party = killColor(PARTY, 'blue');
    const result = resolveMatchGroups(
      [
        { type: 'blue', matchSize: 3 },
        { type: 'gray', matchSize: 3 },
      ],
      party,
      0,
    );

    expect(result.effects).toHaveLength(1);
    expect(result.effects[0].characterId).toBeUndefined();
    expect(result.cooldownReductions).toEqual([]);
    expect(result.guardGain).toBeGreaterThan(0);
    // The dead hero's colour still set the pulse — the orbs did clear.
    expect(result.primaryMatchedType).toBe('blue');
  });

  it('scales damage with the cascade level', () => {
    const initial = resolveMatchGroups([{ type: 'blue', matchSize: 3 }], PARTY, 0);
    const chained = resolveMatchGroups([{ type: 'blue', matchSize: 3 }], PARTY, 3);

    expect(chained.effects[0].amount).toBeGreaterThan(initial.effects[0].amount);
    expect(chained.effects[0].amount).toBe(expectedDamage(PARTY, 'blue', 3, 3));
  });

  it('scales only damage by damageMultiplier, leaving cooldown relief and Guard alone', () => {
    const plain = resolveMatchGroups(
      [
        { type: 'blue', matchSize: 6 },
        { type: 'gray', matchSize: 6 },
      ],
      PARTY,
      0,
    );
    const halved = resolveMatchGroups(
      [
        { type: 'blue', matchSize: 6 },
        { type: 'gray', matchSize: 6 },
      ],
      PARTY,
      0,
      { damageMultiplier: 0.5 },
    );

    expect(halved.effects[0].amount).toBeLessThan(plain.effects[0].amount);
    expect(halved.cooldownReductions).toEqual(plain.cooldownReductions);
    expect(halved.guardGain).toBeCloseTo(plain.guardGain);
  });

  it('defaults to a multiplier of 1, so an unscaled call is the shipped match payout', () => {
    expect(resolveMatchGroups([{ type: 'purple', matchSize: 5 }], PARTY, 1)).toEqual(
      resolveMatchGroups([{ type: 'purple', matchSize: 5 }], PARTY, 1, { damageMultiplier: 1 }),
    );
  });

  it('returns nothing for an empty move', () => {
    expect(resolveMatchGroups([], PARTY, 0)).toEqual({
      effects: [],
      cooldownReductions: [],
      guardGain: 0,
      primaryMatchedType: null,
    });
  });
});
