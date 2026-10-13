import { useState } from 'react';
import { TITLE_MAP_PREVIEW_IMAGES } from '~/constants/title-screen';
import { shuffleArray } from '~/lib/utils';

export function TitleMapScroll() {
  // Shuffled once per mount, then rendered twice so translating the track by -50% loops seamlessly.
  const [trackImages] = useState(() => {
    const shuffled = shuffleArray([...TITLE_MAP_PREVIEW_IMAGES]);
    return [...shuffled, ...shuffled];
  });

  return (
    <div className="title-map-scroll" aria-hidden>
      <div className="title-map-scroll__track">
        {trackImages.map((src, index) => (
          <img key={index} src={src} alt="" draggable={false} className="title-map-scroll__tile" />
        ))}
      </div>
    </div>
  );
}
