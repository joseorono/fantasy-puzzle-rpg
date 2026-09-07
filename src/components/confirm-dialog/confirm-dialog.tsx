import { ConfirmPanel } from './confirm-panel';
import type { ConfirmDialogVariant } from '~/stores/confirm-dialog-atoms';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  icon?: RenderableElement;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Plain text confirmation — a thin wrapper over the generic {@link ConfirmPanel}
 * shell. Driven by `ConfirmDialogHost` + `useConfirm`.
 */
export function ConfirmDialog({
  title,
  message,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ConfirmPanel
      title={title}
      message={message}
      icon={icon}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={variant}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
