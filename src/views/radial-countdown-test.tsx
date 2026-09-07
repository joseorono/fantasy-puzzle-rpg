import { useEffect, useState } from 'react';
import { Swords, Timer } from 'lucide-react';
import { RadialCountdown } from '~/components/ui-custom/radial-countdown';

/** Debug harness for the reusable {@link RadialCountdown} ring. */
export default function RadialCountdownTestView() {
  const [cycle, setCycle] = useState(0);
  const [auto, setAuto] = useState(true);

  // Auto-loop a 3s cycle so the depletion + restart is visible at a glance.
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => setCycle((c) => c + 1), 3000);
    return () => clearInterval(timer);
  }, [auto]);

  return (
    <div className="flex flex-col gap-y-4 text-slate-300">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold">RadialCountdown</span>
        <button
          onClick={() => setCycle((c) => c + 1)}
          className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
        >
          Restart cycle
        </button>
        <button
          onClick={() => setAuto((a) => !a)}
          className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-500"
        >
          {auto ? 'Stop auto-loop' : 'Start auto-loop'}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-6 rounded-lg bg-slate-800 p-6">
        <div className="flex flex-col items-center gap-2">
          <RadialCountdown durationMs={3000} cycleKey={cycle} size="sm" tone="neutral">
            <Timer className="h-3 w-3 text-amber-200" />
          </RadialCountdown>
          <span className="text-xs">sm / neutral</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <RadialCountdown durationMs={3000} cycleKey={cycle} size="md" tone="danger">
            <Swords className="h-3.5 w-3.5 text-red-200" />
          </RadialCountdown>
          <span className="text-xs">md / danger</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <RadialCountdown durationMs={3000} cycleKey={cycle} size="lg" tone="gold">
            <span className="pixel-font text-[0.6rem] text-amber-100">3s</span>
          </RadialCountdown>
          <span className="text-xs">lg / gold</span>
        </div>
      </div>
    </div>
  );
}
