import { useSetAtom } from 'jotai';
import { titleSignAtom, type TitleSignRequest } from '~/stores/title-sign-atoms';

/**
 * Single entry point for showing/dismissing a decorative title sign. Any screen
 * calls `showTitleSign(request)` to announce a location; `TitleSignHost` renders
 * whatever is active. Only one sign shows at a time (last request wins).
 */
export function useTitleSign() {
  const setTitleSign = useSetAtom(titleSignAtom);

  return {
    showTitleSign: (request: TitleSignRequest) => setTitleSign(request),
    dismissTitleSign: () => setTitleSign(null),
  };
}
