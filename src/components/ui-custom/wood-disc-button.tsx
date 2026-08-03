import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

/**
 * Glyphs are drawn on a 16×16 grid with integer coordinates only, so `shape-rendering: crispEdges`
 * lands every edge on a pixel boundary at all three sizes — that is what keeps them reading as
 * pixel art instead of smooth vector icons. Diagonals are exact 45°, so they stair-step cleanly.
 */
const GLYPH_PATHS = {
  back: 'M7 3 L7 6 L13 6 L13 10 L7 10 L7 13 L2 8 Z',
  help: 'M3 1 H13 V3 H3 Z M3 3 H5 V5 H3 Z M11 3 H13 V7 H11 Z M7 7 H13 V9 H7 Z M7 9 H9 V12 H7 Z M7 14 H9 V16 H7 Z',
  close: 'M3 5 L5 3 L8 6 L11 3 L13 5 L10 8 L13 11 L11 13 L8 10 L5 13 L3 11 L6 8 Z',
  settings:
    'M6 1 H10 V3 H6 Z M6 13 H10 V15 H6 Z M1 6 H3 V10 H1 Z M13 6 H15 V10 H13 Z M3 3 H13 V13 H3 Z M6 6 H10 V10 H6 Z',
} as const;

export type WoodDiscGlyph = keyof typeof GLYPH_PATHS;

const DEFAULT_ARIA_LABEL: Record<WoodDiscGlyph, string> = {
  back: 'Back',
  help: 'Help',
  close: 'Close',
  settings: 'Settings',
};

const woodDiscButtonVariants = cva('wood-disc-btn inline-flex items-center justify-center select-none', {
  variants: {
    /** Which wood the disc is cut from. Colour only — geometry is identical. */
    tone: {
      oak: 'wood-disc-btn--oak',
      walnut: 'wood-disc-btn--walnut',
    },
    size: {
      sm: '[--wd-size:48px] [--wd-lip:3px]',
      default: '[--wd-size:64px] [--wd-lip:4px]',
      lg: '[--wd-size:80px] [--wd-lip:4px]',
    },
  },
  defaultVariants: { tone: 'walnut', size: 'default' },
});

interface WoodDiscButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof woodDiscButtonVariants> {
  /** Which glyph is carved into the disc. */
  glyph: WoodDiscGlyph;
}

/**
 * A carved wooden disc with a glyph cut into its face — the town's circular icon button.
 *
 * Built entirely from CSS geometry and one inline SVG, so it stays crisp at any size and any
 * zoom, unlike the raster button art it is meant to replace. `size="lg"` is deliberately
 * `back-button.png`'s 80px footprint so `.leave-btn` can adopt this with no layout shift.
 *
 * Two woods ship: `walnut` (dark, pitched to the back button's brick interior) and `oak` (the
 * lighter signpost-plank honey). All colours are `--wd-*` custom properties set by the tone
 * class, following the `--cb-*` convention in {@link ToffecSquareButton}, so a future stone or
 * iron disc is a new block of properties and nothing else.
 */
export function WoodDiscButton({
  className,
  tone,
  size,
  glyph,
  'aria-label': ariaLabel,
  ...props
}: WoodDiscButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? DEFAULT_ARIA_LABEL[glyph]}
      className={cn(woodDiscButtonVariants({ tone, size, className }))}
      {...props}
    >
      <svg
        className="wood-disc-btn__glyph"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
      >
        {/* evenodd so the gear's centre subpath punches a hole instead of filling it. */}
        <path d={GLYPH_PATHS[glyph]} fillRule="evenodd" />
      </svg>
    </button>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { woodDiscButtonVariants };
