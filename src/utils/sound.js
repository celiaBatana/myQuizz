// Sons (synthétisés, aucun fichier) et vibrations. Coupés par défaut : le joueur les active lui-même.
const KEY = 'quizly-sound';
let ctx = null;

export function isSoundOn() {
  try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; }
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', vol = 0.15) {
  const c = ensureCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + start;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* non supporté */ } }

export function setSoundOn(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* sans stockage */ }
  window.dispatchEvent(new Event('quizly-sound'));
  if (on) { tone(660, 0, 0.1); tone(880, 0.09, 0.14); } // petit bip de confirmation
}

export function playCorrect() { if (!isSoundOn()) return; vibrate(25); tone(660, 0, 0.12); tone(880, 0.1, 0.2); }
export function playWrong()   { if (!isSoundOn()) return; vibrate([60, 40, 60]); tone(220, 0, 0.18, 'sawtooth', 0.09); tone(165, 0.15, 0.28, 'sawtooth', 0.09); }
export function playWin()     { if (!isSoundOn()) return; vibrate([30, 30, 30]); [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle', 0.14)); }
export function playLose()    { if (!isSoundOn()) return; tone(330, 0, 0.2, 'triangle', 0.1); tone(262, 0.18, 0.35, 'triangle', 0.1); }
