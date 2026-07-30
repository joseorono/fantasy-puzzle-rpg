import { createContext, useContext, type ReactNode, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

export type IndigoLayListVariant = 'indigolay' | 'gilded' | 'regal' | 'shading' | 'chevron' | 'send' | 'sovereign' | 'sovereign-shading';

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
        sovereign: 'indigolay-list--sovereign IndigoLayStyledLists--sovereign',
        'sovereign-shading': 'indigolay-list--sovereign-shading IndigoLayStyledLists--sovereign-shading',
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
      variant: 'chevron',
      size: 'default',
      compact: false,
      bordered: false,
    },
  }
);

/** Metallic gold diamond with specular sheen for the Sovereign variant */
const SovereignGoldDiamond = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    className="indigolay-list__bullet-img IndigoLayStyledLists__bullet-img inline-block select-none"
    style={{ filter: 'drop-shadow(1px 1px 0px rgba(0,0,0,0.9))' }}
  >
    <defs>
      <linearGradient id="sovereignGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff8cf" />
        <stop offset="25%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#996515" />
        <stop offset="75%" stopColor="#ffeea1" />
        <stop offset="100%" stopColor="#d4af37" />
      </linearGradient>
    </defs>
    {/* Base metallic gold diamond */}
    <polygon points="8,1 15,8 8,15 1,8" fill="url(#sovereignGoldGrad)" stroke="#573802" strokeWidth="0.8" />
    <polygon points="8,3 13,8 8,13 3,8" fill="url(#sovereignGoldGrad)" opacity="0.95" />
    {/* Specular sheen reflection highlight */}
    <polygon points="8,2 12,6 7,7" fill="#ffffff" opacity="0.65" />
  </svg>
);

const DEFAULT_BULLET_ICONS: Record<IndigoLayListVariant, ReactNode> = {
  indigolay: '◆',
  gilded: '✦',
  regal: '❖',
  shading: '◈',
  sovereign: SovereignGoldDiamond,
  'sovereign-shading': SovereignGoldDiamond,
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
  const effectiveBullet = bullet ?? context.bulletSymbol ?? DEFAULT_BULLET_ICONS.chevron;

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
 * Reusable modal/tooltip list component built on the Indigolay design system.
 * Defaults to 'chevron' variant for standard tooltips and popups.
 * Supports variants: 'chevron' (default), 'send', 'indigolay', 'gilded', 'regal', 'shading', 'sovereign', 'sovereign-shading'.
 */
export function IndigoLayStyledLists({
  className,
  variant = 'chevron',
  size,
  compact,
  bordered = false,
  items,
  bulletSymbol,
  children,
  ...props
}: IndigoLayStyledListsProps) {
  const activeVariant: IndigoLayListVariant = variant ?? 'chevron';
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
