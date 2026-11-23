import { useCallback, useEffect } from 'react';
import { useTypewriter } from '../hooks.js';
import { unlockAudio } from '../lib/audio.js';
import AsciiText from './AsciiText.jsx';

const ENVELOPE = [
  ' ________________________ ',
  '|\\                      /|',
  '| \\                    / |',
  '|  \\       .--.       /  |',
  '|   \\     ( <3 )     /   |',
  "|    \\     '--'     /    |",
  '|     \\____________/     |',
  '|                        |',
  '|________________________|',
];

function BootLine({ line }) {
  const ok = line.endsWith(' OK');
  const body = ok ? line.slice(0, -2) : line;
  const prompt = body.startsWith('>') ? '>' : '';
  return (
    <>
      {prompt && <span className="prompt">{prompt}</span>}
      {body.slice(prompt.length)}
      {ok && <span className="ok">OK</span>}
    </>
  );
}

export default function Boot({ lines, reduced, onOpen }) {
  const text = lines.join('\n');
  const { shown, done, skip } = useTypewriter(text, { speed: 16, instant: reduced });

  const activate = useCallback(() => {
    unlockAudio();
    if (done) onOpen();
    else skip();
  }, [done, onOpen, skip]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activate]);

  const shownLines = shown.split('\n');
  return (
    <section className="step boot" onClick={activate}>
      <AsciiText lines={ENVELOPE} label="Una busta chiusa con un cuore" className="envelope" maxFont={18} />
      <p className="sr-only">{text}</p>
      <pre className="boot-log" aria-hidden="true">
        {shownLines.map((line, i) => (
          <span key={i}>
            <BootLine line={line} />
            {i < shownLines.length - 1 ? '\n' : ''}
          </span>
        ))}
        {!done && <span className="cursor">█</span>}
      </pre>
      <div className={`boot-cta${done ? ' is-visible' : ''}`}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!done}
          onClick={(e) => {
            e.stopPropagation();
            activate();
          }}
        >
          [ apri il biglietto ]
        </button>
        <p className="hint">premi INVIO o tocca lo schermo · audio consigliato</p>
      </div>
    </section>
  );
}
