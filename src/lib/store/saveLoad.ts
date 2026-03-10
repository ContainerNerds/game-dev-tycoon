import type { StudioState, BugSeverity } from '@/lib/game/types';
import { formatDate } from '@/lib/game/calendarSystem';
import { GAME_CONFIG } from '@/lib/config/gameConfig';

const SAVE_VERSION = 5;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = state as any;

  if (fromVersion < 3) {
    // v2 → v3: autoAssign moved from StudioTask to Employee
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

  if (fromVersion < 4) {
    // v3 → v4: Bug.fixTarget, Employee.bugsFixed + totalBugFixPoints
    const migrateBugs = (bugs: any[]) =>
      bugs.map((b: any) => ({
        ...b,
        fixTarget: b.fixTarget ?? GAME_CONFIG.bugFixTargets[b.severity as BugSeverity] ?? 50,
        fixProgress: b.fixProgress ?? 0,
      }));

    raw.activeGames = raw.activeGames.map((g: any) => ({
      ...g,
      bugs: migrateBugs(g.bugs ?? []),
    }));
    raw.activeTasks = raw.activeTasks.map((t: any) => ({
      ...t,
      bugs: t.bugs ? migrateBugs(t.bugs) : undefined,
    }));
    raw.employees = raw.employees.map((e: any) => ({
      ...e,
      bugsFixed: e.bugsFixed ?? 0,
      totalBugFixPoints: e.totalBugFixPoints ?? 0,
    }));
    raw.candidatePool = (raw.candidatePool ?? []).map((e: any) => ({
      ...e,
      bugsFixed: e.bugsFixed ?? 0,
      totalBugFixPoints: e.totalBugFixPoints ?? 0,
    }));
  }

  if (fromVersion < 5) {
    // v4 → v5: Rarity system, IV/EV, pack-based hiring
    const migrateEmployee = (e: any) => {
      const oldTotal = (e.skills?.graphics ?? 3) + (e.skills?.sound ?? 3) +
        (e.skills?.gameplay ?? 3) + (e.skills?.polish ?? 3);
      const scaleSkill = (v: number) => Math.round(((v - 1) / 4) * 31);
      let rarity: string = 'common';
      if (oldTotal >= 16) rarity = 'legendary';
      else if (oldTotal >= 14) rarity = 'epic';
      else if (oldTotal >= 11) rarity = 'rare';
      else if (oldTotal >= 8) rarity = 'uncommon';

      return {
        ...e,
        rarity: e.rarity ?? rarity,
        skills: e.skills ? {
          graphics: scaleSkill(e.skills.graphics ?? 3),
          sound: scaleSkill(e.skills.sound ?? 3),
          gameplay: scaleSkill(e.skills.gameplay ?? 3),
          polish: scaleSkill(e.skills.polish ?? 3),
        } : { graphics: 15, sound: 10, gameplay: 15, polish: 10 },
        evs: e.evs ?? { graphics: 0, sound: 0, gameplay: 0, polish: 0 },
      };
    };

    raw.employees = (raw.employees ?? []).map(migrateEmployee);

    // Migrate candidatePool → currentPack
    const oldPool = (raw.candidatePool ?? []).map(migrateEmployee);
    raw.currentPack = raw.currentPack ?? oldPool;
    raw.packRevealed = raw.packRevealed ?? new Array(raw.currentPack.length).fill(true);
    raw.freePackAvailable = raw.freePackAvailable ?? false;
    delete raw.candidatePool;
    delete raw.lastCandidateRefreshDay;
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
