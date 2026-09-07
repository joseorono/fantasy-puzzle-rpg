import { cn } from '~/lib/utils';

type IndigolayDividerVariant = 'default' | 'victory' | 'defeat' | 'gold' | 'silver' | 'bronze';

interface IndigolayDividerProps {
  variant?: IndigolayDividerVariant;
  className?: string;
  icon?: string;
}

const ORNAMENT_SRC = '/assets/decorations/indigolay/divider-ornament.png';

/**
 * Per-variant re-tint of the warm-gold filigree source PNG. `filter` recolors
 * the ornament; `glow` is its soft drop-shadow.
 */
const VARIANT_CONFIG: Record<IndigolayDividerVariant, { filter: string; glow: string }> = {
  default: { filter: 'saturate(0.8) brightness(0.95)', glow: '0 0 4px rgba(146,64,14,0.25)' },
  victory: { filter: 'brightness(1.1) saturate(1.15)', glow: '0 0 6px rgba(202,138,4,0.4)' },
  defeat: { filter: 'sepia(1) saturate(3) hue-rotate(-40deg) brightness(0.8)', glow: '0 0 6px rgba(153,27,27,0.4)' },
  gold: { filter: 'brightness(1.05) saturate(1.1)', glow: '0 0 6px rgba(202,138,4,0.45)' },
  silver: { filter: 'grayscale(1) brightness(1.3) contrast(1.05)', glow: '0 0 6px rgba(156,163,175,0.4)' },
  bronze: { filter: 'sepia(0.5) saturate(1.5) hue-rotate(-12deg) brightness(0.9)', glow: '0 0 6px rgba(180,83,9,0.4)' },
};

export function IndigolayDivider({ variant = 'default', className, icon }: IndigolayDividerProps) {
  const { filter, glow } = VARIANT_CONFIG[variant];

  return (
    <div className={cn('my-3 flex justify-center', className)}>
      <div className="relative flex items-center justify-center">
        {/* Native-resolution ornament — never upscaled past 2x to stay crisp */}
        <img
          src={ORNAMENT_SRC}
          alt=""
          className="h-[13px] w-auto object-contain [image-rendering:pixelated]"
          style={{ filter: `${filter} drop-shadow(${glow})` }}
        />
        {icon && (
          <img
            src={icon}
            alt=""
            className="absolute h-4 w-4 object-contain [image-rendering:pixelated]"
            style={{ filter: `drop-shadow(${glow})` }}
          />
        )}
      </div>
    </div>
  );
}
