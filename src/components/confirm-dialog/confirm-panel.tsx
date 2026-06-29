import type { ReactNode } from 'react';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { cn } from '~/lib/utils';
import type { ConfirmDialogVariant } from '~/stores/confirm-dialog-atoms';

interface ConfirmPanelProps {
  /** Title shown in the header (rendered with the wood bitmap font). */
  title: string;
  /** Optional icon shown in a rotated pixel-art medallion above the title. */
  icon?: FrostyRpgIconName;
  /** Optional rich body. Plain confirmations can omit this and pass `message` instead. */
  children?: ReactNode;
  /** Convenience text body — rendered as a centered message when `children` is absent. */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` swaps the gold accents (frame/medallion/divider/confirm) for warning red. */
  variant?: ConfirmDialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic confirmation modal — a pixel-art panel in the game-over / map-menu visual
 * language: a chunky triple border over the board texture, an optional diamond icon
 * medallion, a gradient divider, a flexible body, and Cancel / Confirm actions.
 * Backdrop and the corner close button both cancel. Compose it for plain text
 * confirms (`ConfirmDialog`) and richer ones (e.g. `SalvageConfirmDialog`).
 */
export function ConfirmPanel({
  title,
  icon,
  children,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmPanelProps) {
  const isDanger = variant === 'danger';
  const body = children ?? (message ? <p className="confirm-panel__message pixel-font">{message}</p> : null);

  return (
    <div className="confirm-panel-backdrop" onClick={onCancel}>
      <div
        className={cn('confirm-panel', isDanger && 'confirm-panel--danger')}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="confirm-panel__close" onClick={onCancel} aria-label="Close" type="button" />

        <div className="confirm-panel__header">
          {icon ? (
            <div className="confirm-panel__medallion">
              <FrostyRpgIcon name={icon} size={32} />
            </div>
          ) : null}
          <div className="confirm-panel__title">
            <NarikWoodBitFont text={title} size={1.1} />
          </div>
        </div>

        <div className="confirm-panel__divider" />

        {body ? <div className="confirm-panel__body">{body}</div> : null}

        <div className="confirm-panel__actions">
          <ToffecButton variant="cream" size="xs" onClick={onCancel}>
            {cancelLabel}
          </ToffecButton>
          <ToffecButton variant={isDanger ? 'orange' : 'tan'} size="xs" onClick={onConfirm}>
            {confirmLabel}
          </ToffecButton>
        </div>
      </div>
    </div>
  );
}
