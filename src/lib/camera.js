// La macchina fotografica digitale (il regalo!), nascosta sotto un velo di
// "rumore" che si gratta via un pezzetto per ogni risposta giusta.

import { Grid } from './grid.js';
import { C } from './palette.js';
import { hash, hash2, valueNoise } from './math.js';

export const CAMERA_COLS = 56;
export const CAMERA_ROWS = 13;

const LENS = [
  '      .-------.      ',
  "   .-'  _____  '-.   ",
  "  /   .'     '.   \\  ",
  ' /   /  .---.  \\   \\ ',
  '|   |  (  o  )  |   |',
  " \\   \\  '---'  /   / ",
  "  \\   '._____.'   /  ",
  "   '-.         .-'   ",
  "      '-------'      ",
];
const LENS_X = 18;
const LENS_Y = 3;

function buildCamera(age) {
  const g = new Grid(CAMERA_COLS, CAMERA_ROWS);
  const W = CAMERA_COLS;

  // Pulsanti sul dorso: ghiera, accensione, scatto
  g.text(8, 0, '____', C.body);
  g.text(33, 0, '__', C.body);
  g.text(40, 0, '_____', C.pink);
  g.text(2, 1, '_'.repeat(W - 4), C.body);
  g.text(7, 1, '|____|', C.body);
  g.text(32, 1, '|__|', C.body);
  g.text(39, 1, '|_____|', C.pink);

  // Contorno del corpo
  g.set(1, 2, '/', C.body);
  g.set(W - 2, 2, '\\', C.body);
  for (let y = 3; y <= 11; y++) {
    g.set(0, y, '|', C.body);
    g.set(W - 1, y, '|', C.body);
  }
  g.set(1, 12, '\\', C.body);
  g.text(2, 12, '_'.repeat(W - 4), C.body);
  g.set(W - 2, 12, '/', C.body);

  // Flash
  g.text(4, 3, ".--------.", C.body);
  g.text(4, 4, '|', C.body);
  g.text(5, 4, '::::::::', C.yellow);
  g.text(13, 4, '|', C.body);
  g.text(4, 5, "'--------'", C.body);

  // Obiettivo
  LENS.forEach((line, j) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') continue;
      const inner = j >= 2 && j <= 6 && i >= 6 && i <= 14;
      g.set(LENS_X + i, LENS_Y + j, line[i], inner ? C.sky : C.lens);
    }
  });
  g.set(LENS_X + 10, LENS_Y + 4, 'o', C.lensCore);

  // Spia, impugnatura, scritte
  g.text(45, 4, '( )', C.body);
  g.set(46, 4, 'o', C.red);
  g.text(46, 6, '.--.', C.dim);
  for (let y = 7; y <= 9; y++) g.text(46, y, '|  |', C.dim);
  g.text(46, 10, "'--'", C.dim);
  g.text(4, 9, 'DIGITAL', C.text);
  g.text(4, 10, `${age} MP`, C.pink);
  g.text(40, 11, 'ZOOM 4x', C.dim);
  return g;
}

const cameras = new Map();
function getCamera(age) {
  if (!cameras.has(age)) cameras.set(age, buildCamera(age));
  return cameras.get(age);
}

/** Ordine di scoperta delle celle: a macchie, come un gratta e vinci. */
const ORDER = (() => {
  const n = CAMERA_COLS * CAMERA_ROWS;
  const raw = Array.from({ length: n }, (_, i) => {
    const x = i % CAMERA_COLS;
    const y = Math.floor(i / CAMERA_COLS);
    return { i, v: 0.75 * valueNoise(x / 7, y / 3.5, 3) + 0.25 * hash(i + 7) };
  });
  raw.sort((a, b) => a.v - b.v);
  const rank = new Float32Array(n);
  raw.forEach(({ i }, k) => { rank[i] = k / (n - 1); });
  return rank;
})();

const NOISE = '#%&@$*+=:;-~.';

/**
 * Disegna la macchina scoperta per la frazione `level` (0..1).
 * Le celle ancora coperte mostrano rumore che sfarfalla.
 */
export function drawCamera(g, t, level, { idle = false, age = 26 } = {}) {
  const CAMERA = getCamera(age);
  const frame = Math.floor(t * 8);
  for (let i = 0; i < CAMERA.ch.length; i++) {
    if (level >= 1 || ORDER[i] < level) {
      g.ch[i] = CAMERA.ch[i];
      g.co[i] = CAMERA.co[i];
    } else {
      const h = hash2(i, frame);
      g.ch[i] = NOISE[Math.floor(h * NOISE.length)];
      g.co[i] = h < 0.5 ? C.noise : C.noise2;
    }
  }
  if (idle && level >= 1) {
    // la spia lampeggia e l'obiettivo luccica
    if (Math.floor(t * 2) % 2 === 0) g.set(46, 4, '*', C.red);
    const glint = (t % 3.2) / 3.2;
    if (glint < 0.12) g.set(LENS_X + 10, LENS_Y + 4, '*', C.white);
    if (glint > 0.5 && glint < 0.58) g.set(LENS_X + 7, LENS_Y + 3, '*', C.white);
  }
}
