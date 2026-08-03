import { useState } from 'react';
import { WoodDiscButton, type WoodDiscGlyph } from '~/components/ui-custom/wood-disc-button';

const GLYPHS: WoodDiscGlyph[] = ['back', 'help', 'close', 'settings'];
const TONES = ['walnut', 'oak'] as const;
const SIZES = ['sm', 'default', 'lg'] as const;

/**
 * Debug harness for {@link WoodDiscButton} — every tone × glyph, all three sizes, and the real
 * `back-button.png` alongside for comparison, since replacing it is the component's whole point.
 */
export default function WoodDiscButtonTestView() {
  const [lastPressed, setLastPressed] = useState<string>('—');

  return (
    <div className="flex flex-col gap-y-4 text-slate-300">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold">WoodDiscButton</span>
        <span className="text-xs text-slate-400">last pressed: {lastPressed}</span>
      </div>

      {/* Dark wooden backdrop rather than the debug slate, so the discs are judged against
          something close to the town they live in. */}
      <div className="flex flex-col gap-6 rounded-lg bg-[#2a1810] p-6">
        {TONES.map((tone) => (
          <div key={tone} className="flex flex-wrap items-end gap-6">
            <span className="w-16 text-xs text-[#d4a574]">{tone}</span>
            {GLYPHS.map((glyph) => (
              <div key={glyph} className="flex flex-col items-center gap-2">
                <WoodDiscButton
                  glyph={glyph}
                  tone={tone}
                  size="lg"
                  onClick={() => setLastPressed(`${tone} / ${glyph}`)}
                />
                <span className="text-xs text-[#d4a574]">{glyph}</span>
              </div>
            ))}
          </div>
        ))}

        <div className="flex flex-wrap items-end gap-6 border-t border-[#4a2a12] pt-6">
          <span className="w-16 text-xs text-[#d4a574]">sizes</span>
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <WoodDiscButton glyph="back" size={size} onClick={() => setLastPressed(`back / ${size}`)} />
              <span className="text-xs text-[#d4a574]">{size}</span>
            </div>
          ))}

          <div className="flex flex-col items-center gap-2">
            <img src="/assets/menu/back-button.png" alt="" className="pixel-art h-[86px] w-20" />
            <span className="text-xs text-[#d4a574]">back-button.png</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <WoodDiscButton glyph="back" size="lg" disabled />
            <span className="text-xs text-[#d4a574]">disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
