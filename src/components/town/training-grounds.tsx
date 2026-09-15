import { useState } from 'react';
import { useSetAtom } from 'jotai';
import type { CharacterData, CoreRPGStats } from '~/types/rpg-elements';
import {
  useParty,
  usePartyActions,
  useResources,
  useResourcesActions,
  useRespecCount,
  useProgressFlagsActions,
  useRouterActions,
  useViewData,
} from '~/stores/game-store';
import { setupBattleAtom } from '~/stores/battle-atoms';
import { TRAINING_DUMMY } from '~/constants/enemies/training';
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
import { IndigolayTab, IndigolayTabs } from '~/components/ui-custom/indigolay-tab';
import { KeyHintPill } from '~/components/ui-custom/key-hint-pill';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { IndigoLayStyledLists, IndigolayStyledListItem } from '~/components/ui-custom/indigolay-styled-list';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { PartyMemberCard } from '~/components/party/party-member-card';
import { FrostyRpgIcon } from '~/components/sprite-icons/frost-icons';
import { SkillsPanel } from '~/components/skills/skills-panel';

type TrainingTab = 'respec' | 'skills' | 'spar';
type TrainingZone = 'tabs' | 'content';
/** Within the Respec tab: the hero row, or the editor open under it. */
type RespecFocus = 'heroes' | 'editor';

const TRAINING_TABS: readonly { id: TrainingTab; label: string; tooltip: string }[] = [
  { id: 'skills', label: 'Skills', tooltip: "Unlock and upgrade each hero's skills." },
  { id: 'respec', label: 'Respec', tooltip: "Re-spend a hero's stat points for coins." },
  { id: 'spar', label: 'Spar', tooltip: 'Practice on a dummy. No rewards, no risk.' },
];

const TAB_KEY_HINTS: Record<TrainingTab, { vertical: string; enter: string }> = {
  respec: { vertical: 'hero / stats', enter: 'to respec' },
  skills: { vertical: 'browse', enter: 'to select' },
  spar: { vertical: 'focus', enter: 'to spar' },
};

