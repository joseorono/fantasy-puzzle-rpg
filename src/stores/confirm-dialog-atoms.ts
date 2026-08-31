/**
 * Global confirmation-dialog state. A single request lives here at a time; the
 * `ConfirmDialogHost` renders it and the `useConfirm` hook drives it as a promise.
 * Mirrors the app's other atom-backed overlay hosts (title sign, overlays).
 */

import { atom } from 'jotai';

/** Visual emphasis for the confirm action. */
export type ConfirmDialogVariant = 'default' | 'danger';

/** Options accepted by `useConfirm()`. */
export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  /** Element shown in the header medallion; omit for a title-only header. */
  icon?: RenderableElement;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
}

/** A live request: the options plus the promise resolver the host calls. */
export interface ConfirmDialogRequest extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void;
}

/** The currently open confirmation request, or null when none is shown. */
export const confirmDialogRequestAtom = atom<ConfirmDialogRequest | null>(null);
