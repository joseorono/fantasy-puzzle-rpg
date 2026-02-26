export default function Franuka05aFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="f05a-frame">
      {/* Top Row */}
      <div className="f05a-row f05a-top">
        <div className="f05a-corner f05a-corner--top-left" />
        <div className="f05a-edge f05a-edge--top" />
        <div className="f05a-corner f05a-corner--top-right" />
      </div>

      {/* Middle Row */}
      <div className="f05a-row f05a-middle">
        <div className="f05a-edge f05a-edge--left" />
        <div className="f05a-viewport">
          {children}
        </div>
        <div className="f05a-edge f05a-edge--right" />
      </div>

      {/* Bottom Row */}
      <div className="f05a-row f05a-bottom">
        <div className="f05a-corner f05a-corner--bottom-left" />
        <div className="f05a-edge f05a-edge--bottom" />
        <div className="f05a-corner f05a-corner--bottom-right" />
      </div>
    </div>
  );
}
