import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '~/components/ui-custom/tooltip';

const indigolayTabVariants = cva(
  'indigolay-tab inline-flex items-center justify-center border-none bg-transparent font-bold uppercase tracking-wide select-none outline-none transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  {
    variants: {
      size: {
        sm: 'indigolay-tab--sm',
        default: 'indigolay-tab--default',
        lg: 'indigolay-tab--lg',
      },
      state: {
        inactive: 'indigolay-tab--inactive',
        active: 'indigolay-tab--active',
      },
      glow: {
        true: 'indigolay-tab--glow',
        false: 'indigolay-tab--no-glow',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'inactive',
      glow: true,
    },
  },
);

interface IndigolayTabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof indigolayTabVariants> {
  isActive?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
  /** One line on what the tab is for, shown on hover. Omit for a label that needs no explaining. */
  tooltip?: React.ReactNode;
}

export function IndigolayTab({
  className,
  glow,
  isActive,
  ref,
  size,
  state,
  tooltip,
  type = 'button',
  ...props
}: IndigolayTabProps) {
  const resolvedState = isActive === true ? 'active' : isActive === false ? 'inactive' : state;

  const tab = (
    <button
      ref={ref}
      type={type}
      className={cn(indigolayTabVariants({ glow, size, state: resolvedState, className }))}
      {...props}
    />
  );

  if (!tooltip) return tab;

  // `asChild` so the trigger is the button itself: no extra element to disturb the tab row,
  // and any ref the caller passed still reaches it.
  return (
    <Tooltip>
      <TooltipTrigger asChild>{tab}</TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

const indigolayTabsVariants = cva('indigolay-tabs', {
  variants: {
    /** Underline the row to part it from the pane below. Primary rows yes, filter rows no. */
    rule: {
      true: 'indigolay-tabs--rule',
      false: '',
    },
  },
  defaultVariants: {
    rule: false,
  },
});

interface IndigolayTabsProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof indigolayTabsVariants> {}

/**
 * A row of {@link IndigolayTab}s, optionally trailed by a `KeyHintPill`. Wraps, so a long
 * hint drops to its own line instead of pushing the panel sideways. Spacing around the row
 * belongs to the host: pass a `className` for margins, or set `--indigolay-tabs-gap`.
 */
export function IndigolayTabs({ className, rule, ...props }: IndigolayTabsProps) {
  return <div className={cn(indigolayTabsVariants({ rule, className }))} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { indigolayTabVariants, indigolayTabsVariants };
