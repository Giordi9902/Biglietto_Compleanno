import { useCallback, useEffect, useRef, useState } from 'react';
import { banner } from '../art/banners.js';
import { sfxCorrect, sfxShutter, sfxTada, sfxWrong } from '../lib/audio.js';
import { CAMERA_COLS, CAMERA_ROWS, drawCamera } from '../lib/camera.js';
import AsciiCanvas from './AsciiCanvas.jsx';
import AsciiText from './AsciiText.jsx';
import Confetti from './Confetti.jsx';

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const QUIZ_MAX_LEVEL = 0.72; // quanto si vede del regalo prima di indovinarlo
const BAR = 20;

const pick = (list, n) => list[n % list.length];

const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-7px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(0)' },
];

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function evaluateGuess(text, regalo) {
  const norm = normalize(text);
  if (!norm) return { type: 'empty' };
  const has = (words) => words.some((w) => norm.includes(w));
  for (const group of regalo.quasi) if (has(group.parole)) return { type: 'near', text: group.risposta };
  if (has(regalo.paroleGiuste)) return { type: 'ok' };
  for (const group of regalo.fuochino) if (has(group.parole)) return { type: 'near', text: group.risposta };
  return { type: 'ko' };
}

export default function GiftQuest({ config, reduced, onFlash, onNext }) {
  const { quiz, regalo } = config;
  const [qi, setQi] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [clues, setClues] = useState([]);
  const [phase, setPhase] = useState('quiz'); // quiz | guess | revealed
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [guessFeedback, setGuessFeedback] = useState(null);
  const optionsRef = useRef(null);
  const guessRowRef = useRef(null);
  const shake = (ref) => {
    if (!reduced) ref.current?.animate?.(SHAKE, { duration: 360, easing: 'ease-out' });
  };

  const target = phase === 'revealed' ? 1 : (clues.length / quiz.length) * QUIZ_MAX_LEVEL;
  const targetRef = useRef(target);
  const levelRef = useRef(0);
  const lastRef = useRef(null);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const draw = useCallback(
    (g, now) => {
      const dt = lastRef.current == null ? 0 : Math.min(0.2, now - lastRef.current);
      lastRef.current = now;
      const goal = targetRef.current;
      levelRef.current = reduced ? goal : levelRef.current + (goal - levelRef.current) * Math.min(1, dt * (goal >= 1 ? 3.5 : 2));
      const level = levelRef.current > 0.995 ? 1 : levelRef.current;
      drawCamera(g, now, level, { idle: goal >= 1, age: config.anni });
    },
    [reduced, config.anni],
  );

  const q = quiz[qi];
  const isLast = qi === quiz.length - 1;

  const choose = useCallback(
    (j) => {
      if (phase !== 'quiz' || solved || wrong.includes(j)) return;
      if (j === q.corretta) {
        sfxCorrect();
        setSolved(true);
        setClues((c) => [...c, q.indizio]);
        setFeedback({ type: 'ok', text: `${pick(config.rispostaGiusta, qi)} Nuovo indizio: ${q.indizio}.` });
      } else {
        sfxWrong();
        setWrong((w) => [...w, j]);
        shake(optionsRef);
        setFeedback({ type: 'ko', text: pick(config.rispostaSbagliata, qi + wrong.length) });
      }
    },
    [phase, solved, wrong, q, qi, config.rispostaGiusta, config.rispostaSbagliata, reduced],
  );

  const next = useCallback(() => {
    if (!solved) return;
    if (isLast) {
      setPhase('guess');
      return;
    }
    setQi((i) => i + 1);
    setWrong([]);
    setSolved(false);
    setFeedback(null);
  }, [solved, isLast]);

  // Tastiera: A-D / 1-4 per rispondere, Invio per andare avanti
  useEffect(() => {
    if (phase !== 'quiz') return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const idx = KEYS.indexOf(k) >= 0 ? KEYS.indexOf(k) : Number(k) - 1;
      if (idx >= 0 && idx < q.opzioni.length) choose(idx);
      else if (e.key === 'Enter' && solved) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, solved, choose, next]);

  const reveal = (gaveUp) => {
    setPhase('revealed');
    setGuessFeedback(gaveUp ? { type: 'info', text: 'Va bene, te lo dico io…' } : null);
    onFlash();
    sfxShutter();
    setTimeout(sfxTada, 380);
  };

  const submitGuess = (e) => {
    e.preventDefault();
    const result = evaluateGuess(guess, regalo);
    if (result.type === 'empty') return;
    if (result.type === 'ok') {
      reveal(false);
      return;
    }
    sfxWrong();
    shake(guessRowRef);
    setAttempts((a) => a + 1);
    setGuessFeedback({
      type: result.type,
      text: result.type === 'near' ? result.text : pick(config.rispostaSbagliata, attempts + 1),
    });
  };

  const percent = Math.round(target * 100);
  const filled = Math.round(target * BAR);

  return (
    <section className={`step gift phase-${phase}`}>
      <header className="step-head">
        <h2 className="step-title">{phase === 'revealed' ? 'Sorpresa!' : 'Caccia al regalo'}</h2>
        <p className="step-sub">
          {phase === 'quiz' && 'Il tuo regalo è nascosto qui sotto. Ogni risposta giusta ne gratta via un pezzetto.'}
          {phase === 'guess' && 'Hai sbloccato tutti gli indizi. Hai capito di cosa si tratta?'}
          {phase === 'revealed' && 'Ecco cosa si nascondeva sotto tutti quei caratteri:'}
        </p>
      </header>

      <div className="gift-layout">
        <div className="gift-stage">
          {phase === 'revealed' && (
            <AsciiText lines={banner('Click!', 'Slant')} label="Click!" className="banner banner-click" maxFont={18} />
          )}
          <AsciiCanvas
            cols={CAMERA_COLS}
            rows={CAMERA_ROWS}
            draw={draw}
            fps={16}
            label={phase === 'revealed' ? 'Una macchina fotografica digitale in ASCII art' : 'Il regalo, ancora nascosto sotto un velo di caratteri'}
            className="camera-canvas"
            maxFont={16}
          />
          <p className="meter" aria-label={`Regalo scoperto al ${percent}%`}>
            scoperto [<span className="meter-fill">{'#'.repeat(filled)}</span>
            {'-'.repeat(BAR - filled)}] {String(percent).padStart(3, ' ')}%
          </p>
        </div>

        <div className="gift-panel">
          {clues.length > 0 && (
            <ul className="clues" aria-label="Indizi sbloccati">
              {clues.map((c, i) => (
                <li key={i}>
                  <span className="ok">✓</span> indizio #{i + 1}: {c}
                </li>
              ))}
            </ul>
          )}

          {phase === 'quiz' && (
            <div className="quiz-card" key={qi}>
              <p className="q-count">
                domanda {qi + 1} di {quiz.length}
              </p>
              <h3 className="q-text">{q.domanda}</h3>
              <div className="options" ref={optionsRef}>
                {q.opzioni.map((op, j) => {
                  const isWrong = wrong.includes(j);
                  const isRight = solved && j === q.corretta;
                  return (
                    <button
                      key={j}
                      type="button"
                      className={`option${isWrong ? ' is-wrong' : ''}${isRight ? ' is-right' : ''}`}
                      disabled={isWrong || solved}
                      onClick={() => choose(j)}
                    >
                      <span className="option-key">{KEYS[j]}</span>
                      <span className="option-text">{op}</span>
                    </button>
                  );
                })}
              </div>
              <p className={`feedback${feedback ? ` is-${feedback.type}` : ''}`} aria-live="polite">
                {feedback?.text}
              </p>
              {solved && (
                <button type="button" className="btn btn-primary" onClick={next} autoFocus>
                  {isLast ? '[ indovina il regalo → ]' : '[ prossima domanda → ]'}
                </button>
              )}
            </div>
          )}

          {phase === 'guess' && (
            <form className="guess" onSubmit={submitGuess}>
              <label htmlFor="guess-input" className="q-text">
                Ultimo livello: allora, cos’è il regalo?
              </label>
              <div className="guess-row" ref={guessRowRef}>
                <span className="prompt" aria-hidden="true">&gt;</span>
                <input
                  id="guess-input"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="scrivi qui la tua risposta…"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                />
                <button type="submit" className="btn btn-primary">
                  [ invio ]
                </button>
              </div>
              <p className={`feedback${guessFeedback ? ` is-${guessFeedback.type}` : ''}`} aria-live="polite">
                {guessFeedback?.text}
              </p>
              {attempts >= 2 && <p className="hint">{regalo.suggerimento}</p>}
              {attempts >= 3 && (
                <button type="button" className="btn btn-ghost" onClick={() => reveal(true)}>
                  [ mi arrendo, dimmelo! ]
                </button>
              )}
            </form>
          )}

          {phase === 'revealed' && (
            <div className="reveal">
              {guessFeedback && <p className="feedback is-info">{guessFeedback.text}</p>}
              <h3 className="reveal-title">{regalo.titolo}</h3>
              <p className="reveal-text">{regalo.messaggio}</p>
              {regalo.doveTrovarlo && (
                <p className="reveal-where">
                  <span className="prompt">&gt;</span> dove trovarla: {regalo.doveTrovarlo}
                </p>
              )}
              <button type="button" className="btn btn-primary" onClick={onNext}>
                [ 📸 scatta la prima foto → ]
              </button>
            </div>
          )}
        </div>
      </div>

      {phase === 'revealed' && !reduced && <Confetti />}
    </section>
  );
}
