// Mazzo di fiori in ASCII art, animato.
// Ogni fotogramma viene ridisegnato da zero a partire dal tempo `t` (secondi):
// la carta si avvolge, gli steli crescono, i fiori sbocciano in tre stadi,
// poi il mazzo ondeggia mentre cadono petali, brillano scintille e salgono cuoricini.

import { C } from './palette.js';
import { clamp01, easeInOutCubic, easeOutCubic, hash, hash2, strokeChar } from './math.js';

export const BOUQUET_COLS = 64;
export const BOUQUET_ROWS = 37;

/** Secondi dopo i quali il mazzo è completamente sbocciato. */
export const BOUQUET_BLOOM_TIME = 5;

const TOP = 3; // spazio libero in alto per i cuoricini
const CX = 32; // asse centrale
const GY = 29 + TOP; // punto in cui si raccolgono gli steli (fiocco)
const PT = 17 + TOP; // bordo superiore della carta
const HW_TOP = 15.5; // mezza larghezza della carta in alto
const ASPECT = 2; // un carattere è alto circa il doppio di quanto è largo

// ---------------------------------------------------------------------------
// Sprite dei fiori. `map` assegna a ogni carattere un ruolo colore:
// o = petalo, i = petalo interno, c = cuore del fiore.

const SPRITES = {
  rose: {
    stages: [['o'], [' .-. ', '( @ )', " '-' "]],
    lines: ['  .---.  ', ' / .-. \\ ', '( ( @ ) )', " \\ '-' / ", "  '---'  "],
    map: ['  ooooo  ', ' o iii o ', 'o i c i o', ' o iii o ', '  ooooo  '],
  },
  rosebud: {
    stages: [['o'], ['(@)']],
    lines: [' .-~-. ', '( (@) )', " '-.-' "],
    map: [' ooooo ', 'o ici o', ' ooooo '],
  },
  flower: {
    stages: [['o'], ['(@)']],
    lines: ['   _   ', ' _(_)_ ', '(_)@(_)', '  (_)  '],
    map: ['   o   ', ' ooooo ', 'ooocooo', '  ooo  '],
  },
  daisy: {
    stages: [['o'], ['-@-']],
    lines: [' \\ | / ', '-- @ --', ' / | \\ '],
    map: [' o o o ', 'oo c oo', ' o o o '],
  },
  tulip: {
    stages: [['o'], [' ^ ', '(_)']],
    lines: [',^,^,', '(   )', ' \\_/ '],
    map: ['ooooo', 'o   o', ' iii '],
  },
};

const PAL = {
  red: { o: C.rose, i: C.roseDark, c: C.roseDark },
  pink: { o: C.pink, i: C.pinkDark, c: C.yellow },
  lilac: { o: C.lilac, i: C.lilacDark, c: C.yellow },
  sky: { o: C.sky, i: C.sky, c: C.yellow },
  white: { o: C.white, i: C.white, c: C.yellow },
  coral: { o: C.ribbon, i: C.roseDark, c: C.yellow },
  gold: { o: C.yellow, i: C.flame, c: C.flame },
};

const HEADS = [
  { sprite: 'rose', pal: 'red', x: 32, y: 6 },
  { sprite: 'tulip', pal: 'coral', x: 20, y: 6 },
  { sprite: 'tulip', pal: 'coral', x: 44, y: 6 },
  { sprite: 'flower', pal: 'lilac', x: 23, y: 10 },
  { sprite: 'flower', pal: 'sky', x: 41, y: 10 },
  { sprite: 'daisy', pal: 'white', x: 15, y: 12 },
  { sprite: 'daisy', pal: 'white', x: 49, y: 12 },
  { sprite: 'rosebud', pal: 'pink', x: 32, y: 12 },
  { sprite: 'tulip', pal: 'gold', x: 18, y: 15 },
  { sprite: 'tulip', pal: 'gold', x: 46, y: 15 },
  { sprite: 'rosebud', pal: 'red', x: 25, y: 16 },
  { sprite: 'rosebud', pal: 'red', x: 39, y: 16 },
  { sprite: 'daisy', pal: 'white', x: 32, y: 17 },
].map((h, i) => {
  const stemStart = 0.9 + i * 0.13;
  const stemDur = 1.1;
  const def = SPRITES[h.sprite];
  return {
    ...h,
    y: h.y + TOP,
    def,
    pal: PAL[h.pal],
    phase: hash(i + 1) * Math.PI * 2,
    stemStart,
    stemDur,
    bloomStart: stemStart + stemDur * 0.95,
    bloomDur: 0.9,
    halfH: (def.lines.length - 1) / 2,
  };
});

