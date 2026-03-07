# StyledButton Component Guide

## Overview
`StyledButton` is a reusable React component that renders pixel-art pill-shaped buttons with customizable colors, inspired by retro game UI design.

## Location
- Component: `src/components/ui/styled-button.tsx`
- Styles: `src/styles/styled-button.css`
- Demo: `src/views/styled-button-demo.tsx`

## Features
- **Pill-shaped design** with rounded borders (border-radius: 9999px)
- **Retro depth effect** using box-shadow (bottom border effect)
- **Color customization** via hex color codes
- **Automatic color darkening** for the border shadow
- **Circle variant** for icon buttons
- **Smooth interactions** with hover and active states
- **Disabled state** support

## Props

```typescript
interface StyledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;           // Button text or icon
  hexColor: string;              // Hex color code (e.g., "#A07151")
  textColor?: string;            // Text color (default: "rgb(145, 92, 54)")
  isCircle?: boolean;            // Circle variant (default: false)
  // All standard HTML button props are supported
}
```

## Usage Examples

### Basic Pill Button
```tsx
import { StyledButton } from '~/components/ui/styled-button';

<StyledButton hexColor="#A07151" onClick={handleNext}>
  Next
</StyledButton>
```

### Cream/Beige Button
```tsx
<StyledButton hexColor="#D9C7AC" onClick={handleFinish}>
  Finish
</StyledButton>
```

### Orange Button
```tsx
<StyledButton hexColor="#C06F21" onClick={handleConfirm}>
  Confirm
</StyledButton>
```

### Circle Button (Icon)
```tsx
<StyledButton hexColor="#A07151" isCircle={true} onClick={handleNext}>
  →
</StyledButton>
```

### With Disabled State
```tsx
<StyledButton 
  hexColor="#A07151" 
  onClick={handleNext}
  disabled={!isReady}
>
  Next
</StyledButton>
```

## Color Palette

### Browns & Tans
- `#A07151` - Medium brown
- `#8B6F47` - Dark tan
- `#6B5344` - Deep brown

### Creams & Beiges
- `#D9C7AC` - Light cream
- `#E8DCC8` - Pale cream
- `#C9B89A` - Warm beige

### Oranges
- `#C06F21` - Burnt orange
- `#D9841F` - Bright orange
- `#B8621A` - Dark orange

### Grays
- `#8B8680` - Medium gray
- `#9D9691` - Light gray
- `#7A7570` - Dark gray

## How Color Darkening Works

The component automatically calculates a darker shade for the bottom border/shadow effect:

```typescript
function darkenColor(hex: string, factor: number = 0.4): string {
  // Converts hex to RGB, reduces each channel by 40%, converts back to hex
}
```

This creates visual depth without requiring manual color specification.

## Replacing Existing Buttons

### Before (Standard Button)
```tsx
<button onClick={handleContinue} className="continue-button">
  Continue
  <span className="arrow-icon">→</span>
</button>
```

### After (StyledButton)
```tsx
<StyledButton hexColor="#D9C7AC" onClick={handleContinue}>
  Continue →
</StyledButton>
```

## Interaction States

- **Default**: Full shadow (4px offset)
- **Hover**: Reduced shadow (2px offset), slight press effect
- **Active**: Minimal shadow (0px offset), fully pressed
- **Disabled**: Reduced opacity (60%), no interaction

## Integration Checklist

- [ ] Import `StyledButton` in target component
- [ ] Replace standard button elements
- [ ] Choose appropriate hex color from palette
- [ ] Test hover and click interactions
- [ ] Verify disabled states if applicable
- [ ] Test on different screen sizes

## Demo View

Visit `src/views/styled-button-demo.tsx` to see all color variants and sizes in action.
