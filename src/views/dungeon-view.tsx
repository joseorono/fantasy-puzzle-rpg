import { useEffect, useState } from 'react';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import {
  activeDungeonIdAtom,
  currentFloorIndexAtom,
  currentEventIndexAtom,
  dungeonPhaseAtom,
  isReplayAtom,
  hasRestedOnFloorAtom,
  startDungeonRunAtom,
  advanceEventAtom,
  advanceFloorAtom,
  resetDungeonRunAtom,
  resolveBattleWinAtom,
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
  getDungeonById,
  getFloor,
  getEvent,
  getFloorBackground,
  isLastFloor,
  shouldRunEvent,
} from '~/lib/dungeon-system';
import { applyLootTable } from '~/lib/loot';
import { healAllByMaxHpPercent, isPartyFullyHealed } from '~/lib/party-system';
import { DUNGEON_REST_HEAL_PERCENT } from '~/constants/dungeon';
import type { DialogueScene as DialogueSceneType } from '~/types/dialogue';
import type { LootTable } from '~/types/loot';
import type { DungeonEvent } from '~/types/dungeon';
import { DialogueScene } from '~/components/dialogue';
import { LootNotification } from '~/components/map/loot-notification';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { usePauseMenu } from '~/hooks/use-pause-menu';
import { useConfirm } from '~/hooks/use-confirm';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
import { cn } from '~/lib/utils';

