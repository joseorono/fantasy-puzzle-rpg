'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface FranukaSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant?: 'default' | 'compact';
}

const FranukaSlider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  FranukaSliderProps
>(({ className, variant = 'default', ...props }, ref) => (
  <div className={`franuka-slider-wrapper ${variant}`}>
    <SliderPrimitive.Root
      ref={ref}
      className="franuka-slider"
      {...props}
    >
      <SliderPrimitive.Track className="franuka-slider-track">
        <SliderPrimitive.Range className="franuka-slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="franuka-slider-thumb" />
    </SliderPrimitive.Root>
  </div>
));

FranukaSlider.displayName = 'FranukaSlider';

export { FranukaSlider };
