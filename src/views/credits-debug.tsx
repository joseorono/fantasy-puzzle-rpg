import { useState } from 'react';
import { CreditsModal } from '~/components/credits-modal';

/**
 * Debug section for opening the shared {@link CreditsModal}. Lets us eyeball the
 * audio/graphics/links attribution content without having to walk back out to the
 * title screen.
 */
export default function CreditsDebugView() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6">
      <h2 className="mb-3 text-lg font-bold text-white">Credits / Licenses</h2>
      <p className="mb-4 text-sm text-slate-400">
        Opens the same credits modal shown from the start menu (audio, graphics, and license links).
      </p>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-slate-700 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
      >
        Open Credits Modal
      </button>

      <CreditsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
