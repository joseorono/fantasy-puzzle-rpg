'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface FranukaSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: 'default' | 'compact';
  frameVariant?: 'wood' | 'gold' | 'ornate' | 'bookstyle';
  fillInVariant?: 'blue' | 'red' | 'green' | 'parchment' | 'golden';
  markerVariant?: 'block' | 'round' | 'slim' | 'ridged';
}

const FranukaSlider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  FranukaSliderProps
>(({ className, variant = 'default', frameVariant = 'wood', fillInVariant = 'blue', markerVariant = 'block', ...props }, ref) => (
  <div className={`franuka-slider-wrapper ${variant} frame-${frameVariant} marker-${markerVariant}`}>
    <SliderPrimitive.Root
      ref={ref}
      className="franuka-slider"
      {...props}
    >
      <SliderPrimitive.Track className="franuka-slider-track">
        <SliderPrimitive.Range className={`franuka-slider-range fill-${fillInVariant}`} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="franuka-slider-thumb" />
    </SliderPrimitive.Root>
  </div>
));

FranukaSlider.displayName = 'FranukaSlider';

export { FranukaSlider };
