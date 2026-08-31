import { useEffect, useRef, useState } from 'react';
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
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { NarikHeading } from '~/components/typography/narik-heading';
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
import { getDetailActions } from '~/components/pause-menu/skills/skill-gates';

import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';

/** How long the just-unlocked slot flare plays. Matches the CSS animations. */
const UNLOCK_FLASH_MS = 950;

/** A purchase awaiting confirmation: first unlock, or a level upgrade. */
interface PendingAction {
  mode: 'unlock' | 'upgrade';
  selection: SkillSelection;
}

interface PauseMenuSkillsProps {
  /** The content zone owns the keyboard — arrows/Enter act on this pane. */
  keyboardActive?: boolean;
  /** Fired when ← from the roster hands the keyboard back to the sidebar. */
  onExitToSidebar?: () => void;
}

/**
 * The Skills tab: pick a hero, browse their Active (Ultimate) track and Passive
 * track as framed Indigolay slots, inspect any slot in the parchment detail
 * panel, and unlock or level up skills with crafting resources — reaching a
 * level only makes a skill purchasable. Tier-0 Ultimates are the free starting kit.
 */
export function PauseMenuSkills({ keyboardActive = false, onExitToSidebar }: PauseMenuSkillsProps) {
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
  // Which column the keyboard cursor lives in: the party roster or the slots/actions pane.
  const [column, setColumn] = useState<'roster' | 'main'>('roster');
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = party.find((m) => m.id === selectedId) ?? party[0];

  const actives = selected ? getSkillsForClass(selected.class) : [];
  const passives = selected ? getPassivesForClass(selected.class) : [];

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
  }

  function handleEquip(skillId: string) {
    if (!selected) return;
    soundService.playSound(SoundNames.mechanicalClick, 0.5);
    partyActions.selectSkillForCharacter(selected.id, skillId);
  }

  // ─── Keyboard: main-column grid [active slots] / [passive slots] / [detail actions] ──
  const detailActions = selected ? getDetailActions(selected, detailSelection, resources, isInBattle) : [];
  const gridRows: KeyboardSelectableItem[][] = [
    actives.map((skill) => ({ id: `active:${skill.id}` })),
    passives.map((passive) => ({ id: `passive:${passive.id}` })),
    ...(detailActions.length > 0
      ? [detailActions.map((action) => ({ id: `action:${action.id}`, disabled: action.disabled }))]
      : []),
  ];

  const gridSelection = useKeyboardSelection(gridRows, {
    // Landing on a slot re-points the detail panel (selectSlot brings its own sound);
    // landing on an action button only ticks.
    onMove: (id) => {
      if (id.startsWith('active:')) {
        const index = actives.findIndex((skill) => `active:${skill.id}` === id);
        if (index !== -1) selectSlot('active', index);
        return;
      }
      if (id.startsWith('passive:')) {
        const index = passives.findIndex((passive) => `passive:${passive.id}` === id);
        if (index !== -1) selectSlot('passive', index);
        return;
      }
      soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05);
    },
  });

  // Leaving the pane (← or Escape back to the sidebar) re-arms the roster column and
  // drops the cursor, so a later return can't show a stale one.
  const gridSelectionRef = useRef(gridSelection);
  gridSelectionRef.current = gridSelection;
  useEffect(() => {
    if (keyboardActive) return;
    setColumn('roster');
    gridSelectionRef.current.clear();
  }, [keyboardActive]);

  // The keyboard cursor sits on an action button only while the hook says so; the
  // detail panel shows the corners on that button.
  const keyboardSelectedActionId = gridSelection.selectedId?.startsWith('action:')
    ? gridSelection.selectedId.slice('action:'.length)
    : null;

  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;
    const direction = getNavDirection(event.key);

    if (column === 'roster') {
      if (direction === 'up' || direction === 'down') {
        event.preventDefault();
        const currentIndex = party.findIndex((m) => m.id === selectedId);
        const step = direction === 'down' ? 1 : -1;
        const next = party[(currentIndex + step + party.length) % party.length];
        if (next) selectCharacter(next.id);
        return;
      }
      if (direction === 'left') {
        event.preventDefault();
        onExitToSidebar?.();
        return;
      }
      if (direction === 'right' || isConfirmKey(event.key)) {
        event.preventDefault();
        if (isConfirmKey(event.key) && event.repeat) return;
        setColumn('main');
        const def = detailSelection.kind === 'active' ? detailSelection.skill : detailSelection.passive;
        gridSelection.select(`${selection.row}:${def.id}`);
      }
      return;
    }

    // Main column
    if (direction) {
      event.preventDefault();
      if (direction === 'left' && (gridSelection.position === null || gridSelection.position.colIndex === 0)) {
        gridSelection.clear();
        setColumn('roster');
        return;
      }
      gridSelection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      const entry = gridRows.flat().find((item) => item.id === gridSelection.selectedId);
      if (!entry || entry.disabled) return;
      if (entry.id.startsWith('active:') || entry.id.startsWith('passive:')) {
        // Enter on a slot means "go do something with this skill": jump the cursor
        // to the first enabled detail action, if it has one.
        const firstEnabled = detailActions.find((action) => !action.disabled);
        if (firstEnabled) gridSelection.select(`action:${firstEnabled.id}`);
        return;
      }
      const actionId = entry.id.slice('action:'.length);
      if (actionId === 'equip') {
        const def = detailSelection.kind === 'active' ? detailSelection.skill : detailSelection.passive;
        handleEquip(def.id);
      } else if (actionId === 'unlock') {
        setPendingAction({ mode: 'unlock', selection: detailSelection });
      } else if (actionId === 'upgrade') {
        setPendingAction({ mode: 'upgrade', selection: detailSelection });
      }
    }
  }, keyboardActive);

  if (!selected) return null;

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
      <NarikHeading as="h2" text="Skills" />
      <div className="pause-menu-skills-layout">
        <div className="pause-menu-party-roster">
          {party.map((member) => (
            <PartyMemberCard
              key={member.id}
              member={member}
              variant="roster"
              isActive={member.id === selectedId}
              isKeyboardCursor={keyboardActive && column === 'roster' && member.id === selectedId}
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
                  <ToffecBeigeCornersWrapper
                    key={skill.id}
                    className="skill-slot-wrapper"
                    forceDisplay={gridSelection.isSelected(`active:${skill.id}`)}
                  >
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
                  <ToffecBeigeCornersWrapper
                    key={passive.id}
                    className="skill-slot-wrapper"
                    forceDisplay={gridSelection.isSelected(`passive:${passive.id}`)}
                  >
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
            keyboardSelectedActionId={keyboardSelectedActionId}
            onEquip={handleEquip}
            onRequestUnlock={(sel) => setPendingAction({ mode: 'unlock', selection: sel })}
            onRequestUpgrade={(sel) => setPendingAction({ mode: 'upgrade', selection: sel })}
          />
        </div>
      </div>

      {pendingAction && pendingDef && pendingCost && (
        <ConfirmPanel
          title={
            pendingAction.mode === 'upgrade' ? 'Do you want to\nupgrade this skill' : 'Do you want to\nlearn this skill'
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
