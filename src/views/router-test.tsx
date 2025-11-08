import { useRouterActions, useRouterState } from '~/stores/game-store';

/**
 * Router test view - demonstrates navigation
 */
export default function RouterTestView() {
  const router = useRouterState();
  const { goToTownHub, goToBattleDemo, goToMapDemo, goToDebug, goBack } =
    useRouterActions();

  return (
    <div className="flex flex-col items-center justify-center p-5 gap-2.5">
      <h3 className="text-xl font-bold mb-2">Router Test</h3>

      <div className="mb-2">
        <strong>Current View:</strong> {router.currentView}
      </div>

      <div className="mb-4">
        <strong>Previous View:</strong> {router.previousView ?? 'None'}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <button
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() =>
            goToTownHub({
              innCost: { coins: 20, gold: 0, silver: 0, bronze: 0, copper: 0 },
              itemsForSell: ['potion', 'sword'],
              onLeaveCallback: () => {},
            })
          }
        >
          Town Hub
        </button>

        <button
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => goToMapDemo()}
        >
          Map Demo
        </button>

        <button
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => goToDebug()}
        >
          Debug
        </button>

        <button
          className={`px-3 py-2 rounded transition-colors ${
            router.previousView
              ? 'bg-gray-500 text-white hover:bg-gray-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
