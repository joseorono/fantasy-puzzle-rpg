interface LoopingProgressBarProps {
  durationInMs: number;
}

export default function LoopingProgressBar(props: LoopingProgressBarProps) {
  const durationInMs = Math.floor(props.durationInMs);

  return (
    <div className="loader__progress-bar-container">
      {/* Exempt from reduced motion: this indeterminate bar is the only sign loading is alive. */}
      <div data-durationms={durationInMs} className="loop-progress-bar motion-exempt" />
    </div>
  );
}
