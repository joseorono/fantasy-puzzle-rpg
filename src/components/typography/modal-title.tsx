import { cn } from '~/lib/utils';
import { NarikHeading } from '~/components/typography/narik-heading';

/** Standard NarikWoodBitFont scale for modal titles. */
export const MODAL_TITLE_BF_SIZE = 0.9;

interface ModalTitleProps {
  text: string;
  /** Extra classes for modal-specific layout (e.g. a centering offset). */
  className?: string;
  /** Override the default bitmap-font size. */
  size?: number;
}

/**
 * Standardized modal heading: a centered `<h2>` rendering the Narik bitmap font
 * at {@link MODAL_TITLE_BF_SIZE}. Carries the shared `.modal-title` class so every
 * modal title looks the same; pass `className` for per-modal layout tweaks.
 */
export function ModalTitle({ text, className, size = MODAL_TITLE_BF_SIZE }: ModalTitleProps) {
  return <NarikHeading as="h2" text={text} size={size} className={cn('modal-title', className)} />;
}
