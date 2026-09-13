import { useState } from 'react';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import {
  useParty,
  usePartyActions,
  useResources,
  useResourcesActions,
  useRespecCount,
  useProgressFlagsActions,
} from '~/stores/game-store';
import { getRefundableStatPoints } from '~/lib/leveling-system';
import { canAfford } from '~/lib/resources';
import { chunk, cn } from '~/lib/utils';
import { getRespecCost } from '~/constants/training-grounds';
import { INN_HERO_COLUMNS } from '~/constants/game';
import { soundService } from '~/services/sound-service';
import { SoundNames, TOWN_SFX_VOLUME } from '~/constants/audio';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { TRAINING_GROUNDS_WELCOME_TEXT } from '~/constants/flavor-text/welcome-text';
import { TRAINER_CHAR } from '~/constants/dialogue/characters';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { useKeyboardSelection, type KeyboardSelectableItem } from '~/hooks/use-keyboard-selection';
import { useConfirm } from '~/hooks/use-confirm';
import { TownLocationLayout } from './town-location-layout';
import { RespecEditor } from './respec-editor';
import { IndigolayTab } from '~/components/ui-custom/indigolay-tab';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { PartyMemberCard } from '~/components/party/party-member-card';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { SkillsPanel } from '~/components/skills/skills-panel';

type TrainingTab = 'retrain' | 'skills';
type TrainingZone = 'tabs' | 'content';
/** Within the Retrain tab: the hero row, or the editor open under it. */
type RetrainFocus = 'heroes' | 'editor';

const TRAINING_TABS: readonly { id: TrainingTab; label: string }[] = [
  { id: 'retrain', label: 'Retrain' },
  { id: 'skills', label: 'Skills' },
];

interface TrainingGroundsProps {
  backgroundImage: string;
  onLeaveCallback: () => void;
}

