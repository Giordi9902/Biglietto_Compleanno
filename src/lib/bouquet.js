// Mazzo di fiori ASCII procedurale.
// Ogni fotogramma viene ricalcolato da zero a partire dal tempo `t` (secondi):
// la carta si avvolge, gli steli crescono, i fiori sbocciano, poi il mazzo
// ondeggia mentre cadono petali, brillano scintille e salgono cuoricini.

import { C } from './palette.js';
import {
  clamp01, easeInOutCubic, easeOutBack, easeOutCubic, hash, hash2, strokeChar,
} from './math.js';

export const BOUQUET_COLS = 72;
export const BOUQUET_ROWS = 39;

const TOP = 3; // spazio sopra il mazzo per i cuoricini che salgono
const CX = 36; // asse centrale
const GY = 30 + TOP; // punto in cui si raccolgono gli steli (fiocco)
const PT = 18 + TOP; // bordo superiore della carta
const HW_TOP = 17; // mezza larghezza della carta in alto
const ASPECT = 2; // un carattere è alto circa il doppio di quanto è largo

/** Tempo dopo il quale il mazzo è completamente sbocciato. */
export const BOUQUET_BLOOM_TIME = 5.2;

const HEADS = [
  { kind: 'rose', x: 36, y: 6.5, r: 3.3 },
  { kind: 'daisy', x: 25.5, y: 9.5, r: 3.0 },
  { kind: 'daisy', x: 46.5, y: 9.5, r: 3.0 },
  { kind: 'peony', x: 30, y: 14, r: 3.0 },
  { kind: 'rose', x: 42.5, y: 14.2, r: 2.9 },
  { kind: 'rose', x: 19.5, y: 15, r: 2.5 },
  { kind: 'peony', x: 53, y: 15, r: 2.6 },
  { kind: 'daisy', x: 36, y: 17.6, r: 2.2 },
].map((h, i) => {
  const stemStart = 0.9 + i * 0.14;
  const stemDur = 1.2;
  const bloomStart = stemStart + stemDur * 0.92;
  return { ...h, y: h.y + TOP, phase: hash(i + 1) * Math.PI * 2, stemStart, stemDur, bloomStart, bloomDur: 1.3 };
});

const LAVENDER = [
  { x: 21, y: 3, len: 6 },
  { x: 51, y: 2.5, len: 6 },
  { x: 14.5, y: 9, len: 5 },
  { x: 57.5, y: 9, len: 5 },
].map((l, i) => ({
  ...l,
  y: l.y + TOP,
  phase: hash(i + 40) * Math.PI * 2,
  stemStart: 0.7 + i * 0.18,
  stemDur: 1.4,
}));

// Foglie: punto di attacco, direzione (gradi, y verso il basso), lunghezza.
const LEAVES = [
  { x: 17, y: 13, deg: -155, len: 3.2 },
  { x: 55, y: 13, deg: -25, len: 3.2 },
  { x: 23, y: 7, deg: -125, len: 2.6 },
  { x: 49, y: 7, deg: -55, len: 2.6 },
  { x: 15, y: 18.5, deg: 175, len: 3 },
  { x: 57, y: 18.5, deg: 5, len: 3 },
  { x: 32, y: 10.5, deg: -105, len: 2 },
  { x: 40, y: 10.5, deg: -75, len: 2 },
].map((l, i) => ({ ...l, y: l.y + TOP, start: 2.0 + i * 0.12 }));

// Gipsofila: puntini bianchi tra un fiore e l'altro.
const BABY = [
  [33, 11], [40, 11], [21, 12], [51, 12], [28, 4.5], [44, 4.5], [36, 2], [17, 12.5],
  [56, 12], [31, 18.5], [41, 18.5], [24, 18], [48, 18.5], [31, 8.5], [42, 8.5], [12, 14], [60, 14],
].map(([x, y], i) => ({ x, y: y + TOP, start: 3.6 + i * 0.07, phase: hash(i + 90) * 10 }));

const PAPER_ROWS = GY - PT;

function paperHalfWidth(y) {
  const s = (y - PT) / PAPER_ROWS;
  return 1.5 + (HW_TOP - 1.5) * (1 - s);
}

// ---------------------------------------------------------------------------
// Elementi