/** The Spar tab's only focusable, so its cursor follows the same keyboard-only rule as the rest. */
const SPAR_START_ID = 'start-sparring';

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
  const routerActions = useRouterActions();
  const townHubData = useViewData('town-hub');
  const setupBattle = useSetAtom(setupBattleAtom);

  const [tab, setTab] = useState<TrainingTab>(TRAINING_TABS[0].id);
  const [zone, setZone] = useState<TrainingZone>('tabs');
  const [respecFocus, setRespecFocus] = useState<RespecFocus>('heroes');
  const [editingId, setEditingId] = useState<string | null>(null);

  const cost = getRespecCost(respecCount);
  const isAffordable = canAfford(resources, cost);
  const playNavTick = () => soundService.playSound(SoundNames.clickChangeTab, TOWN_SFX_VOLUME.navTick, 0.1, 0.05);

  // A level-1 hero has nothing to move; an unaffordable fee locks the card like the Inn does.
  const isRespecDisabled = (member: CharacterData) => getRefundableStatPoints(member) === 0 || !isAffordable;

  const heroRows: KeyboardSelectableItem[][] = chunk(party, INN_HERO_COLUMNS).map((row) =>
    row.map((member) => ({ id: member.id, disabled: isRespecDisabled(member) })),
  );
  const heroSelection = useKeyboardSelection(heroRows, { onMove: playNavTick });
  const sparSelection = useKeyboardSelection([[{ id: SPAR_START_ID }]], { onMove: playNavTick });

  const editingMember = party.find((member) => member.id === editingId) ?? null;
  const isSkillsKeyboardActive = zone === 'content' && tab === 'skills';
  const isEditorKeyboardActive =
    zone === 'content' && tab === 'respec' && respecFocus === 'editor' && editingMember !== null;

  function switchTab(next: TrainingTab, viaKeyboard = false) {
    if (next !== tab) {
      playNavTick();
      setTab(next);
    }
    heroSelection.clear();
    sparSelection.clear();
    setRespecFocus('heroes');
    setZone(viaKeyboard ? 'tabs' : 'content');
  }

  function enterContent() {
    setZone('content');
    if (tab === 'spar') {
      sparSelection.select(SPAR_START_ID);
      return;
    }
    if (tab !== 'respec') return;
    const firstEnabled = heroRows.flat().find((item) => !item.disabled) ?? heroRows.flat()[0];
    if (firstEnabled) heroSelection.select(firstEnabled.id);
  }

  function returnToTabs() {
    heroSelection.clear();
    sparSelection.clear();
    setRespecFocus('heroes');
    setZone('tabs');
  }

  function openEditor(member: CharacterData, viaKeyboard: boolean) {
    if (isRespecDisabled(member)) return;
    setEditingId(member.id);
    setZone('content');
    setRespecFocus(viaKeyboard ? 'editor' : 'heroes');
    if (!viaKeyboard) heroSelection.clear();
  }

  function closeEditor() {
    const closedId = editingId;
    setEditingId(null);
    setRespecFocus('heroes');
    if (closedId && respecFocus === 'editor') heroSelection.select(closedId);
  }

  function focusHeroes() {
    setRespecFocus('heroes');
    if (editingId) heroSelection.select(editingId);
  }

  async function handleRespec(member: CharacterData, newStats: CoreRPGStats) {
    const confirmed = await confirm({
      title: `Respec ${member.name}?`,
      message: `Costs ${cost.coins} coins. HP above the new maximum is lost.`,
      confirmLabel: 'Respec',
    });
    if (!confirmed || !canAfford(resources, cost)) return;
    soundService.playSound(SoundNames.clickCoin, TOWN_SFX_VOLUME.transaction);
    resourcesActions.reduceResources(cost);
    partyActions.respecCharacter(member.id, newStats);
    progressFlagsActions.registerRespec();
    closeEditor();
  }

  // A reward-free fight on the normal board. The dummy goes into the battle atoms first (as the
  // map does), and the hub is told to reopen on this location when the fight hands control back.
  function handleStartSparring() {
    soundService.playSound(SoundNames.mechanicalClick, TOWN_SFX_VOLUME.locationSelect, 0.1);
    setupBattle({ enemies: [TRAINING_DUMMY], party, mode: 'training' });
    if (townHubData) routerActions.setViewData('town-hub', { ...townHubData, initialLocation: 'training-grounds' });
    routerActions.goToBattleDemo({
      enemyId: TRAINING_DUMMY.id,
      location: 'Training Grounds',
      bgImage: backgroundImage,
    });
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

    if (tab === 'spar') {
      if (direction === 'up') {
        event.preventDefault();
        returnToTabs();
      } else if (isConfirmKey(event.key) && sparSelection.isSelected(SPAR_START_ID)) {
        event.preventDefault();
        if (!event.repeat) handleStartSparring();
      }
      return;
    }

    if (direction) {
      event.preventDefault();
      if (direction === 'up' && (heroSelection.position === null || heroSelection.position.rowIndex === 0)) {
        returnToTabs();
      } else if (direction === 'down' && editingMember && heroSelection.position?.rowIndex === heroRows.length - 1) {
        setRespecFocus('editor');
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
        <IndigolayTabs rule className="town-tabs">
          {TRAINING_TABS.map((entry) => (
            <IndigolayTab
              key={entry.id}
              size="default"
              isActive={tab === entry.id}
              onClick={() => switchTab(entry.id)}
              tooltip={entry.tooltip}
            >
              {entry.label}
            </IndigolayTab>
          ))}
          <KeyHintPill
            className="town-key-hint"
            items={[
              { keys: ['←', '→'], label: 'switch tab' },
              { keys: ['↑', '↓'], label: TAB_KEY_HINTS[tab].vertical },
              { keys: ['Enter'], label: TAB_KEY_HINTS[tab].enter },
            ]}
          />
        </IndigolayTabs>

        {tab === 'respec' && (
          <div className="training-respec">
            <div className="town-section-header town-section-header--inn">
              <h2>
                <NarikWoodBitFont text="RESPEC" size={1.2} />
              </h2>
              <div className="town-header-badge">
                <span className="town-header-badge__label">Next respec</span>
                <span className="town-header-badge__value town-header-badge__value--coins">{cost.coins} coins</span>
              </div>
            </div>
            <p className="town-section-subtitle">
              Move the stat points a hero chose at level-up. Random growth stays where it landed.
            </p>

            <div className="party-members-grid inn-party-members-grid">
              {party.map((member) => {
                const refundable = getRefundableStatPoints(member);
                const isDisabled = isRespecDisabled(member);
                const isEditing = member.id === editingId;
                return (
                  <div key={member.id} className="inn-hero-cell">
                    <ToffecBeigeCornersWrapper
                      className={cn(isDisabled && 'cannot-afford')}
                      forceDisplay={
                        (zone === 'content' && respecFocus === 'heroes' && heroSelection.isSelected(member.id)) ||
                        (isEditing && respecFocus === 'editor')
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
                        {refundable} pts · {isAffordable ? 'Respec' : 'Need'} {cost.coins}
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
        )}

        {tab === 'skills' && (
          <div className="training-skills">
            <SkillsPanel keyboardActive={isSkillsKeyboardActive} onExitLeft={returnToTabs} />
          </div>
        )}

        {tab === 'spar' && (
          <div className="training-spar">
            <div className="town-section-header town-section-header--inn">
              <h2>
                <NarikWoodBitFont text="SPARRING" size={1.2} />
              </h2>
            </div>
            <div className="training-spar__card">
              <div className="training-spar__dummy">
                <div className="training-spar__dummy-frame">
                  <img
                    src={TRAINING_DUMMY.sprite}
                    alt={TRAINING_DUMMY.name}
                    className="training-spar__dummy-sprite pixel-art"
                  />
                </div>
                <span className="training-spar__dummy-name pixel-font">{TRAINING_DUMMY.name}</span>
              </div>
              <div className="training-spar__details">
                <IndigoLayStyledLists variant="chevron">
                  <IndigolayStyledListItem>Never hits back — no HP at stake</IndigolayStyledListItem>
                  <IndigolayStyledListItem>Items and ultimates work, nothing is used up</IndigolayStyledListItem>
                  <IndigolayStyledListItem>Live damage and DPS readout</IndigolayStyledListItem>
                  <IndigolayStyledListItem>Leave any time from the pause menu</IndigolayStyledListItem>
                </IndigoLayStyledLists>
                <div className="training-spar__actions">
                  <ToffecBeigeCornersWrapper forceDisplay={sparSelection.isSelected(SPAR_START_ID)}>
                    <ToffecButton variant="cream" size="xs" onClick={handleStartSparring}>
                      Start sparring
                    </ToffecButton>
                  </ToffecBeigeCornersWrapper>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TownLocationLayout>
  );
}
