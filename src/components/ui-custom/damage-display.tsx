import { cn } from '~/lib/utils';
import type { DamageDisplayProps } from '~/types/components';

interface DamagePalette {
  base: string;
  light: string;
  dark: string;
  border: string;
  shadow: string;
}

function getDamagePalette(type: DamageDisplayProps['type']): DamagePalette {
  switch (type) {
    case 'heal':
      return { base: '#1d8f4a', light: '#2fd06d', dark: '#0f5f31', border: '#0a3e20', shadow: 'rgba(0, 40, 0, 0.7)' };
    case 'critical':
      return { base: '#d97a1c', light: '#f7b24f', dark: '#9c4f0b', border: '#5a2b04', shadow: 'rgba(45, 18, 0, 0.75)' };
    case 'damage':
    default:
      return { base: '#b83232', light: '#e35c5c', dark: '#7c1c1c', border: '#4a0f0f', shadow: 'rgba(35, 0, 0, 0.75)' };
  }
}

export function DamageDisplay({ amount, type, className }: DamageDisplayProps) {
  const palette = getDamagePalette(type);

  return (
    <div
      className={cn('animate-in zoom-in relative inline-flex items-center justify-center duration-150', className)}
      style={{
        imageRendering: 'pixelated',
        filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.55))',
      }}
    >
      <div
        className="relative inline-flex items-center justify-center rounded-md px-3 py-1.5"
        style={{
          background: `linear-gradient(180deg, ${palette.light} 0%, ${palette.base} 55%, ${palette.dark} 100%)`,
          border: `3px solid ${palette.border}`,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -2px 0 rgba(0,0,0,0.38), inset 2px 0 0 rgba(255,255,255,0.14), inset -2px 0 0 rgba(0,0,0,0.2)',
        }}
      >
        <span
          className="pixel-font-alt relative z-10 text-2xl font-bold text-white md:text-3xl"
          style={{ textShadow: `2px 2px 0 ${palette.shadow}` }}
        >
          {type === 'heal' ? '+' : '-'}
          {amount}
        </span>

        {/* Gloss + outline */}
        <div
          className="pointer-events-none absolute inset-0 rounded-sm"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 45%, rgba(0,0,0,0.1) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-sm"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 0 0 2px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </div>
  );
}
