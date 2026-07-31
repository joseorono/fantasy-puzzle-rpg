import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';
import type { SkillDefinition, PassiveSkillDefinition, SkillTarget } from '~/types/skills';
import type { Resources } from '~/types/resources';
import { canAfford } from '~/lib/resources';
import { useResources } from '~/stores/game-store';
import { isPassiveUnlocked, hasPreviousPassiveTier, isSkillUnlocked } from '~/lib/skill-system';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { SkillDecoIcon } from '~/components/skill-sprite-icons/skill-deco-icon';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { CostBadges } from '~/components/ui-custom/cost-badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { describePassiveModifiers } from './passive-descriptions';

// Short on purpose — the active stat strip must fit one line in Press Start 2P.
const TARGET_LABELS: Record<SkillTarget, string> = {
  enemy: 'One enemy',
  allEnemy: 'All enemies',
  ally: 'Weakest ally',
  allAlly: 'Whole party',
};

const ROMAN_TIERS = ['I', 'II', 'III', 'IV'] as const;

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
}

/**
 * The parchment detail panel under the slot rows: featured icon on the gold
 * deco frame, name, tier/gate line, description, effect list, and the action
 * row. Every locked skill — active or passive — shows its resource price
 * explicitly next to the Unlock button; a blocked unlock names the failing
 * gate in a tooltip over the disabled button. Dark-on-parchment text, no
 * pixel-font shadow (it smears at small sizes).
 */
export function SkillDetailPanel({
  character,
  selection,
  isInBattle,
  onEquip,
  onRequestUnlock,
}: SkillDetailPanelProps) {
  const resources = useResources();
  const isActive = selection.kind === 'active';
  const def = isActive ? selection.skill : selection.passive;

  const heals = isActive && (selection.skill.target === 'ally' || selection.skill.target === 'allAlly');
  const kindLabel = isActive ? 'Ultimate' : 'Passive';
  const tierLabel =
    isActive && selection.skill.tier === 0
      ? 'Starting Ultimate — every hero begins with this'
      : `Tier ${ROMAN_TIERS[(isActive ? selection.skill.tier : selection.passive.tier) - 1]} ${kindLabel} · from Lv ${def.unlockLevel}`;

  return (
    <div className="skill-detail" key={def.id}>
      <div className="skill-detail__header">
        <SkillDecoIcon characterClass={def.class} position={def.icon} size={72} className="skill-detail__deco" />
        <div className="skill-detail__title-group">
          <div className="skill-detail__name">
            <NarikWoodBitFont text={def.name.toUpperCase()} size={1} />
          </div>
          <div className="skill-detail__tier">{tierLabel}</div>
        </div>
      </div>

      <p className="skill-detail__description">{def.description}</p>

      {/* Actives: one horizontal strip with engraved separators. Passives: their
          sentence-length effect lines stack instead. */}
      <div className={cn('skill-detail__stats', !isActive && 'skill-detail__stats--stack')}>
        {isActive ? (
          <>
            <DetailStat label={TARGET_LABELS[selection.skill.target]} />
            <DetailStat
              label={`${heals ? 'Heal' : 'Dmg'} ×${selection.skill.baseDamageMultiplier}${
                selection.skill.flatDamageBonus > 0 ? ` +${selection.skill.flatDamageBonus}` : ''
              }`}
            />
            <DetailStat
              label={`Charge ×${selection.skill.cooldownMultiplier}`}
              highlight={selection.skill.cooldownMultiplier < 1}
            />
          </>
        ) : (
          describePassiveModifiers(selection.passive.modifiers).map((line) => <DetailStat key={line} label={line} />)
        )}
      </div>

      <SkillDetailActions
        character={character}
        selection={selection}
        resources={resources}
        isInBattle={isInBattle}
        onEquip={onEquip}
        onRequestUnlock={onRequestUnlock}
      />

      {isInBattle && <div className="skill-detail__battle-lock">Locked during battle</div>}
    </div>
  );
}

function DetailStat({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return <span className={cn('skill-detail__stat', highlight && 'skill-detail__stat--highlight')}>{label}</span>;
}

interface SkillDetailActionsProps {
  character: CharacterData;
  selection: SkillSelection;
  resources: Resources;
  isInBattle: boolean;
  onEquip: (skillId: string) => void;
  onRequestUnlock: (selection: SkillSelection) => void;
}

function SkillDetailActions({
  character,
  selection,
  resources,
  isInBattle,
  onEquip,
  onRequestUnlock,
}: SkillDetailActionsProps) {
  const isActive = selection.kind === 'active';
  const def = isActive ? selection.skill : selection.passive;

  // Owned skills: actives offer Equip; passives are simply always on.
  if (isActive && isSkillUnlocked(character, selection.skill.id)) {
    const equipped = character.selectedSkillId === def.id;
    return (
      <div className="skill-detail__actions">
        <ToffecBeigeCornersWrapper>
          <ToffecButton variant="tan" size="xs" disabled={equipped || isInBattle} onClick={() => onEquip(def.id)}>
            {equipped ? 'Equipped' : 'Equip'}
          </ToffecButton>
        </ToffecBeigeCornersWrapper>
      </div>
    );
  }
  if (!isActive && isPassiveUnlocked(character, selection.passive.id)) {
    return <div className="skill-detail__gate-note skill-detail__gate-note--owned">Learned — always active</div>;
  }

  // Locked: show the price explicitly, and say exactly which gate is failing.
  const affordable = canAfford(resources, def.cost);
  const needsPrevious = !isActive && !hasPreviousPassiveTier(character, selection.passive);
  const needsLevel = character.level < def.unlockLevel;
  const blockedReason = needsPrevious
    ? `Unlock Tier ${ROMAN_TIERS[selection.kind === 'passive' ? selection.passive.tier - 2 : 0]} first`
    : needsLevel
      ? `Requires Lv ${def.unlockLevel}`
      : !affordable
        ? 'Not enough resources'
        : null;

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
    <div className="skill-detail__actions skill-detail__actions--unlock">
      <div className={cn('skill-detail__cost', !affordable && 'skill-detail__cost--short')}>
        <CostBadges resources={def.cost} />
      </div>
      {/* The disabled button swallows pointer events (see the CSS pointer-events
          override), so the span is the hover surface for the gate tooltip. */}
      {blockedReason ? (
        <Tooltip>
          <TooltipTrigger>
            <span className="skill-detail__blocked-trigger">{unlockButton}</span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <IndigoLayStyledLists variant="chevron">
              <IndigolayStyledListItem>{blockedReason}</IndigolayStyledListItem>
            </IndigoLayStyledLists>
          </TooltipContent>
        </Tooltip>
      ) : (
        unlockButton
      )}
    </div>
  );
}
