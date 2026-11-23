// Il pacco regalo, nascosto sotto un velo di "rumore" che si gratta via un
// pezzetto per ogni risposta giusta. Mostra solo la carta e il fiocco:
// cosa c'è dentro resta un segreto (il regalo vero si consegna a mano).

import { Grid } from './grid.js';
import { C } from './palette.js';
import { hash, hash2, valueNoise } from './math.js';

export const GIFT_COLS = 56;
export const GIFT_ROWS = 13;

const BOW = [
  '  __        __  ',
  ' /  \\ .--. /  \\ ',
  ' \\___(    )___/ ',
];
const BOW_X = 20;
const RIB_X = 27; // le due colonne del nastro verticale: 27 e 28
const BAND_Y = 9;

function buildBox(name, age) {
  const g = new Grid(GIFT_COLS, GIFT_ROWS);

  // Coperchio
  const L0 = 4;
  const L1 = 51;
  g.text(L0, 3, '.' + '='.repeat(L1 - L0 - 1) + '.', C.pink);
  g.set(L0, 4, '|', C.pink);
  g.set(L1, 4, '|', C.pink);
  for (let x = L0 + 1; x < L1; x++) g.set(x, 4, (x + 4) % 6 === 0 ? '*' : '.', C.pinkDark);
  g.text(L0, 5, "'" + '='.repeat(L1 - L0 - 1) + "'", C.pink);

  // Scatola
  const B0 = 6;
  const B1 = 49;
  for (let y = 6; y <= 11; y++) {
    g.set(B0, y, '|', C.pink);
    g.set(B1, y, '|', C.pink);
    for (let x = B0 + 2; x < B1 - 1; x++) {
      if ((x + y * 3) % 7 === 0) g.set(x, y, y % 2 ? '+' : 'x', C.pinkDark);
    }
  }
  g.text(B0, 12, "'" + '-'.repeat(B1 - B0 - 1) + "'", C.pink);

  // Nastro orizzontale
  for (let x = B0 + 1; x < B1; x++) g.set(x, BAND_Y, '=', C.ribbon);

  // Nastro verticale (sopra coperchio e scatola)
  for (let y = 3; y <= 12; y++) {
    g.set(RIB_X, y, '|', C.ribbon);
    g.set(RIB_X + 1, y, '|', C.ribbon);
  }
  g.text(RIB_X, BAND_Y, '##', C.ribbon);

  // Fiocco
  BOW.forEach((line, j) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ') g.set(BOW_X + i, j, line[i], C.ribbon);
    }
  });
  g.text(BOW_X + 6, 2, '<3', C.heart);

  // Bigliettino
  const label = name.length <= 14 ? `per ${name}` : 'per te';
  const tw = label.length + 4;
  const tx = B1 - 2 - tw;
  g.text(tx, 6, '.' + '-'.repeat(tw - 2) + '.', C.paper);
  g.text(tx, 7, `| ${label} |`, C.paper, true);
  g.text(tx + 2, 7, label, C.yellow);
  g.text(tx, 8, "'" + '-'.repeat(tw - 2) + "'", C.paper);

  // Scritte sul lato sinistro
  g.text(10, 7, '? ? ?', C.lilac, true);
  g.text(10, 11, `${age} <3`, C.pink, true);
  return g;
}

const boxes = new Map();
function getBox(name, age) {
  const key = `${name}|${age}`;
  if (!boxes.has(key)) boxes.set(key, buildBox(name, age));
  return boxes.get(key);
}

/** Ordine di scoperta delle celle: a macchie, come un gratta e vinci. */
const ORDER = (() => {
  const n = GIFT_COLS * GIFT_ROWS;
  const raw = Array.from({ length: n }, (_, i) => {
    const x = i % GIFT_COLS;
    const y = Math.floor(i / GIFT_COLS);
    return { i, v: 0.75 * valueNoise(x / 7, y / 3.5, 3) + 0.25 * hash(i + 7) };
  });
  raw.sort((a, b) => a.v - b.v);
  const rank = new Float32Array(n);
  raw.forEach(({ i }, k) => { rank[i] = k / (n - 1); });
  return rank;
})();

const NOISE = '#%&@$*+=:;-~.';
const SPARKS = [[18, 1], [37, 0], [16, 3], [39, 2], [2, 6], [53, 8], [3, 11], [52, 12]];

/**
 * Disegna il pacco scoperto per la frazione `level` (0..1).
 * Le celle ancora coperte mostrano rumore che sfarfalla.
 */
export function drawGiftBox(g, t, level, { idle = false, name = '', age = 26 } = {}) {
  const BOX = getBox(name, age);
  const frame = Math.floor(t * 8);
  for (let i = 0; i < BOX.ch.length; i++) {
    if (level >= 1 || ORDER[i] < level) {
      g.ch[i] = BOX.ch[i];
      g.co[i] = BOX.co[i];
    } else {
      const h = hash2(i, frame);
      g.ch[i] = NOISE[Math.floor(h * NOISE.length)];
      g.co[i] = h < 0.5 ? C.noise : C.noise2;
    }
  }
  if (idle && level >= 1) {
    // brillantini intorno al pacco e cuore che pulsa
    const tick = Math.floor(t * 3);
    SPARKS.forEach(([x, y], k) => {
      if ((tick + k) % 4 === 0) g.set(x, y, k % 2 ? '+' : '*', C.spark);
    });
    if (Math.floor(t * 2) % 2 === 0) g.text(BOW_X + 6, 2, '<3', C.white);
  }
}
