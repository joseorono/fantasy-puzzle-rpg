import {
  BitmapText,
  buildCharMap,
  type BitmapFontConfig,
  type BitmapTextProps,
} from './bitmap-text';

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
  image1x: '/assets/fonts/RedWood-narik.png',
  image5x: '/assets/fonts/RedWood-5x-narik.png',
};

const CHAR_MAP = buildCharMap(CONFIG.charset, CONFIG.cols);
const SHEET_ROWS = Math.ceil(CONFIG.charset.length / CONFIG.cols);

export function NarikRedwoodBitFont({ text, size }: BitmapTextProps) {
  return <BitmapText text={text} size={size} config={CONFIG} charMap={CHAR_MAP} sheetRows={SHEET_ROWS} />;
}


