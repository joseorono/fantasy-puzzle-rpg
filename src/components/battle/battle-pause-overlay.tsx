import { ToffecButton } from '~/components/ui-custom/toffec-button';

interface BattlePauseOverlayProps {
  onResume: () => void;
}

export function BattlePauseOverlay({ onResume }: BattlePauseOverlayProps) {
  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-black/90 px-4 backdrop-blur-[2px]">
      <div className="title-sign title-sign--red title-sign--text-gold" style={{ width: '280px' }}>
        <span className="title-sign__text pixel-font" style={{ fontSize: '16px' }}>PAUSE</span>
      </div>

      <ToffecButton onClick={onResume} size="default" variant="cream">
        Resume
      </ToffecButton>
    </div>
  );
}
