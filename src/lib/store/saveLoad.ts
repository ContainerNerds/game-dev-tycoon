import type { StudioState } from '@/lib/game/types';

const SAVE_KEY = 'game-dev-tycoon-save';
const SAVE_VERSION = 1;

interface SaveEnvelope {
  version: number;
  timestamp: number;
  state: StudioState;
}

export function saveGame(state: StudioState): void {
  try {
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function loadGame(): StudioState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const envelope: SaveEnvelope = JSON.parse(raw);

    if (envelope.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: expected ${SAVE_VERSION}, got ${envelope.version}`);
      return null;
    }

    return envelope.state;
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error('Failed to delete save:', e);
  }
}

export function getSaveTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const envelope: SaveEnvelope = JSON.parse(raw);
    return envelope.timestamp;
  } catch {
    return null;
  }
}
