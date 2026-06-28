import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import type { ConfirmDialogVariant } from '~/stores/confirm-dialog-atoms';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Presentational confirmation dialog — a parchment/dark-brown modal with a title,
 * optional message, and Cancel/Confirm actions. Driven by `ConfirmDialogHost` +
 * `useConfirm`; styling generalized from the salvage confirm dialog.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-dialog-backdrop" onClick={onCancel}>
      <div className="confirm-dialog-panel" onClick={(e) => e.stopPropagation()}>
        {/* Corner decorations */}
        <div className="confirm-dialog-corner confirm-dialog-corner--tl" />
        <div className="confirm-dialog-corner confirm-dialog-corner--tr" />
        <div className="confirm-dialog-corner confirm-dialog-corner--bl" />
        <div className="confirm-dialog-corner confirm-dialog-corner--br" />

        <button className="confirm-dialog-close" onClick={onCancel} aria-label="Close" type="button" />

        <div className="confirm-dialog-header">
          <NarikWoodBitFont text={title} size={1.2} />
        </div>

        <div className="confirm-dialog-divider" />

        {message ? (
          <div className="confirm-dialog-body">
            <p className="confirm-dialog-message pixel-font">{message}</p>
          </div>
        ) : null}

        <div className="confirm-dialog-divider" />

        <div className="confirm-dialog-actions">
          <ToffecButton variant="cream" size="xs" onClick={onCancel}>
            {cancelLabel}
          </ToffecButton>
          <ToffecButton variant={variant === 'danger' ? 'orange' : 'tan'} size="xs" onClick={onConfirm}>
            {confirmLabel}
          </ToffecButton>
        </div>
      </div>
    </div>
  );
}
