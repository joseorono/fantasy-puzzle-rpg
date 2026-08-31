import { cn } from '~/lib/utils';

interface ToffecBeigeCornersWrapperProps {
  children: React.ReactNode;
  className?: string;
  alwaysVisible?: boolean;
  /** Force the corners to show even without hover (e.g. keyboard selection). */
  forceDisplay?: boolean;
}

function ToffecBeigeCornersWrapper({
  children,
  className,
  alwaysVisible,
  forceDisplay = false,
}: ToffecBeigeCornersWrapperProps) {
  return (
    <div
      className={cn(
        'cursor-corners cursor-corners--toffeec-beige',
        alwaysVisible && 'cursor-corners--always-visible',
        forceDisplay && 'cursor-corners--force-display',
        className,
      )}
    >
      <div className="cursor-corner cursor-corner--tl" />
      <div className="cursor-corner cursor-corner--tr" />
      <div className="cursor-corner cursor-corner--bl" />
      <div className="cursor-corner cursor-corner--br" />
      {children}
    </div>
  );
}

export { ToffecBeigeCornersWrapper };
