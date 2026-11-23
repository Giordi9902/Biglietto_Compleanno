import { CLASS_NAMES } from './palette.js';

const ESC = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };

/** Buffer di caratteri + colori, convertibile in HTML per un <pre>. */
export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.ch = new Array(cols * rows).fill(' ');
    this.co = new Uint8Array(cols * rows);
  }

  clear() {
    this.ch.fill(' ');
    this.co.fill(0);
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  set(x, y, ch, color = 0) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inside(x, y)) return;
    const i = y * this.cols + x;
    this.ch[i] = ch;
    this.co[i] = color;
  }

  get(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    return this.inside(x, y) ? this.ch[y * this.cols + x] : null;
  }

  isEmpty(x, y) {
    return this.get(x, y) === ' ';
  }

  /** Scrive una stringa; gli spazi sono trasparenti salvo `opaque`. */
  text(x, y, str, color = 0, opaque = false) {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === ' ' && !opaque) continue;
      this.set(x + i, y, str[i], color);
    }
  }

  sprite(x, y, lines, color = 0, opaque = false) {
    lines.forEach((line, j) => this.text(x, y + j, line, color, opaque));
  }

  toString() {
    const out = [];
    for (let y = 0; y < this.rows; y++) {
      out.push(this.ch.slice(y * this.cols, (y + 1) * this.cols).join(''));
    }
    return out.join('\n');
  }

  toHTML() {
    let html = '';
    for (let y = 0; y < this.rows; y++) {
      let run = '';
      let runColor = 0;
      const flush = () => {
        if (!run) return;
        const cls = CLASS_NAMES[runColor];
        html += cls ? `<span class="${cls}">${run}</span>` : run;
        run = '';
      };
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        const ch = this.ch[i];
        // Gli spazi non hanno colore: così le sequenze si uniscono e l'HTML resta leggero.
        const color = ch === ' ' ? runColor : this.co[i];
        if (color !== runColor) {
          flush();
          runColor = color;
        }
        run += ESC[ch] || ch;
      }
      flush();
      if (y < this.rows - 1) html += '\n';
    }
    return html;
  }
}
