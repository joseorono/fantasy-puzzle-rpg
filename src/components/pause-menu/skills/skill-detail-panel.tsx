import { Fragment, type ReactNode } from 'react';
import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';
import type { SkillDefinition, PassiveSkillDefinition } from '~/types/skills';
import type { Resources } from '~/types/resources';
import { canAfford } from '~/lib/resources';
import { useResources } from '~/stores/game-store';
import {
  isPassiveUnlocked,
  isSkillUnlocked,
  getSkillLevel,
  getNextActiveUpgrade,
  getNextPassiveUpgrade,
} from '~/lib/skill-system';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { SkillDecoIcon } from '~/components/skill-sprite-icons/skill-deco-icon';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { CostBadges } from '~/components/ui-custom/cost-badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { getUpgradePreviewRows } from './upgrade-preview';
import { SkillMasteryPips } from './skill-mastery-pips';
import { describeSkillEffects, getTierLabel } from './skill-labels';
import { getUnlockGateReason, getUpgradeGateReason } from './skill-gates';

/** The slot the detail panel is describing. */
export type SkillSelection =
  | { kind: 'active'; skill: SkillDefinition }
  | { kind: 'passive'; passive: PassiveSkillDefinition };

interface SkillDetailPanelProps {
  character: CharacterData;
  selection: SkillSelection;
  /** True while a battle is in progress — every action locks. */
  isInBattle: boolean;
  onEquip: (skillId: string) => void;
  onRequestUnlock: (selection: SkillSelection) => void;
  onRequestUpgrade: (selection: SkillSelection) => void;
}

/**
 * The parchment detail panel under the slot rows: featured icon on the gold deco
 * frame, name, tier/gate line and mastery pips, description, then one gilded
 * ledger plate carrying the current effects above the next level's gains, and
 * the action row. Every locked skill — active or passive — shows its resource
 * price explicitly beside the Unlock button; owned skills below max level show
 * the upgrade price beside Upgrade the same way. A blocked action names the
 * failing gate in a tooltip over the disabled button. Dark-on-parchment text, no
 * pixel-font shadow (it smears at small sizes).
 */
export function SkillDetailPanel({
  character,
  selection,
  isInBattle,
  onEquip,
  onRequestUnlock,
  onRequestUpgrade,
}: SkillDetailPanelProps) {
  const resources = useResources();
  const isActive = selection.kind === 'active';
  const def = isActive ? selection.skill : selection.passive;
  const owned = isActive ? isSkillUnlocked(character, def.id) : isPassiveUnlocked(character, def.id);
  const level = getSkillLevel(character, def.id);

  // The level lives in the mastery pips now — keeping it here too wrapped the line.
  const tierLabel = getTierLabel(selection);

  return (
    <div className="skill-detail" key={def.id}>
      <div className="skill-detail__header">
        <SkillDecoIcon characterClass={def.class} position={def.icon} size={72} className="skill-detail__deco" />
        <div className="skill-detail__title-group">
          <div className="skill-detail__name">
            <NarikWoodBitFont text={def.name.toUpperCase()} size={1} />
          </div>
          <div className="skill-detail__tier">
            <span className="skill-detail__tier-badge">{tierLabel.badge}</span>
            <span className="skill-detail__tier-meta">{tierLabel.meta}</span>
          </div>
        </div>
        {owned && def.maxLevel > 1 && (
          <InfoTooltip label={`Level ${level} of ${def.maxLevel}${level >= def.maxLevel ? ' · Mastered' : ''}`}>
            <SkillMasteryPips level={level} maxLevel={def.maxLevel} />
          </InfoTooltip>
        )}
      </div>

      <p className="skill-detail__description">{def.description}</p>

      {/* One gilded plate: current stats on top, the next level's gains below a
          gold hairline — the comparison reads as a single ledger. */}
      <div className="skill-detail__ledger">
        {/* Actives: one horizontal strip with engraved separators. Passives: their
            sentence-length effect lines stack instead. */}
        <div className={cn('skill-detail__stats', !isActive && 'skill-detail__stats--stack')}>
          <SkillEffects selection={selection} level={level} />
        </div>
        {owned && level < def.maxLevel && <UpgradePreview selection={selection} level={level} />}
      </div>

      <div className="skill-detail__footer">
        {isInBattle && <div className="skill-detail__battle-lock">Locked during battle</div>}
        <SkillDetailActions
          character={character}
          selection={selection}
          resources={resources}
          isInBattle={isInBattle}
          onEquip={onEquip}
          onRequestUnlock={onRequestUnlock}
          onRequestUpgrade={onRequestUpgrade}
        />
      </div>
    </div>
  );
}

