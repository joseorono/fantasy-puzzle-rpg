import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useParty, usePartyActions, useResources, useResourcesActions, useCurrentView } from '~/stores/game-store';
import {
  getSkillsForClass,
  getPassivesForClass,
  isSkillUnlocked,
  isPassiveUnlocked,
  getSkillLevel,
  getNextActiveUpgrade,
  getNextPassiveUpgrade,
  hasPreviousActiveTier,
  hasPreviousPassiveTier,
} from '~/lib/skill-system';
import { canAfford } from '~/lib/resources';
import { useUnlockSkill } from '~/hooks/use-unlock-skill';
import { useUnlockPassive } from '~/hooks/use-unlock-passive';
import { useUpgradeSkill } from '~/hooks/use-upgrade-skill';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { getNavDirection } from '~/constants/keyboard';
import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { INFO_ICON_SRC } from '~/constants/ui';
import { GradientDivider } from '~/components/dividers/gradient-divider';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { ConfirmPanel } from '~/components/confirm-dialog/confirm-panel';
import { CostBadges } from '~/components/ui-custom/cost-badge';
import { PartyMemberCard } from '~/components/pause-menu/party-member-card';
import { SkillDecoIcon } from '~/components/skill-sprite-icons/skill-deco-icon';
import { SkillSlot } from '~/components/pause-menu/skills/skill-slot';
import { SkillDetailPanel, type SkillSelection } from '~/components/pause-menu/skills/skill-detail-panel';
import { SkillSlotTooltip } from '~/components/pause-menu/skills/skill-slot-tooltip';
import { getUpgradePreviewRows } from '~/components/pause-menu/skills/upgrade-preview';
import { describePassiveModifiers } from '~/components/pause-menu/skills/passive-descriptions';

import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';

/** How long the just-unlocked slot flare plays. Matches the CSS animations. */
const UNLOCK_FLASH_MS = 950;

/** A purchase awaiting confirmation: first unlock, or a level upgrade. */
interface PendingAction {
  mode: 'unlock' | 'upgrade';
  selection: SkillSelection;
}

/**
 * The Skills tab: pick a hero, browse their Active (Ultimate) track and Passive
 * track as framed Indigolay slots, inspect any slot in the parchment detail
 * panel, and unlock or level up skills with crafting resources — reaching a
 * level only makes a skill purchasable. Tier-0 Ultimates are the free starting kit.
 */