function drawStem(g, x0, y0, x1, y1, progress, color) {
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
      for (let xi = prevX + dir; xi !== xr; xi += dir) g.set(xi, y, ch, color);
    }
    g.set(xr, y, ch, color);
    prevX = xr;
  }
}

function drawLeaf(g, leaf, grow) {
  if (grow <= 0) return;
  const th = (leaf.deg * Math.PI) / 180;
  const a = (leaf.len * grow) / 2; // semiasse lungo (in righe)
  const b = 0.85 * grow; // semiasse corto
  const cxl = leaf.x + Math.cos(th) * a * ASPECT;
  const cyl = leaf.y + Math.sin(th) * a;
  const ch = strokeChar(th);
  const x0 = Math.floor(cxl - a * ASPECT - 2);
  const x1 = Math.ceil(cxl + a * ASPECT + 2);
  for (let y = Math.floor(cyl - a - 1); y <= Math.ceil(cyl + a + 1); y++) {
    for (let x = x0; x <= x1; x++) {
      const u = (x - cxl) / ASPECT;
      const v = y - cyl;
      const p = u * Math.cos(th) + v * Math.sin(th);
      const q = -u * Math.sin(th) + v * Math.cos(th);
      if (Math.abs(p) > a) continue;
      const half = b * (1 - (p / a) ** 2);
      if (Math.abs(q) > half + 0.15) continue;
      const tip = p > a * 0.7;
      g.set(x, y, tip ? "'" : ch, Math.abs(q) < 0.35 ? C.leafLight : C.leaf);
    }
  }
}

function drawLavender(g, l, grow, sway) {
  const n = Math.round(l.len * grow);
  for (let i = 0; i < n; i++) {
    const y = l.y + l.len - 1 - i;
    const k = 1 - (y - l.y) / l.len; // più ondeggia in cima
    const x = l.x + sway * k;
    if (i === l.len - 1) {
      g.set(x, y, '.', C.lilac);
      continue;
    }
    const odd = (i + Math.round(l.y)) % 2 === 1;
    g.set(x - 1, y, odd ? '(' : ',', C.lilacDark);
    g.set(x, y, odd ? '8' : 'o', C.lilac);
    g.set(x + 1, y, odd ? ')' : ',', C.lilacDark);
  }
}

function drawPaper(g, reveal) {
  if (reveal <= 0) return;
  const firstRow = GY - PAPER_ROWS * reveal;
  for (let y = PT; y < GY; y++) {
    if (y < firstRow) continue;
    const hw = paperHalfWidth(y);
    const hwNext = paperHalfWidth(y + 1);
    const xl = Math.round(CX - hw);
    const xr = Math.round(CX + hw);
    const xlN = Math.round(CX - hwNext);
    const xrN = Math.round(CX + hwNext);
    const creaseL = Math.round(CX - hw * 0.5);
    const creaseR = Math.round(CX + hw * 0.5);
    for (let x = xl + 1; x < xr; x++) {
      let ch = ' ';
      let col = C.paper;
      if (x === creaseL && y > PT) ch = '\\', col = C.paperDim;
      else if (x === creaseR && y > PT) ch = '/', col = C.paperDim;
      else if ((x + 3 * y) % 7 === 0) ch = '.', col = C.paperDim;
      g.set(x, y, ch, col);
    }
    for (let x = xl; x < Math.max(xl + 1, xlN); x++) g.set(x, y, '\\', C.paper);
    for (let x = xr; x > Math.min(xr - 1, xrN); x--) g.set(x, y, '/', C.paper);
    if (y === PT) {
      for (let x = xl; x <= xr; x++) g.set(x, y, (x - xl) % 2 === 0 ? '\\' : '/', C.paper);
    }
  }
}

const BOW = [
  '  .-.   .-.  ',
  ' (   \\ /   ) ',
  "  '-.(o).-'  ",
];