function DetailStat({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return <span className={cn('skill-detail__stat', highlight && 'skill-detail__stat--highlight')}>{label}</span>;
}

function StatDivider() {
  return <span className="skill-detail__divider" aria-hidden="true" />;
}

/**
 * The skill's effects at its current level. Actives read as one line joined by
 * gilded dividers; passives stack, so they get no dividers. Both come from
 * `describeSkillEffects`, which the slot hover card reads from too.
 */
function SkillEffects({ selection, level }: { selection: SkillSelection; level: number }) {
  const effects = describeSkillEffects(selection, level);
  const isActive = selection.kind === 'active';
  return (
    <>
      {effects.map((effect, index) => (
        <Fragment key={effect.text}>
          {isActive && index > 0 && <StatDivider />}
          <DetailStat label={effect.text} highlight={effect.highlight} />
        </Fragment>
      ))}
    </>
  );
}

/**
 * The ledger's lower band: one current → next row per changed stat, sitting under
 * the gold hairline on the same plate as the current stats.
 */
function UpgradePreview({ selection, level }: { selection: SkillSelection; level: number }) {
  const rows = getUpgradePreviewRows(selection, level);
  if (rows.length === 0) return null;
  return (
    <div className="skill-detail__upgrade">
      <span className="skill-detail__upgrade-title">Next · Lv {level + 1}</span>
      <div className="skill-detail__upgrade-rows">
        {rows.map((row) => (
          <span key={row.label} className="skill-detail__upgrade-row">
            <span className="skill-detail__upgrade-label">{row.label}</span>
            <span className="skill-detail__upgrade-from">{row.from}</span>
            <span className="skill-detail__upgrade-arrow">→</span>
            <span className="skill-detail__upgrade-next">{row.to}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Hover label for a non-interactive element — the mastery pips and the Mastered
 * seal, both of which trade an exact number for a compact glyph. The wrapper span
 * is the hover surface, since `TooltipTrigger` is `asChild` and these children
 * don't forward refs.
 */
function InfoTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span className="skill-detail__info-trigger">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <IndigoLayStyledLists variant="chevron">
          <IndigolayStyledListItem>{label}</IndigolayStyledListItem>
        </IndigoLayStyledLists>
      </TooltipContent>
    </Tooltip>
  );
}

/** Wraps a disabled action button so its gate reason shows in a hover tooltip. */
function GateTooltip({ reason, children }: { reason: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        {/* The disabled button swallows pointer events (see the CSS pointer-events
            override), so the span is the hover surface for the gate tooltip. */}
        <span className="skill-detail__blocked-trigger">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <IndigoLayStyledLists variant="chevron">
          <IndigolayStyledListItem>{reason}</IndigolayStyledListItem>
        </IndigoLayStyledLists>
      </TooltipContent>
    </Tooltip>
  );
}

interface SkillDetailActionsProps {
  character: CharacterData;
  selection: SkillSelection;
  resources: Resources;
  isInBattle: boolean;
  onEquip: (skillId: string) => void;
  onRequestUnlock: (selection: SkillSelection) => void;
  onRequestUpgrade: (selection: SkillSelection) => void;
}

function SkillDetailActions({
  character,
  selection,
  resources,
  isInBattle,
  onEquip,
  onRequestUnlock,
  onRequestUpgrade,
}: SkillDetailActionsProps) {
  const isActive = selection.kind === 'active';
  const def = isActive ? selection.skill : selection.passive;
  const owned = isActive ? isSkillUnlocked(character, def.id) : isPassiveUnlocked(character, def.id);

  // Owned skills: actives offer Equip; both kinds offer Upgrade until maxed.
  if (owned) {
    const level = getSkillLevel(character, def.id);
    const nextUpgrade = isActive
      ? getNextActiveUpgrade(selection.skill, level)
      : getNextPassiveUpgrade(selection.passive, level);
    const equipped = isActive && character.selectedSkillId === def.id;

    // A disabled Equip says why on hover rather than sitting there inert.
    const equipBlockedReason = isInBattle ? 'Locked during battle' : equipped ? 'Already your equipped Ultimate' : null;
    const rawEquipButton = isActive ? (
      <ToffecBeigeCornersWrapper>
        <ToffecButton
          variant="tan"
          size="xs"
          className="skill-detail__equip"
          disabled={equipped || isInBattle}
          onClick={() => onEquip(def.id)}
        >
          {equipped ? 'Equipped' : 'Equip'}
        </ToffecButton>
      </ToffecBeigeCornersWrapper>
    ) : null;
    const equipButton =
      rawEquipButton && equipBlockedReason ? (
        <GateTooltip reason={equipBlockedReason}>{rawEquipButton}</GateTooltip>
      ) : (
        rawEquipButton
      );

    if (!nextUpgrade) {
      return (
        <div className="skill-detail__actions">
          {equipButton}
          <InfoTooltip label={`${isActive ? 'Ultimate' : 'Passive'} is at its highest level`}>
            <span className="skill-detail__mastered">Mastered</span>
          </InfoTooltip>
        </div>
      );
    }

    const blockedReason = getUpgradeGateReason(character, nextUpgrade, resources);
    // Independent of the gate: the price greys out whenever it's out of reach,
    // even when a level gate is the reason the button is disabled.
    const affordable = canAfford(resources, nextUpgrade.cost);

    const upgradeButton = (
      <ToffecBeigeCornersWrapper>
        <ToffecButton
          variant="orange"
          size="xs"
          disabled={Boolean(blockedReason) || isInBattle}
          onClick={() => onRequestUpgrade(selection)}
        >
          Upgrade
        </ToffecButton>
      </ToffecBeigeCornersWrapper>
    );

    // The price is grouped with the button that spends it, so a wrap keeps them
    // together instead of stranding Upgrade on its own line under Equip.
    return (
      <div className="skill-detail__actions">
        {equipButton}
        <div className="skill-detail__buy">
          <div className={cn('skill-detail__cost', !affordable && 'skill-detail__cost--short')}>
            <CostBadges resources={nextUpgrade.cost} />
          </div>
          {blockedReason ? <GateTooltip reason={blockedReason}>{upgradeButton}</GateTooltip> : upgradeButton}
        </div>
      </div>
    );
  }

  // Locked: show the price explicitly, and say exactly which gate is failing.
  // A skipped lower tier is named outright — tiers unlock strictly in order.
  const blockedReason = getUnlockGateReason(character, selection, resources);
  const affordable = canAfford(resources, def.cost);

  const unlockButton = (
    <ToffecBeigeCornersWrapper>
      <ToffecButton
        variant="orange"
        size="xs"
        disabled={Boolean(blockedReason) || isInBattle}
        onClick={() => onRequestUnlock(selection)}
      >
        Unlock
      </ToffecButton>
    </ToffecBeigeCornersWrapper>
  );

  return (
    <div className="skill-detail__actions">
      <div className="skill-detail__buy">
        <div className={cn('skill-detail__cost', !affordable && 'skill-detail__cost--short')}>
          <CostBadges resources={def.cost} />
        </div>
        {blockedReason ? <GateTooltip reason={blockedReason}>{unlockButton}</GateTooltip> : unlockButton}
      </div>
    </div>
  );
}
