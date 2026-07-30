import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useParty, usePartyActions, useResources, useResourcesActions, useCurrentView } from '~/stores/game-store';
import type { Resources } from '~/types/resources';
import { getSkillsForClass, getPassivesForClass, isSkillUnlocked, isPassiveUnlocked } from '~/lib/skill-system';
import { canAfford } from '~/lib/resources';
import { useUnlockSkill } from '~/hooks/use-unlock-skill';
import { useUnlockPassive } from '~/hooks/use-unlock-passive';
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
import { describePassiveModifiers } from '~/components/pause-menu/skills/passive-descriptions';

/** How long the just-unlocked slot flare plays. Matches the CSS animations. */
const UNLOCK_FLASH_MS = 950;

/**
 * The Skills tab: pick a hero, browse their Active (Ultimate) track and Passive
 * track as framed Indigolay slots, inspect any slot in the parchment detail
 * panel, and unlock skills with crafting resources — reaching a level only
 * makes a skill purchasable. Tier-0 Ultimates are the free starting kit.
 */
export function PauseMenuSkills() {
  const party = useParty();
  const partyActions = usePartyActions();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const unlockActive = useUnlockSkill().unlock;
  const unlockPassive = useUnlockPassive().unlock;
  const isInBattle = useCurrentView() === 'battle-demo';

  const [selectedId, setSelectedId] = useState(party[0]?.id ?? '');
  const [selection, setSelection] = useState<{ row: 'active' | 'passive'; index: number }>({ row: 'active', index: 0 });
  const [pendingUnlock, setPendingUnlock] = useState<SkillSelection | null>(null);
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

  function handleConfirmUnlock() {
    const pending = pendingUnlock;
    setPendingUnlock(null);
    if (!pending) return;
    const def = pending.kind === 'active' ? pending.skill : pending.passive;
    if (!canAfford(resources, def.cost)) return;
    soundService.playSound(SoundNames.clickCoin);
    resourcesActions.reduceResources(def.cost);
    if (pending.kind === 'active') unlockActive(selected.id, def.id);
    else unlockPassive(selected.id, def.id);
    flashSlot(def.id);
  }

  const pendingDef = pendingUnlock
    ? pendingUnlock.kind === 'active'
      ? pendingUnlock.skill
      : pendingUnlock.passive
    : null;

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
                  <ul className="indigolay-list">
                    <li className="indigolay-list__item">
                      <span className="indigolay-list__bullet">◆</span>
                      <span className="indigolay-list__text">One equipped at a time</span>
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <GradientDivider variant="gold" className="my-1" />
            <div className="pause-menu-skills-row">
              {actives.map((skill, index) => {
                const locked = !isSkillUnlocked(selected, skill.id);
                return (
                  <ToffecBeigeCornersWrapper key={skill.id} className="skill-slot-wrapper">
                    <SkillSlot
                      characterClass={selected.class}
                      icon={skill.icon}
                      name={skill.name}
                      locked={locked}
                      unlockLevel={skill.unlockLevel}
                      selected={selection.row === 'active' && selection.index === index}
                      equipped={selected.selectedSkillId === skill.id}
                      flash={justUnlockedId === skill.id}
                      tooltip={locked ? <SlotTooltip name={skill.name} cost={skill.cost} /> : undefined}
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
                  <ul className="indigolay-list">
                    <li className="indigolay-list__item">
                      <span className="indigolay-list__bullet">◆</span>
                      <span className="indigolay-list__text">All learned passives apply</span>
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <GradientDivider variant="gold" className="my-1" />
            <div className="pause-menu-skills-row pause-menu-skills-row--passive">
              {passives.map((passive, index) => {
                const locked = !isPassiveUnlocked(selected, passive.id);
                return (
                  <ToffecBeigeCornersWrapper key={passive.id} className="skill-slot-wrapper">
                    <SkillSlot
                      characterClass={selected.class}
                      icon={passive.icon}
                      name={passive.name}
                      locked={locked}
                      unlockLevel={passive.unlockLevel}
                      selected={selection.row === 'passive' && selection.index === index}
                      flash={justUnlockedId === passive.id}
                      tooltip={locked ? <SlotTooltip name={passive.name} cost={passive.cost} /> : undefined}
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
            onRequestUnlock={setPendingUnlock}
          />
        </div>
      </div>

      {pendingUnlock && pendingDef && (
        <ConfirmPanel
          title={pendingUnlock.kind === 'active' ? 'Learn Skill' : 'Learn Passive'}
          confirmLabel="Unlock"
          cancelLabel="Cancel"
          onConfirm={handleConfirmUnlock}
          onCancel={() => setPendingUnlock(null)}
        >
          <div className="skill-unlock-confirm">
            <SkillDecoIcon characterClass={pendingDef.class} position={pendingDef.icon} size={72} />
            <div className="skill-unlock-confirm__name pixel-font">{pendingDef.name}</div>
            <ul className="indigolay-list indigolay-list--compact">
              {(pendingUnlock.kind === 'active'
                ? [pendingDef.description]
                : describePassiveModifiers(pendingUnlock.passive.modifiers)
              ).map((line) => (
                <li key={line} className="indigolay-list__item">
                  <span className="indigolay-list__bullet indigolay-list__bullet--amber">◆</span>
                  <span className="indigolay-list__text">{line}</span>
                </li>
              ))}
            </ul>
            <div className="skill-unlock-confirm__cost">
              <CostBadges resources={pendingDef.cost} />
            </div>
          </div>
        </ConfirmPanel>
      )}
    </>
  );
}

function SlotTooltip({ name, cost }: { name: string; cost: Resources }) {
  return (
    <div className="skill-slot-tooltip">
      <div className="font-bold">{name}</div>
      <div className="skill-slot-tooltip__cost">
        <CostBadges resources={cost} />
      </div>
    </div>
  );
}
