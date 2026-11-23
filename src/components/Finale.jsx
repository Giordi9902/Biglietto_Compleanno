import { useCallback, useMemo, useRef, useState } from 'react';
import { useTimeout, useTypewriter } from '../hooks.js';
import { PHOTO_COLS, PHOTO_ROWS, buildPhoto, drawPhoto } from '../lib/photo.js';
import { sfxShutter } from '../lib/audio.js';
import AsciiCanvas from './AsciiCanvas.jsx';

export default function Finale({ config, reduced, onFlash, onRestart }) {
  const [shot, setShot] = useState(() => ({ n: 0, date: new Date() }));
  const shotAtRef = useRef(null);
  const photo = useMemo(
    () => buildPhoto(shot.n, { name: config.nome, age: config.anni, date: shot.date }),
    [shot, config.nome, config.anni],
  );

  const draw = useCallback(
    (g, now) => {
      if (shotAtRef.current == null) shotAtRef.current = now;
      drawPhoto(g, photo, reduced ? 99 : now - shotAtRef.current);
    },
    [photo, reduced],
  );

  const shootAgain = () => {
    onFlash();
    sfxShutter();
    shotAtRef.current = null;
    setShot((s) => ({ n: s.n + 1, date: new Date() }));
  };

  const [textOn, setTextOn] = useState(reduced);
  useTimeout(() => setTextOn(true), 2300, !reduced);
  const { shown, done, skip } = useTypewriter(config.finale.testo, { speed: 38, enabled: textOn, instant: reduced });

  return (
    <section className="step finale">
      <header className="step-head">
        <h2 className="step-title">La prima foto</h2>
        <p className="step-sub">scattata con la tua nuova macchina fotografica digitale</p>
      </header>

      <div className="finale-body">
        <AsciiCanvas
          cols={PHOTO_COLS}
          rows={PHOTO_ROWS}
          draw={draw}
          fps={16}
          label="Il display della macchina fotografica con la foto appena scattata"
          className="lcd"
          maxFont={16}
        />
        <div className="finale-text" onClick={skip}>
          <p className="sr-only">{config.finale.testo}</p>
          <div className="letter-text" aria-hidden="true">
            {shown}
            {textOn && !done && <span className="cursor">█</span>}
          </div>
          {done && <p className="letter-sign">— {config.firma}</p>}
          <div className={`step-actions${done ? ' is-visible' : ''}`}>
            <button type="button" className="btn btn-primary" onClick={shootAgain}>
              [ 📸 scatta ancora ]
            </button>
            <button type="button" className="btn btn-ghost" onClick={onRestart}>
              [ ↺ ricomincia ]
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
