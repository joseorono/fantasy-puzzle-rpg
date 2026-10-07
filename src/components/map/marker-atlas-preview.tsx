import { useEffect, useRef } from 'react';
import { JIRBY_SYMBOL_SHEET } from '~/constants/jirby-symbols';
import { getCachedImage, isImageReady } from '~/lib/image-cache';
import { getReadyMapMarkerAtlas } from '~/lib/map-marker-atlas';

interface MarkerAtlasPreviewProps {
  /** Whole-number display scale (default 2). */
  scale?: number;
}

/** Shows the baked map-marker atlas — every node type × state, plus the floating symbols and shadows. */
export function MarkerAtlasPreview({ scale = 2 }: MarkerAtlasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const symbols = getCachedImage(JIRBY_SYMBOL_SHEET.image);

    function paint() {
      const atlas = getReadyMapMarkerAtlas();
      const ctx = canvasRef.current?.getContext('2d');
      if (!atlas || !ctx) return;
      ctx.canvas.width = atlas.width * scale;
      ctx.canvas.height = atlas.height * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(atlas, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    if (isImageReady(symbols)) {
      paint();
      return;
    }
    symbols.addEventListener('load', paint, { once: true });
    return () => symbols.removeEventListener('load', paint);
  }, [scale]);

  return <canvas ref={canvasRef} className="pixel-art" aria-label="Map marker atlas" />;
}
