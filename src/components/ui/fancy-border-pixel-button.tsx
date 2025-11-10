import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

interface FancyBorderPixelButtonProps {
  children?: ReactNode;
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  // Optional style overrides for the CSS variables
  fillColor?: string; // --btn-fill
  textColor?: string; // --btn-text
  frameOuterColor?: string; // --btn-frame-outer
  frameInnerColor?: string; // --btn-frame-inner
  style?: CSSProperties;
}

export function FancyBorderPixelButton({
  children,
  label,
  onClick,
  className,
  fillColor = '#6f7f8a',
  textColor = '#cdd6db',
  frameOuterColor = '#a9905b',
  frameInnerColor = '#d8c999',
  style,
}: FancyBorderPixelButtonProps) {
  const cssVars = {
    '--btn-fill': fillColor,
    '--btn-text': textColor,
    '--btn-frame-outer': frameOuterColor,
    '--btn-frame-inner': frameInnerColor,
    ...style,
  } as CSSProperties & Record<string, string | number>;

  const content = children ?? label;

  return (
    <button
      onClick={onClick}
      className={[
        'pixel-bevel-button pixel-rounded',
        // default sizing similar to AA style; tweak in callers as needed
        'px-3 py-1 text-[10px] leading-none uppercase',
        className ?? '',
      ].join(' ')}
      style={cssVars}
    >
      {content}
    </button>
  );
}
