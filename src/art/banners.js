// Scritte giganti in ASCII art generate con FIGlet direttamente nel browser,
// così cambiando il nome in src/config.js cambiano anche i titoli.
import figlet from 'figlet';
import colossal from 'figlet/fonts/Colossal';
import script from 'figlet/fonts/Script';
import slant from 'figlet/fonts/Slant';

figlet.parseFont('Slant', slant);
figlet.parseFont('Script', script);
figlet.parseFont('Colossal', colossal);

const cache = new Map();

/** Restituisce le righe della scritta `text` nel font FIGlet `font`. */
export function banner(text, font) {
  const key = `${font}|${text}`;
  if (!cache.has(key)) {
    const lines = figlet.textSync(String(text), { font }).split('\n').map((l) => l.replace(/\s+$/, ''));
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    while (lines.length && !lines[0].trim()) lines.shift();
    cache.set(key, lines);
  }
  return cache.get(key);
}

export const bannerWidth = (lines) => Math.max(...lines.map((l) => l.length));
