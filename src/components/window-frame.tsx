export default function WindowFrame({ children }: { children: React.ReactNode }) {
  return (
    <div id="window-frame">
      {/* Top Row */}
      <div className="wf-row wf-top">
        <div className="wf-corner wf-corner--top-left" />
        <div className="wf-edge wf-edge--top" />
        <div className="wf-corner wf-corner--top-right" />
      </div>

      {/* Middle Row */}
      <div className="wf-row wf-middle">
        <div className="wf-edge wf-edge--left" />
        <div id="game-screen" className="wf-viewport">
          {children}
        </div>
        <div className="wf-edge wf-edge--right" />
      </div>

      {/* Bottom Row */}
      <div className="wf-row wf-bottom">
        <div className="wf-corner wf-corner--bottom-left" />
        <div className="wf-edge wf-edge--bottom" />
        <div className="wf-corner wf-corner--bottom-right" />
      </div>
    </div>
  );
}