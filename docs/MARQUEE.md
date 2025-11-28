# Marquee System

The project uses **react-fast-marquee** plus a thin wrapper component `MarqueeText` for scrolling helper text.

Path:
- Component: `src/components/marquee/marquee-text.tsx`
- Styles: `src/styles/marquee.css`
- Text constants: `src/constants/dialogue/marquee-text.ts`

## Component API

```tsx
import { MarqueeText } from '~/components/marquee/marquee-text';

<MarqueeText
  type="level-up"          // key from MARQUEE_HELP_TEXT
  variant="marquee--gray"  // visual style
  speed={40}                // optional, defaults to 50
  pauseOnHover              // optional, defaults to true
/>
```

### Props

- `type: MarqueeTextTypes`
  - Union of logical text groups defined in `MARQUEE_HELP_TEXT`.
  - Example values: `'blacksmith' | 'inn' | 'item-shop' | 'level-up' | 'world-map' | 'general'`.

- `variant?: MarqueeStyle`
  - Controls the visual style of the marquee container.
  - Implemented as a CSS class on `.marquee-container`.
  - Current values:
    - `'marquee--gray'` (default) – gradient background, borders, gold text with shadow.
    - `'marquee--clear'` – transparent background, no borders, plain text.

- `speed?: number`
  - Passed directly to `react-fast-marquee`.
  - Higher is faster. Default: `50`.

- `pauseOnHover?: boolean`
  - Whether the marquee pauses when the mouse is over it.
  - Default: `true`.

- `className?: string`
  - Extra classes merged with the container via `cn()` from `~/lib/utils`.

## How text is resolved

`MarqueeText` reads from `MARQUEE_HELP_TEXT[type]`, which is a readonly record of string arrays. The array is joined with `" • "` and rendered as a single scrolling line.

Text source: `src/constants/dialogue/marquee-text.ts`.

## CSS structure

There's the base styles (shared by all variants):
Variant styles live on `.marquee-container.<variant>`.

Current variants: .marquee--gray, .marquee--clear

## How to add a new variant

1. **Extend the TypeScript union** in `marquee-text.tsx`:

```ts
export type MarqueeStyle = 'marquee--gray' | 'marquee--clear' | 'marquee--warning';
```

2. **Add CSS rules** in `src/styles/marquee.css`:

```css
.marquee-container.marquee--warning {
  background: linear-gradient(135deg, #3b0b0b 0%, #650000 100%);
  border-top: 2px solid #ff6b6b;
  border-bottom: 2px solid #ff6b6b;
  padding: 0.5rem 0;
}

.marquee-container.marquee--warning .marquee-text {
  color: #ffe3e3;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.9);
}
```

3. **Use the new variant** wherever needed:

```tsx
<MarqueeText type="general" variant="marquee--warning" />
```

That is all that is required; no changes to the component implementation are needed beyond updating the `MarqueeStyle` union.
