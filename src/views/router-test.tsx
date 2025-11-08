import { useRouterActions, useRouterState } from '~/stores/game-store';

/**
 * Router test view - demonstrates navigation
 */
export default function RouterTestView() {
  const router = useRouterState();
  const { goToTownHub, goToBattleDemo, goToMapDemo, goToDebug, goBack } =
    useRouterActions();

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>Router Test</h3>

      <div style={{ marginBottom: '10px' }}>
        <strong>Current View:</strong> {router.currentView}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Previous View:</strong> {router.previousView ?? 'None'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() =>
            goToTownHub({
              innCost: { coins: 20, gold: 0, silver: 0, bronze: 0, copper: 0 },
              itemsForSell: ['potion', 'sword'],
              onLeaveCallback: () => {},
            })
          }
          style={{ padding: '8px', cursor: 'pointer' }}
        >
          Go to Town Hub
        </button>

        <button
          onClick={() =>
            goToBattleDemo({
              enemyId: 'moss-golem',
              location: 'Forest',
              canFlee: true,
            })
          }
          style={{ padding: '8px', cursor: 'pointer' }}
        >
          Go to Battle Demo
        </button>

        <button
          onClick={() => goToMapDemo()}
          style={{ padding: '8px', cursor: 'pointer' }}
        >
          Go to Map Demo
        </button>

        <button
          onClick={() => goToDebug()}
          style={{ padding: '8px', cursor: 'pointer' }}
        >
          Go to Debug
        </button>

        <button
          onClick={() => goBack()}
          disabled={!router.previousView}
          style={{
            padding: '8px',
            cursor: router.previousView ? 'pointer' : 'not-allowed',
            opacity: router.previousView ? 1 : 0.5,
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
