import { useAtom } from 'jotai';
import { titleSignAtom } from '~/stores/title-sign-atoms';
import { TitleSign } from './title-sign';

/**
 * Renders the currently-active title sign (if any). Mounted once globally in
 * `game-loader`, alongside `OverlayHost`, so signs are universal to every
 * screen. A `key` ties the mounted `TitleSign` to its text+position so a fresh
 * request restarts the entry animation rather than reusing stale phase state.
 */
export function TitleSignHost() {
  const [request, setRequest] = useAtom(titleSignAtom);
  if (!request) return null;

  const dismiss = () => setRequest(null);

  return (
    <TitleSign key={`${request.position}:${request.text}`} request={request} onDismiss={dismiss} />
  );
}
