// Rileva un soffio nel microfono: un rumore forte e prolungato.

/**
 * Avvia l'ascolto. Restituisce una funzione per interromperlo.
 * Lancia un errore se il microfono non è disponibile o viene negato.
 */
export async function listenForBlow({ onBlow, onLevel, threshold = 0.16, holdMs = 280 }) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  await ctx.resume();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);

  let above = 0;
  let last = performance.now();
  let raf = 0;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((track) => track.stop());
    ctx.close();
  };

  const loop = (now) => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const dt = now - last;
    last = now;
    above = rms > threshold ? above + dt : Math.max(0, above - dt * 0.5);
    onLevel?.(Math.min(1, rms / (threshold * 1.4)));
    if (above >= holdMs) {
      stop();
      onBlow();
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return stop;
}
