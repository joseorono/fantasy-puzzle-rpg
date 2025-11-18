import { useRouterActions, useRouterState } from '~/stores/game-store';

/**
 * Router test view - demonstrates navigation
 */
export default function RouterTestView() {
  const router = useRouterState();
  const { goToTownHub, goToBattleDemo, goToMapDemo, goToDialogueDemo, goToLevelUpDemo, goToDebug, goBack } =
    useRouterActions();

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 p-5">
      <h3 className="mb-2 text-xl font-bold">Router Test</h3>

      <div className="mb-2">
        <strong>Current View:</strong> {router.currentView}
      </div>

      <div className="mb-4">
        <strong>Previous View:</strong> {router.previousView ?? 'None'}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() =>
            goToTownHub({
              innCost: { coins: 20, gold: 0, silver: 0, bronze: 0, copper: 0 },
              itemsForSell: ['potion', 'sword'],
              onLeaveCallback: () => goBack(),
            })
          }
        >
          Town Hub
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() =>
            goToBattleDemo({
              enemyId: 'moss-golem',
              location: 'Forest',
              canFlee: true,
            })
          }
        >
          Battle Demo
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() => goToMapDemo()}
        >
          Map Demo
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() => goToDialogueDemo({})}
        >
          Dialogue Demo
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() => goToLevelUpDemo({ id: 'warrior' })}
        >
          Level Up Demo
        </button>

        <button
          className="rounded bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
          onClick={() => goToDebug()}
        >
          Debug
        </button>

        <button
          className={`rounded px-3 py-2 transition-colors ${
            router.previousView
              ? 'bg-gray-500 text-white hover:bg-gray-600'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
          onClick={() => goBack()}
          disabled={!router.previousView}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
