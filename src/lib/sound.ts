import { useSyncExternalStore } from 'react';
import { loadSettings, storeSettings, type Settings } from './settings';

// All sounds are synthesised with Web Audio, so there are no audio files to license or download.

let settingsUser: string | null = null;
let settings: Settings = loadSettings();
const listeners = new Set<() => void>();
let onChange: ((s: Settings) => void) | null = null;

/** Loads the signed-in account's settings. `changed` hears her own edits, for syncing. */
export function switchSettings(userId: string | null, changed: ((s: Settings) => void) | null = null): void {
  settingsUser = userId;
  onChange = changed;
  applySettings(loadSettings(userId));
}

/** Settings that arrived from the server; stored locally but not echoed back. */
export function applySettings(next: Settings): void {
  settings = next;
  storeSettings(settings, settingsUser);
  if (!settings.music) stopMusic();
  listeners.forEach((l) => l());
}
let ctx: AudioContext | null = null;
let audioBroken = false;
let musicTimer: number | null = null;

export function useSettings(): [Settings, (next: Partial<Settings>) => void] {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => settings,
  );
  return [value, updateSettings];
}

function updateSettings(next: Partial<Settings>): void {
  settings = { ...settings, ...next };
  storeSettings(settings, settingsUser);
  onChange?.(settings);
  if (settings.music) startMusic();
  else stopMusic();
  listeners.forEach((l) => l());
}

function audio(): AudioContext | null {
  if (audioBroken || typeof AudioContext === 'undefined') return null;
  try {
    ctx ??= new AudioContext();
  } catch {
    // Some embedded browsers refuse audio; sounds are optional, so just go quiet.
    audioBroken = true;
    return null;
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(freq: number, start: number, length: number, volume: number, type: OscillatorType = 'sine'): void {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = a.currentTime + start;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

export function playKey(correct: boolean): void {
  if (!settings.sounds) return;
  if (correct) tone(1100 + Math.random() * 120, 0, 0.06, 0.04, 'triangle');
  else tone(220, 0, 0.12, 0.05, 'sine');
}

export function playFinish(celebrate: boolean): void {
  if (!settings.sounds) return;
  const notes = celebrate ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
  notes.forEach((f, i) => tone(f, i * 0.12, 0.6, 0.08));
}

// A slow music-box loop on a pentatonic scale: calm, and never clashes with itself.
const scale = [392, 440, 523.25, 587.33, 659.25, 783.99];

function startMusic(): void {
  if (musicTimer !== null || !audio()) return;
  let step = 0;
  const play = () => {
    // Don't queue up notes while the browser has audio suspended.
    if (audio()?.state !== 'running') return;
    const note = scale[(step * 2 + (step % 3)) % scale.length]!;
    tone(note, 0, 1.6, 0.025);
    if (step % 4 === 0) tone(note / 2, 0, 2.4, 0.02);
    step++;
  };
  play();
  musicTimer = window.setInterval(play, 700);
}

function stopMusic(): void {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
}

/** Browsers only allow audio after a user gesture, so music resumes on the first key or click. */
export function resumeMusicOnGesture(): () => void {
  const start = () => {
    if (settings.music) startMusic();
  };
  window.addEventListener('keydown', start, { once: true });
  window.addEventListener('pointerdown', start, { once: true });
  return () => {
    window.removeEventListener('keydown', start);
    window.removeEventListener('pointerdown', start);
  };
}
