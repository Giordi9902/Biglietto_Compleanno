import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimeout } from '../hooks.js';
import { SONG_TIMING, playBirthdaySong, sfxBlow, stopSong } from '../lib/audio.js';
import { listenForBlow } from '../lib/blow.js';
import { CAKE_COLS, CAKE_ROWS, blowDuration, drawCake } from '../lib/cake.js';
import AsciiCanvas from './AsciiCanvas.jsx';

const METER = 12;

export default function Cake({ config, reduced, onNext }) {
  const startRef = useRef(null);
  const nowRef = useRef(0);
  const blownAtRef = useRef(null);
  const stopMicRef = useRef(null);
  const [phase, setPhase] = useState('lit'); // lit | blowing | out
  const [lyric, setLyric] = useState(null);
  const [mic, setMic] = useState('off'); // off | starting | listening | denied
  const [level, setLevel] = useState(0);

  const draw = useCallback(
    (g, now) => {
      if (startRef.current == null) startRef.current = now;
      nowRef.current = now - startRef.current;
      drawCake(g, nowRef.current, {
        name: config.nome,
        candles: config.anni,
        blownAt: blownAtRef.current,
        still: reduced,
      });
    },
    [config.nome, config.anni, reduced],
  );

  // "Tanti auguri a te" con il testo che scorre in sincrono
  useEffect(() => {
    const words = [
      'Tanti auguri a te',
      'tanti auguri a te',
      `tanti auguri a ${config.nome}`,
      'tanti auguri a te!',
    ];
    const timers = [];
    const start = setTimeout(() => {
      playBirthdaySong();
      SONG_TIMING.phraseStarts.forEach((s, i) => {
        timers.push(setTimeout(() => setLyric({ i, text: words[i] }), s * 1000 + 150));
      });
      timers.push(setTimeout(() => setLyric(null), (SONG_TIMING.duration + 1) * 1000));
    }, 700);
    return () => {
      clearTimeout(start);
      timers.forEach(clearTimeout);
      stopSong();
    };
  }, [config.nome]);

  const blow = useCallback(() => {
    if (blownAtRef.current != null) return;
    blownAtRef.current = nowRef.current;
    stopSong();
    setLyric(null);
    sfxBlow();
    stopMicRef.current?.();
    stopMicRef.current = null;
    setMic((m) => (m === 'listening' ? 'off' : m));
    setPhase('blowing');
  }, []);

  useTimeout(() => setPhase('out'), reduced ? 300 : blowDuration(config.anni) * 1000 * 0.7, phase === 'blowing');

  // Microfono: chiuderlo sempre quando si lascia la pagina
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopMicRef.current?.();
    };
  }, []);

  const startMic = async () => {
    if (mic === 'starting' || mic === 'listening') return;
    setMic('starting');
    stopSong();
    try {
      const stop = await listenForBlow({
        onBlow: blow,
        onLevel: (l) => {
          const q = Math.round(l * METER);
          setLevel((prev) => (prev === q ? prev : q));
        },
      });
      if (!mounted.current || blownAtRef.current != null) {
        stop();
        return;
      }
      stopMicRef.current = stop;
      setMic('listening');
    } catch {
      if (mounted.current) setMic('denied');
    }
  };

  const lit = phase === 'lit';

  return (
    <section className="step cake">
      <header className="step-head">
        <h2 className="step-title">{lit ? 'Esprimi un desiderio…' : 'Desiderio registrato ✓'}</h2>
        <p className="step-sub">
          {lit
            ? `…poi spegni le ${config.anni} candeline: tocca la torta, premi «soffia» oppure soffia davvero nel microfono.`
            : `${config.anni} candeline spente in un colpo solo. Non dirmi cosa hai chiesto, sennò non si avvera.`}
        </p>
      </header>

      <div className="lyric" aria-live="polite">
        {lyric && (
          <span key={lyric.i} className="lyric-line">
            ♪ {lyric.text} ♪
          </span>
        )}
      </div>

      <AsciiCanvas
        cols={CAKE_COLS}
        rows={CAKE_ROWS}
        draw={draw}
        fps={18}
        label={lit ? `Una torta con ${config.anni} candeline accese: tocca per soffiare` : 'Una torta con le candeline spente'}
        onActivate={lit ? blow : undefined}
        className="cake-canvas"
        maxFont={19}
      />

      <div className="step-actions is-visible">
        {lit ? (
          <>
            <button type="button" className="btn btn-primary" onClick={blow}>
              [ soffia! ]
            </button>
            {mic === 'listening' ? (
              <span className="mic-meter" role="status" aria-label="Microfono in ascolto">
                mic [{'#'.repeat(level)}
                {'-'.repeat(METER - level)}] soffia forte!
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={startMic} disabled={mic === 'starting'}>
                [ 🎤 soffia nel microfono ]
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onNext} disabled={phase !== 'out'}>
            [ e adesso… il regalo → ]
          </button>
        )}
      </div>
      {mic === 'denied' && lit && (
        <p className="hint">Il microfono non è disponibile: niente paura, basta toccare la torta.</p>
      )}
    </section>
  );
}
