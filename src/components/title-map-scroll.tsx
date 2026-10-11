import { TITLE_MAP_PREVIEW_IMAGES } from '~/constants/title-screen';

// Rendered twice so translating the track by -50% loops seamlessly.
const TRACK_IMAGES = [...TITLE_MAP_PREVIEW_IMAGES, ...TITLE_MAP_PREVIEW_IMAGES];

export function TitleMapScroll() {
  return (
    <div className="title-map-scroll" aria-hidden>
      <div className="title-map-scroll__track">
        {TRACK_IMAGES.map((src, index) => (
          <img key={index} src={src} alt="" draggable={false} className="title-map-scroll__tile" />
        ))}
      </div>
    </div>
  );
}
