import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

/**
 * Glyphs are 20×20 three-tone pixel bitmaps — mid-gray outline, white fill, `#e6e6e6` lower
 * half — matching the chunky gray arrow of `back-button.png`, the art this button replaces.
 * Rows are one char per pixel, so tuning a glyph is a single-character edit.
 */
type Tone = 'o' | 'f' | 'd';

const TONE_FILLS: Record<Tone, string> = {
  o: '#808080',
  f: '#ffffff',
  d: '#e6e6e6',
};

const GLYPH_BITMAPS = {
  back: [
    '....................',
    '....................',
    '....................',
    '........oo..........',
    '.......ofo..........',
    '......offo..........',
    '.....offfo..........',
    '....offfffoooooooo..',
    '...offffffffffffffo.',
    '..offfffffffffffffo.',
    '..offfffffffffffffo.',
    '..odddddddddddddddo.',
    '...oddddddddddddddo.',
    '....odddddoooooooo..',
    '.....odddo..........',
    '......oddo..........',
    '.......odo..........',
    '........oo..........',
    '....................',
    '....................',
  ],
  help: [
    '....................',
    '......oooooooo......',
    '....ooffffffffoo....',
    '...offffffffffffo...',
    '...offfoooooofffo...',
    '...offo......offo...',
    '...oooo......offo...',
    '.............offo...',
    '............offfo...',
    '...........offfo....',
    '.........ooddoo.....',
    '........odddo.......',
    '........ooooo.......',
    '....................',
    '........oooo........',
    '........oddo........',
    '........oddo........',
    '........oddo........',
    '........oooo........',
    '....................',
  ],
  close: [
    '....................',
    '....................',
    '...oo..........oo...',
    '..offo........offo..',
    '..offfo......offfo..',
    '...offfo....offfo...',
    '....offfo..offfo....',
    '.....offfoofffo.....',
    '......offffffo......',
    '.......offffo.......',
    '.......offffo.......',
    '......oddddddo......',
    '.....odddoodddo.....',
    '....odddo..odddo....',
    '...odddo....odddo...',
    '..odddo......odddo..',
    '..oddo........oddo..',
    '...oo..........oo...',
    '....................',
    '....................',
  ],
  settings: [
    '....................',
    '....................',
    '........oooo........',
    '........offo........',
    '......ooffffoo......',
    '.....offffffffo.....',
    '....offffffffffo....',
    '....offfoooofffo....',
    '..oofffo....offfoo..',
    '..offffo....offffo..',
    '..offffo....offffo..',
    '..oodddo....odddoo..',
    '....odddoooodddo....',
    '....oddddddddddo....',
    '.....oddddddddo.....',
    '......ooddddoo......',
    '........oddo........',
    '........oooo........',
    '....................',
    '....................',
  ],
} as const;

export type WoodDiscGlyph = keyof typeof GLYPH_BITMAPS;

/** One path per tone, built from 1px-row runs. Horizontal merging only — `crispEdges`
    disables antialiasing, so vertically adjacent same-tone rects cannot seam. */
function bitmapToLayers(rows: readonly string[]): Record<Tone, string> {
  const runs: Record<Tone, string[]> = { o: [], f: [], d: [] };
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const tone = row[x] as Tone | '.';
      let end = x + 1;
      while (end < row.length && row[end] === tone) end += 1;
      if (tone !== '.') runs[tone].push(`M${x} ${y}h${end - x}v1h${x - end}z`);
      x = end;
    }
  });
  return { o: runs.o.join(''), f: runs.f.join(''), d: runs.d.join('') };
}

const GLYPH_LAYERS = Object.fromEntries(
  (Object.keys(GLYPH_BITMAPS) as WoodDiscGlyph[]).map((glyph) => [glyph, bitmapToLayers(GLYPH_BITMAPS[glyph])]),
) as Record<WoodDiscGlyph, Record<Tone, string>>;

const DEFAULT_ARIA_LABEL: Record<WoodDiscGlyph, string> = {
  back: 'Back',
  help: 'Help',
  close: 'Close',
  settings: 'Settings',
};

const woodDiscButtonVariants = cva('wood-disc-btn inline-flex items-center justify-center select-none', {
  variants: {
    /** Which wood the disc is cut from. Colour only — geometry is identical. */
    variant: {
      oak: 'wood-disc-btn--oak',
      walnut: 'wood-disc-btn--walnut',
      redwood: 'wood-disc-btn--redwood',
      ash: 'wood-disc-btn--ash',
    },
    size: {
      sm: '[--wd-size:64px] [--wd-lip:4px]',
      default: '[--wd-size:80px] [--wd-lip:4px]',
      lg: '[--wd-size:96px] [--wd-lip:5px]',
    },
  },
  defaultVariants: { variant: 'walnut', size: 'default' },
});

interface WoodDiscButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof woodDiscButtonVariants> {
  /** Which glyph sits on the disc. */
  glyph: WoodDiscGlyph;
}

/**
 * A wooden disc with a chunky gray glyph on its face — the town's circular icon button.
 *
 * The face is a real pixel wood tile (`tc-bg-wood-*.png` at a fixed 2× texel scale) clipped to
 * the circle; ring, lip and glyph stay CSS + inline SVG. Sizes are 64/80/96px, and the default
 * is deliberately `back-button.png`'s 80px footprint so `.leave-btn` can adopt this with no
 * layout shift.
 *
 * Four woods ship — `walnut` (dark, pitched to the back button's brick interior), `oak` (lighter
 * signpost honey), `redwood` (warm red) and `ash` (pale and cool). Each variant class declares
 * the entire `--wd-*` block, following the `--cb-*` convention in {@link ToffecSquareButton}, so
 * a future stone or iron disc is a new block of properties and nothing else.
 */
export function WoodDiscButton({
  className,
  variant,
  size,
  glyph,
  'aria-label': ariaLabel,
  ...props
}: WoodDiscButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? DEFAULT_ARIA_LABEL[glyph]}
      className={cn(woodDiscButtonVariants({ variant, size, className }))}
      {...props}
    >
      <svg
        className="wood-disc-btn__glyph"
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
      >
        {(['o', 'd', 'f'] as const).map((tone) => (
          <path key={tone} d={GLYPH_LAYERS[glyph][tone]} fill={TONE_FILLS[tone]} />
        ))}
      </svg>
    </button>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { woodDiscButtonVariants };





