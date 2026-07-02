import { useRouterActions, useDungeonProgressActions } from '~/stores/game-store';
import { SAMPLE_DUNGEON } from '~/constants/dungeons';
import { randomizeDungeon } from '~/lib/dungeon-randomizer';

/**
 * Debug entry point for the dungeon system. Computes `isReplay` from completion
 * state (mirroring a real entry surface) and navigates into the sample dungeon.
 */
export default function DungeonDebugView() {
  const { goToDungeon } = useRouterActions();
  const { isDungeonCompleted } = useDungeonProgressActions();

  function enter() {
    const isReplay = isDungeonCompleted(SAMPLE_DUNGEON.id);
    goToDungeon({ dungeon: SAMPLE_DUNGEON, isReplay });
  }

  function enterReplay() {
    goToDungeon({ dungeon: SAMPLE_DUNGEON, isReplay: true });
  }

  function enterRandomized() {
    goToDungeon({ dungeon: randomizeDungeon(SAMPLE_DUNGEON), isReplay: false });
  }

  const completed = isDungeonCompleted(SAMPLE_DUNGEON.id);

  return (
    <div className="p-6">
      <h2 className="mb-2 text-lg font-bold text-slate-200">Dungeon</h2>
      <p className="mb-3 text-sm text-slate-400">
        Sample dungeon: <span className="font-semibold">{SAMPLE_DUNGEON.name}</span> —{' '}
        {completed ? 'cleared (entering as replay: combats only)' : 'not yet cleared (first clear)'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={enter}
          className="rounded bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Enter {SAMPLE_DUNGEON.name}
        </button>
        <button
          onClick={enterReplay}
          className="rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
        >
          Replay {SAMPLE_DUNGEON.name}
        </button>
        <button
          onClick={enterRandomized}
          className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Randomize {SAMPLE_DUNGEON.name}
        </button>
      </div>
    </div>
  );
}
