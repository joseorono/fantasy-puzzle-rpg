import { cn } from '~/lib/utils';

interface ToffecBeigeCornersWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function ToffecBeigeCornersWrapper({
  children,
  className,
}: ToffecBeigeCornersWrapperProps) {
  return (
    <div
      className={cn(
        'cursor-corners cursor-corners--toffeec-beige',
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
