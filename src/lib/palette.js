// Indici colore usati dalle griglie ASCII. Ogni nome diventa una classe CSS `k-<nome>`
// (vedi src/styles.css), così i colori si cambiano da un unico punto.
const NAMES = [
  'none', 'stem', 'leaf', 'leafLight', 'paper', 'paperDim', 'ribbon',
  'rose', 'roseDark', 'white', 'yellow', 'pink', 'pinkDark', 'lilac', 'lilacDark',
  'spark', 'heart', 'dim', 'flame', 'flameTip', 'smoke', 'frosting', 'text',
  'candle1', 'candle2', 'candle3', 'candle4', 'body', 'lens', 'lensCore', 'red',
  'noise', 'noise2', 'lcd', 'green', 'sky', 'cream',
];

export const C = Object.fromEntries(NAMES.map((n, i) => [n, i]));
export const CLASS_NAMES = NAMES.map((n, i) => (i === 0 ? '' : `k-${n}`));
