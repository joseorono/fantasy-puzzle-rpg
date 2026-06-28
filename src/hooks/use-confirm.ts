import { useSetAtom } from 'jotai';
import { confirmDialogRequestAtom, type ConfirmDialogOptions } from '~/stores/confirm-dialog-atoms';

/**
 * Imperative confirmation dialog. Returns a function that opens the global
 * `ConfirmDialogHost` and resolves to `true` (confirmed) or `false` (cancelled).
 *
 * @example
 * const confirm = useConfirm();
 * const ok = await confirm({ title: 'Leave Dungeon?', message: 'Run progress will be lost.' });
 * if (!ok) return;
 */
export function useConfirm() {
  const setRequest = useSetAtom(confirmDialogRequestAtom);

  return (options: ConfirmDialogOptions): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      // Settle any still-open request as cancelled before replacing it, so a caller
      // awaiting the previous confirm never hangs (e.g. double-trigger).
      setRequest((prev) => {
        prev?.resolve(false);
        return { ...options, resolve };
      });
    });
}
