import { useCallback, useState } from 'react';
import Boot from './components/Boot.jsx';
import Cake from './components/Cake.jsx';
import Card from './components/Card.jsx';
import Finale from './components/Finale.jsx';
import GiftQuest from './components/GiftQuest.jsx';
import { CONFIG } from './config.js';
import { useReducedMotion } from './hooks.js';
import { isMuted, setMuted, sfxShutter, unlockAudio } from './lib/audio.js';

const STEPS = ['avvio', 'biglietto', 'torta', 'regalo', 'finale'];

export default function App() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [muted, setMutedState] = useState(isMuted);

  const flash = useCallback(() => {
    if (!reduced) setFlashKey((k) => k + 1);
  }, [reduced]);

  const go = useCallback(
    (n) => {
      setStep(n);
      setMaxStep((m) => Math.max(m, n));
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    },
    [reduced],
  );

  const toggleMute = () => {
    unlockAudio();
    setMuted(!muted);
    setMutedState(!muted);
  };

  const props = { config: CONFIG, reduced };

  return (
    <div className="app">
      <div className="window">
        <header className="titlebar">
          <span className="dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="titlebar-title">
            {CONFIG.nome.toLowerCase()}@{CONFIG.anni}anni: ~/auguri
          </span>
          <button type="button" className="sound" onClick={toggleMute} aria-pressed={!muted} aria-label="Audio">
            [ ♪ {muted ? 'off' : 'on'} ]
          </button>
        </header>

        {step > 0 && (
          <nav className="steps" aria-label="Sezioni del biglietto">
            {STEPS.slice(1).map((label, i) => {
              const n = i + 1;
              return (
                <button
                  key={label}
                  type="button"
                  className={`steps-item${n === step ? ' is-current' : ''}`}
                  aria-current={n === step ? 'step' : undefined}
                  disabled={n > maxStep}
                  onClick={() => go(n)}
                >
                  <span className="steps-num">0{n}</span> {label}
                </button>
              );
            })}
          </nav>
        )}

        <main className="screen" key={step}>
          {step === 0 && <Boot lines={CONFIG.boot} reduced={reduced} onOpen={() => go(1)} />}
          {step === 1 && <Card {...props} onNext={() => go(2)} />}
          {step === 2 && <Cake {...props} onNext={() => go(3)} />}
          {step === 3 && (
            <GiftQuest
              {...props}
              onFlash={flash}
              onNext={() => {
                flash();
                sfxShutter();
                go(4);
              }}
            />
          )}
          {step === 4 && <Finale {...props} onFlash={flash} onRestart={() => go(1)} />}
        </main>
      </div>

      <p className="footer-note">fatto a mano, un carattere alla volta · con amore, {CONFIG.firma}</p>
      {flashKey > 0 && <div key={flashKey} className="flash" aria-hidden="true" />}
      <div className="crt" aria-hidden="true" />
    </div>
  );
}
