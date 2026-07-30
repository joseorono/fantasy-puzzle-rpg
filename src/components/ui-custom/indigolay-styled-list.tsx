import { createContext, useContext, type ReactNode, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

export type IndigoLayListVariant = 'indigolay' | 'gilded' | 'regal' | 'shading' | 'chevron' | 'send';

const indigolayStyledListVariants = cva(
  'indigolay-list IndigoLayStyledLists indigolay-styled-list',
  {
    variants: {
      variant: {
        indigolay: 'indigolay-list--indigolay IndigoLayStyledLists--indigolay',
        gilded: 'indigolay-list--gilded IndigoLayStyledLists--gilded',
        regal: 'indigolay-list--regal IndigoLayStyledLists--regal',
        shading: 'indigolay-list--shading IndigoLayStyledLists--shading',
        chevron: 'indigolay-list--chevron IndigoLayStyledLists--chevron',
        send: 'indigolay-list--send IndigoLayStyledLists--send',
      },
      size: {
        sm: 'indigolay-list--sm IndigoLayStyledLists--sm',
        default: 'indigolay-list--default IndigoLayStyledLists--default',
        lg: 'indigolay-list--lg IndigoLayStyledLists--lg',
      },
      compact: {
        true: 'indigolay-list--compact IndigoLayStyledLists--compact',
      },
      bordered: {
        true: 'indigolay-list--bordered IndigoLayStyledLists--bordered',
      },
    },
    defaultVariants: {
      variant: 'indigolay',
      size: 'default',
      compact: false,
      bordered: false,
    },
  }
);

const DEFAULT_BULLET_ICONS: Record<IndigoLayListVariant, ReactNode> = {
  indigolay: '◆',
  gilded: '✦',
  regal: '❖',
  shading: '◈',
  chevron: (
    <img
      src="/assets/icons/indigolay/Icon_chevron-right.png"
      alt=""
      className="indigolay-list__bullet-img IndigoLayStyledLists__bullet-img"
      draggable={false}
    />
  ),
  send: (
    <img
      src="/assets/icons/indigolay/Icon_send.png"
      alt=""
      className="indigolay-list__bullet-img IndigoLayStyledLists__bullet-img"
      draggable={false}
    />
  ),
};

interface IndigoLayListContextValue {
  bulletSymbol?: ReactNode;
  variant?: IndigoLayListVariant;
}

const IndigoLayListContext = createContext<IndigoLayListContextValue>({});

export interface IndigolayStyledListItemProps {
  children: ReactNode;
  bullet?: ReactNode;
  className?: string;
  bulletClassName?: string;
}

export function IndigolayStyledListItem({
  children,
  bullet,
  className,
  bulletClassName,
}: IndigolayStyledListItemProps) {
  const context = useContext(IndigoLayListContext);
  const effectiveBullet = bullet ?? context.bulletSymbol ?? '◆';

  return (
    <li className={cn('indigolay-list__item IndigoLayStyledLists__item', className)}>
      {effectiveBullet !== null && effectiveBullet !== false && (
        <span className={cn('indigolay-list__bullet IndigoLayStyledLists__bullet', bulletClassName)}>
          {effectiveBullet}
        </span>
      )}
      <span className="indigolay-list__text IndigoLayStyledLists__text">{children}</span>
    </li>
  );
}

export interface IndigoLayStyledListsProps
  extends Omit<HTMLAttributes<HTMLUListElement>, 'size'>,
    VariantProps<typeof indigolayStyledListVariants> {
  items?: ReactNode[];
  bulletSymbol?: ReactNode;
  children?: ReactNode;
}

/**
 * Reusable modal list component built on the Indigolay design system.
 * Supports variants: 'indigolay', 'gilded', 'regal', 'shading', 'chevron', 'send'.
 * Items have transparent backgrounds matching game tooltips & modal popups by default.
 */
export function IndigoLayStyledLists({
  className,
  variant = 'indigolay',
  size,
  compact,
  bordered = false,
  items,
  bulletSymbol,
  children,
  ...props
}: IndigoLayStyledListsProps) {
  const activeVariant: IndigoLayListVariant = variant ?? 'indigolay';
  const defaultBullet = bulletSymbol ?? DEFAULT_BULLET_ICONS[activeVariant];

  return (
    <IndigoLayListContext.Provider value={{ bulletSymbol: defaultBullet, variant: activeVariant }}>
      <ul
        className={cn(indigolayStyledListVariants({ variant: activeVariant, size, compact, bordered, className }))}
        {...props}
      >
        {items
          ? items.map((item, idx) => (
              <IndigolayStyledListItem key={idx}>
                {item}
              </IndigolayStyledListItem>
            ))
          : children}
      </ul>
    </IndigoLayListContext.Provider>
  );
}

// Aliases for component import convenience
export { IndigoLayStyledLists as IndigolayStyledList, IndigoLayStyledLists as IndigolayList, indigolayStyledListVariants };
