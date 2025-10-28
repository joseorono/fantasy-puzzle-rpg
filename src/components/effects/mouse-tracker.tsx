// https://codepen.io/daiyalkhan/pen/KKgvvgM
import { useEffect } from 'react';

export default function MouseTracker() {
  useEffect(() => {
    // console.log('MouseTracker mounted');

    const mouseTracker = document.querySelector('.mouseTracker');

    if (!mouseTracker) {
      console.warn('MouseTracker not found!', mouseTracker);
    }

    const handleTrackMouse = (e: MouseEvent) => {
      // console.log('Mouse Moved');

      mouseTracker?.setAttribute('style', 'top: ' + (e.pageY - 40) + 'px; left:' + (e.pageX - 40) + 'px;');
    };

    const playAnimOnClick = () => {
      // console.log('Playing Click animation');
      if (mouseTracker == null) {
        console.warn('MouseTracker not found!');
      }

      mouseTracker?.classList.add('clickAnim');
      setTimeout(() => {
        mouseTracker?.classList.remove('clickAnim');
      }, 500);
    };

    // ON CLICK ADD/REMOVE CLASS ".clickAnim"
    window.addEventListener('click', playAnimOnClick);

    window.addEventListener('mousemove', handleTrackMouse);

    return () => {
      /*
      window.removeEventListener('mousemove', handleTrackMouse);
      document.removeEventListener('mousemove', playAnimOnClick);
      */
    };
  }, []);

  return <div className="mouseTracker"></div>;
}
