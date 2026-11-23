import { useCallback, useEffect, useRef, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(QUERY).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Scrive `text` un carattere alla volta, con pause dopo la punteggiatura. */
export function useTypewriter(text, { speed = 28, enabled = true, instant = false } = {}) {
  const [count, setCount] = useState(instant ? text.length : 0);
  const index = useRef(count);

  useEffect(() => {
    if (!enabled) return undefined;
    if (instant) {
      index.current = text.length;
      setCount(text.length);
      return undefined;
    }
    index.current = 0;
    setCount(0);
    let timer;
    const step = () => {
      if (index.current >= text.length) return;
      index.current += 1;
      setCount(index.current);
      const ch = text[index.current - 1];
      const next = text[index.current];
      // pausa solo dopo la punteggiatura "vera" (non nei puntini di sospensione ......)
      const endOfClause = /[.,!?;:…]/.test(ch) && (next === undefined || next === ' ' || next === '\n');
      const pause = ch === '\n' ? speed * 6 : endOfClause ? speed * 5 : speed;
      timer = setTimeout(step, pause);
    };
    timer = setTimeout(step, speed);
    return () => clearTimeout(timer);
  }, [text, speed, enabled, instant]);

  const skip = useCallback(() => {
    index.current = text.length;
    setCount(text.length);
  }, [text]);

  return { shown: text.slice(0, count), done: count >= text.length, skip };
}

/** Esegue `callback` dopo `ms` millisecondi, annullandolo allo smontaggio. */
export function useTimeout(callback, ms, active = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    if (!active || ms == null) return undefined;
    const id = setTimeout(() => saved.current(), ms);
    return () => clearTimeout(id);
  }, [ms, active]);
}