const LAVENDER = [
  { x: 13, y: 4, len: 7 },
  { x: 51, y: 4, len: 7 },
  { x: 26, y: 0, len: 6 },
  { x: 38, y: 0, len: 6 },
].map((l, i) => ({
  ...l,
  y: l.y + TOP,
  phase: hash(i + 40) * Math.PI * 2,
  stemStart: 0.6 + i * 0.15,
  stemDur: 1.4,
}));

// Foglie a tratteggio: punto di attacco, direzione in gradi (y verso il basso), lunghezza.
const LEAVES = [
  { x: 15, y: 18.5, deg: -148, len: 3.2 },
  { x: 49, y: 18.5, deg: -32, len: 3.2 },
].map((l, i) => ({ ...l, y: l.y + TOP, start: 2.2 + i * 0.15 }));

// Gipsofila: puntini bianchi negli spazi liberi.
const BABY = [
  [19, 9], [45, 9], [28, 9], [36, 9], [11, 15], [53, 15], [22, 13], [42, 13],
  [17, 3], [47, 3], [32, 1], [29, 13.5], [35, 13.5], [9, 11], [55, 11],
].map(([x, y], i) => ({ x, y: y + TOP, start: 3.4 + i * 0.08, phase: hash(i + 90) * 10 }));

const BOW = ['  .-.   .-.  ', ' (   \\ /   ) ', "  '-.(o).-'  "];

// ---------------------------------------------------------------------------
// Disegno

/** Sprite con spazi opachi tra il primo e l'ultimo carattere di ogni riga. */
function drawSprite(g, lines, map, cx, cy, pal) {
  const x0 = Math.round(cx - (lines[0].length - 1) / 2);
  const y0 = Math.round(cy - (lines.length - 1) / 2);
  lines.forEach((line, j) => {
    const a = line.search(/\S/);
    if (a < 0) return;
    const b = line.trimEnd().length - 1;
    for (let i = a; i <= b; i++) {
      const role = map ? map[j][i] : line[i] === '@' ? 'c' : 'o';
      g.set(x0 + i, y0 + j, line[i], pal[role] ?? pal.o);
    }
  });
  return { x0, y0, x1: x0 + lines[0].length - 1, y1: y0 + lines.length - 1 };
}

function drawStem(g, x0, y0, x1, y1, progress) {
  const dy = y0 - y1;
  if (dy <= 0 || progress <= 0) return;
  const yTop = y0 - dy * progress;
  const xAt = (y) => x0 + (x1 - x0) * ((y0 - y) / dy);
  let prevX = Math.round(xAt(y0));
  for (let y = Math.round(y0) - 1; y >= Math.ceil(yTop); y--) {
    const slope = xAt(y - 0.5) - xAt(y + 0.5); // colonne per riga, salendo
    const ch = Math.abs(slope) < 0.45 ? '|' : slope > 0 ? '/' : '\\';
    const xr = Math.round(xAt(y));
    if (Math.abs(xr - prevX) > 1) {
      const dir = Math.sign(xr - prevX);
      for (let xi = prevX + dir; xi !== xr; xi += dir) g.set(xi, y, ch, C.stem);
    }
    g.set(xr, y, ch, C.stem);
    prevX = xr;
  }
}

function drawLeaf(g, leaf, grow) {
  if (grow <= 0) return;
  const th = (leaf.deg * Math.PI) / 180;
  const a = (leaf.len * grow) / 2;
  const b = 0.8 * grow;
  const lx = leaf.x + Math.cos(th) * a * ASPECT;
  const ly = leaf.y + Math.sin(th) * a;
  const ch = strokeChar(th);
  for (let y = Math.floor(ly - a - 1); y <= Math.ceil(ly + a + 1); y++) {
    for (let x = Math.floor(lx - a * ASPECT - 2); x <= Math.ceil(lx + a * ASPECT + 2); x++) {
      const u = (x - lx) / ASPECT;
      const v = y - ly;
      const p = u * Math.cos(th) + v * Math.sin(th);
      const q = -u * Math.sin(th) + v * Math.cos(th);
      if (Math.abs(p) > a) continue;
      if (Math.abs(q) > b * (1 - (p / a) ** 2) + 0.15) continue;
      g.set(x, y, p > a * 0.7 ? "'" : ch, Math.abs(q) < 0.35 ? C.leafLight : C.leaf);
    }
  }
}

