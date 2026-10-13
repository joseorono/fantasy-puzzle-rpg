import { CHARACTER_SPRITES } from '~/constants/party';
import { cn } from '~/lib/utils';
import type { CharacterClass } from '~/types/rpg-elements';

interface PartyPortraitFrameProps {
  characterClass: CharacterClass;
  level: number;
  alt?: string;
  className?: string;
}

/**
 * Face-cropped party portrait in the indigolay HUD thumbnail frame. The frame's window is
 * transparent, so the portrait sits under the gold corners; the level rides on its pennant.
 * Width is set by the caller; the height follows the frame art's 187:225 ratio.
 */
export function PartyPortraitFrame({ characterClass, level, alt = '', className }: PartyPortraitFrameProps) {
  const { face, faceFocus } = CHARACTER_SPRITES[characterClass];

  return (
    <div className={cn('party-portrait-frame', className)}>
      <div
        className="party-portrait-frame__window portrait-face-crop"
        style={{ '--face-x': faceFocus.x, '--face-y': faceFocus.y } as React.CSSProperties}
      >
        <img src={face} alt={alt} />
      </div>
      <div className="party-portrait-frame__art indigolay-art" />
      <span className="party-portrait-frame__level pixel-font">LV {level}</span>
    </div>
  );
}
