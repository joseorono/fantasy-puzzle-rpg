export default function Franuka05aBottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="f05a-bottom-bar">
      {children}
      <div className="f05a-bottom-bar__edge">
        <div className="f05a-edge f05a-edge--bottom" />
      </div>
    </div>
  );
}
