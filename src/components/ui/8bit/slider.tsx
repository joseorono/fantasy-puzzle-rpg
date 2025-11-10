'use client';

import * as React from 'react';

import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '~/lib/utils';

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <div className={cn('relative w-full', className)}>
    <SliderPrimitive.Root
      ref={ref}
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-secondary relative h-2 w-full grow overflow-hidden">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="border-foreground dark:border-ring bg-foreground dark:bg-ring ring-offset-background block size-5 border-2 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>

    <div
      className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -my-1 border-y-4"
      aria-hidden="true"
    />

    <div
      className="border-foreground dark:border-ring pointer-events-none absolute inset-0 -mx-1 border-x-4"
      aria-hidden="true"
    />
  </div>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
