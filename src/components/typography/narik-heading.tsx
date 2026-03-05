import { NarikWoodBitFont } from '~/components/bitmap-fonts/narik-wood';

const DEFAULT_HEADING_SIZES: Record<HeadingTag, number> = {
  h1: 1.4,
  h2: 1.2,
  h3: 1,
  h4: 0.9,
};

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4';

interface NarikHeadingProps {
  as: HeadingTag;
  text: string;
  className?: string;
  size?: number;
}

export function NarikHeading({ as, text, className, size }: NarikHeadingProps) {
  const HeadingTag = as;
  const resolvedSize = size ?? DEFAULT_HEADING_SIZES[as];

  return (
    <HeadingTag className={className}>
      <NarikWoodBitFont text={text} size={resolvedSize} />
    </HeadingTag>
  );
}
