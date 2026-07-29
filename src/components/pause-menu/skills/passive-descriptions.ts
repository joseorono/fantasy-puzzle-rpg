import type { PassiveModifiers } from '~/types/skills';

/**
 * Renders a passive's modifier record as short player-language effect lines for
 * the detail panel, one line per key present. Percentages are derived from the
 * neutral value of each key (0 additive, 1 multiplicative).
 */
export function describePassiveModifiers(modifiers: PassiveModifiers): string[] {
  const lines: string[] = [];
  const pct = (v: number) => Math.round(Math.abs(1 - v) * 100);

  if (modifiers.cascadeBonus !== undefined) lines.push(`Cascade combos ramp up faster (+${modifiers.cascadeBonus})`);
  if (modifiers.matchDamageMultiplier !== undefined)
    lines.push(`Match damage +${pct(modifiers.matchDamageMultiplier)}%`);
  if (modifiers.skillDamageMultiplier !== undefined)
    lines.push(`Ultimate power +${pct(modifiers.skillDamageMultiplier)}%`);
  if (modifiers.skillCooldownMultiplier !== undefined) {
    const v = modifiers.skillCooldownMultiplier;
    lines.push(v < 1 ? `Ultimate charges ${pct(v)}% faster` : `Ultimate charges ${pct(v)}% slower`);
  }
  if (modifiers.skillGuardRestore !== undefined) lines.push(`Ultimate restores ${modifiers.skillGuardRestore} Guard`);
  if (modifiers.staggerPushMultiplier !== undefined)
    lines.push(`Stagger pushes ${pct(modifiers.staggerPushMultiplier)}% harder`);
  if (modifiers.guardChargeRateBonus !== undefined)
    lines.push(`Guard charges +${Math.round(modifiers.guardChargeRateBonus * 100)}%`);
  if (modifiers.guardDecayResistanceMultiplier !== undefined)
    lines.push(`Guard bleeds ${pct(modifiers.guardDecayResistanceMultiplier)}% slower`);
  if (modifiers.itemCooldownSpdBonus !== undefined)
    lines.push(`+${modifiers.itemCooldownSpdBonus} party SPD for item cooldown`);

  return lines;
}
