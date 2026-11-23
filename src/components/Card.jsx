import { useCallback, useRef, useState } from 'react';
import { banner } from '../art/banners.js';
import { useTimeout, useTypewriter } from '../hooks.js';
import { BOUQUET_COLS, BOUQUET_ROWS, drawBouquet } from '../lib/bouquet.js';
import AsciiCanvas from './AsciiCanvas.jsx';
import AsciiText from './AsciiText.jsx';

export default function Card({ config, reduced, onNext }) {
  const startRef = useRef(null);
  const [letterOn, setLetterOn] = useState(reduced);
  useTimeout(() => setLetterOn(true), 2400, !reduced);

  const draw = useCallback(
    (g, now) => {
      if (startRef.current == null) startRef.current = now;
      drawBouquet(g, now - startRef.current, { still: reduced });
    },
    [reduced],
  );

  const { shown, done, skip } = useTypewriter(config.messaggio, { speed: 26, enabled: letterOn, instant: reduced });

  return (
    <section className="step card">
      <header className="card-head">
        <AsciiText lines={banner('Tanti Auguri', 'Slant')} label="Tanti auguri" className="banner banner-title" maxFont={17} />
        <AsciiText lines={banner(config.nome, 'Script')} label={config.nome} className="banner banner-name" maxFont={19} />
      </header>

      <div className="card-body">
        <figure className="bouquet">
          <AsciiCanvas
            cols={BOUQUET_COLS}
            rows={BOUQUET_ROWS}
            draw={draw}
            label={`Un mazzo di fiori in ASCII art per ${config.nome}${reduced ? '' : ': toccalo per farlo risbocciare'}`}
            onActivate={reduced ? undefined : () => { startRef.current = null; }}
            maxFont={15}
          />
          <figcaption>
            un mazzo che non appassisce mai{reduced ? '' : ' · toccalo per farlo risbocciare'}
          </figcaption>
        </figure>

        <article className="letter" onClick={skip}>
          <p className="letter-cmd">
            <span className="prompt">$</span> cat biglietto.txt
          </p>
          <p className="sr-only">{config.messaggio}</p>
          <div className="letter-text" aria-hidden="true">
            {shown}
            {letterOn && !done && <span className="cursor">█</span>}
          </div>
          {done ? (
            <p className="letter-sign">— {config.firma}</p>
          ) : (
            letterOn && <p className="hint">tocca il testo per scriverlo subito</p>
          )}
        </article>
      </div>

      <footer className={`step-actions${done ? ' is-visible' : ''}`}>
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={!done}>
          [ continua → ]
        </button>
      </footer>
    </section>
  );
}
