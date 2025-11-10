interface DialogueTriggerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function DialogueTriggerModal({ isOpen, onAccept, onDecline }: DialogueTriggerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onDecline}
    >
      <div
        style={{
          backgroundColor: '#16213e',
          border: '4px solid #ffd700',
          padding: '2rem',
          maxWidth: '500px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            color: '#ffd700',
            fontFamily: 'monospace',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Event Discovered!
        </h2>
        
        <p
          style={{
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '1rem',
            marginBottom: '2rem',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          You've discovered something interesting. Would you like to investigate?
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onAccept}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: '#0f3460',
              color: '#ffd700',
              border: '3px solid #ffd700',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            Yes
          </button>

          <button
            onClick={onDecline}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: '#8b0000',
              color: '#fff',
              border: '3px solid #ff4444',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
