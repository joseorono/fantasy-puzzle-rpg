import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DialogueCharacter } from '~/types/dialogue';
import type { MarqueeTextTypes } from '~/constants/flavor-text/marquee-text';
import { useResources } from '~/stores/game-store';
import { getRandomElement } from '~/lib/utils';
import { TopBarResources } from './top-bar-resources';
import { MarqueeText } from '../marquee/marquee-text';
import { DialogueBox } from '~/components/dialogue/dialogue-box';

interface TownLocationLayoutProps {
  locationClass: string;
  bgClass: string;
  bgImages: string[];
  character: DialogueCharacter;
  welcomeTexts: readonly string[];
  marqueeType: MarqueeTextTypes;
  onLeave: () => void;
  children: ReactNode;
}

export function TownLocationLayout({
  locationClass,
  bgClass,
  bgImages,
  character,
  welcomeTexts,
  marqueeType,
  onLeave,
  children,
}: TownLocationLayoutProps) {
  const resources = useResources();
  const backgroundImage = useMemo(() => getRandomElement(bgImages), []);
  const [dialogueText] = useState(() => getRandomElement(welcomeTexts));

  return (
    <div className={locationClass}>
      <div className={bgClass} style={{ backgroundImage: `url('${backgroundImage}')` }}></div>
      <button className="leave-btn" onClick={onLeave}></button>

      {/* Barra de recursos */}
      <div className="town-resources-bar">
        <TopBarResources resources={resources} />
      </div>

      <div className="shop-layout">
        <div className="shop-portrait-sidebar">
          {character.portrait && (
            <img src={character.portrait} alt={character.name ?? ''} className="shop-portrait__image" />
          )}
        </div>

        {/* Contenedor principal */}
        <div className="shop-container">{children}</div>
      </div>

      <div className="shop-bottom">
        <DialogueBox speakerName={character.name} text={dialogueText} isTyping={false} showIndicator={true} />
        <MarqueeText type={marqueeType} variant="marquee--golden" />
      </div>
    </div>
  );
}
