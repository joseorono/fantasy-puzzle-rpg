import {
  BitmapText,
  buildCharMap,
  type BitmapFontConfig,
  type BitmapTextProps,
} from './bitmap-text';
import {
  NARIK_DEFAULT_METRIC,
  NARIK_GLYPH_METRICS,
  NARIK_SPACE_WIDTH,
  NARIK_TRACKING,
} from './narik-metrics';

const CONFIG: BitmapFontConfig = {
  charset:
    'ABCDEFGHIJKL' +
    'MNOPQRSTUVWX' +
    'YZ1234567890' +
    'abcdefghijkl' +
    'mnopqrstuvwx' +
    'yz:',
  cols: 12,
  charW: 15,
  charH: 25,
  image1x: '/assets/fonts/Wood-narik.png',
  image5x: '/assets/fonts/Wood-5x-narik.png',
  defaultMetric: NARIK_DEFAULT_METRIC,
  metrics: NARIK_GLYPH_METRICS,
  tracking: NARIK_TRACKING,
  spaceWidth: NARIK_SPACE_WIDTH,
};

const CHAR_MAP = buildCharMap(CONFIG.charset, CONFIG.cols);
const SHEET_ROWS = Math.ceil(CONFIG.charset.length / CONFIG.cols);

export function NarikWoodBitFont({ text, size }: BitmapTextProps) {
  return <BitmapText text={text} size={size} config={CONFIG} charMap={CHAR_MAP} sheetRows={SHEET_ROWS} />;
}
