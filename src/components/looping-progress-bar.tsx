interface LoopingProgressBarProps {
  durationInMs: number;
}

export default function LoopingProgressBar(props: LoopingProgressBarProps) {
  const durationInMs = Math.floor(props.durationInMs);

  return (
    <div className="loader__progress-bar-container">
      <div data-durationms={durationInMs} className="loop-progress-bar" />
    </div>
  );
}
