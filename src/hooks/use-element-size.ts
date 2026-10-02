import { useState, useEffect, type RefObject } from 'react';
import type { MapSize } from '~/lib/map-camera';

/**
 * Tracks an element's content-box size in whole CSS pixels.
 *
 * Measured with a `ResizeObserver`, so the value changes only when layout genuinely
 * changes and never during render. Sizes are floored so a child sized from them can
 * never overflow the element.
 *
 * @param ref The element to measure.
 * @returns The size, or `null` until the first measurement.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): MapSize | null {
  const [size, setSize] = useState<MapSize | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      setSize((previous) =>
        previous && previous.width === width && previous.height === height ? previous : { width, height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
