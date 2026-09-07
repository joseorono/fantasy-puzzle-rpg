import { useState, useEffect, type RefObject } from 'react';

export interface CanvasMetrics {
  /** Rendered width over intrinsic (map-pixel) width. */
  scale: number;
  /** Canvas's left edge relative to the positioning container, in CSS pixels. */
  offsetX: number;
  /** Canvas's top edge relative to the positioning container, in CSS pixels. */
  offsetY: number;
}

const INITIAL_METRICS: CanvasMetrics = { scale: 1, offsetX: 0, offsetY: 0 };

/**
 * Measures how a map canvas is laid out inside its positioning container.
 *
 * The canvas is shrink-to-fit and centred, so it is both scaled down and
 * letterboxed: an overlay anchored to the container is offset from the tiles by
 * the centring margin unless that margin is added back. Returning the offset
 * lets the sprite stay pinned to the canvas without wrapping the canvas in an
 * extra element, which would disturb how it sizes itself.
 *
 * Measured through a `ResizeObserver` rather than read during render, so the
 * value changes only when layout genuinely changes.
 *
 * @param canvasRef Ref to the map canvas.
 * @param containerRef Ref to the `position: relative` element the overlay is absolute within.
 * @param intrinsicWidth The canvas's width in map pixels (`mapWidth * tileSize`).
 */
export function useCanvasMetrics(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  intrinsicWidth: number,
): CanvasMetrics {
  const [metrics, setMetrics] = useState<CanvasMetrics>(INITIAL_METRICS);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || intrinsicWidth <= 0) return;

    function measure() {
      const canvasElement = canvasRef.current;
      const containerElement = containerRef.current;
      if (!canvasElement || !containerElement) return;

      const canvasRect = canvasElement.getBoundingClientRect();
      if (canvasRect.width <= 0) return;
      const containerRect = containerElement.getBoundingClientRect();

      // Absolute children anchor to the padding box, so step inside any border.
      const next: CanvasMetrics = {
        scale: canvasRect.width / intrinsicWidth,
        offsetX: canvasRect.left - containerRect.left - containerElement.clientLeft,
        offsetY: canvasRect.top - containerRect.top - containerElement.clientTop,
      };

      setMetrics((previous) =>
        previous.scale === next.scale && previous.offsetX === next.offsetX && previous.offsetY === next.offsetY
          ? previous
          : next,
      );
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    observer.observe(container);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [canvasRef, containerRef, intrinsicWidth]);

  return metrics;
}
