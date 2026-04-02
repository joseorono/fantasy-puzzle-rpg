'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface FranukaSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: 'default' | 'compact';
  frameVariant?: 'wood' | 'gold' | 'ornate';
  fillInVariant?: 'blue' | 'red' | 'green';
}

const FranukaSlider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  FranukaSliderProps
>(({ className, variant = 'default', frameVariant = 'wood', fillInVariant = 'blue', ...props }, ref) => (
  <div className={`franuka-slider-wrapper ${variant} frame-${frameVariant}`}>
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