export function PauseMenuSkills() {
  const party = useParty();
  const partyActions = usePartyActions();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const unlockActive = useUnlockSkill().unlock;
  const unlockPassive = useUnlockPassive().unlock;
  const { upgradeActive, upgradePassive } = useUpgradeSkill();
  const isInBattle = useCurrentView() === 'battle-demo';

  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');
  const [selection, setSelection] = useState<{ row: 'active' | 'passive'; index: number }>({ row: 'active', index: 0 });
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [justUnlockedId, setJustUnlockedId] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = party.find((m) => m.id === selectedId) ?? party[0];
  if (!selected) return null;

  const actives = getSkillsForClass(selected.class);
  const passives = getPassivesForClass(selected.class);

  const detailSelection: SkillSelection =
    selection.row === 'active'
      ? { kind: 'active', skill: actives[selection.index] ?? actives[0] }
      : { kind: 'passive', passive: passives[selection.index] ?? passives[0] };

  function selectCharacter(id: string) {
    if (id === selectedId) return;
    soundService.playSound(SoundNames.clickChangeTab, 0.5);
    setSelectedId(id);
    setSelection({ row: 'active', index: 0 });
  }

  function selectSlot(row: 'active' | 'passive', index: number) {
    soundService.playSound(SoundNames.clickChangeTab, 0.5);
    setSelection({ row, index });
    slotRefs.current[`${row}-${index}`]?.focus();
  }

  // Arrow navigation across the two slot rows. stopPropagation keeps the
  // sidebar (which listens for arrows on window to switch tabs) out of it.
  function handleSlotKeyDown(e: KeyboardEvent<HTMLButtonElement>, row: 'active' | 'passive', index: number) {
    const navDirection = getNavDirection(e.key);
    if (!navDirection) return;
    e.preventDefault();
    e.stopPropagation();
    const rowLength = row === 'active' ? actives.length : passives.length;
    if (navDirection === 'left') selectSlot(row, (index - 1 + rowLength) % rowLength);
    else if (navDirection === 'right') selectSlot(row, (index + 1) % rowLength);
    else {
      const otherRow = row === 'active' ? 'passive' : 'active';
      const otherLength = otherRow === 'active' ? actives.length : passives.length;
      selectSlot(otherRow, Math.min(index, otherLength - 1));
    }
  }

  function handleEquip(skillId: string) {
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    partyActions.selectSkillForCharacter(selected.id, skillId);
  }

  function flashSlot(id: string) {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setJustUnlockedId(id);
    flashTimerRef.current = setTimeout(() => setJustUnlockedId(null), UNLOCK_FLASH_MS);
  }

  function handleConfirm() {
    const pending = pendingAction;
    setPendingAction(null);
    if (!pending) return;
    const { mode, selection: pendingSelection } = pending;
    const def = pendingSelection.kind === 'active' ? pendingSelection.skill : pendingSelection.passive;

    const cost =
      mode === 'unlock'
        ? def.cost
        : (pendingSelection.kind === 'active'
            ? getNextActiveUpgrade(pendingSelection.skill, getSkillLevel(selected, def.id))
            : getNextPassiveUpgrade(pendingSelection.passive, getSkillLevel(selected, def.id))
          )?.cost;
    if (!cost || !canAfford(resources, cost)) return;

    soundService.playSound(SoundNames.clickCoin);
    resourcesActions.reduceResources(cost);
    if (mode === 'unlock') {
      if (pendingSelection.kind === 'active') unlockActive(selected.id, def.id);
      else unlockPassive(selected.id, def.id);
    } else {
      if (pendingSelection.kind === 'active') upgradeActive(selected.id, def.id);
      else upgradePassive(selected.id, def.id);
    }
    flashSlot(def.id);
  }

  const pendingDef = pendingAction
    ? pendingAction.selection.kind === 'active'
      ? pendingAction.selection.skill
      : pendingAction.selection.passive
    : null;
  const pendingLevel = pendingDef ? getSkillLevel(selected, pendingDef.id) : 1;
  const pendingCost =
    pendingAction && pendingDef
      ? pendingAction.mode === 'unlock'
        ? pendingDef.cost
        : (pendingAction.selection.kind === 'active'
            ? getNextActiveUpgrade(pendingAction.selection.skill, pendingLevel)
            : getNextPassiveUpgrade(pendingAction.selection.passive, pendingLevel)
          )?.cost
      : undefined;

  return (
    <>
      <h2>
        <NarikRedwoodBitFont text="SKILLS" size={1.2} />
      </h2>
      <div className="pause-menu-skills-layout">
        <div className="pause-menu-party-roster">
          {party.map((member) => (
            <PartyMemberCard
              key={member.id}
              member={member}
              variant="roster"
              isActive={member.id === selectedId}
              onClick={() => selectCharacter(member.id)}
            />
          ))}
        </div>

        <div className="pause-menu-skills-main pixel-scrollbar">
          <div className="pause-menu-skills-section">
            <div className="pause-menu-skills-section-label pixel-font">
              <span>Active</span>
              <Tooltip>
                <TooltipTrigger>
                  <span className="info-icon" role="img" aria-label="About Active Skills">
                    <img className="info-icon__img" src={INFO_ICON_SRC} alt="" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <IndigoLayStyledLists variant="chevron" compact>
                    <IndigolayStyledListItem>Only 1 skill equipped per hero</IndigolayStyledListItem>
                    <IndigolayStyledListItem>Charges over time & matching orbs</IndigolayStyledListItem>
                    <IndigolayStyledListItem>Tap when ready to activate</IndigolayStyledListItem>
                  </IndigoLayStyledLists>
                </TooltipContent>
              </Tooltip>
            </div>
            <GradientDivider variant="gold" className="my-1" />
            <div className="pause-menu-skills-row">
              {actives.map((skill, index) => {
                const locked = !isSkillUnlocked(selected, skill.id);
                const previousLocked = !hasPreviousActiveTier(selected, skill);
                const needsLevel = selected.level < skill.unlockLevel;
                const affordable = canAfford(resources, skill.cost);
                const learnable = locked && !previousLocked && !needsLevel && affordable;
                
                return (
                  <ToffecBeigeCornersWrapper key={skill.id} className="skill-slot-wrapper">
                    <SkillSlot
                      characterClass={selected.class}
                      icon={skill.icon}
                      name={skill.name}
                      locked={locked}
                      learnable={learnable}
                      unlockLevel={skill.unlockLevel}
                      selected={selection.row === 'active' && selection.index === index}
                      equipped={selected.selectedSkillId === skill.id}
                      level={getSkillLevel(selected, skill.id)}
                      maxLevel={skill.maxLevel}
                      flash={justUnlockedId === skill.id}
                      tooltip={
                        <SkillSlotTooltip
                          character={selected}
                          selection={{ kind: 'active', skill }}
                          resources={resources}
                          locked={locked}
                        />
                      }
                      onSelect={() => selectSlot('active', index)}
                      onKeyDown={(e) => handleSlotKeyDown(e, 'active', index)}
                      buttonRef={(el) => {
                        slotRefs.current[`active-${index}`] = el;
                      }}
                    />
                  </ToffecBeigeCornersWrapper>
                );
              })}
            </div>
          </div>

          <div className="pause-menu-skills-section">
            <div className="pause-menu-skills-section-label pixel-font">
              <span>Passive</span>
              <Tooltip>
                <TooltipTrigger>
                  <span className="info-icon" role="img" aria-label="About Passive Skills">
                    <img className="info-icon__img" src={INFO_ICON_SRC} alt="" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <IndigoLayStyledLists variant="chevron" compact>
                    <IndigolayStyledListItem>Always active automatically</IndigolayStyledListItem>
                    <IndigolayStyledListItem>Boosts stats & damage</IndigolayStyledListItem>
                    <IndigolayStyledListItem>Stacks across all unlocked tiers</IndigolayStyledListItem>
                  </IndigoLayStyledLists>
                </TooltipContent>
              </Tooltip>
            </div>
            <GradientDivider variant="gold" className="my-1" />
            <div className="pause-menu-skills-row pause-menu-skills-row--passive">
              {passives.map((passive, index) => {
                const locked = !isPassiveUnlocked(selected, passive.id);
                const previousLocked = !hasPreviousPassiveTier(selected, passive);
                const needsLevel = selected.level < passive.unlockLevel;
                const affordable = canAfford(resources, passive.cost);
                const learnable = locked && !previousLocked && !needsLevel && affordable;
                
                return (
                  <ToffecBeigeCornersWrapper key={passive.id} className="skill-slot-wrapper">
                    <SkillSlot
                      characterClass={selected.class}
                      icon={passive.icon}
                      name={passive.name}
                      locked={locked}
                      learnable={learnable}
                      unlockLevel={passive.unlockLevel}
                      selected={selection.row === 'passive' && selection.index === index}
                      level={getSkillLevel(selected, passive.id)}
                      maxLevel={passive.maxLevel}
                      flash={justUnlockedId === passive.id}
                      tooltip={
                        <SkillSlotTooltip
                          character={selected}
                          selection={{ kind: 'passive', passive }}
                          resources={resources}
                          locked={locked}
                        />
                      }
                      onSelect={() => selectSlot('passive', index)}
                      onKeyDown={(e) => handleSlotKeyDown(e, 'passive', index)}
                      buttonRef={(el) => {
                        slotRefs.current[`passive-${index}`] = el;
                      }}
                    />
                  </ToffecBeigeCornersWrapper>
                );
              })}
            </div>
          </div>

          <SkillDetailPanel
            character={selected}
            selection={detailSelection}
            isInBattle={isInBattle}
            onEquip={handleEquip}
            onRequestUnlock={(sel) => setPendingAction({ mode: 'unlock', selection: sel })}
            onRequestUpgrade={(sel) => setPendingAction({ mode: 'upgrade', selection: sel })}
          />
        </div>
      </div>

      {pendingAction && pendingDef && pendingCost && (
        <ConfirmPanel
          title={
            pendingAction.mode === 'upgrade'
              ? 'Do you want to\nupgrade this skill'
              : 'Do you want to\nlearn this skill'
          }
          confirmLabel={pendingAction.mode === 'upgrade' ? 'Upgrade' : 'Unlock'}
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
        >
          <div className="skill-unlock-confirm">
            <SkillDecoIcon characterClass={pendingDef.class} position={pendingDef.icon} size={72} />
            <div className="skill-unlock-confirm__name pixel-font">
              {pendingDef.name}
              {pendingAction.mode === 'upgrade' && (
                <span className="skill-unlock-confirm__level">
                  {' '}
                  · Lv {pendingLevel} → {pendingLevel + 1}
                </span>
              )}
            </div>
            <IndigoLayStyledLists variant="chevron" compact>
              {(pendingAction.mode === 'upgrade'
                ? getUpgradePreviewRows(pendingAction.selection, pendingLevel).map(
                    (row) => `${row.label} ${row.from} → ${row.to}`,
                  )
                : pendingAction.selection.kind === 'active'
                  ? [pendingDef.description]
                  : describePassiveModifiers(pendingAction.selection.passive.modifiers)
              ).map((line) => (
                <IndigolayStyledListItem key={line}>{line}</IndigolayStyledListItem>
              ))}
            </IndigoLayStyledLists>
            <div className="skill-unlock-confirm__cost">
              <CostBadges resources={pendingCost} />
            </div>
          </div>
        </ConfirmPanel>
      )}
    </>
  );
}
