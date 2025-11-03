interface LoopingProgressBarProps {
  durationInMs: number;
}

export default function LoopingProgressBar(props: LoopingProgressBarProps) {
  const durationInMs = Math.floor(props.durationInMs);
  
  return (
    <div className="h-[17px] w-full select-none overflow-hidden border-b-[3px]">
      <div 
        data-durationms={durationInMs} 
        className="loop-progress-bar h-full bg-white"
      />
    </div>
  );
}
