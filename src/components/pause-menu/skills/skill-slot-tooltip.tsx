import type { CharacterData } from '~/types/rpg-elements';
import type { Resources } from '~/types/resources';
import { getSkillLevel } from '~/lib/skill-system';
import { SkillIcon } from '~/components/skill-sprite-icons/skill-icon';
import { CostBadges } from '~/components/ui-custom/cost-badge';
import { GradientDivider } from '~/components/dividers/gradient-divider';
import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';
import { SkillMasteryPips } from './skill-mastery-pips';
import { describeSkillEffects, getShortTierLabel } from './skill-labels';
import { getUnlockGateReason } from './skill-gates';
import type { SkillSelection } from './skill-detail-panel';

/**
 * The sheet the card's icon is cut from. The slots have already pulled the 64px
 * sheet by the time any of these render, so reusing it costs nothing — asking
 * for 32 would fetch a third sheet (only 102 is preloaded) for a 1:1 render the
 * eye can't tell from a clean 2:1 downscale.
 */
const TOOLTIP_ICON_SHEET_SIZE = 64;
/** Rendered icon size — half the sheet cell, so the downscale stays on whole pixels. */
const TOOLTIP_ICON_SIZE = 32;

interface SkillSlotTooltipProps {
  character: CharacterData;
  selection: SkillSelection;
  resources: Resources;
  /** Drives the greyed icon, the price footer, and whether pips show at all. */
  locked: boolean;
}

/**
 * The hover card behind a skill slot: icon, name, tier and level, what the skill
 * actually does, and — while locked — what it costs and which gate is failing.
 * A compact read of a slot you haven't selected; the detail panel remains the
 * place for the next-level preview and the buttons.
 */
export function SkillSlotTooltip({ character, selection, resources, locked }: SkillSlotTooltipProps) {
  const def = selection.kind === 'active' ? selection.skill : selection.passive;
  const level = getSkillLevel(character, def.id);
  const equipped = selection.kind === 'active' && character.selectedSkillId === def.id;
  const gateReason = locked ? getUnlockGateReason(character, selection, resources) : null;
  const effects = describeSkillEffects(selection, locked ? 1 : level);
  const showsPips = !locked && def.maxLevel > 1;

  const meta = locked
    ? `${getShortTierLabel(selection)} · from Lv ${def.unlockLevel}`
    : def.maxLevel > 1
      ? `${getShortTierLabel(selection)} · Lv ${level}/${def.maxLevel}`
      : getShortTierLabel(selection);

  // Tier-0 starters are free, so their all-zero cost would render an empty footer.
  const showsCost = locked && Object.values(def.cost).some((amount) => amount > 0);
  const hasFooter = showsCost || Boolean(gateReason) || equipped;

  return (
    <div className="skill-slot-tooltip">
      <div className="skill-slot-tooltip__header">
        <SkillIcon
          characterClass={def.class}
          position={def.icon}
          disabled={locked}
          size={TOOLTIP_ICON_SIZE}
          sheetSize={TOOLTIP_ICON_SHEET_SIZE}
        />
        <div className="skill-slot-tooltip__titles">
          <div className="skill-slot-tooltip__name pixel-font">{def.name}</div>
          <div className="skill-slot-tooltip__meta">{meta}</div>
        </div>
        {showsPips && <SkillMasteryPips level={level} maxLevel={def.maxLevel} size="slot" />}
      </div>

      <GradientDivider variant="gold" />

      <IndigoLayStyledLists variant="chevron" compact>
        {effects.map((effect) => (
          <IndigolayStyledListItem key={effect.text}>{effect.text}</IndigolayStyledListItem>
        ))}
      </IndigoLayStyledLists>

      {hasFooter && (
        <>
          <GradientDivider variant="gold" />
          {/* Plain rows, not a list — bullets on a price and a one-line status
              added decoration without adding meaning. The padding lines these up
              with the bulleted text above. */}
          <div className="skill-slot-tooltip__footer">
            {showsCost && (
              <span className="skill-slot-tooltip__cost">
                <CostBadges resources={def.cost} />
              </span>
            )}
            {gateReason && <span className="skill-slot-tooltip__gate">{gateReason}</span>}
            {equipped && <span className="skill-slot-tooltip__equipped">Equipped Ultimate</span>}
          </div>
        </>
      )}
    </div>
  );
}
