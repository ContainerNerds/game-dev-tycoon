import type { StudioState } from '@/lib/game/types';
import { formatDate } from '@/lib/game/calendarSystem';

const SAVE_VERSION = 3;
const SLOT_KEY_PREFIX = 'game-dev-tycoon-slot-';
const SETTINGS_KEY = 'game-dev-tycoon-settings';

export interface SaveMeta {
  studioName: string;
  ceoName: string;
  balance: number;
  yearMonth: string;
  gamesCompleted: number;
  activeGameNames: string[];
}

interface SaveEnvelope {
  version: number;
  timestamp: number;
  slotId: number;
  meta: SaveMeta;
  state: StudioState;
}

export interface GameSettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalMinutes: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  autoSaveEnabled: true,
  autoSaveIntervalMinutes: 5,
};

function buildMeta(state: StudioState): SaveMeta {
  return {
    studioName: state.studioName,
    ceoName: state.playerName,
    balance: Math.floor(state.money),
    yearMonth: formatDate(state.calendar),
    gamesCompleted: state.completedGames.length,
    activeGameNames: state.activeGames.map((g) => g.name),
  };
}

export function saveToSlot(slotId: number, state: StudioState): void {
  try {
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      slotId,
      meta: buildMeta(state),
      state,
    };
    localStorage.setItem(`${SLOT_KEY_PREFIX}${slotId}`, JSON.stringify(envelope));
  } catch (e) {
    console.error(`Failed to save to slot ${slotId}:`, e);
  }
}

function migrateState(state: StudioState, fromVersion: number): StudioState {
  if (fromVersion < 3) {
    // v2 → v3: autoAssign moved from StudioTask to Employee
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = state as any;
    raw.employees = raw.employees.map((e: any) => ({
      ...e,
      autoAssign: e.autoAssign ?? true,
    }));
    raw.candidatePool = raw.candidatePool.map((e: any) => ({
      ...e,
      autoAssign: e.autoAssign ?? true,
    }));
    raw.activeTasks = raw.activeTasks.map(({ autoAssign: _removed, ...rest }: any) => rest);
  }
  return state;
}

export function loadFromSlot(slotId: number): StudioState | null {
  try {
    const raw = localStorage.getItem(`${SLOT_KEY_PREFIX}${slotId}`);
    if (!raw) return null;
    const envelope: SaveEnvelope = JSON.parse(raw);
    if (envelope.version > SAVE_VERSION) {
      console.warn(`Save version too new in slot ${slotId}`);
      return null;
    }
    if (envelope.version < SAVE_VERSION) {
      envelope.state = migrateState(envelope.state, envelope.version);
    }
    return envelope.state;
  } catch (e) {
    console.error(`Failed to load slot ${slotId}:`, e);
    return null;
  }
}

export function getSlotMeta(slotId: number): { meta: SaveMeta; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(`${SLOT_KEY_PREFIX}${slotId}`);
    if (!raw) return null;
    const envelope: SaveEnvelope = JSON.parse(raw);
    if (envelope.version > SAVE_VERSION) return null;
    return { meta: envelope.meta, timestamp: envelope.timestamp };
  } catch {
    return null;
  }
}

export function deleteSlot(slotId: number): void {
  try {
    localStorage.removeItem(`${SLOT_KEY_PREFIX}${slotId}`);
  } catch (e) {
    console.error(`Failed to delete slot ${slotId}:`, e);
  }
}

export function getAllSlotsMeta(): (({ meta: SaveMeta; timestamp: number; slotId: number }) | null)[] {
  return [0, 1, 2].map((slotId) => {
    const data = getSlotMeta(slotId);
    return data ? { ...data, slotId } : null;
  });
}

// Legacy migration: move old single save to slot 0
export function migrateLegacySave(): void {
  try {
    const old = localStorage.getItem('game-dev-tycoon-save');
    if (old && !localStorage.getItem(`${SLOT_KEY_PREFIX}0`)) {
      const parsed = JSON.parse(old);
      if (parsed?.state) {
        const envelope: SaveEnvelope = {
          version: SAVE_VERSION,
          timestamp: parsed.timestamp ?? Date.now(),
          slotId: 0,
          meta: buildMeta(parsed.state),
          state: parsed.state,
        };
        localStorage.setItem(`${SLOT_KEY_PREFIX}0`, JSON.stringify(envelope));
        localStorage.removeItem('game-dev-tycoon-save');
      }
    }
  } catch { /* ignore */ }
}

// Settings
export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}
