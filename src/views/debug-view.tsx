import InventoryTestView from '~/views/inventory-test';
import ResourcesTestView from '~/views/resources-test';
import SoundTestView from '~/views/sound-test';
import TestView from '~/views/test-view';
import PartyTestView from '~/views/party-test';
import RouterTestView from '~/views/router-test';
import GlobalAnimationTest from '~/views/global-animation-test';

/**
 * Debug view containing all test components
 */
export default function DebugView() {
  const dividerClasses = "my-4 border-b border-gray-200";
  return (
    <>
      <TestView />
      <hr className={dividerClasses} />
      <GlobalAnimationTest />
      <hr className={dividerClasses} />
      <RouterTestView />
      <hr className={dividerClasses} />
      <PartyTestView />
      <hr className={dividerClasses} />
      <InventoryTestView />
      <hr className={dividerClasses} />
      <ResourcesTestView />
      <hr className={dividerClasses} />
      <SoundTestView />
    </>
  );
}