function drawBow(g, pop) {
  if (pop <= 0) return;
  // Le estremità degli steli spuntano sotto il fiocco
  const ends = [
    [35, 1, '/'], [36, 1, '|'], [37, 1, '\\'],
    [34, 2, '/'], [36, 2, '|'], [38, 2, '\\'],
    [33, 3, '/'], [36, 3, '|'], [39, 3, '\\'],
  ];
  for (const [x, dy, ch] of ends) g.set(x, GY + dy, ch, C.stem);
  if (pop < 0.35) {
    g.set(CX, GY, 'o', C.ribbon);
    return;
  }
  g.sprite(CX - 6, GY - 1, BOW, C.ribbon);
  g.set(CX, GY + 1, 'o', C.pinkDark);
  if (pop > 0.7) {
    g.set(CX - 4, GY + 2, '/', C.ribbon);
    g.set(CX - 5, GY + 3, '/', C.ribbon);
    g.set(CX + 4, GY + 2, '\\', C.ribbon);
    g.set(CX + 5, GY + 3, '\\', C.ribbon);
  }
}

// ---------------------------------------------------------------------------
// Corolle

function forEachCell(hx, hy, R, fn) {
  const y0 = Math.floor(hy - R - 1);
  const y1 = Math.ceil(hy + R + 1);
  const x0 = Math.floor(hx - R * ASPECT - 2);
  const x1 = Math.ceil(hx + R * ASPECT + 2);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const u = (x - hx) / ASPECT;
      const v = y - hy;
      fn(x, y, Math.hypot(u, v), Math.atan2(v, u), u);
    }
  }
}

function arcChar(th) {
  const d = (th * 180) / Math.PI;
  if (d >= -22.5 && d < 22.5) return ')';
  if (d >= 22.5 && d < 67.5) return "'";
  if (d >= 67.5 && d < 112.5) return '-';
  if (d >= 112.5 && d < 157.5) return '`';
  if (d >= 157.5 || d < -157.5) return '(';
  if (d >= -157.5 && d < -112.5) return '.';
  if (d >= -112.5 && d < -67.5) return '-';
  return '.';
}

function drawBud(g, hx, hy, color) {
  g.set(hx, hy, 'o', color);
}

function drawDaisy(g, hx, hy, R, rot) {
  if (R < 0.7) return drawBud(g, hx, hy, C.white);
  const k = 10;
  forEachCell(hx, hy, R, (x, y, r, th, u) => {
    if (r > R + 0.3) return;
    if (r <= R * 0.3) {
      g.set(x, y, Math.abs(u) < 0.3 ? '@' : u < 0 ? '(' : ')', C.yellow);
      return;
    }
    const p = Math.abs(Math.cos((k * (th - rot)) / 2));
    const rho = R * (0.3 + 0.7 * p ** 0.6);
    if (r <= rho) g.set(x, y, strokeChar(th), C.white);
  });
}

function drawRose(g, hx, hy, R, rot) {
  if (R < 0.7) return drawBud(g, hx, hy, C.rose);
  forEachCell(hx, hy, R, (x, y, r, th) => {
    const rho = R * (0.92 + 0.08 * Math.cos(5 * (th - rot)));
    if (r > rho) return;
    if (r < R * 0.2) {
      g.set(x, y, '@', C.roseDark);
      return;
    }
    const edge = r > rho - 0.6;
    const s = (r / R) * 2.4 + (th + Math.PI) / (2 * Math.PI) + rot * 0.15;
    const f = s - Math.floor(s);
    if (edge || f < 0.42) g.set(x, y, arcChar(th), r / R < 0.55 ? C.roseDark : C.rose);
    else g.set(x, y, ' ', C.rose);
  });
}

const PEONY_RAMP = '@%#*+=-:';

function drawPeony(g, hx, hy, R, rot) {
  if (R < 0.7) return drawBud(g, hx, hy, C.pink);
  forEachCell(hx, hy, R, (x, y, r, th) => {
    const rho = R * (0.86 + 0.14 * Math.cos(7 * (th - rot)));
    if (r > rho) return;
    const d = r / rho;
    if (d > 0.72) {
      g.set(x, y, strokeChar(th), C.pink);
      return;
    }
    const n = 0.16 * Math.sin(9 * th + r * 2.5 + rot * 2);
    const idx = Math.floor(clamp01(d / 0.72 + n) * (PEONY_RAMP.length - 1));
    g.set(x, y, PEONY_RAMP[idx], d < 0.4 ? C.pinkDark : C.pink);
  });
}