function drawLavender(g, l, grow, sway) {
  const n = Math.round(l.len * grow);
  for (let i = 0; i < n; i++) {
    const y = l.y + l.len - 1 - i; // cresce dal basso
    const x = Math.round(l.x + sway * (1 - (y - l.y) / l.len));
    const k = y - l.y;
    if (k === 0) {
      g.set(x, y, '.', C.lilac);
      continue;
    }
    const odd = k % 2 === 1;
    g.set(x - 1, y, odd ? '(' : ',', C.lilacDark);
    g.set(x, y, odd ? '8' : 'o', C.lilac);
    g.set(x + 1, y, odd ? ')' : ',', C.lilacDark);
  }
}

function paperHalfWidth(y) {
  return 1.5 + (HW_TOP - 1.5) * (1 - (y - PT) / (GY - PT));
}

function drawPaper(g, reveal) {
  if (reveal <= 0) return;
  const firstRow = GY - (GY - PT) * reveal;
  for (let y = PT; y < GY; y++) {
    if (y < firstRow) continue;
    const xl = Math.round(CX - paperHalfWidth(y));
    const xr = Math.round(CX + paperHalfWidth(y));
    const xlN = Math.round(CX - paperHalfWidth(y + 1));
    const xrN = Math.round(CX + paperHalfWidth(y + 1));
    for (let x = xl + 1; x < xr; x++) {
      const dot = (x + 3 * y) % 7 === 0;
      g.set(x, y, dot ? '.' : ' ', dot ? C.paperDim : C.paper);
    }
    for (let x = xl; x < Math.max(xl + 1, xlN); x++) g.set(x, y, '\\', C.paper);
    for (let x = xr; x > Math.min(xr - 1, xrN); x--) g.set(x, y, '/', C.paper);
    if (y === PT) {
      for (let x = xl; x <= xr; x++) g.set(x, y, (x - xl) % 2 === 0 ? '\\' : '/', C.paper);
    }
  }
}

function drawBow(g, pop) {
  if (pop <= 0) return;
  const ends = [
    [-1, 2, '/'], [0, 2, '|'], [1, 2, '\\'],
    [-2, 3, '/'], [0, 3, '|'], [2, 3, '\\'],
  ];
  for (const [dx, dy, ch] of ends) g.set(CX + dx, GY + dy, ch, C.stem);
  if (pop < 0.4) {
    g.set(CX, GY, 'o', C.ribbon);
    return;
  }
  drawSprite(g, BOW, null, CX, GY, { o: C.ribbon, c: C.ribbon });
  g.set(CX, GY + 1, 'o', C.pinkDark);
  if (pop > 0.75) {
    g.set(CX - 4, GY + 2, '/', C.ribbon);
    g.set(CX - 5, GY + 3, '/', C.ribbon);
    g.set(CX + 4, GY + 2, '\\', C.ribbon);
    g.set(CX + 5, GY + 3, '\\', C.ribbon);
  }
}

// ---------------------------------------------------------------------------
// Effetti di contorno, senza stato: dipendono solo da t.

const SPARK_SEQ = ['.', '+', '*', '+', '.'];

function drawSparkles(g, t) {
  for (let i = 0; i < 8; i++) {
    const period = 2.2 + (i % 4) * 0.45;
    const ph = (t + i * 1.7) / period;
    const cycle = Math.floor(ph);
    const f = ph - cycle;
    if (f > 0.5) continue;
    const x = 2 + Math.floor(hash2(i, cycle) * (BOUQUET_COLS - 4));
    const y = Math.floor(hash2(i + 7, cycle) * (PT - 1));
    if (!g.isEmpty(x, y)) continue;
    g.set(x, y, SPARK_SEQ[Math.floor((f / 0.5) * SPARK_SEQ.length)], C.spark);
  }
}

const PETAL_CHARS = [',', "'", '`', '.'];

function drawFallingPetals(g, t) {
  for (let i = 0; i < 6; i++) {
    const period = 5 + i * 0.7;
    const ph = t / period + hash(i + 300);
    const cycle = Math.floor(ph);
    const f = ph - cycle;
    const head = HEADS[Math.floor(hash2(i, cycle) * HEADS.length)];
    const x0 = head.x + (hash2(i + 3, cycle) - 0.5) * 6;
    const y0 = head.y + head.halfH + 1;
    const x = x0 + Math.sin(f * 9 + i) * 1.6 + f * 4 * (hash(i) - 0.5);
    const y = y0 + f * (BOUQUET_ROWS + 1 - y0);
    g.set(x, y, PETAL_CHARS[Math.floor(f * 14) % PETAL_CHARS.length], head.pal.o);
  }
}

