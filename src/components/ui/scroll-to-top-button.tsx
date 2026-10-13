import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

const SCROLL_THRESHOLD_PX = 300;
const SCROLL_CONTAINER_ID = 'game-screen';

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(SCROLL_CONTAINER_ID);
    if (!el) return;

    function handleScroll() {
      setIsVisible(el!.scrollTop > SCROLL_THRESHOLD_PX);
    }

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed right-13 bottom-9 z-20 rounded bg-slate-700 p-3 text-white shadow-lg transition-colors hover:bg-slate-600"
    >
      <ArrowUp size={20} />
    </button>
  );
}
