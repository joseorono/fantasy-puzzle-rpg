import { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import {
  activeDungeonIdAtom,
  currentFloorIndexAtom,
  currentEventIndexAtom,
  dungeonPhaseAtom,
  isReplayAtom,
  hasRestedOnFloorAtom,
  restsUsedAtom,
  startDungeonRunAtom,
  advanceEventAtom,
  advanceFloorAtom,
  resetDungeonRunAtom,
  resolveBattleWinAtom,
  floorRatingsAtom,
} from '~/stores/dungeon-atoms';
import { setupBattleAtom } from '~/stores/battle-atoms';
import {
  useParty,
  usePartyActions,
  useInventory,
  useInventoryActions,
  useResources,
  useResourcesActions,
  useRouterActions,
  useViewData,
  useDungeonProgressActions,
} from '~/stores/game-store';
import {
  getFloor,
  getEvent,
  getFloorBackground,
  getDungeonRestPool,
  isLastFloor,
  shouldRunEvent,
  summarizeFloorRatings,
  formatFloorTitle,
} from '~/lib/dungeon-system';
import { applyLootTable } from '~/lib/loot';
import { healAllByMaxHpPercent, isPartyFullyHealed } from '~/lib/party-system';
import { DUNGEON_FLOOR_MARK_ICONS, DUNGEON_REST_HEAL_PERCENT } from '~/constants/dungeon';
import { DEFAULT_VIEW } from '~/constants/routing';
import type { DialogueScene as DialogueSceneType } from '~/types/dialogue';
import type { LootTable } from '~/types/loot';
import type { DungeonEvent } from '~/types/dungeon';
import { DialogueScene } from '~/components/dialogue';
import { LootNotification } from '~/components/map/loot-notification';
import { DungeonClearScreen } from '~/components/dungeon/dungeon-clear-screen';
import { PauseMenuResourcesBar } from '~/components/pause-menu/pause-menu-resources-bar';
import { PauseMenuPartyBar } from '~/components/pause-menu/pause-menu-party-bar';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { GradientDivider } from '~/components/dividers/gradient-divider';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import { useConfirm } from '~/hooks/use-confirm';
import { useKeyboardSelection } from '~/hooks/use-keyboard-selection';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { getNavDirection, isConfirmKey } from '~/constants/keyboard';
import { confirmDialogRequestAtom } from '~/stores/confirm-dialog-atoms';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { Star } from 'lucide-react';
import { MAX_STARS, STAR_COLOR_FILLED, STAR_COLOR_EMPTY } from '~/constants/battle-rating';
import { cn, getRandomElement } from '~/lib/utils';
import {
  DUNGEON_COMBAT_FLAVOR,
  DUNGEON_BOSS_FLAVOR,
  DUNGEON_CHEST_FLAVOR,
  DUNGEON_DIALOGUE_FLAVOR,
  DUNGEON_CONTINUE_FLAVOR,
  DUNGEON_CLEARED_FLAVOR,
} from '~/constants/flavor-text/dungeon-flavor';

type DungeonActionId = 'engage' | 'finish' | 'manage-party' | 'rest' | 'leave';

/**
 * One keyboard-reachable action. The buttons and the keyboard grid are built from the
 * same entries, so a shortcut can never fire an action its button has disabled.
 */
interface DungeonAction {
  id: DungeonActionId;
  label: string;
  disabled: boolean;
  run: () => void;
}

/** Label for the floor's contextual action button, by the current event type. */
function getActionLabel(event: DungeonEvent | undefined, isBoss: boolean): string {
  if (!event) return 'Continue';
  if (event.type === 'dialogue') return 'View Scene';
  if (event.type === 'chest') return 'Open Chest';
  return isBoss ? 'Challenge Boss' : 'Enter Battle';
}

/** Icon shown in the action card's pixel-art medallion, by the current event type. */
function getEventMedallion(event: DungeonEvent | undefined, isBoss: boolean): FrostyRpgIconName {
  if (isBoss) return 'skull';
  if (!event) return 'elixir';
  if (event.type === 'dialogue') return 'openBook';
  if (event.type === 'chest') return 'parchment';
  return 'steelSword';
}

/**
 * Marker icon for a floor in the descent track. Boss floors only flag danger while
 * still locked — once reached or cleared, the current/completed marker takes over.
 */
function floorMarkIcon(state: 'completed' | 'current' | 'locked', isBoss?: boolean) {
  if (state === 'completed') return DUNGEON_FLOOR_MARK_ICONS.completed;
  if (state === 'current') return DUNGEON_FLOOR_MARK_ICONS.current;
  return isBoss ? DUNGEON_FLOOR_MARK_ICONS.boss : DUNGEON_FLOOR_MARK_ICONS.locked;
}

/** Compact star row (filled up to `stars`, out of MAX_STARS) for a floor's combat rating. */
function FloorRatingStars({ stars }: { stars: number }) {
  return (
    <span className="dungeon-floor__rating" aria-label={`${stars} of ${MAX_STARS} stars`}>
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <Star
          key={i}
          className="dungeon-floor__star"
          fill="currentColor"
          strokeWidth={0}
          style={{ color: i < stars ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY }}
        />
      ))}
    </span>
  );
}

