import { cn } from '~/lib/utils';

interface ToffecBeigeCornersWrapperProps {
  children: React.ReactNode;
  className?: string;
  alwaysVisible?: boolean;
}

function ToffecBeigeCornersWrapper({
  children,
  className,
  alwaysVisible,
}: ToffecBeigeCornersWrapperProps) {
  return (
    <div
      className={cn(
        'cursor-corners cursor-corners--toffeec-beige',
        alwaysVisible && 'cursor-corners--always-visible',
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
