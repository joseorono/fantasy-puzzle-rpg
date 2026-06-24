import { NarikRedwoodBitFont } from '~/components/bitmap-fonts/narik-redwood';
import { ToffecButton } from '~/components/ui-custom/toffec-button';

interface BattlePauseOverlayProps {
  onResume: () => void;
}

export function BattlePauseOverlay({ onResume }: BattlePauseOverlayProps) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/72 px-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl border-[3px] border-[#d4a574] bg-[linear-gradient(135deg,#3d2817_0%,#2a1810_100%)] px-8 py-10 text-[#e0e0e0] shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-center rounded-xl border border-amber-200/20 bg-amber-100/5 px-6 py-3 shadow-[inset_0_1px_0_rgba(255,241,214,0.18)]">
          <NarikRedwoodBitFont text="PAUSE" size={2.4} />
        </div>

        <ToffecButton onClick={onResume} size="lg" variant="cream">
          Resume
        </ToffecButton>
      </div>
    </div>
  );
}
