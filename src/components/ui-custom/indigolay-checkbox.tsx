import type { InputHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const indigolayCheckboxVariants = cva(
  'indigolay-checkbox inline-flex items-center select-none',
  {
    variants: {
      size: {
        sm: 'indigolay-checkbox--sm',
        md: 'indigolay-checkbox--md',
        lg: 'indigolay-checkbox--lg',
        xl: 'indigolay-checkbox--xl',
        '2xl': 'indigolay-checkbox--2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

interface IndigolayCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, VariantProps<typeof indigolayCheckboxVariants> {
  label?: ReactNode;
}

export function IndigolayCheckbox({ checked, className, disabled, label, onChange, size, ...props }: IndigolayCheckboxProps) {
  return (
    <label className={cn(indigolayCheckboxVariants({ size, className }))}>
      <input type="checkbox" className="indigolay-checkbox__input" checked={checked} disabled={disabled} onChange={onChange} {...props} />
      <span className="indigolay-checkbox__box">
        <span className="indigolay-checkbox__mark" />
      </span>
      {label ? <span className="indigolay-checkbox__text">{label}</span> : null}
    </label>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { indigolayCheckboxVariants };