/** Random flavor line for the current event (chosen once per event in an effect). */
function pickEventFlavor(event: DungeonEvent | undefined, isBoss: boolean): string {
  if (!event) return getRandomElement(DUNGEON_CONTINUE_FLAVOR);
  if (event.type === 'dialogue') return getRandomElement(DUNGEON_DIALOGUE_FLAVOR);
  if (event.type === 'chest') return getRandomElement(DUNGEON_CHEST_FLAVOR);
  return getRandomElement(isBoss ? DUNGEON_BOSS_FLAVOR : DUNGEON_COMBAT_FLAVOR);
}

/**
 * Drives a single dungeon run: steps through `floors[].events[]` in order, wiring
 * the existing combat, dialogue, loot, rewards and pause-menu systems together.
 * Run state lives in transient Jotai atoms (so it survives this view unmounting
 * during combat); the store is written once, on completion.
 */
export default function DungeonView() {
  const viewData = useViewData('dungeon');

  // ─── Run state (Jotai) ───────────────────────────────────────────────
  const activeDungeonId = useAtomValue(activeDungeonIdAtom);
  const floorIndex = useAtomValue(currentFloorIndexAtom);
  const eventIndex = useAtomValue(currentEventIndexAtom);
  const phase = useAtomValue(dungeonPhaseAtom);
  const isReplay = useAtomValue(isReplayAtom);
  const hasRested = useAtomValue(hasRestedOnFloorAtom);
  const restsUsed = useAtomValue(restsUsedAtom);
  const floorRatings = useAtomValue(floorRatingsAtom);

  const startRun = useSetAtom(startDungeonRunAtom);
  const advanceEvent = useSetAtom(advanceEventAtom);
  const advanceFloor = useSetAtom(advanceFloorAtom);
  const resetRun = useSetAtom(resetDungeonRunAtom);
  const resolveBattleWin = useSetAtom(resolveBattleWinAtom);
  const setPhase = useSetAtom(dungeonPhaseAtom);
  const setHasRested = useSetAtom(hasRestedOnFloorAtom);
  const setRestsUsed = useSetAtom(restsUsedAtom);
  const setupBattle = useSetAtom(setupBattleAtom);
  const store = useStore();

  // ─── Store ───────────────────────────────────────────────────────────
  const party = useParty();
  const { setParty } = usePartyActions();
  const inventory = useInventory();
  const { setInventory } = useInventoryActions();
  const resources = useResources();
  const { setResources } = useResourcesActions();
  // A run returns to whichever surface launched it (map node, debug list, …). We can't use
  // goBack(): the battle round-trip leaves the router's previousView null.
  const { goToBattleDemo, goBackTo } = useRouterActions();
  const { markDungeonCompleted } = useDungeonProgressActions();

  const pauseMenu = usePauseMenu();
  const confirm = useConfirm();
  const confirmRequest = useAtomValue(confirmDialogRequestAtom);

  // ─── Local UI state ──────────────────────────────────────────────────
  const [activeDialogue, setActiveDialogue] = useState<DialogueSceneType | null>(null);
  const [currentLoot, setCurrentLoot] = useState<LootTable | null>(null);
  const [showClearOverlay, setShowClearOverlay] = useState(false);
  const [flavorLine, setFlavorLine] = useState<string>(() => getRandomElement(DUNGEON_CONTINUE_FLAVOR));
  // One-shot latches: these actions navigate away (or await a dialog), so a second
  // activation before the unmount must not run them twice.
  const isLeavingRef = useRef(false);
  const hasFinishedRef = useRef(false);

  // The dungeon definition is passed by reference through the router (authored or generated).
  const dungeon = viewData?.dungeon;

  // On mount: resume a won battle, or seed a fresh run. Both paths are idempotent,
  // so StrictMode's double-fired mount effect is safe.
  useEffect(() => {
    if (!viewData) return;
    if (activeDungeonId === viewData.dungeon.id && phase === 'awaiting-battle') {
      resolveBattleWin();
    } else if (activeDungeonId !== viewData.dungeon.id) {
      startRun({ dungeonId: viewData.dungeon.id, isReplay: viewData.isReplay });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-skip replay events and roll over floors / completion. Runs only while
  // browsing (not mid-battle, mid-dialogue, or after completion). All decisions read
  // LIVE atom state via the jotai store so a double-fired mount effect (StrictMode)
  // takes exactly one consistent step rather than double-skipping an event.
  useEffect(() => {
    if (!dungeon || !viewData) return;
    if (activeDialogue) return;
    if (store.get(dungeonPhaseAtom) !== 'browsing') return;
    if (store.get(activeDungeonIdAtom) !== viewData.dungeon.id) return; // not seeded yet

    const liveFloorIndex = store.get(currentFloorIndexAtom);
    const floor = getFloor(dungeon, liveFloorIndex);
    if (!floor) return;

    const event = getEvent(floor, store.get(currentEventIndexAtom));
    if (event === undefined) {
      // Floor exhausted: advance to the next floor, or finish the dungeon.
      if (isLastFloor(dungeon, liveFloorIndex)) {
        // The single store write of the run. Remixes opt out — their id is throwaway.
        if (dungeon.recordsCompletion !== false) markDungeonCompleted(dungeon.id);
        setPhase('complete');
      } else {
        advanceFloor();
      }
      return;
    }

    if (!shouldRunEvent(event, store.get(isReplayAtom))) {
      advanceEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, floorIndex, eventIndex, activeDialogue, activeDungeonId]);

  // Re-roll the flavor line once per event/floor/phase change (not per render, so
  // it doesn't flicker).
  useEffect(() => {
    if (!dungeon) return;
    if (phase === 'complete') {
      setFlavorLine(getRandomElement(DUNGEON_CLEARED_FLAVOR));
      return;
    }
    const floor = getFloor(dungeon, floorIndex);
    const event = floor ? getEvent(floor, eventIndex) : undefined;
    setFlavorLine(pickEventFlavor(event, floor?.isBoss ?? false));
  }, [dungeon, floorIndex, eventIndex, phase]);

  // ─── Derived gates (before the not-found return: the hooks below need them) ──
  const currentFloor = dungeon ? getFloor(dungeon, floorIndex) : undefined;
  const currentEvent = currentFloor ? getEvent(currentFloor, eventIndex) : undefined;
  const isBoss = currentFloor?.isBoss ?? false;

  const isComplete = phase === 'complete';
  const isBrowsing = phase === 'browsing' && !activeDialogue;
  const canEngage = isBrowsing && currentEvent !== undefined;

  // Footer controls available only between events (not mid-combat / mid-dialogue).
  const controlsEnabled = isBrowsing && !isComplete;
  const partyFull = isPartyFullyHealed(party);
  const restsLeft = (dungeon ? getDungeonRestPool(dungeon) : 0) - restsUsed;
  // No resting on the entrance floor: otherwise players could walk in, rest, and leave,
  // treating the dungeon as a free (albeit slower) inn. You must progress past it first.
  const canRestOnThisFloor = floorIndex > 0;
  const isRestDisabled = !controlsEnabled || hasRested || partyFull || restsLeft <= 0 || !canRestOnThisFloor;

  // ─── Keyboard ────────────────────────────────────────────────────────
  // The buttons and the keyboard grid share these entries, so a shortcut can never
  // fire an action its button has disabled.
  const primaryAction: DungeonAction = isComplete
    ? { id: 'finish', label: 'Finish', disabled: false, run: handleFinishPressed }
    : { id: 'engage', label: getActionLabel(currentEvent, isBoss), disabled: !canEngage, run: handleEngage };
  const footerActions: DungeonAction[] = [
    { id: 'manage-party', label: 'Manage Party', disabled: !controlsEnabled, run: pauseMenu.open },
    { id: 'rest', label: hasRested ? 'Rested' : `Rest (${restsLeft} left)`, disabled: isRestDisabled, run: handleRest },
    { id: 'leave', label: 'Leave Dungeon', disabled: !controlsEnabled, run: () => void handleLeave() },
  ];
  const [manageAction, restAction, leaveAction] = footerActions;
  const actionRows = [[primaryAction], footerActions];

  const selection = useKeyboardSelection(actionRows, {
    onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05),
  });

  // The dungeon owns the keyboard only while browsing with nothing on top. useWindowKeyDown
  // has no arbitration — every mounted subscriber fires on every keydown — so each surface
  // that takes over (dialogue, pause menu, confirm dialog, clear overlay) is gated out here.
  const keyboardEnabled =
    !pauseMenu.isOpen && !activeDialogue && confirmRequest === null && !showClearOverlay && phase !== 'awaiting-battle';

  // Escape is deliberately NOT handled here: usePauseMenu owns it globally, and "Leave
  // Dungeon" forfeits the run — it must never be one keystroke away. Leave stays a
  // select-then-confirm action like everything else in the ring.
  useWindowKeyDown((event) => {
    if (!keyboardEnabled) return;

    const direction = getNavDirection(event.key);
    if (direction) {
      event.preventDefault();
      selection.move(direction);
      return;
    }

    if (isConfirmKey(event.key)) {
      // Claimed even with nothing selected, so Space can never scroll the view and a
      // click-focused button can't be re-activated by the browser's default behavior.
      event.preventDefault();
      // Ignore OS auto-repeat — including an Enter still held from the battle-rewards
      // screens, which would otherwise land here on mount and start the next battle.
      if (event.repeat) return;
      const action = actionRows.flat().find((entry) => entry.id === selection.selectedId);
      if (!action || action.disabled) return;
      action.run();
    }
  }, keyboardEnabled);

  if (!viewData || !dungeon) {
    return <div className="game-view dungeon dungeon--error pixel-font">Error: dungeon not found.</div>;
  }

  const returnView = viewData.returnView ?? DEFAULT_VIEW;

  const floorBg = currentFloor ? getFloorBackground(dungeon, currentFloor) : dungeon.backgroundImage;

  const ratingSummary = summarizeFloorRatings(floorRatings);
  // Rated floors only (dialogue/chest-only floors are absent), in descent order, for the overlay.
  const ratedFloorRows = dungeon.floors
    .map((floor, idx) => {
      const rating = floorRatings[idx];
      return rating ? { name: formatFloorTitle(idx, floor.name), stars: rating.stars } : null;
    })
    .filter((row): row is { name: string; stars: number } => row !== null);

  const totalCurrentHp = party.reduce((sum, m) => sum + Math.max(0, m.currentHp), 0);
  const totalMaxHp = party.reduce((sum, m) => sum + m.maxHp, 0);

  function handleEngage() {
    if (!currentFloor || !currentEvent) return;
    if (currentEvent.type === 'dialogue') {
      setActiveDialogue(currentEvent.scene);
      return;
    }
    if (currentEvent.type === 'combat') {
      setupBattle({ enemies: currentEvent.encounter.enemies, party });
      setPhase('awaiting-battle');
      goToBattleDemo({ enemyId: currentFloor.id, location: dungeon!.id, bgImage: floorBg });
      return;
    }
    // chest
    const result = applyLootTable(currentEvent.loot, inventory, resources);
    setInventory(result.inventory);
    setResources(result.resources);
    setCurrentLoot(result.rolledLoot);
    soundService.playSound(SoundNames.rhodesmasChime, 0.7, 0.1, 0.05);
    advanceEvent();
  }

  function handleDialogueComplete() {
    setActiveDialogue(null);
    advanceEvent();
  }

  function handleRest() {
    if (hasRested || partyFull || restsLeft <= 0 || !canRestOnThisFloor) return;
    setParty(healAllByMaxHpPercent(party, DUNGEON_REST_HEAL_PERCENT));
    soundService.playSound(SoundNames.shimmeringSuccessShorter, 0.6, 0.05);
    setHasRested(true);
    setRestsUsed((n) => n + 1);
  }

  async function handleLeave() {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    try {
      const ok = await confirm({
        title: 'Leave Dungeon?',
        message: 'You will lose all progress in this run.',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
        variant: 'danger',
      });
      if (!ok) return;
      resetRun();
      goBackTo(returnView);
    } finally {
      isLeavingRef.current = false;
    }
  }

  function handleFinish() {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    resetRun();
    goBackTo(returnView);
  }

  /** Finish, shared by the button and the keyboard: rated runs detour through the overlay. */
  function handleFinishPressed() {
    if (ratingSummary.ratedFloors > 0) setShowClearOverlay(true);
    else handleFinish();
  }

  const restHealPercent = Math.round(DUNGEON_REST_HEAL_PERCENT * 100);

  return (
    <div className="game-view dungeon flex h-full min-h-0 flex-col overflow-hidden">
      {/* Atmospheric background + darkening scrim (mirrors the town's layered bg) */}
      <div className="dungeon-bg" style={{ backgroundImage: `url('${floorBg}')` }} />
      <div className="dungeon-scrim" />

      {/* Resources floated top-right, out of flow (mirrors the town hub) */}
      <div className="dungeon-resources-bar">
        <PauseMenuResourcesBar />
      </div>

      {/* Top bar: dungeon name + party HP chip */}
      <div className="dungeon-topbar">
        <div className="dungeon-topbar__left">
          <NarikWoodBitFont text={dungeon.name} size={1.1} />
          <span className="dungeon-hp-chip indigolay-art" aria-label={`Party HP ${totalCurrentHp} of ${totalMaxHp}`}>
            <img className="dungeon-hp-chip__icon" src="/assets/icons/indigolay/icon-hp.png" alt="" />
            <span className="dungeon-hp-chip__value pixel-font" aria-hidden="true">
              {totalCurrentHp} / {totalMaxHp}
            </span>
          </span>
        </div>
      </div>

      {/* Main: floor track (left) + current-floor stage (right) */}
      <div className="dungeon-layout">
        <aside className="dungeon-track">
          <div className="dungeon-track__title">
            <NarikWoodBitFont text="DESCENT" size={0.9} />
          </div>
          <div className="dungeon-track__list">
            {dungeon.floors.map((floor, idx) => {
              const state = idx < floorIndex ? 'completed' : idx === floorIndex ? 'current' : 'locked';
              const rating = floorRatings[idx];
              return (
                <div
                  key={floor.id}
                  className={cn('dungeon-floor', `dungeon-floor--${state}`, floor.isBoss && 'dungeon-floor--boss')}
                >
                  <span className="dungeon-floor__mark">
                    <img className="dungeon-floor__mark-icon" src={floorMarkIcon(state, floor.isBoss)} alt="" />
                  </span>
                  <div className="dungeon-floor__body">
                    <span className="dungeon-floor__name">{formatFloorTitle(idx, floor.name)}</span>
                    {rating && <FloorRatingStars stars={rating.stars} />}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="dungeon-stage">
          {isComplete ? (
            <div className="dungeon-card dungeon-card--complete">
              <div className="dungeon-card__banner">
                <div className="dungeon-card__medallion">
                  <FrostyRpgIcon name="redBook" size={24} />
                </div>
                <div className="dungeon-card__banner-title">
                  <NarikWoodBitFont text="Dungeon Cleared" size={1.2} />
                </div>
                <div className="dungeon-card__banner-side" />
              </div>
              <GradientDivider variant="gold" />
              <div className="dungeon-card__body">
                <p className="dungeon-card__desc">{flavorLine}</p>
              </div>
              <div className="dungeon-card__action">
                <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('finish')}>
                  <ToffecButton variant="cream" size="sm" onClick={handleFinishPressed}>
                    {primaryAction.label}
                  </ToffecButton>
                </ToffecBeigeCornersWrapper>
              </div>
            </div>
          ) : (
            <div className={cn('dungeon-card', isBoss && 'dungeon-card--boss')}>
              <div className="dungeon-card__banner">
                <div className="dungeon-card__medallion">
                  <FrostyRpgIcon name={getEventMedallion(currentEvent, isBoss)} size={24} />
                </div>
                <div className="dungeon-card__banner-title">
                  <NarikWoodBitFont
                    text={currentFloor ? formatFloorTitle(floorIndex, currentFloor.name) : ''}
                    size={1}
                  />
                </div>
                <div className="dungeon-card__banner-side">
                  {isBoss && <span className="dungeon-card__boss-tag">BOSS</span>}
                </div>
              </div>
              <GradientDivider variant={isBoss ? 'red' : 'gold'} />
              <div className="dungeon-card__body">
                {isReplay && <p className="dungeon-card__replay">Replay — combats only</p>}
                <p className="dungeon-card__desc">{phase === 'awaiting-battle' ? 'Entering battle…' : flavorLine}</p>
              </div>
              <div className="dungeon-card__action">
                {phase !== 'awaiting-battle' && (
                  <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('engage')}>
                    <ToffecButton
                      variant={isBoss && currentEvent?.type === 'combat' ? 'orange' : 'tan'}
                      size="sm"
                      onClick={handleEngage}
                      disabled={primaryAction.disabled}
                    >
                      {primaryAction.label}
                    </ToffecButton>
                  </ToffecBeigeCornersWrapper>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Party status strip */}
      <div className="dungeon-party">
        <PauseMenuPartyBar />
      </div>

      {/* Footer controls */}
      <div className="dungeon-footer">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'dungeon-footer__slot',
                selection.isSelected('manage-party') && 'dungeon-footer__slot--selected',
              )}
            >
              <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('manage-party')}>
                <ToffecButton variant="cream" size="sm" onClick={manageAction.run} disabled={manageAction.disabled}>
                  {manageAction.label}
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            Open the party menu to review stats, swap equipment, and assign skills.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn('dungeon-footer__slot', selection.isSelected('rest') && 'dungeon-footer__slot--selected')}
            >
              <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('rest')}>
                <ToffecButton variant="tan" size="sm" onClick={restAction.run} disabled={restAction.disabled}>
                  {restAction.label}
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            Heal every hero for {restHealPercent}% of their max HP. Rests are limited per dungeon.
            {isRestDisabled ? " You can't rest on this floor." : ''}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn('dungeon-footer__slot', selection.isSelected('leave') && 'dungeon-footer__slot--selected')}
            >
              <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('leave')}>
                <ToffecButton
                  variant="indigolay-red"
                  size="sm"
                  onClick={leaveAction.run}
                  disabled={leaveAction.disabled}
                >
                  {leaveAction.label}
                </ToffecButton>
              </ToffecBeigeCornersWrapper>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            Abandon the run and return. You'll lose all progress in this dungeon.
          </TooltipContent>
        </Tooltip>

        <span className="dungeon-key-hint pixel-font">
          Arrow Keys / WASD to select · Enter to act · Esc for the menu
        </span>
      </div>

      {/* Inline overlays */}
      {activeDialogue && <DialogueScene scene={activeDialogue} onComplete={handleDialogueComplete} />}
      {currentLoot && <LootNotification loot={currentLoot} onClose={() => setCurrentLoot(null)} />}
      {showClearOverlay && (
        <DungeonClearScreen
          summary={ratingSummary}
          floors={ratedFloorRows}
          onContinue={handleFinish}
          continueLabel="Leave"
        />
      )}
    </div>
  );
}
