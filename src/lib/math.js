export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

/** Pseudo-casuale deterministico in [0, 1). */
export function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export const hash2 = (a, b) => hash(a * 57.31 + b * 113.97);

/** Value noise 2D liscio in [0, 1). */
export function valueNoise(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const s = (t) => t * t * (3 - 2 * t);
  const h = (a, b) => hash2(a + seed * 31.7, b - seed * 17.3);
  const top = lerp(h(xi, yi), h(xi + 1, yi), s(xf));
  const bottom = lerp(h(xi, yi + 1), h(xi + 1, yi + 1), s(xf));
  return lerp(top, bottom, s(yf));
}

/** Carattere ASCII che meglio rappresenta un tratto con angolo `th` (y verso il basso). */
export function strokeChar(th) {
  let a = th % Math.PI;
  if (a < 0) a += Math.PI;
  if (a < Math.PI / 8 || a >= (7 * Math.PI) / 8) return '-';
  if (a < (3 * Math.PI) / 8) return '\\';
  if (a < (5 * Math.PI) / 8) return '|';
  return '/';
}
