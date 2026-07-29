import { cn } from '~/lib/utils';
import type { CharacterData } from '~/types/rpg-elements';
import type { SkillDefinition, PassiveSkillDefinition, SkillTarget } from '~/types/skills';
import { canAfford } from '~/lib/resources';
import { useResources } from '~/stores/game-store';
import { isPassiveUnlocked, hasPreviousPassiveTier } from '~/lib/skill-system';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { SkillDecoIcon } from '~/components/skill-sprite-icons/skill-deco-icon';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { CostBadges } from '~/components/ui-custom/cost-badge';
import { describePassiveModifiers } from './passive-descriptions';

const TARGET_LABELS: Record<SkillTarget, string> = {
  enemy: 'Single enemy',
  allEnemy: 'All enemies',
  ally: 'Lowest-HP ally',
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
  onRequestUnlock: (passive: PassiveSkillDefinition) => void;
}

/**
 * The parchment detail panel under the slot rows: featured icon on the gold
 * deco frame, name, tier/gate line, description, effect list, and the action
 * row (Equip for actives, explicit cost + gated Unlock for passives).
 * Dark-on-parchment text — the panel art is bright cream.
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
  const tierLabel = isActive
    ? selection.skill.tier === 0
      ? 'Starting Ultimate'
      : `Tier ${ROMAN_TIERS[selection.skill.tier - 1]} Ultimate · unlocks at Lv ${selection.skill.unlockLevel}`
    : `Tier ${ROMAN_TIERS[selection.passive.tier - 1]} Passive · requires Lv ${selection.passive.unlockLevel}`;

  return (
    <div className="skill-detail" key={def.id}>
      <div className="skill-detail__header">
        <SkillDecoIcon characterClass={def.class} position={def.icon} size={82} className="skill-detail__deco" />
        <div className="skill-detail__title-group">
          <div className="skill-detail__name">
            <NarikWoodBitFont text={def.name.toUpperCase()} size={1} />
          </div>
          <div className="skill-detail__tier pixel-font">{tierLabel}</div>
        </div>
      </div>

      <p className="skill-detail__description">{def.description}</p>

      <ul className="skill-detail__stats indigolay-list indigolay-list--compact">
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
      </ul>

      <SkillDetailActions
        character={character}
        selection={selection}
        isInBattle={isInBattle}
        canAffordCost={!isActive && canAfford(resources, selection.passive.cost)}
        onEquip={onEquip}
        onRequestUnlock={onRequestUnlock}
      />

      {isInBattle && <div className="skill-detail__battle-lock pixel-font">Locked during battle</div>}
    </div>
  );
}

function DetailStat({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <li className="indigolay-list__item">
      <span
        className={cn(
          'indigolay-list__bullet',
          highlight ? 'indigolay-list__bullet--gold' : 'indigolay-list__bullet--amber',
        )}
      >
        ◆
      </span>
      <span className="indigolay-list__text skill-detail__stat-text">{label}</span>
    </li>
  );
}

interface SkillDetailActionsProps {
  character: CharacterData;
  selection: SkillSelection;
  isInBattle: boolean;
  canAffordCost: boolean;
  onEquip: (skillId: string) => void;
  onRequestUnlock: (passive: PassiveSkillDefinition) => void;
}

function SkillDetailActions({
  character,
  selection,
  isInBattle,
  canAffordCost,
  onEquip,
  onRequestUnlock,
}: SkillDetailActionsProps) {
  if (selection.kind === 'active') {
    const skill = selection.skill;
    const unlocked = character.unlockedSkillIds.includes(skill.id);
    const equipped = character.selectedSkillId === skill.id;
    if (!unlocked) {
      return <div className="skill-detail__gate-note pixel-font">Unlocks free at Lv {skill.unlockLevel}</div>;
    }
    return (
      <div className="skill-detail__actions">
        <ToffecButton variant="tan" size="xs" disabled={equipped || isInBattle} onClick={() => onEquip(skill.id)}>
          {equipped ? 'Equipped' : 'Equip'}
        </ToffecButton>
      </div>
    );
  }

  const passive = selection.passive;
  if (isPassiveUnlocked(character, passive.id)) {
    return (
      <div className="skill-detail__gate-note skill-detail__gate-note--owned pixel-font">Learned — always active</div>
    );
  }

  // Locked passive: show the price explicitly, and say which gate is failing.
  const needsPrevious = !hasPreviousPassiveTier(character, passive);
  const needsLevel = character.level < passive.unlockLevel;
  const blockedReason = needsPrevious
    ? `Unlock Tier ${ROMAN_TIERS[passive.tier - 2]} first`
    : needsLevel
      ? `Requires Lv ${passive.unlockLevel}`
      : !canAffordCost
        ? 'Not enough resources'
        : null;

  return (
    <div className="skill-detail__actions skill-detail__actions--unlock">
      <div className={cn('skill-detail__cost', !canAffordCost && 'skill-detail__cost--short')}>
        <CostBadges resources={passive.cost} />
      </div>
      <ToffecButton
        variant="orange"
        size="xs"
        disabled={Boolean(blockedReason) || isInBattle}
        onClick={() => onRequestUnlock(passive)}
      >
        Unlock
      </ToffecButton>
      {blockedReason && <div className="skill-detail__gate-note pixel-font">{blockedReason}</div>}
    </div>
  );
}
