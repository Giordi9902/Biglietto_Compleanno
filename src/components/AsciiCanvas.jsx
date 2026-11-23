import { useEffect, useRef } from 'react';
import { Grid } from '../lib/grid.js';

/**
 * Un <pre> ridisegnato a ~`fps` fotogrammi al secondo.
 * `draw(grid, nowInSeconds)` riceve una griglia vuota da riempire.
 * Il testo si ridimensiona da solo per stare nella larghezza disponibile.
 */
export default function AsciiCanvas({ cols, rows, draw, fps = 20, label, onActivate, className = '', maxFont }) {
  const preRef = useRef(null);
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const grid = new Grid(cols, rows);
    let raf = 0;
    let last = -Infinity;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / fps) return;
      last = now;
      grid.clear();
      drawRef.current(grid, now / 1000);
      if (preRef.current) preRef.current.innerHTML = grid.toHTML();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cols, rows, fps]);

  const interactive = Boolean(onActivate);
  return (
    <div className={`ascii-wrap ${className}`}>
      <pre
        ref={preRef}
        className={`ascii${interactive ? ' is-interactive' : ''}`}
        style={{ '--cols': cols, '--rows': rows, ...(maxFont ? { '--ascii-max': `${maxFont}px` } : null) }}
        role={interactive ? 'button' : 'img'}
        aria-label={label}
        tabIndex={interactive ? 0 : undefined}
        onClick={onActivate}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onActivate();
                }
              }
            : undefined
        }
      />
    </div>
  );
}