function drawHearts(g, t) {
  for (let i = 0; i < 2; i++) {
    const period = 6.5 + i * 1.8;
    const ph = t / period + i * 0.5;
    const cycle = Math.floor(ph);
    const f = ph - cycle;
    if (f > 0.75) continue;
    const k = f / 0.75;
    const startX = 14 + hash2(i, cycle) * 34;
    const startY = 4 + TOP;
    const x = Math.round(startX + Math.sin(k * 7 + i) * 1.5);
    const y = Math.round(startY - k * (startY + 1));
    if (g.isEmpty(x, y) && g.isEmpty(x + 1, y)) {
      g.set(x, y, '<', C.heart);
      g.set(x + 1, y, '3', C.heart);
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * Disegna il mazzo al tempo `t` (secondi dall'inizio dell'animazione).
 * Con `still` disegna la versione statica già sbocciata (prefers-reduced-motion).
 */
export function drawBouquet(g, t, { still = false } = {}) {
  if (still) t = BOUQUET_BLOOM_TIME + 3;
  const idle = still ? 0 : clamp01((t - BOUQUET_BLOOM_TIME) / 2);

  // Lavanda, sul fondo
  for (const l of LAVENDER) {
    const sway = Math.round(Math.sin(t * 0.8 + l.phase) * 0.75 * idle);
    const grow = easeInOutCubic(clamp01((t - l.stemStart) / l.stemDur));
    drawStem(g, CX + (l.x - CX) * 0.08, GY, l.x, l.y + l.len, grow);
    drawLavender(g, l, clamp01((t - l.stemStart - l.stemDur * 0.8) / 0.9), sway);
  }

  // Steli dei fiori
  const heads = HEADS.map((h) => ({
    ...h,
    hx: h.x + Math.round(Math.sin(t * 0.9 + h.phase) * 0.75 * idle),
    bloom: clamp01((t - h.bloomStart) / h.bloomDur),
  }));
  for (const h of heads) {
    const grow = easeInOutCubic(clamp01((t - h.stemStart) / h.stemDur));
    drawStem(g, CX + (h.x - CX) * 0.08, GY, h.hx, h.y, grow);
  }

  // Foglie e gipsofila, dietro le corolle
  for (const leaf of LEAVES) drawLeaf(g, leaf, easeOutCubic(clamp01((t - leaf.start) / 0.8)));
  for (const b of BABY) {
    if (t < b.start || !g.isEmpty(b.x, b.y)) continue;
    const cyc = Math.floor((t * 1.3 + b.phase) % 9);
    g.set(b.x, b.y, still ? '*' : cyc === 0 ? '+' : cyc === 5 ? '.' : '*', C.white);
  }

  // Carta e fiocco
  drawPaper(g, easeOutCubic(clamp01(t / 1.0)));
  drawBow(g, clamp01((t - 0.8) / 0.5));

  // Corolle: prima quelle in fondo, poi quelle davanti
  for (const h of [...heads].sort((a, b) => a.y - b.y)) {
    if (h.bloom <= 0) continue;
    const { def, pal } = h;
    if (h.bloom < 0.3) drawSprite(g, def.stages[0], null, h.hx, h.y, pal);
    else if (h.bloom < 0.65) drawSprite(g, def.stages[1], null, h.hx, h.y, pal);
    else {
      const box = drawSprite(g, def.lines, def.map, h.hx, h.y, pal);
      // piccolo scintillio quando il fiore si apre
      const since = t - (h.bloomStart + h.bloomDur * 0.65);
      if (!still && since < 0.45) {
        g.set(box.x0 - 1, h.y, '+', C.spark);
        g.set(box.x1 + 1, h.y, '+', C.spark);
        g.set(h.hx, box.y0 - 1, '*', C.spark);
      }
    }
  }

  if (still || t < BOUQUET_BLOOM_TIME) return;
  drawSparkles(g, t);
  drawFallingPetals(g, t - BOUQUET_BLOOM_TIME);
  drawHearts(g, t - BOUQUET_BLOOM_TIME);
}
