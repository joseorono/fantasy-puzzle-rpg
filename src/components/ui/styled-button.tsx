import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface StyledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  hexColor: string;
  textColor?: string;
  isCircle?: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function darkenColor(hex: string, factor: number = 0.4): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const darkened = {
    r: Math.max(0, Math.floor(rgb.r * (1 - factor))),
    g: Math.max(0, Math.floor(rgb.g * (1 - factor))),
    b: Math.max(0, Math.floor(rgb.b * (1 - factor))),
  };

  return `#${darkened.r.toString(16).padStart(2, '0')}${darkened.g.toString(16).padStart(2, '0')}${darkened.b.toString(16).padStart(2, '0')}`;
}

export function StyledButton({
  children,
  hexColor,
  textColor = 'rgb(145, 92, 54)',
  isCircle = false,
  className = '',
  ...props
}: StyledButtonProps) {
  const borderColor = darkenColor(hexColor, 0.35);

  const baseStyles: React.CSSProperties = {
    backgroundColor: hexColor,
    color: textColor,
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontFamily: 'var(--font-body, system-ui)',
    fontSize: isCircle ? '1rem' : '0.875rem',
    transition: 'all 0.15s ease',
    boxShadow: `0 4px 0 ${borderColor}, inset 0 -2px 0 rgba(0, 0, 0, 0.2)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    userSelect: 'none',
    outline: 'none',
  };

  const sizeStyles: React.CSSProperties = isCircle
    ? {
        width: '48px',
        height: '48px',
        minWidth: '48px',
        minHeight: '48px',
      }
    : {
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        minHeight: '48px',
      };

  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(2px)',
    boxShadow: `0 2px 0 ${borderColor}, inset 0 -2px 0 rgba(0, 0, 0, 0.2)`,
  };

  const activeStyles: React.CSSProperties = {
    transform: 'translateY(4px)',
    boxShadow: `0 0 0 ${borderColor}, inset 0 -2px 0 rgba(0, 0, 0, 0.2)`,
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles,
      }}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, {
          transform: 'translateY(0)',
          boxShadow: `0 4px 0 ${borderColor}, inset 0 -2px 0 rgba(0, 0, 0, 0.2)`,
        });
      }}
      onMouseDown={(e) => {
        Object.assign(e.currentTarget.style, activeStyles);
      }}
      onMouseUp={(e) => {
        Object.assign(e.currentTarget.style, hoverStyles);
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}
