// One element per URL, shared by every canvas that draws it and by every map mount.
const imageCache = new Map<string, HTMLImageElement>();

/**
 * The shared `<img>` for a URL, created and set loading on first request. Check
 * {@link isImageReady} before drawing it.
 *
 * @param src Image URL.
 */
export function getCachedImage(src: string): HTMLImageElement {
  let image = imageCache.get(src);
  if (!image) {
    image = new Image();
    image.src = src;
    imageCache.set(src, image);
  }
  return image;
}

/**
 * Whether an image has decoded and can be drawn. A failed load reports complete with no size.
 *
 * @param image The image.
 */
export function isImageReady(image: HTMLImageElement): boolean {
  return image.complete && image.naturalWidth > 0;
}
