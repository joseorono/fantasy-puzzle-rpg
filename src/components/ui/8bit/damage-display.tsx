import { cn } from '~/lib/utils';
import type { DamageDisplayProps } from '~/types/components';

export function DamageDisplay({ amount, type, className }: DamageDisplayProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'damage':
        return 'bg-red-600 border-red-500 text-white';
      case 'heal':
        return 'bg-green-600 border-green-500 text-white';
      case 'critical':
        return 'bg-orange-600 border-orange-500 text-yellow-200';
      default:
        return 'bg-red-600 border-red-500 text-white';
    }
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-none border-4 px-4 py-2',
        'pixel-font-alt font-bold',
        'animate-in zoom-in duration-200',
        getTypeStyles(),
        className,
      )}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      {/* Pixelated border corners */}
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
      <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -left-1.5 h-[calc(100%-12px)] w-1.5" />
      <div className="bg-foreground dark:bg-ring absolute top-1.5 -right-1.5 h-[calc(100%-12px)] w-1.5" />

      {/* Content */}
      <span className="relative z-10 text-2xl md:text-3xl">
        {type === 'heal' ? '+' : '-'}
        {amount}
      </span>

      {/* Shadow effect */}
      <div className="bg-foreground/20 absolute top-0 left-0 h-1.5 w-full" />
      <div className="bg-foreground/20 absolute bottom-0 left-0 h-1.5 w-full" />
    </div>
  );
}
