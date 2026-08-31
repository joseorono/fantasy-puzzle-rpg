import { useTitleSign } from '~/hooks/use-title-sign';
import type {
  TitleSignPosition,
  TitleSignSize,
  TitleSignTextColor,
  TitleSignVariant,
} from '~/stores/title-sign-atoms';

const VARIANTS: TitleSignVariant[] = ['tan', 'red', 'large'];
const POSITIONS: TitleSignPosition[] = ['top', 'bottom', 'left', 'right', 'center'];
const SIZES: TitleSignSize[] = ['sm', 'md', 'lg'];
const TEXT_COLORS: TitleSignTextColor[] = ['gold', 'cream', 'white', 'dark'];

const buttonClass =
  'px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors capitalize';

/** Debug controls for triggering the decorative title-sign ribbon. */
export default function TitleSignTestView() {
  const { showTitleSign } = useTitleSign();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-y-4">
      <div className="flex flex-col gap-y-2">
        <span className="text-sm font-bold text-slate-300">Ribbon variant</span>
        <div className="flex flex-wrap gap-2">
          {VARIANTS.map((variant) => (
            <button
              key={variant}
              className={buttonClass}
              onClick={() => showTitleSign({ text: 'Verdant Hollow', variant })}
            >
              {variant}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <span className="text-sm font-bold text-slate-300">Position</span>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((position) => (
            <button
              key={position}
              className={buttonClass}
              onClick={() => showTitleSign({ text: position.toUpperCase(), position })}
            >
              {position}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <span className="text-sm font-bold text-slate-300">Size</span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              className={buttonClass}
              onClick={() => showTitleSign({ text: `Size ${size}`, size })}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <span className="text-sm font-bold text-slate-300">Text colour</span>
        <div className="flex flex-wrap gap-2">
          {TEXT_COLORS.map((textColor) => (
            <button
              key={textColor}
              className={buttonClass}
              onClick={() => showTitleSign({ text: textColor, variant: 'red', textColor })}
            >
              {textColor}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <span className="text-sm font-bold text-slate-300">Behaviour</span>
        <div className="flex flex-wrap gap-2">
          <button
            className={buttonClass}
            onClick={() => showTitleSign({ text: 'Click me to dismiss', holdMs: null })}
          >
            Hold forever (click to dismiss)
          </button>
          <button
            className={buttonClass}
            onClick={() => showTitleSign({ text: 'No slide-in', hasEntryAnimation: false })}
          >
            No entry animation
          </button>
          <button
            className={buttonClass}
            onClick={() =>
              showTitleSign({
                text: 'Ancient Ruins',
                variant: 'large',
                size: 'lg',
                textColor: 'gold',
                position: 'center',
                holdMs: 4000,
              })
            }
          >
            Showcase combo
          </button>
        </div>
      </div>
    </div>
  );
}