export default function TrainingGrounds({ backgroundImage, onLeaveCallback }: TrainingGroundsProps) {
  const party = useParty();
  const partyActions = usePartyActions();
  const resources = useResources();
  const resourcesActions = useResourcesActions();
  const respecCount = useRespecCount();
  const progressFlagsActions = useProgressFlagsActions();
  const confirm = useConfirm();

  const [tab, setTab] = useState<TrainingTab>('retrain');
  const [zone, setZone] = useState<TrainingZone>('tabs');
  const [retrainFocus, setRetrainFocus] = useState<RetrainFocus>('heroes');
  const [editingId, setEditingId] = useState<string | null>(null);

  const cost = getRespecCost(respecCount);
  const isAffordable = canAfford(resources, cost);
  const playNavTick = () => soundService.playSound(SoundNames.clickChangeTab, TOWN_SFX_VOLUME.navTick, 0.1, 0.05);

  // A level-1 hero has nothing to move; an unaffordable fee locks the card like the Inn does.
  const isRetrainDisabled = (member: CharacterData) => getRefundableStatPoints(member) === 0 || !isAffordable;

  const heroRows: KeyboardSelectableItem[][] = chunk(party, INN_HERO_COLUMNS).map((row) =>
    row.map((member) => ({ id: member.id, disabled: isRetrainDisabled(member) })),
  );
  const heroSelection = useKeyboardSelection(heroRows, { onMove: playNavTick });

  const editingMember = party.find((member) => member.id === editingId) ?? null;
  const isSkillsKeyboardActive = zone === 'content' && tab === 'skills';
  const isEditorKeyboardActive =
    zone === 'content' && tab === 'retrain' && retrainFocus === 'editor' && editingMember !== null;

  function switchTab(next: TrainingTab, viaKeyboard = false) {
    if (next !== tab) {
      playNavTick();
      setTab(next);
    }
    heroSelection.clear();
    setRetrainFocus('heroes');
    setZone(viaKeyboard ? 'tabs' : 'content');
  }

  function enterContent() {
    setZone('content');
    if (tab !== 'retrain') return;
    const firstEnabled = heroRows.flat().find((item) => !item.disabled) ?? heroRows.flat()[0];
    if (firstEnabled) heroSelection.select(firstEnabled.id);
  }

  function returnToTabs() {
    heroSelection.clear();
    setRetrainFocus('heroes');
    setZone('tabs');
  }

  function openEditor(member: CharacterData, viaKeyboard: boolean) {
    if (isRetrainDisabled(member)) return;
    setEditingId(member.id);
    setZone('content');
    setRetrainFocus(viaKeyboard ? 'editor' : 'heroes');
    if (!viaKeyboard) heroSelection.clear();
  }

  function closeEditor() {
    const closedId = editingId;
    setEditingId(null);
    setRetrainFocus('heroes');
    if (closedId && retrainFocus === 'editor') heroSelection.select(closedId);
  }

  function focusHeroes() {
    setRetrainFocus('heroes');
    if (editingId) heroSelection.select(editingId);
  }

  async function handleRespec(member: CharacterData, newStats: CoreRPGStats) {
    const confirmed = await confirm({
      title: `Retrain ${member.name}?`,
      message: `Costs ${cost.coins} coins. HP above the new maximum is lost.`,
      confirmLabel: 'Retrain',
    });
    if (!confirmed || !canAfford(resources, cost)) return;
    soundService.playSound(SoundNames.clickCoin, TOWN_SFX_VOLUME.transaction);
    resourcesActions.reduceResources(cost);
    partyActions.respecCharacter(member.id, newStats);
    progressFlagsActions.registerRespec();
    closeEditor();
  }

  // Tabs and the hero row are handled here; the editor and the skills panel bind their own keys
  // while they own the cursor, so this listener steps aside for them.
  useWindowKeyDown((event) => {
    if (event.defaultPrevented) return;
    const direction = getNavDirection(event.key);

    if (zone === 'tabs') {
      if (direction === 'left' || direction === 'right') {
        event.preventDefault();
        const currentIndex = TRAINING_TABS.findIndex((entry) => entry.id === tab);
        const step = direction === 'right' ? 1 : -1;
        switchTab(TRAINING_TABS[(currentIndex + step + TRAINING_TABS.length) % TRAINING_TABS.length].id, true);
        return;
      }
      if (direction === 'down' || isConfirmKey(event.key)) {
        event.preventDefault();
        if (event.repeat) return;
        enterContent();
      }
      return;
    }

    if (direction) {
      event.preventDefault();
      if (direction === 'up' && (heroSelection.position === null || heroSelection.position.rowIndex === 0)) {
        returnToTabs();
      } else if (direction === 'down' && editingMember && heroSelection.position?.rowIndex === heroRows.length - 1) {
        setRetrainFocus('editor');
      } else {
        heroSelection.move(direction);
      }
      return;
    }

    if (!isConfirmKey(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    const member = party.find((entry) => entry.id === heroSelection.selectedId);
    if (member) openEditor(member, true);
  }, !isSkillsKeyboardActive && !isEditorKeyboardActive);

  return (
    <TownLocationLayout
      locationClass="training-grounds"
      bgClass="bg-training-grounds"
      backgroundImage={backgroundImage}
      character={TRAINER_CHAR}
      welcomeTexts={TRAINING_GROUNDS_WELCOME_TEXT}
      marqueeType="training-grounds"
      onLeave={onLeaveCallback}
    >
      <div className="training-content">
        <div className="blacksmith-tabs">
          {TRAINING_TABS.map((entry) => (
            <IndigolayTab key={entry.id} size="default" isActive={tab === entry.id} onClick={() => switchTab(entry.id)}>
              {entry.label}
            </IndigolayTab>
          ))}
          <KeyHintPill
            className="town-key-hint"
            items={[
              { keys: ['←', '→'], label: 'switch tab' },
              { keys: ['↑', '↓'], label: tab === 'retrain' ? 'hero / stats' : 'browse' },
              { keys: ['Enter'], label: tab === 'retrain' ? 'to retrain' : 'to select' },
            ]}
          />
        </div>

        {tab === 'retrain' ? (
          <div className="training-retrain">
            <div className="town-section-header town-section-header--inn">
              <h2>
                <NarikWoodBitFont text="RETRAIN" size={1.2} />
              </h2>
              <div className="town-header-badge">
                <span className="town-header-badge__label">Next retrain</span>
                <span className="town-header-badge__value town-header-badge__value--coins">{cost.coins} coins</span>
              </div>
            </div>
            <p className="town-section-subtitle">
              Move the stat points a hero chose at level-up. Random growth stays where it landed.
            </p>

            <div className="party-members-grid inn-party-members-grid">
              {party.map((member) => {
                const refundable = getRefundableStatPoints(member);
                const isDisabled = isRetrainDisabled(member);
                const isEditing = member.id === editingId;
                return (
                  <div key={member.id} className="inn-hero-cell">
                    <ToffecBeigeCornersWrapper
                      className={cn(isDisabled && 'cannot-afford')}
                      forceDisplay={
                        (zone === 'content' && retrainFocus === 'heroes' && heroSelection.isSelected(member.id)) ||
                        (isEditing && retrainFocus === 'editor')
                      }
                    >
                      <PartyMemberCard
                        member={member}
                        variant="bar"
                        isActive={isEditing}
                        onClick={isDisabled ? undefined : () => openEditor(member, false)}
                      />
                    </ToffecBeigeCornersWrapper>
                    {refundable === 0 ? (
                      <div className="inn-hero-heal inn-hero-heal--full">Nothing to move</div>
                    ) : (
                      <div className={cn('inn-hero-heal', !isAffordable && 'inn-hero-heal--locked')}>
                        {refundable} pts · {isAffordable ? 'Retrain' : 'Need'} {cost.coins}
                        <FrostyRpgIcon name="coinPurse" size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {editingMember && (
              <RespecEditor
                key={editingMember.id}
                character={editingMember}
                isAffordable={isAffordable}
                keyboardActive={isEditorKeyboardActive}
                onConfirm={(newStats) => handleRespec(editingMember, newStats)}
                onBack={closeEditor}
                onExitUp={focusHeroes}
              />
            )}
          </div>
        ) : (
          <div className="training-skills">
            <SkillsPanel keyboardActive={isSkillsKeyboardActive} onExitLeft={returnToTabs} />
          </div>
        )}
      </div>
    </TownLocationLayout>
  );
}
