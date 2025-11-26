import { TopBarResources } from './top-bar-resources';
import { useResources } from '~/stores/game-store';

/**
 * Example usage of the TopBarResources component
 * This shows how to integrate it with the game store
 */
export function TopBarResourcesExample() {
  const resources = useResources();
  
  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Top Bar Resources Example</h2>
      <TopBarResources resources={resources} />
    </div>
  );
}

/**
 * Alternative usage with custom resources (for testing)
 */
export function TopBarResourcesDemo() {
  const demoResources = {
    coins: 1250,
    gold: 45,
    silver: 120,
    bronze: 300,
    copper: 850,
  };
  
  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Top Bar Resources Demo</h2>
      <TopBarResources resources={demoResources} />
    </div>
  );
}