/** Label for the floor's contextual action button, by the current event type. */
function getActionLabel(event: DungeonEvent | undefined, isBoss: boolean): string {
  if (!event) return 'Continue';
  if (event.type === 'dialogue') return 'View Scene';
  if (event.type === 'chest') return 'Open Chest';
  return isBoss ? 'Challenge Boss' : 'Enter Battle';
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

  const startRun = useSetAtom(startDungeonRunAtom);
  const advanceEvent = useSetAtom(advanceEventAtom);
  const advanceFloor = useSetAtom(advanceFloorAtom);
  const resetRun = useSetAtom(resetDungeonRunAtom);
  const resolveBattleWin = useSetAtom(resolveBattleWinAtom);
  const setPhase = useSetAtom(dungeonPhaseAtom);
  const setHasRested = useSetAtom(hasRestedOnFloorAtom);
  const setupBattle = useSetAtom(setupBattleAtom);
  const store = useStore();

  // ─── Store ───────────────────────────────────────────────────────────
  const party = useParty();
  const { setParty } = usePartyActions();
  const inventory = useInventory();
  const { setInventory } = useInventoryActions();
  const resources = useResources();
  const { setResources } = useResourcesActions();
  const { goToBattleDemo, goBack } = useRouterActions();
  const { markDungeonCompleted } = useDungeonProgressActions();

  const pauseMenu = usePauseMenu();
  const confirm = useConfirm();

  // ─── Local UI state ──────────────────────────────────────────────────
  const [activeDialogue, setActiveDialogue] = useState<DialogueSceneType | null>(null);
  const [currentLoot, setCurrentLoot] = useState<LootTable | null>(null);

  const dungeon = viewData ? getDungeonById(viewData.dungeonId) : undefined;

  // On mount: resume a won battle, or seed a fresh run. Both paths are idempotent,
  // so StrictMode's double-fired mount effect is safe.
  useEffect(() => {
    if (!viewData) return;
    if (activeDungeonId === viewData.dungeonId && phase === 'awaiting-battle') {
      resolveBattleWin();
    } else if (activeDungeonId !== viewData.dungeonId) {
      startRun({ dungeonId: viewData.dungeonId, isReplay: viewData.isReplay });
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
    if (store.get(activeDungeonIdAtom) !== viewData.dungeonId) return; // not seeded yet

    const liveFloorIndex = store.get(currentFloorIndexAtom);
    const floor = getFloor(dungeon, liveFloorIndex);
    if (!floor) return;

    const event = getEvent(floor, store.get(currentEventIndexAtom));
    if (event === undefined) {
      // Floor exhausted: advance to the next floor, or finish the dungeon.
      if (isLastFloor(dungeon, liveFloorIndex)) {
        markDungeonCompleted(dungeon.id); // the single store write of the run
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

  if (!viewData || !dungeon) {
    return <div className="game-view dungeon dungeon--error pixel-font">Error: dungeon not found.</div>;
  }

  const currentFloor = getFloor(dungeon, floorIndex);
  const currentEvent = currentFloor ? getEvent(currentFloor, eventIndex) : undefined;
  const floorBg = currentFloor ? getFloorBackground(dungeon, currentFloor) : dungeon.backgroundImage;

  const isComplete = phase === 'complete';
  const isBrowsing = phase === 'browsing' && !activeDialogue;
  const canEngage = isBrowsing && currentEvent !== undefined;

  // Footer controls available only between events (not mid-combat / mid-dialogue).
  const controlsEnabled = isBrowsing && !isComplete;
  const partyFull = isPartyFullyHealed(party);

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
    soundService.playSound(SoundNames.bgNoiseMiner, 0.7, 0.1, 0.05);
    advanceEvent();
  }

  function handleDialogueComplete() {
    setActiveDialogue(null);
    advanceEvent();
  }

  function handleRest() {
    if (hasRested || partyFull) return;
    setParty(healAllByMaxHpPercent(party, DUNGEON_REST_HEAL_PERCENT));
    soundService.playSound(SoundNames.shimmeringSuccessShorter, 0.6, 0.05);
    setHasRested(true);
  }

  async function handleLeave() {
    const ok = await confirm({
      title: 'Leave Dungeon?',
      message: 'You will lose all progress in this run.',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
      variant: 'danger',
    });
    if (!ok) return;
    resetRun();
    goBack();
  }

  function handleFinish() {
    resetRun();
    goBack();
  }

  return (
    <div
      className="game-view dungeon"
      style={{ backgroundImage: `url('${floorBg}')` }}
    >
      <div className="dungeon__scrim" />

      {/* Header */}
      <div className="dungeon__header">
        <div className="dungeon__title">
          <NarikWoodBitFont text={dungeon.name} size={1.2} />
        </div>
        <div className="dungeon__hp pixel-font">
          PARTY HP {totalCurrentHp} / {totalMaxHp}
        </div>
      </div>

      <div className="dungeon__main">
        {/* Left: vertical floor track */}
        <div className="dungeon__track">
          {dungeon.floors.map((floor, idx) => {
            const state =
              idx < floorIndex ? 'completed' : idx === floorIndex ? 'current' : 'locked';
            return (
              <div key={floor.id} className={cn('dungeon__floor', `dungeon__floor--${state}`)}>
                <span className="dungeon__floor-mark">
                  {state === 'completed' ? '✓' : state === 'current' ? '▸' : '·'}
                </span>
                <span className="dungeon__floor-name">
                  {floor.isBoss ? `BOSS — ${floor.name}` : floor.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: current floor + contextual action */}
        <div className="dungeon__stage">
          {isComplete ? (
            <div className="dungeon__panel dungeon__panel--complete">
              <NarikWoodBitFont text="Dungeon Cleared" size={1.4} />
              <p className="dungeon__desc pixel-font">The hollow falls silent. Your work here is done.</p>
              <ToffecButton variant="cream" onClick={handleFinish}>
                Leave
              </ToffecButton>
            </div>
          ) : (
            <div className="dungeon__panel">
              <div className="dungeon__floor-banner">
                <NarikWoodBitFont text={currentFloor?.name ?? ''} size={1} />
              </div>
              {isReplay && <p className="dungeon__replay pixel-font">Replay — combats only</p>}
              <div className="dungeon__action">
                {phase === 'awaiting-battle' ? (
                  <p className="dungeon__desc pixel-font">Entering battle…</p>
                ) : (
                  <ToffecButton
                    variant="tan"
                    onClick={handleEngage}
                    disabled={!canEngage}
                  >
                    {getActionLabel(currentEvent, currentFloor?.isBoss ?? false)}
                  </ToffecButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="dungeon__footer">
        <ToffecButton variant="gray" size="sm" onClick={pauseMenu.open} disabled={!controlsEnabled}>
          Manage Party
        </ToffecButton>
        <ToffecButton
          variant="gray"
          size="sm"
          onClick={handleRest}
          disabled={!controlsEnabled || hasRested || partyFull}
        >
          {hasRested ? 'Rested' : 'Rest'}
        </ToffecButton>
        <ToffecButton variant="mauve" size="sm" onClick={handleLeave} disabled={isComplete}>
          Leave Dungeon
        </ToffecButton>
      </div>

      {/* Inline overlays */}
      {activeDialogue && <DialogueScene scene={activeDialogue} onComplete={handleDialogueComplete} />}
      {currentLoot && <LootNotification loot={currentLoot} onClose={() => setCurrentLoot(null)} />}
    </div>
  );
}
