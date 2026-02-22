export default function BoardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bf-frame">
      {/* Top Row */}
      <div className="bf-row bf-top">
        <div className="bf-corner bf-corner--top-left" />
        <div className="bf-edge bf-edge--top" />
        <div className="bf-corner bf-corner--top-right" />
      </div>

      {/* Middle Row */}
      <div className="bf-row bf-middle">
        <div className="bf-edge bf-edge--left" />
        <div className="bf-viewport">
          {children}
        </div>
        <div className="bf-edge bf-edge--right" />
      </div>

      {/* Bottom Row */}
      <div className="bf-row bf-bottom">
        <div className="bf-corner bf-corner--bottom-left" />
        <div className="bf-edge bf-edge--bottom" />
        <div className="bf-corner bf-corner--bottom-right" />
      </div>
    </div>
  );
}
