import { cn } from "~/lib/utils";
import type { DamageDisplayProps } from "~/types/components";

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
        'px-4 py-2 rounded-none border-4',
        'font-bold pixel-font-alt',
        'animate-in zoom-in duration-200',
        getTypeStyles(),
        className
      )}
      style={{
        imageRendering: 'pixelated',
      }}
    >
      {/* Pixelated border corners */}
      <div className="absolute -top-1.5 w-1/2 left-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -top-1.5 w-1/2 right-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -bottom-1.5 w-1/2 left-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute -bottom-1.5 w-1/2 right-1.5 h-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-0 left-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-0 right-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute bottom-0 left-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute bottom-0 right-0 size-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-1.5 -left-1.5 h-[calc(100%-12px)] w-1.5 bg-foreground dark:bg-ring" />
      <div className="absolute top-1.5 -right-1.5 h-[calc(100%-12px)] w-1.5 bg-foreground dark:bg-ring" />

      {/* Content */}
      <span className="relative z-10 text-2xl md:text-3xl">
        {type === 'heal' ? '+' : '-'}{amount}
      </span>

      {/* Shadow effect */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-foreground/20" />
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-foreground/20" />
    </div>
  );
}
