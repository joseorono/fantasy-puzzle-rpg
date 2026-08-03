// https://codepen.io/daiyalkhan/pen/KKgvvgM
import { useEffect, useRef } from 'react';
import { isReducedMotion } from '~/lib/reduced-motion';

/** Half the tracker's 80px box, so the circle centres on the pointer. */
const TRACKER_OFFSET_PX = 40;

export default function MouseTracker() {
  const trackerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tracker = trackerRef.current;
    if (!tracker) return;

    let frame = 0;

    function handleTrackMouse(e: MouseEvent) {
      // Coalesce to one write per frame; transform keeps it off the layout path.
      if (frame) return;
      const x = e.clientX - TRACKER_OFFSET_PX;
      const y = e.clientY - TRACKER_OFFSET_PX;
      frame = requestAnimationFrame(() => {
        frame = 0;
        tracker.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    }

    function playAnimOnClick() {
      // The ripple is decoration, and its softness comes from a 200ms fill ease that
      // reduced-motion.css collapses to 1ms — leaving a hard black disc. Skip it outright.
      if (isReducedMotion()) return;
      // Re-adding an already-present class won't replay the animation, so drop it and
      // force a reflow to restart cleanly on every click.
      tracker.classList.remove('clickAnim');
      tracker.getBoundingClientRect();
      tracker.classList.add('clickAnim');
    }

    function handleAnimEnd() {
      tracker.classList.remove('clickAnim');
    }

    window.addEventListener('mousemove', handleTrackMouse);
    window.addEventListener('click', playAnimOnClick);
    tracker.addEventListener('animationend', handleAnimEnd);

    return () => {
      window.removeEventListener('mousemove', handleTrackMouse);
      window.removeEventListener('click', playAnimOnClick);
      tracker.removeEventListener('animationend', handleAnimEnd);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={trackerRef} className="mouseTracker" />;
}
