// Простой 8-bit-style звуковой движок через WebAudio API. Без файлов:
// все эффекты генерируются осцилляторами на лету.
//
// AudioContext создаётся лениво и автоматически возобновляется (браузеры
// блокируют звук до первого user-жеста; resume() при первом вызове sfx.*
// обычно срабатывает, т.к. вызов идёт из обработчика клика/кнопки).
//
// Mute-флаг сохраняется в localStorage, чтобы не сбрасывался при перезагрузке.

const MUTE_KEY = "platformer-muted";

let _ctx = null;
function ctx() {
  if (!_ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    _ctx = new C();
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

let _muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
})();

export function isMuted() { return _muted; }
export function setMuted(v) {
  _muted = !!v;
  try { localStorage.setItem(MUTE_KEY, _muted ? "1" : "0"); } catch {}
}
export function toggleMute() { setMuted(!_muted); return _muted; }

// Одна нота: осциллятор + экспоненциальное затухание громкости.
// sweep — конечная частота для glide-эффекта (опционально).
function tone({ freq, type = "square", duration = 0.1, volume = 0.2, sweep = null, when = 0 }) {
  if (_muted) return;
  const c = ctx(); if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweep != null) osc.frequency.exponentialRampToValueAtTime(Math.max(sweep, 1), t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
}

function sequence(notes) {
  if (_muted) return;
  let when = 0;
  for (const n of notes) {
    tone({ ...n, when });
    when += n.duration;
  }
}

export const sfx = {
  jump:      () => tone({ freq: 280, sweep: 520, type: "square", duration: 0.09, volume: 0.18 }),
  coin:      () => tone({ freq: 880, sweep: 1320, type: "triangle", duration: 0.08, volume: 0.18 }),
  enemyKill: () => tone({ freq: 660, sweep: 220, type: "square", duration: 0.14, volume: 0.20 }),
  hit:       () => tone({ freq: 220, sweep: 70, type: "sawtooth", duration: 0.22, volume: 0.25 }),
  win:       () => sequence([
    { freq: 523, duration: 0.10, type: "square", volume: 0.2 },
    { freq: 659, duration: 0.10, type: "square", volume: 0.2 },
    { freq: 784, duration: 0.20, type: "square", volume: 0.2 },
  ]),
  gameover:  () => sequence([
    { freq: 392, duration: 0.15, type: "square", volume: 0.22 },
    { freq: 311, duration: 0.15, type: "square", volume: 0.22 },
    { freq: 233, duration: 0.30, type: "square", volume: 0.22 },
  ]),
};
