import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';
import { KeyboardKeys } from '~/constants/keyboard';

interface OverlayContainerProps {
  onDismiss: () => void;
  /** Dismiss when the backdrop (outside the content) is clicked. Default true. */
  dismissOnBackdropClick?: boolean;
  /** Dismiss on Enter/Escape. Default true. */
  dismissOnKey?: boolean;
  /** Auto-dismiss after N ms; null/undefined disables. */
  autoDismissMs?: number | null;
  /** Number of drifting sparkles to render over the overlay (0 = none). */
  sparkleCount?: number;
  backdropClassName?: string;
  children: ReactNode;
}

/**
 * Shared chrome for overlays: a full-screen backdrop, optional click / Enter /
 * Escape / auto dismissal, and an optional sparkle layer. Content components
 * render their card/banner as `children`. Only one overlay is shown at a time
 * (see `OverlayHost`), so the global key listener is unambiguous.
 */
export function OverlayContainer({
  onDismiss,
  dismissOnBackdropClick = true,
  dismissOnKey = true,
  autoDismissMs = null,
  sparkleCount = 0,
  backdropClassName,
  children,
}: OverlayContainerProps) {
  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  useEffect(() => {
    if (!dismissOnKey) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === KeyboardKeys.Enter || e.key === KeyboardKeys.Escape) {
        e.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismissOnKey, onDismiss]);

  return (
    <div
      className={cn('gom-backdrop', backdropClassName)}
      onClick={dismissOnBackdropClick ? onDismiss : undefined}
    >
      <div className="overlay-container-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>

      {sparkleCount > 0 && (
        <div className="gom-sparkles">
          {Array.from({ length: sparkleCount }).map((_, i) => (
            <div
              key={i}
              className="gom-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
