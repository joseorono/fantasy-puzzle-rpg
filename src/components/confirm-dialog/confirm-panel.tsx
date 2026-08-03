import type { ReactNode } from 'react';
import { ToffecButton } from '~/components/ui-custom/toffec-button';
import { ToffecSquareButton } from '~/components/ui-custom/toffec-square-button';
import { ToffecBeigeCornersWrapper } from '~/components/cursor/toffec-beige-corners-wrapper';
import { IndigolayDivider } from '~/components/dividers/indigolay-divider';
import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';
import { FrostyRpgIcon, type FrostyRpgIconName } from '~/components/sprite-icons/frost-icons';
import { useKeyboardSelection } from '~/hooks/use-keyboard-selection';
import { useWindowKeyDown } from '~/hooks/use-window-keydown';
import { getNavDirection, isConfirmKey, isCancelKey } from '~/constants/keyboard';
import { soundService } from '~/services/sound-service';
import { SoundNames } from '~/constants/audio';
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
 *
 * Keyboard: ←/→ (or A/D) pick an action, Enter/Space activates it, Escape cancels.
 * Enter never activates anything until an arrow reveals a selection — a destructive
 * confirm must not be one blind keystroke away.
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

  // The danger variant renders its actions row-reversed, so the keyboard row is built in
  // the order the player SEES — ←/→ must stay spatially truthful, not DOM-truthful.
  const visualOrder = isDanger ? (['confirm', 'cancel'] as const) : (['cancel', 'confirm'] as const);
  const selection = useKeyboardSelection([visualOrder.map((id) => ({ id }))], {
    onMove: () => soundService.playSound(SoundNames.clickChangeTab, 0.35, 0.1, 0.05),
  });

  // Registered in the capture phase with stopImmediatePropagation, so an open confirm
  // claims these keys outright from every bubble-phase listener beneath it (the pause
  // menu's Escape toggle, view-level arrow/Enter handlers) without editing any of them.
  // Unclaimed keys return early and still reach everyone else.
  useWindowKeyDown(
    (event) => {
      const direction = getNavDirection(event.key);
      const isClaimed = direction !== null || isConfirmKey(event.key) || isCancelKey(event.key);
      if (!isClaimed) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (direction === 'left' || direction === 'right') {
        selection.move(direction);
        return;
      }
      if (direction) return; // ↑/↓ claimed but inert (keeps the pause-menu sidebar out)
      if (event.repeat) return; // Enter/Space/Escape/Backspace act once per press
      if (isCancelKey(event.key)) {
        onCancel();
        return;
      }
      if (selection.isSelected('confirm')) onConfirm();
      else if (selection.isSelected('cancel')) onCancel();
      // Nothing selected: swallowed — Enter never confirms blind.
    },
    true,
    { capture: true },
  );

  return (
    <div className="confirm-panel-backdrop" onClick={onCancel}>
      <div
        className={cn('confirm-panel', isDanger && 'confirm-panel--danger')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <ToffecSquareButton
          variant="medieval2"
          className="confirm-panel__close"
          style={{ width: '26px', height: '26px' }}
          onClick={onCancel}
        />

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

        <IndigolayDivider variant={isDanger ? 'defeat' : 'default'} />

        {body ? <div className="confirm-panel__body">{body}</div> : null}

        <div className="confirm-panel__actions">
          <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('cancel')}>
            <ToffecButton variant="cream" size="xs" onClick={onCancel}>
              {cancelLabel}
            </ToffecButton>
          </ToffecBeigeCornersWrapper>
          <ToffecBeigeCornersWrapper forceDisplay={selection.isSelected('confirm')}>
            <ToffecButton variant={isDanger ? 'indigolay-red' : 'tan'} size="xs" onClick={onConfirm}>
              {confirmLabel}
            </ToffecButton>
          </ToffecBeigeCornersWrapper>
        </div>

        <p className="confirm-panel__key-hint pixel-font">← → to choose · Enter to confirm · Esc to cancel</p>
      </div>
    </div>
  );
}
