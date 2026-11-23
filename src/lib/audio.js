// Suoni sintetizzati con Web Audio (stile chiptune): nessun file da scaricare.

const STORAGE_KEY = 'auguri-muted';
const VOLUME = 0.6;

let ctx = null;
let master = null;
let songBus = null;
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* storage non disponibile: pazienza */
  }
  if (master) master.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.03);
}

/** Va chiamata dentro un gesto dell'utente (click/tasto) la prima volta. */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(dest, freq, start, dur, { type = 'square', vol = 0.06, attack = 0.01, release = 0.06 } = {}) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + attack);
  gain.gain.setValueAtTime(vol, start + Math.max(attack, dur - release));
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noise(start, dur, { type = 'bandpass', freq = 2000, q = 0.8, vol = 0.5, sweepTo = null } = {}) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, start);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, start + dur);
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(master);
  src.start(start);
}

// --- "Tanti auguri a te" (melodia tradizionale, di pubblico dominio) ---------

const FREQ = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
const SONG = [
  [['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2]],
  [['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2]],
  [['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2]],
  [['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3]],
];
const BEAT = 0.46;

/** Tempi (in secondi) di inizio di ogni frase e durata totale della canzone. */
export const SONG_TIMING = (() => {
  let t = 0;
  const phraseStarts = SONG.map((phrase) => {
    const start = t;
    t += phrase.reduce((sum, [, beats]) => sum + beats * BEAT, 0);
    return start;
  });
  return { phraseStarts, duration: t };
})();

const SONG_DELAY = 0.15;

/** Suona la canzone; restituisce false se l'audio non è disponibile. */
export function playBirthdaySong() {
  if (!unlockAudio()) return false;
  stopSong();
  songBus = ctx.createGain();
  songBus.connect(master);
  let t = ctx.currentTime + SONG_DELAY;
  for (const phrase of SONG) {
    for (const [name, beats] of phrase) {
      const dur = beats * BEAT;
      tone(songBus, FREQ[name], t, dur * 0.9, { vol: 0.05 });
      tone(songBus, FREQ[name] / 2, t, dur * 0.9, { type: 'triangle', vol: 0.08 });
      t += dur;
    }
  }
  return true;
}

export function stopSong() {
  if (!songBus) return;
  const bus = songBus;
  songBus = null;
  bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  setTimeout(() => bus.disconnect(), 500);
}

// --- Effetti -----------------------------------------------------------------

export function sfxCorrect() {
  if (!unlockAudio()) return;
  const t = ctx.currentTime;
  tone(master, 880, t, 0.09, { vol: 0.05 });
  tone(master, 1318.5, t + 0.09, 0.18, { vol: 0.05 });
}

export function sfxWrong() {
  if (!unlockAudio()) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.3);
}

export function sfxShutter() {
  if (!unlockAudio()) return;
  const t = ctx.currentTime;
  noise(t, 0.05, { freq: 2600, vol: 0.7 });
  noise(t + 0.09, 0.07, { freq: 1400, vol: 0.6 });
}

export function sfxBlow() {
  if (!unlockAudio()) return;
  noise(ctx.currentTime, 0.9, { type: 'lowpass', freq: 1800, sweepTo: 300, q: 0.3, vol: 0.5 });
}

export function sfxTada() {
  if (!unlockAudio()) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(master, f, t + i * 0.09, i === 3 ? 0.5 : 0.12, { vol: 0.05 }));
}
