import { cn } from '~/lib/utils';

interface RetroDividerProps {
  variant?: 'default' | 'victory' | 'defeat' | 'gold' | 'silver' | 'bronze';
  className?: string;
}

export function RetroDivider({ variant = 'default', className }: RetroDividerProps) {
  const variantStyles = {
    default: 'bg-gradient-to-r from-transparent via-amber-900/50 to-transparent',
    victory: 'bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent',
    defeat: 'bg-gradient-to-r from-transparent via-red-900/60 to-transparent',
    gold: 'bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent',
    silver: 'bg-gradient-to-r from-transparent via-gray-400/70 to-transparent',
    bronze: 'bg-gradient-to-r from-transparent via-amber-700/70 to-transparent',
  };

  return (
    <div className={cn('relative my-4 flex items-center', className)}>
      {/* Left decorative element */}
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-800/30 to-amber-700/50" />

      {/* Center diamond/ornament */}
      <div className="mx-2 flex h-8 w-8 items-center justify-center">
        <div
          className={cn(
            'h-2 w-2 rotate-45 border',
            variant === 'victory' && 'border-yellow-500 bg-yellow-600 shadow-[0_0_8px_rgba(202,138,4,0.6)]',
            variant === 'defeat' && 'border-red-700 bg-red-800 shadow-[0_0_8px_rgba(153,27,27,0.6)]',
            variant === 'gold' && 'border-yellow-400 bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
            variant === 'silver' && 'border-gray-300 bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]',
            variant === 'bronze' && 'border-amber-600 bg-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.6)]',
            variant === 'default' && 'border-amber-700 bg-amber-800 shadow-[0_0_6px_rgba(146,64,14,0.4)]',
          )}
        />
      </div>

      {/* Right decorative element */}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-800/30 to-amber-700/50" />

      {/* Main divider line */}
      <div className={cn('absolute inset-0 h-px', variantStyles[variant])} />
    </div>
  );
}

