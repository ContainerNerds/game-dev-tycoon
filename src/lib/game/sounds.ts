import { loadSettings, saveSettings } from '@/lib/store/saveLoad';

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let volume = 0.5;
let muted = false;

function ensureAudio(): { ctx: AudioContext; gain: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = muted ? 0 : volume;
  }
  return { ctx: audioCtx, gain: masterGain! };
}

export function initSoundSystem() {
  const settings = loadSettings();
  volume = settings.sfxVolume;
  muted = settings.sfxMuted;
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
  }
}

export function getVolume(): number {
  return volume;
}

export function isMuted(): boolean {
  return muted;
}

export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
  }
  const settings = loadSettings();
  saveSettings({ ...settings, sfxVolume: volume });
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : volume;
  }
  const settings = loadSettings();
  saveSettings({ ...settings, sfxMuted: muted });
}

export function playFlipSound() {
  const audio = ensureAudio();
  if (!audio) return;
  const { ctx, gain } = audio;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.connect(env);
  env.connect(gain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

  env.gain.setValueAtTime(0.25, ctx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playEpicRevealSound() {
  const audio = ensureAudio();
  if (!audio) return;
  const { ctx, gain } = audio;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(gain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const onset = now + i * 0.06;
    env.gain.setValueAtTime(0, onset);
    env.gain.linearRampToValueAtTime(0.2, onset + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, onset + 0.5);

    osc.start(onset);
    osc.stop(onset + 0.5);
  });
}
