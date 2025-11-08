import InventoryTestView from '~/views/inventory-test';
import ResourcesTestView from '~/views/resources-test';
import SoundTestView from '~/views/sound-test';
import TestView from '~/views/test-view';
import PartyTestView from '~/views/party-test';
import RouterTestView from '~/views/router-test';

/**
 * Debug view containing all test components
 */
export default function DebugView() {
  return (
    <>
      <RouterTestView />
      <TestView />
      <PartyTestView />
      <InventoryTestView />
      <ResourcesTestView />
      <SoundTestView />
    </>
  );
}
