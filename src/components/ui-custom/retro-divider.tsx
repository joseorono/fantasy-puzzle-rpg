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
    <div className={cn('relative my-6 flex items-center', className)}>
      {/* Left decorative element */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-800/30 to-amber-700/50" />
      
      {/* Center diamond/ornament */}
      <div className="flex items-center justify-center w-8 h-8 mx-2">
        <div className={cn(
          'w-2 h-2 rotate-45 border',
          variant === 'victory' && 'bg-yellow-600 border-yellow-500 shadow-[0_0_8px_rgba(202,138,4,0.6)]',
          variant === 'defeat' && 'bg-red-800 border-red-700 shadow-[0_0_8px_rgba(153,27,27,0.6)]',
          variant === 'gold' && 'bg-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]',
          variant === 'silver' && 'bg-gray-400 border-gray-300 shadow-[0_0_8px_rgba(156,163,175,0.6)]',
          variant === 'bronze' && 'bg-amber-700 border-amber-600 shadow-[0_0_8px_rgba(180,83,9,0.6)]',
          variant === 'default' && 'bg-amber-800 border-amber-700 shadow-[0_0_6px_rgba(146,64,14,0.4)]'
        )} />
      </div>
      
      {/* Right decorative element */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-800/30 to-amber-700/50" />
      
      {/* Main divider line */}
      <div className={cn(
        'absolute inset-0 h-px',
        variantStyles[variant]
      )} />
    </div>
  );
}
