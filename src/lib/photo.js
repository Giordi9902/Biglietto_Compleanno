// Il display della macchina fotografica: mostra la "prima foto" che si carica
// riga per riga, come un JPEG su una connessione lenta.

import { Grid } from './grid.js';
import { C } from './palette.js';
import { hash, hash2 } from './math.js';
import { banner, bannerWidth } from '../art/banners.js';

export const PHOTO_COLS = 52;
export const PHOTO_ROWS = 20;

const IMG_X = 1;
const IMG_Y = 3;
const IMG_W = PHOTO_COLS - 2;
const IMG_H = 14;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function frame(g, shotNumber, date, age) {
  const W = PHOTO_COLS;
  const H = PHOTO_ROWS;
  g.text(0, 0, '+' + '-'.repeat(W - 2) + '+', C.lcd);
  g.text(0, H - 1, '+' + '-'.repeat(W - 2) + '+', C.lcd);
  for (let y = 1; y < H - 1; y++) {
    g.set(0, y, '|', C.lcd);
    g.set(W - 1, y, '|', C.lcd);
  }
  g.text(2, 1, `IMG_${String(shotNumber).padStart(4, '0')}.JPG`, C.lcd);
  g.text(W - 18, 1, '[|||]', C.green);
  g.text(W - 10, 1, `${age} MP`, C.lcd);
  const stamp = `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}  ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  g.text(2, H - 2, stamp, C.lcd);
  g.text(W - 18, H - 2, 'ISO 100   f/2.8', C.lcd);
  // angoli della messa a fuoco
  const fx0 = 4;
  const fx1 = W - 5;
  const fy0 = IMG_Y - 1;
  const fy1 = IMG_Y + IMG_H;
  g.text(fx0, fy0, '.-', C.lcd);
  g.text(fx1 - 1, fy0, '-.', C.lcd);
  g.text(fx0, fy1, "'-", C.lcd);
  g.text(fx1 - 1, fy1, "-'", C.lcd);
}

function heartImage(g, text, age) {
  const cx = IMG_X + (IMG_W - 1) / 2;
  const s = 6.4; // righe per unità
  const top = IMG_Y + 0.3; // la cima dei lobi del cuore
  const fill = text.toLowerCase().replace(/\s+/g, '');
  let labelRow = null;
  for (let y = IMG_Y; y < IMG_Y + IMG_H; y++) {
    for (let x = IMG_X; x < IMG_X + IMG_W; x++) {
      const X = (x - cx) / (2.25 * s);
      const Y = 1.26 - (y - top) / s;
      // cuore: x² + (1.25·y − √|x|)² ≤ 1
      if (X * X + (1.25 * Y - Math.sqrt(Math.abs(X))) ** 2 > 1) continue;
      const k = (x - IMG_X + (y - IMG_Y) * 3) % fill.length;
      g.set(x, y, fill[k], Y > 0.6 ? C.rose : Y > -0.1 ? C.heart : C.pinkDark);
      if (labelRow == null && Y < 0.45) labelRow = y;
    }
  }
  const label = ` ${age} `;
  g.text(Math.round(cx - label.length / 2) + 1, labelRow ?? IMG_Y + 5, label, C.yellow, true);
}

function bannerImage(g, lines, color, caption) {
  if (bannerWidth(lines) > IMG_W) lines = [lines.fallback]; // nome troppo lungo per il display
  const w = bannerWidth(lines);
  const x0 = IMG_X + Math.floor((IMG_W - w) / 2);
  const y0 = IMG_Y + Math.floor((IMG_H - lines.length - (caption ? 2 : 0)) / 2);
  lines.forEach((l, j) => g.text(x0, y0 + j, l, color));
  if (caption) g.text(IMG_X + Math.floor((IMG_W - caption.length) / 2), y0 + lines.length + 1, caption, C.pink);
  for (let i = 0; i < 14; i++) {
    const x = IMG_X + 2 + Math.floor(hash(i + 11) * (IMG_W - 4));
    const y = IMG_Y + Math.floor(hash(i + 29) * IMG_H);
    let free = true;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) if (!g.isEmpty(x + dx, y + dy)) free = false;
    if (free) g.set(x, y, i % 3 ? '*' : '+', C.spark);
  }
}

const withFallback = (lines, text) => Object.assign([...lines], { fallback: text.toUpperCase().split('').join(' ') });

/** Costruisce la foto numero `n` (si alternano tre soggetti). */
export function buildPhoto(n, { name, age, date = new Date() }) {
  const g = new Grid(PHOTO_COLS, PHOTO_ROWS);
  const variant = n % 3;
  if (variant === 0) heartImage(g, name, age);
  else if (variant === 1) bannerImage(g, withFallback(banner(name, 'Script'), name), C.pink, null);
  else bannerImage(g, withFallback(banner(age, 'Colossal'), String(age)), C.yellow, 'anni di te');
  frame(g, age + n, date, age);
  return g;
}

const NOISE = '#%@*+=-:. ';

/** Disegna la foto `photo` mentre si "sviluppa" (t = secondi dallo scatto). */
export function drawPhoto(g, photo, t) {
  const frameNo = Math.floor(t * 12);
  for (let i = 0; i < photo.ch.length; i++) {
    const x = i % PHOTO_COLS;
    const y = Math.floor(i / PHOTO_COLS);
    const inImage = x >= IMG_X && x < IMG_X + IMG_W && y >= IMG_Y && y < IMG_Y + IMG_H;
    const reveal = inImage ? 0.25 + ((y - IMG_Y) / IMG_H) * 1.3 + hash(i + 3) * 0.45 : 0.1;
    if (t >= reveal) {
      g.ch[i] = photo.ch[i];
      g.co[i] = photo.co[i];
    } else if (inImage) {
      const h = hash2(i, frameNo);
      g.ch[i] = NOISE[Math.floor(h * NOISE.length)];
      g.co[i] = C.noise;
    }
  }
}
