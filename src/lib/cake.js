// Torta ASCII con una candelina per ogni anno.

import { C } from './palette.js';
import { hash, hash2 } from './math.js';

export const CAKE_COLS = 60;
export const CAKE_ROWS = 15;

const FLAME_TIP_Y = 3;
const FLAME_Y = 4;
const STICK_Y = 5;
const TOP_Y = 7;
const LEFT = 2;
const RIGHT = CAKE_COLS - 3;
const CANDLE_COLORS = [C.candle1, C.candle2, C.candle3, C.candle4];
const SPRINKLE_COLORS = [C.candle1, C.candle2, C.candle3, C.candle4, C.white];

/** Quante candeline ci stanno sulla torta (una ogni due colonne). */
export const MAX_CANDLES = Math.floor((RIGHT - LEFT - 3) / 2) + 1;

const spaced = (s) => s.toUpperCase().split('').join(' ');

/** Istante (secondi dopo il soffio) in cui si spegne la candelina `i`. */
const outDelay = (i) => 0.035 * i + hash(i + 500) * 0.15;
const SMOKE_LIFE = 1.8;

/** Durata totale dell'animazione di spegnimento, fumo compreso. */
export const blowDuration = (count) => outDelay(count - 1) + 0.15 + 0.35 + SMOKE_LIFE;

function centered(g, y, text, color) {
  const inner = RIGHT - LEFT - 1;
  g.text(LEFT + 1 + Math.floor((inner - text.length) / 2), y, text, color);
}

/**
 * @param {number} t     secondi dall'apparizione della torta
 * @param {object} opts  { name, candles, blownAt (secondi, o null) }
 */
export function drawCake(g, t, { name, candles = 26, blownAt = null, still = false }) {
  const n = Math.min(candles, MAX_CANDLES);
  const gap = Math.max(2, Math.floor((RIGHT - LEFT - 3) / n));
  const firstX = Math.round((CAKE_COLS - (n - 1) * gap) / 2);
  const flick = Math.floor(t * 9);

  for (let i = 0; i < n; i++) {
    const x = firstX + i * gap;
    const color = CANDLE_COLORS[i % CANDLE_COLORS.length];
    g.set(x, STICK_Y, '|', color);
    g.set(x, STICK_Y + 1, '|', color);

    const since = blownAt == null ? -1 : t - blownAt - outDelay(i);
    if (since < 0) {
      // fiammella accesa
      const r = still ? 0.3 : hash2(i, flick);
      const r2 = still ? 0.1 : hash2(i + 50, flick);
      g.set(x, FLAME_Y, r < 0.45 ? '(' : r < 0.9 ? ')' : '^', C.flame);
      g.set(x, FLAME_TIP_Y, r2 < 0.55 ? "'" : r2 < 0.85 ? '.' : ' ', C.flameTip);
      continue;
    }
    g.set(x, FLAME_Y, '.', C.smoke); // stoppino spento
    for (let k = 0; k < 2; k++) {
      const a = since - k * 0.35;
      if (a < 0 || a > SMOKE_LIFE) continue;
      const y = FLAME_TIP_Y - a * 2.2;
      const sx = x + Math.sin(a * 5 + i) * 0.8 + a * 0.6;
      const f = a / SMOKE_LIFE;
      g.set(sx, y, f < 0.3 ? '(' : f < 0.55 ? ')' : f < 0.8 ? '~' : '.', f < 0.6 ? C.smoke : C.dim);
    }
  }

  // Corpo della torta
  g.set(LEFT, TOP_Y, '.', C.frosting);
  g.set(RIGHT, TOP_Y, '.', C.frosting);
  for (let x = LEFT + 1; x < RIGHT; x++) g.set(x, TOP_Y, '~', C.frosting);
  for (let y = TOP_Y + 1; y <= TOP_Y + 5; y++) {
    g.set(LEFT, y, '|', C.cream);
    g.set(RIGHT, y, '|', C.cream);
  }
  for (let x = LEFT + 1; x < RIGHT; x++) {
    const k = (x - LEFT - 1) % 4;
    g.set(x, TOP_Y + 1, k === 0 ? '\\' : k === 1 ? '_' : k === 2 ? '/' : ' ', C.frosting);
    for (const y of [TOP_Y + 2, TOP_Y + 5]) {
      const h = hash2(x, y);
      if (h < 0.22) g.set(x, y, ",.'`"[Math.floor(h * 18) % 4], SPRINKLE_COLORS[Math.floor(hash2(y, x) * 5)]);
    }
    g.set(x, TOP_Y + 6, '_', C.cream);
  }
  g.set(LEFT, TOP_Y + 6, '|', C.cream);
  g.set(RIGHT, TOP_Y + 6, '|', C.cream);
  centered(g, TOP_Y + 3, spaced('Buon') + '   ' + spaced('compleanno'), C.text);
  centered(g, TOP_Y + 4, `* ${spaced(name)} *`, C.pink);

  // Piatto
  g.set(0, TOP_Y + 7, '(', C.dim);
  g.set(CAKE_COLS - 1, TOP_Y + 7, ')', C.dim);
  for (let x = 1; x < CAKE_COLS - 1; x++) g.set(x, TOP_Y + 7, '_', C.dim);
}