const DRAW_HEAD = { daisy: drawDaisy, rose: drawRose, peony: drawPeony };
const PETAL_COLOR = { daisy: C.white, rose: C.rose, peony: C.pink };

// ---------------------------------------------------------------------------
// Effetti di contorno (senza stato: dipendono solo da t)

const SPARK_SEQ = ['.', '+', '*', '+', '.'];

function drawSparkles(g, t) {
  for (let i = 0; i < 9; i++) {
    const period = 2.2 + (i % 4) * 0.45;
    const ph = (t + i * 1.7) / period;
    const cycle = Math.floor(ph);
    const f = ph - cycle;
    if (f > 0.5) continue;
    const x = 3 + Math.floor(hash2(i, cycle) * (BOUQUET_COLS - 6));
    const y = Math.floor(hash2(i + 7, cycle) * (PT - 2));
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
    const x0 = head.x + (hash2(i + 3, cycle) - 0.5) * head.r * ASPECT;
    const y0 = head.y + head.r * 0.8;
    const y = y0 + f * (BOUQUET_ROWS + 1 - y0);
    const x = x0 + Math.sin(f * 9 + i) * 1.6 + f * 3 * (hash(i) - 0.5);
    g.set(x, y, PETAL_CHARS[Math.floor(f * 14) % PETAL_CHARS.length], PETAL_COLOR[head.kind]);
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
    const startX = 18 + hash2(i, cycle) * 34;
    const startY = 5 + TOP;
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
 * Con `still` disegna la versione statica, già sbocciata (per prefers-reduced-motion).
 */
export function drawBouquet(g, t, { still = false } = {}) {
  if (still) t = BOUQUET_BLOOM_TIME + 1;
  const idle = still ? 0 : clamp01((t - BOUQUET_BLOOM_TIME) / 2); // ondeggiamento graduale

  // Lavanda (sul fondo)
  for (const l of LAVENDER) {
    const g01 = easeInOutCubic(clamp01((t - l.stemStart) / l.stemDur));
    const sway = Math.sin(t * 0.8 + l.phase) * 0.8 * idle;
    drawStem(g, CX + (l.x - CX) * 0.08, GY, l.x + sway * 0.3, l.y + l.len, g01, C.stem);
    drawLavender(g, l, clamp01((t - l.stemStart - l.stemDur * 0.8) / 0.9), sway);
  }

  // Steli
  const heads = HEADS.map((h) => {
    const sway = Math.sin(t * 0.9 + h.phase) * 0.7 * idle;
    const rot = h.phase + (still ? 0 : t * 0.12);
    const bloom = clamp01((t - h.bloomStart) / h.bloomDur);
    return { ...h, hx: h.x + sway, R: bloom > 0 ? h.r * easeOutBack(bloom) : 0, rot };
  });
  for (const h of heads) {
    const grow = easeInOutCubic(clamp01((t - h.stemStart) / h.stemDur));
    drawStem(g, CX + (h.x - CX) * 0.08, GY, h.hx, h.y, grow, C.stem);
  }

  // Foglie e gipsofila (dietro le corolle)
  for (const leaf of LEAVES) drawLeaf(g, leaf, easeOutCubic(clamp01((t - leaf.start) / 0.8)));
  for (const b of BABY) {
    if (t < b.start) continue;
    const cyc = Math.floor((t * 1.3 + b.phase) % 8);
    g.set(b.x, b.y, still ? '*' : cyc === 0 ? '+' : cyc === 4 ? '.' : '*', C.white);
  }

  // Carta e fiocco
  drawPaper(g, easeOutCubic(clamp01(t / 1.0)));
  drawBow(g, clamp01((t - 0.8) / 0.5));

  // Corolle: prima quelle in fondo, poi quelle davanti
  for (const h of [...heads].sort((a, b) => a.y - b.y)) {
    if (h.R > 0) DRAW_HEAD[h.kind](g, h.hx, h.y, h.R, h.rot);
  }

  if (still || t < BOUQUET_BLOOM_TIME) return;
  drawSparkles(g, t);
  drawFallingPetals(g, t - BOUQUET_BLOOM_TIME);
  drawHearts(g, t - BOUQUET_BLOOM_TIME);
}
