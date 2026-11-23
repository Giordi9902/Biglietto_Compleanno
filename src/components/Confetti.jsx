import { hash } from '../lib/math.js';

const CHARS = ['*', '+', 'o', '.', '<3', 'x', '~', '*'];
const COLORS = ['var(--pink)', 'var(--yellow)', 'var(--sky)', 'var(--green)', 'var(--lilac)', 'var(--rose)'];

/** Coriandoli ASCII che cadono dall'alto. */
export default function Confetti({ count = 70, seed = 1 }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const h = (k) => hash(i * 13.7 + seed * 101 + k);
        return (
          <span
            key={i}
            style={{
              left: `${h(1) * 100}%`,
              color: COLORS[Math.floor(h(2) * COLORS.length)],
              animationDelay: `${h(3) * 0.9}s`,
              animationDuration: `${2.6 + h(4) * 2.2}s`,
              '--drift': `${(h(5) - 0.5) * 160}px`,
              '--spin': `${(h(6) - 0.5) * 720}deg`,
              fontSize: `${12 + h(7) * 12}px`,
            }}
          >
            {CHARS[Math.floor(h(8) * CHARS.length)]}
          </span>
        );
      })}
    </div>
  );
}
