import { resolveActiveSkillStats, resolvePassiveModifiers } from '~/lib/skill-system';
import { describePassiveModifierChange } from './passive-descriptions';
import type { SkillSelection } from './skill-detail-panel';

/** One current → next comparison line of an upgrade preview. */
export interface UpgradePreviewRow {
  label: string;
  from: string;
  to: string;
}

/**
 * Build the current → next comparison rows for upgrading a skill from `level`,
 * one row per stat that actually changes. Shared by the detail panel's preview
 * and the upgrade confirm dialog.
 */
export function getUpgradePreviewRows(selection: SkillSelection, level: number): UpgradePreviewRow[] {
  if (selection.kind === 'active') {
    const current = resolveActiveSkillStats(selection.skill, level);
    const next = resolveActiveSkillStats(selection.skill, level + 1);
    const heals = selection.skill.target === 'ally' || selection.skill.target === 'allAlly';
    const rows: UpgradePreviewRow[] = [];
    if (next.baseDamageMultiplier !== current.baseDamageMultiplier)
      rows.push({
        label: heals ? 'Heal' : 'Dmg',
        from: `×${current.baseDamageMultiplier}`,
        to: `×${next.baseDamageMultiplier}`,
      });
    if (next.flatDamageBonus !== current.flatDamageBonus)
      rows.push({ label: 'Flat', from: `+${current.flatDamageBonus}`, to: `+${next.flatDamageBonus}` });
    if (next.cooldownMultiplier !== current.cooldownMultiplier)
      rows.push({ label: 'Charge', from: `×${current.cooldownMultiplier}`, to: `×${next.cooldownMultiplier}` });
    return rows;
  }
  return describePassiveModifierChange(
    resolvePassiveModifiers(selection.passive, level),
    resolvePassiveModifiers(selection.passive, level + 1),
  );
}
