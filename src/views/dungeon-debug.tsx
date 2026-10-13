import { useRouterActions, useDungeonProgressActions } from '~/stores/game-store';
import { DUNGEONS } from '~/constants/dungeons';
import { randomizeDungeon } from '~/lib/dungeon-randomizer';

/**
 * Debug entry point for the dungeon system. Lists every authored dungeon in `DUNGEONS` and, for
 * each, offers Enter (isReplay derived from completion, mirroring a real entry surface), Replay
 * (combats-only), and Randomize (structure-preserving shuffle).
 */
export default function DungeonDebugView() {
  const { goToDungeon } = useRouterActions();
  const { isDungeonCompleted } = useDungeonProgressActions();

  return (
    <div className="p-6">
      <h2 className="mb-3 text-lg font-bold text-slate-200">Dungeon</h2>
      <div className="flex flex-col gap-5">
        {Object.values(DUNGEONS).map((dungeon) => {
          const completed = isDungeonCompleted(dungeon.id);
          return (
            <div key={dungeon.id}>
              <p className="mb-2 text-sm text-slate-400">
                <span className="font-semibold">{dungeon.name}</span> ({dungeon.floors.length} floors) —{' '}
                {completed ? 'cleared (Enter → replay: combats only)' : 'not yet cleared (first clear)'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => goToDungeon({ dungeon, isReplay: completed })}
                  className="rounded bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  Enter
                </button>
                <button
                  onClick={() => goToDungeon({ dungeon, isReplay: true })}
                  className="rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
                >
                  Replay
                </button>
                <button
                  onClick={() => goToDungeon({ dungeon: randomizeDungeon(dungeon), isReplay: false })}
                  className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Randomize
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
