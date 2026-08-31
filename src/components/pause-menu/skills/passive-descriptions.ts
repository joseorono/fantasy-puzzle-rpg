import type { PassiveModifiers } from '~/types/skills';

/** Rounded percent distance from a multiplicative key's neutral value of 1. */
const pct = (v: number) => Math.round(Math.abs(1 - v) * 100);

interface ModifierFormatter {
  /** Short label for current → next comparisons. */
  label: string;
  /** Full effect sentence for the detail panel and unlock overlays. */
  describe: (value: number) => string;
  /** Compact value for current → next comparisons. */
  short: (value: number) => string;
}

/** One formatter per key of the closed `PassiveModifiers` set, in display order. */
const MODIFIER_FORMATTERS: Record<keyof Required<PassiveModifiers>, ModifierFormatter> = {
  cascadeBonus: {
    label: 'Cascade ramp',
    describe: (v) => `Cascade combos ramp up faster (+${v})`,
    short: (v) => `+${v}`,
  },
  matchDamageMultiplier: {
    label: 'Match damage',
    describe: (v) => `Match damage +${pct(v)}%`,
    short: (v) => `+${pct(v)}%`,
  },
  skillDamageMultiplier: {
    label: 'Ultimate power',
    describe: (v) => `Ultimate power +${pct(v)}%`,
    short: (v) => `+${pct(v)}%`,
  },
  skillCooldownMultiplier: {
    label: 'Ultimate charge',
    describe: (v) => (v < 1 ? `Ultimate charges ${pct(v)}% faster` : `Ultimate charges ${pct(v)}% slower`),
    short: (v) => (v < 1 ? `${pct(v)}% faster` : `${pct(v)}% slower`),
  },
  skillGuardRestore: {
    label: 'Guard restore',
    describe: (v) => `Ultimate restores ${v} Guard`,
    short: (v) => `${v} Guard`,
  },
  staggerPushMultiplier: {
    label: 'Stagger push',
    describe: (v) => `Stagger pushes ${pct(v)}% harder`,
    short: (v) => `+${pct(v)}%`,
  },
  guardChargeRateBonus: {
    label: 'Guard charge',
    describe: (v) => `Guard charges +${Math.round(v * 100)}%`,
    short: (v) => `+${Math.round(v * 100)}%`,
  },
  guardDecayResistanceMultiplier: {
    label: 'Guard bleed',
    describe: (v) => `Guard bleeds ${pct(v)}% slower`,
    short: (v) => `${pct(v)}% slower`,
  },
  itemCooldownSpdBonus: {
    label: 'Item cooldown SPD',
    describe: (v) => `+${v} party SPD for item cooldown`,
    short: (v) => `+${v} SPD`,
  },
};

const MODIFIER_KEYS = Object.keys(MODIFIER_FORMATTERS) as (keyof Required<PassiveModifiers>)[];

/**
 * Renders a passive's modifier record as short player-language effect lines for
 * the detail panel, one line per key present. Percentages are derived from the
 * neutral value of each key (0 additive, 1 multiplicative).
 */
export function describePassiveModifiers(modifiers: PassiveModifiers): string[] {
  const lines: string[] = [];
  for (const key of MODIFIER_KEYS) {
    const value = modifiers[key];
    if (value !== undefined) lines.push(MODIFIER_FORMATTERS[key].describe(value));
  }
  return lines;
}

/** One current → next comparison line of a passive upgrade preview. */
export interface PassiveModifierChange {
  label: string;
  from: string;
  to: string;
}

/**
 * Compares two modifier records of the same passive (adjacent levels) and
 * returns one labeled comparison per key whose value changes.
 */
export function describePassiveModifierChange(current: PassiveModifiers, next: PassiveModifiers): PassiveModifierChange[] {
  const changes: PassiveModifierChange[] = [];
  for (const key of MODIFIER_KEYS) {
    const nextValue = next[key];
    const currentValue = current[key];
    if (nextValue === undefined || currentValue === undefined || nextValue === currentValue) continue;
    const formatter = MODIFIER_FORMATTERS[key];
    changes.push({ label: formatter.label, from: formatter.short(currentValue), to: formatter.short(nextValue) });
  }
  return changes;
}
