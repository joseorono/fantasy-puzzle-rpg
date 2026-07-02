import { useAtom } from 'jotai';
import { confirmDialogRequestAtom } from '~/stores/confirm-dialog-atoms';
import { ConfirmDialog } from './confirm-dialog';

/**
 * Renders the active confirmation request (if any) and resolves its promise on
 * confirm/cancel. Mount once near the app root (see `game-loader.tsx`).
 */
export function ConfirmDialogHost() {
  const [request, setRequest] = useAtom(confirmDialogRequestAtom);

  if (!request) return null;

  function settle(confirmed: boolean) {
    request!.resolve(confirmed);
    setRequest(null);
  }

  return (
    <ConfirmDialog
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      variant={request.variant}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}
