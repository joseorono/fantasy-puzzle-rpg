import { useAtom } from 'jotai';
import { saveIndicatorAtom } from '~/stores/save-atoms';
import { SaveIndicator } from './save-indicator';

/**
 * Renders the save badge whenever a save has just been written. Mounted once globally
 * in `game-loader`. The `key` on the request id is what makes a second save restart the
 * animation instead of letting the first one finish its fade.
 */
export function SaveIndicatorHost() {
  const [request, setRequest] = useAtom(saveIndicatorAtom);
  if (!request) return null;

  return <SaveIndicator key={request.id} isAutosave={request.isAutosave} onDismiss={() => setRequest(null)} />;
}
