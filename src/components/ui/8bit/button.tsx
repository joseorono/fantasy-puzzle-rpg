import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '~/lib/utils';

import { Button as ShadcnButton } from '~/components/ui/button';

import './styles/retro.css';

export const buttonVariants = cva('', {
  variants: {
    font: {
      normal: '',
      retro: 'retro',
    },
    variant: {
      default: 'bg-foreground',
      destructive: 'bg-foreground',
      outline: 'bg-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      default: 'h-9 px-4 py-2 has-[>svg]:px-3',
      sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
      lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
      icon: 'size-9',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface BitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

function Button({ children, asChild, ...props }: BitButtonProps) {
  const { variant, size, className, font } = props;

  return (
    <ShadcnButton
      {...props}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 rounded-none border-none transition-transform active:translate-y-1',
        font !== 'normal' && 'retro',
        className,
      )}
      size={size}
      variant={variant}
      asChild={asChild}
    >
      {asChild ? (
        <span className="relative inline-flex items-center justify-center gap-1.5">
          {children}

          {variant !== 'ghost' && variant !== 'link' && size !== 'icon' && (
            <>
              {/* Pixelated border */}
              <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute top-1.5 -left-1.5 h-[calc(100%-12px)] w-1.5" />
              <div className="bg-foreground dark:bg-ring absolute top-1.5 -right-1.5 h-[calc(100%-12px)] w-1.5" />
              {variant !== 'outline' && (
                <>
                  {/* Top shadow */}
                  <div className="bg-foreground/20 absolute top-0 left-0 h-1.5 w-full" />
                  <div className="bg-foreground/20 absolute top-1.5 left-0 h-1.5 w-3" />

                  {/* Bottom shadow */}
                  <div className="bg-foreground/20 absolute bottom-0 left-0 h-1.5 w-full" />
                  <div className="bg-foreground/20 absolute right-0 bottom-1.5 h-1.5 w-3" />
                </>
              )}
            </>
          )}

          {size === 'icon' && (
            <>
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-0 left-0 h-[5px] w-full md:h-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-0 h-[5px] w-full md:h-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-1 -left-1 h-1/2 w-[5px] md:w-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-1 -left-1 h-1/2 w-[5px] md:w-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-1 -right-1 h-1/2 w-[5px] md:w-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute -right-1 bottom-1 h-1/2 w-[5px] md:w-1.5" />
            </>
          )}
        </span>
      ) : (
        <>
          {children}

          {variant !== 'ghost' && variant !== 'link' && size !== 'icon' && (
            <>
              {/* Pixelated border */}
              <div className="bg-foreground dark:bg-ring absolute -top-1.5 left-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute -top-1.5 right-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute -bottom-1.5 left-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute right-1.5 -bottom-1.5 h-1.5 w-1/2" />
              <div className="bg-foreground dark:bg-ring absolute top-0 left-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute top-0 right-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute bottom-0 left-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute right-0 bottom-0 size-1.5" />
              <div className="bg-foreground dark:bg-ring absolute top-1.5 -left-1.5 h-[calc(100%-12px)] w-1.5" />
              <div className="bg-foreground dark:bg-ring absolute top-1.5 -right-1.5 h-[calc(100%-12px)] w-1.5" />
              {variant !== 'outline' && (
                <>
                  {/* Top shadow */}
                  <div className="bg-foreground/20 absolute top-0 left-0 h-1.5 w-full" />
                  <div className="bg-foreground/20 absolute top-1.5 left-0 h-1.5 w-3" />

                  {/* Bottom shadow */}
                  <div className="bg-foreground/20 absolute bottom-0 left-0 h-1.5 w-full" />
                  <div className="bg-foreground/20 absolute right-0 bottom-1.5 h-1.5 w-3" />
                </>
              )}
            </>
          )}

          {size === 'icon' && (
            <>
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-0 left-0 h-[5px] w-full md:h-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-0 h-[5px] w-full md:h-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-1 -left-1 h-1/2 w-[5px] md:w-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute bottom-1 -left-1 h-1/2 w-[5px] md:w-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute top-1 -right-1 h-1/2 w-[5px] md:w-1.5" />
              <div className="bg-foreground dark:bg-ring pointer-events-none absolute -right-1 bottom-1 h-1/2 w-[5px] md:w-1.5" />
            </>
          )}
        </>
      )}
    </ShadcnButton>
  );
}

export { Button };
