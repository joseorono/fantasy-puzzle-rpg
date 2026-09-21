import type { CharacterData, OrbType } from '~/types/rpg-elements';
import type { SkillCooldownReduction } from './battle-system';
import { calculateComboMultiplier, calculateGuardChargeRate, calculateMatchDamage } from './rpg-calculations';
import { getEquipmentComboBonus } from './equipment-system';
import { getCharacterPassiveModifiers, getPartyPassiveModifiers } from './skill-system';
import {
  BASE_MATCH_DAMAGE,
  COOLDOWN_REDUCTION_PER_ORB,
  GRAY_MATCH_DAMAGE_MULTIPLIER,
  GUARD_CHARGE_PER_ORB,
} from '~/constants/party';

/** One colour's contribution to a resolved move: the colour, and how many orbs it acts on. */
export interface MatchGroup {
  type: OrbType;
  /** Orb count this colour's hero acts off. A line match passes the whole match; a line clear passes its own count. */
  matchSize: number;
}

/** One hero action produced by a resolved move. A healer's action is a heal, everyone else's is damage. */
export interface MatchEffect {
  amount: number;
  isHeal: boolean;
  characterId?: string;
}

/** Everything a resolved move produces, ready to be committed and landed. */
export interface MatchGroupsResult {
  /** Per-colour hero actions, in the order the colours were given. */
  effects: MatchEffect[];
  /** Cooldown relief for each acting hero. Dead heroes and colourless (gray) groups are skipped. */
  cooldownReductions: SkillCooldownReduction[];
  /** Guard charged by gray orbs (0 when none were cleared). */
  guardGain: number;
  /** First-seen colour, which drives the party pulse and health-bar flash. */
  primaryMatchedType: OrbType | null;
}

export interface ResolveMatchGroupsOptions {
  /**
   * Scales every amount produced. Line-clear items pass their own multiplier so their payout can be
   * tuned independently; ordinary matches leave it at 1.
   */
  damageMultiplier?: number;
}

/**
 * Resolves one player move into the actions it produces: each colour's hero deals damage (or heals,
 * for the healer), gets cooldown relief, and gray charges the party Guard meter.
 *
 * Gray is colourless — no hero owns it — so it never earns cooldown relief and its damage is scaled
 * by `GRAY_MATCH_DAMAGE_MULTIPLIER`, trading raw damage for Guard. A dead hero's colour produces no
 * action at all, but gray still charges Guard because no hero has to be alive for it.
 *
 * @param groups - Each colour cleared by the move and the orb count it acts on
 * @param party - The current party; each colour is matched to its hero by `color`
 * @param cascadeLevel - Chain depth (0 = the initial move), driving the combo multiplier
 * @param options - Optional payout scaling; see {@link ResolveMatchGroupsOptions}
 * @returns The hero actions, cooldown relief, Guard gained, and the primary colour
 */
export function resolveMatchGroups(
  groups: ReadonlyArray<MatchGroup>,
  party: CharacterData[],
  cascadeLevel: number,
  options: ResolveMatchGroupsOptions = {},
): MatchGroupsResult {
  const { damageMultiplier = 1 } = options;

  const effects: MatchEffect[] = [];
  const cooldownReductions: SkillCooldownReduction[] = [];
  let guardGain = 0;
  // Only gray needs it, and it does not vary per group, so it is resolved at most once.
  let guardChargeRate: number | null = null;

  for (const { type, matchSize } of groups) {
    const matchingCharacter = party.find((char) => char.color === type);
    const isCharacterDead = matchingCharacter ? matchingCharacter.currentHp <= 0 : false;
    const characterPow = matchingCharacter?.stats.pow ?? 0;

    // Each hero applies their own equipment combo bonus and passive cascade bonus on top of the level.
    const equipmentComboBonus = matchingCharacter ? getEquipmentComboBonus(matchingCharacter) : 0;
    const charPassives = matchingCharacter ? getCharacterPassiveModifiers(matchingCharacter) : null;
    const comboMultiplier = calculateComboMultiplier(
      cascadeLevel,
      equipmentComboBonus + (charPassives?.cascadeBonus ?? 0),
    );

    const isGrayMatch = type === 'gray';
    const baseTotalDamage = Math.floor(
      calculateMatchDamage(matchSize, BASE_MATCH_DAMAGE, characterPow, comboMultiplier) *
        (charPassives?.matchDamageMultiplier ?? 1) *
        damageMultiplier,
    );
    const totalDamage = isGrayMatch ? Math.floor(baseTotalDamage * GRAY_MATCH_DAMAGE_MULTIPLIER) : baseTotalDamage;

    // Dead characters perform no action, but gray still charges the party Guard meter.
    if (isCharacterDead) continue;

    if (matchingCharacter) {
      cooldownReductions.push({
        characterId: matchingCharacter.id,
        amount: matchSize * COOLDOWN_REDUCTION_PER_ORB,
      });
    }

    // Charge scales with the cleared count and the party's SPD-derived Guard Charge Rate.
    if (isGrayMatch) {
      guardChargeRate ??= calculateGuardChargeRate(party) + getPartyPassiveModifiers(party).guardChargeRateBonus;
      guardGain += matchSize * GUARD_CHARGE_PER_ORB * guardChargeRate;
    }

    effects.push({
      amount: totalDamage,
      isHeal: matchingCharacter?.class === 'healer',
      characterId: matchingCharacter?.id,
    });
  }

  return { effects, cooldownReductions, guardGain, primaryMatchedType: groups[0]?.type ?? null };
}
